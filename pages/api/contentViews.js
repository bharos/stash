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
    case 'POST':
      // Record a view and check if limit is exceeded
      try {
        const { experienceId, experienceType } = req.body;

        if (!experienceId || !experienceType) {
          return res.status(400).json({ 
            error: 'Missing required fields. Required: experienceId, experienceType' 
          });
        }

        // Check if user is premium
        const { data: userData, error: userError } = await supabase
          .from('user_tokens')
          .select('premium_until')
          .eq('user_id', user.id)
          .single();
        
        const isPremium = userData?.premium_until && new Date(userData.premium_until) > new Date();

        // If premium, allow unlimited views
        if (isPremium) {
          // Still record the view for analytics but don't enforce limits
          const { error: viewError } = await supabase
            .from('content_views')
            .upsert([{
              user_id: user.id,
              experience_id: experienceId,
              experience_type: experienceType,
              view_date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
            }], { 
              onConflict: 'user_id, experience_id, view_date'
            });

          if (viewError) {
            console.error('Error recording view for premium user:', viewError);
          }

          return res.status(200).json({
            canView: true,
            isLimitReached: false,
            remainingViews: 'unlimited',
            isPremium: true
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

        // Check if this exact content was already viewed today
        const { data: existingView, error: existingViewError } = await supabase
          .from('content_views')
          .select('id')
          .eq('user_id', user.id)
          .eq('experience_id', experienceId)
          .eq('view_date', today)
          .single();

        // If this content was already viewed today, it doesn't count against the limit
        const alreadyViewedToday = existingView !== null;
        
        // Calculate remaining views
        const viewsToday = alreadyViewedToday ? count - 1 : count;
        const remainingViews = Math.max(0, DAILY_VIEW_LIMIT - viewsToday);
        const isLimitReached = viewsToday >= DAILY_VIEW_LIMIT;
        
        // If limit not reached or content already viewed today, allow viewing
        const canView = !isLimitReached || alreadyViewedToday;

        // Record this view if we're going to allow it
        if (canView && !alreadyViewedToday) {
          const { error: viewError } = await supabase
            .from('content_views')
            .insert([{
              user_id: user.id,
              experience_id: experienceId,
              experience_type: experienceType,
              view_date: today
            }]);

          if (viewError) {
            console.error('Error recording view:', viewError);
            return res.status(500).json({ error: 'Error recording view' });
          }
        }

        return res.status(200).json({
          canView,
          isLimitReached: isLimitReached && !alreadyViewedToday,
          remainingViews: alreadyViewedToday ? remainingViews : remainingViews - 1,
          isPremium: false
        });
      } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

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
          return res.status(200).json({
            isLimitReached: false,
            remainingViews: 'unlimited',
            isPremium: true
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

        return res.status(200).json({
          isLimitReached,
          remainingViews,
          isPremium: false
        });
      } catch (err) {
        console.error('Unexpected error during GET request:', err);
        return res.status(500).json({ error: 'Unexpected error occurred' });
      }

    default:
      return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
