import supabase from '../../src/app/utils/supabaseClient';

const DAILY_VIEW_LIMIT = 2; // Non-premium users can view 2 experiences per day

export default async function handler(req, res) {
  const { method } = req;
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.id) {
    return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
  }

  switch (method) {
    case 'GET':
      // Get user's view limit status
      try {
        // Check if user is premium
        const { data: userData, error: userError } = await supabase
          .from('user_tokens')
          .select('premium_until')
          .eq('user_id', user.id)
          .single();
        
        const isPremium = userData?.premium_until && new Date(userData.premium_until) > new Date();

        // If premium, report unlimited views
        if (isPremium) {
          console.log(`Premium user ${user.id} view status: unlimited views`);
          return res.status(200).json({
            isLimitReached: false,
            remainingViews: 'unlimited',
            viewsToday: 0,
            dailyLimit: DAILY_VIEW_LIMIT,
            isPremium: true,
            timestamp: new Date().toISOString()
          });
        }

        // For non-premium users, check daily view count
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Count today's views
        const { count, error: countError } = await supabase
          .from('content_views')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('view_date', today);

        if (countError) {
          console.error('Error counting views:', countError);
          return res.status(500).json({ error: 'Error checking view limit' });
        }

        const remainingViews = Math.max(0, DAILY_VIEW_LIMIT - count);
        const isLimitReached = count >= DAILY_VIEW_LIMIT;
        const viewsToday = count;

        // Log the current view status when requested
        console.log(`User ${user.id} view status: ${viewsToday}/${DAILY_VIEW_LIMIT} views used, ${remainingViews} remaining`);

        return res.status(200).json({
          isLimitReached,
          remainingViews,
          viewsToday,
          dailyLimit: DAILY_VIEW_LIMIT, 
          isPremium: false,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Unexpected error during GET request:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
