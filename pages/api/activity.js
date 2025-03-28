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
        // Get pagination parameters (default to page 1, page size 10)
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * pageSize;

        // Extract the activity type (experience, like, comment, etc.)
        const activityType = req.query.type;

        // Use the token to fetch the user data securely from Supabase Auth server
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user?.id) {
            return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
        }

        const userId = user.id;

        // Query based on activity type
        let query;
        if (activityType === 'experience') {
            query = supabase
                .from('experiences')
                .select('id, company_name, level, created_at, likes, type')
                .eq('user_id', userId)
                .eq('type', 'interview_experience')
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);  // Pagination
        } else if (activityType === 'like') {
            // Query for likes
            query = supabase
                .from('user_likes')
                .select('experience_id, created_at, experiences(id, company_name, level, type)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);  // Pagination
        
            // Execute the query
            const { data: likes, error } = await query;
            if (error) {
                throw error;
            }

            const generalPostExperienceIds = likes
            .filter(like => like.experiences?.type === 'general_post')
            .map(like => like.experience_id);

            let generalPosts = [];
            if (generalPostExperienceIds.length > 0) {
                const { data: posts, error: postError } = await supabase
                    .from('general_posts')
                    .select('experience_id, title')
                    .in('experience_id', generalPostExperienceIds);

                if (postError) {
                    console.error("Error fetching general post titles:", postError);
                } else {
                    generalPosts = posts;
                }
            }
        
            // If the data is returned successfully, proceed to enrich it
            const finalResults = likes.map(like => {
                // Check if the experience is of type 'general_post'
                if (like.experiences?.type === 'general_post') {
                    // Find the corresponding general post title from the generalPosts array
                    const post = generalPosts.find(p => p.experience_id === like.experience_id);
                    return {
                        ...like,
                        title: post ? post.title : null // Add title if found, otherwise null
                    };
                }
                return like; // Return like unchanged if it's not a general_post
            });
            // Return the enriched data in the response
            return res.status(200).json({
                data: finalResults,  // Enriched likes data
                page,
                page_size: pageSize
            });
        } else if (activityType === 'comment') {
            query = supabase
            .from('comments')
            .select(`
                experience_id, 
                created_at, 
                experiences(id, company_name, level, type)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);
        
             const { data: comments, error } = await query;
        
            if (error) {
                console.error("Error fetching comments:", error);
            } else {
                // For experiences that are of type 'general_post', fetch titles from general_posts
                const generalPostExperienceIds = comments
                    .filter(comment => comment.experiences?.type === 'general_post')
                    .map(comment => comment.experience_id);
            
                let generalPosts = [];
                if (generalPostExperienceIds.length > 0) {
                    const { data: posts, error: postError } = await supabase
                        .from('general_posts')
                        .select('experience_id, title')
                        .in('experience_id', generalPostExperienceIds);
            
                    if (postError) {
                        console.error("Error fetching general post titles:", postError);
                    } else {
                        generalPosts = posts;
                    }
                }
        
                // Merge general post titles with comments
                const finalResults = comments.map(comment => {
                    if (comment.experiences?.type === 'general_post') {
                        const post = generalPosts.find(p => p.experience_id === comment.experience_id);
                        return {
                            ...comment,
                            title: post ? post.title : null
                        };
                    }
                    return comment;
                });
                return res.status(200).json({
                    data: finalResults,
                    page,
                    page_size: pageSize
                });    
            }
        } else if (activityType === 'general_post') {
            query = supabase
                .from('general_posts')
                .select('experience_id, created_at, title, experiences!inner(id, user_id)')
                .eq('experiences.user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSize - 1);
        } else {
            return res.status(400).json({ error: 'Invalid activity type.' });
        }

        // Execute the query
        const { data, error } = await query;

        if (error) {
            throw error;
        }
        console.log(data)
        res.status(200).json({
            data,
            page,
            page_size: pageSize
        });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
