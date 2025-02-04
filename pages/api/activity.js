import supabase from '../../src/app/utils/supabaseClient';


export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Extract the token from the Authorization header
    const token = req.headers['authorization']?.split('Bearer ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing.' });
    }

    try {
        // Use the token to fetch the user data securely from Supabase Auth server
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user?.id) {
            return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
        }
        
        const userId = user.id;

        // Fetch experiences created by the user
        const { data: experiences, error: expError } = await supabase
            .from('experiences')
            .select('id, company_name, level, created_at, likes')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (expError) throw expError;

        // Fetch likes made by the user (joining with experiences)
        const { data: likes, error: likeError } = await supabase
            .from('user_likes')
            .select('experience_id, created_at, experiences(id, company_name, level)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (likeError) throw likeError;

        // Combine both experiences and likes into activity
        const activity = [
            ...experiences.map(exp => ({
                type: 'experience_posted',
                id: exp.id,
                company_name: exp.company_name,
                level: exp.level,
                created_at: exp.created_at,
                likes: exp.likes
            })),
            ...likes.map(like => ({
                type: 'liked_experience',
                experience_id: like.experience_id,
                created_at: like.created_at,
                company_name: like.experiences?.company_name,
                level: like.experiences?.level
            }))
        ];

        // Sort all activity by most recent date (created_at or liked_at)
        activity.sort((a, b) => new Date(b.created_at || b.liked_at) - new Date(a.created_at || a.liked_at));

        res.status(200).json({ activity });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
