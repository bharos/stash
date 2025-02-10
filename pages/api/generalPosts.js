import supabase from '../../src/app/utils/supabaseClient';

// Helper function to check if details contain only empty HTML
function isEmptyHtml(html) {
    const strippedHtml = html.replace(/<[^>]*>/g, "").trim(); // Strip HTML tags and check if it's empty
    return strippedHtml === "";
  }

const handleExperienceUpsert = async (req, res) => {
  const { title, details, experienceId, username } = req.body;
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (req.method === 'PUT' && !experienceId) {
    return res.status(400).json({ error: 'Post ID is required for updates.' });
  }

  if (req.method === 'POST' && !username) {
    return res.status(400).json({ error: 'Username is missing.' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
    }

   // Common validation
    if (!title || !details || title.trim() === "" || isEmptyHtml(details)) {
        return res.status(400).json({ error: 'Post title and details are required and cannot be empty.' });
  }

    let experience;

    if (req.method === 'POST') {
      // POST logic
      const { data, error } = await supabase
        .from('experiences')
        .insert([{ company_name: null, level: null, user_id: user.id , username, type : 'general_post'}])
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      experience = data[0];

      const { error: generalPostError } = await supabase
        .from('general_posts')
        .insert([{title, details, experience_id : experience.id}]);

      if (generalPostError) {
        return res.status(500).json({ error: generalPostError.message });
      }

    } else if (req.method === 'PUT') {
        const { data, error: experienceError } = await supabase
        .from('experiences')
        .select()
        .eq('id', experienceId)
        .eq('user_id', user.id)
        .eq('type', 'general_post');

        // Check if the experience exists and has the correct type
        if (experienceError) {
            return res.status(500).json({ error: postError.message });
        }
        if (!data || data.length === 0) {  // Check if data is empty
            return res.status(403).json({ error: 'Experience not found or you do not have permission to edit this one. 😥' });
        }
      
      experience = data[0];
      if (!experience) {
        return res.status(404).json({ error: 'Experience not found for update.' });
      }

      const { error: deleteError } = await supabase
          .from('general_posts')
          .delete()
          .eq('experience_id', experience.id);

      if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
      }

      const { error: postError } = await supabase
      .from('general_posts')
      .insert({title, details, experience_id: experience.id});

      if (postError) {
        return res.status(500).json({ error: postError.message });
      }

    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.status(200).json({ message: `Post ${req.method === 'POST' ? 'added' : 'updated'} successfully` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
    case 'PUT':
      return handleExperienceUpsert(req, res);
      case 'GET':
        const { experienceId, page = 1, limit = 10 } = req.query; // Default page = 1, limit = 10
      
        try {
          const token = req.headers['authorization']?.split('Bearer ')[1];
          let userId;
      
          if (token) {
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user?.id) {
              return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
            }
            userId = user.id;
          }
      
          let query = supabase
            .from('experiences')
            .select(`
              id, 
              user_id,
              username,
              general_posts: general_posts(title, details),
              likes,
              type
            `)
            .eq('type', 'general_post')
            .order('created_at', { ascending: false });
      
          if (experienceId) {
            query = query.eq('id', experienceId); // Fetch a single experience
          } else {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            query = query.range(start, end); // Apply pagination
          }
      
          const { data, error } = await query;
          const experiences = data.map(experience => ({
            ...experience,  // Spread the original experience object
            title: experience.general_posts?.[0]?.title,  // Flatten the title
            details: experience.general_posts?.[0]?.details,  // Flatten the details
            general_posts: undefined,  // Remove general_posts from the object
          }));
          
          if (error) {
            return res.status(500).json({ error: error.message });
          }
      
          if (!experiences || experiences.length === 0) {
            return res.status(404).json({ error: 'Experience not found' });
          }
      
          if (userId) {
            const experienceIds = experiences.map(exp => exp.id);
      
            const { data: userLikes, error: userLikeError } = await supabase
              .from('user_likes')
              .select('experience_id')
              .in('experience_id', experienceIds)
              .eq('user_id', userId);
      
            if (userLikeError) {
              return res.status(500).json({ error: userLikeError.message });
            }
      
            const likedExperienceIds = new Set(userLikes.map(like => like.experience_id));
      
            experiences.forEach(exp => {
              exp.user_liked = likedExperienceIds.has(exp.id);
              exp.posted_by_user = exp.user_id === userId;
            });
          } else {
            experiences.forEach(exp => {
              exp.user_liked = false;
              exp.posted_by_user = false;
            });
          }
      
          const experiencesWithoutUserId = experiences.map(({ user_id, ...rest }) => rest);
          res.status(200).json({ 
            experiences: experiencesWithoutUserId,
            page: Number(page),
            limit: Number(limit)
          });
      
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
        break;
      
    case 'DELETE':
      const { experienceId: deleteExperienceId } = req.body;

      if (!deleteExperienceId) {
        return res.status(400).json({ error: 'Experience ID is required.' });
      }

      // Extract token from the Authorization header
      const token = req.headers['authorization']?.split('Bearer ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Authorization token is missing.' });
      }

      try {
        // Authenticate the user
        const { data: { user: deleteUser }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !deleteUser?.id) {
          return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Fetch the experience to ensure it exists and belongs to the user
        const { data: experience, error: fetchError } = await supabase
          .from('experiences')
          .select('id, user_id')
          .eq('id', deleteExperienceId)
          .single();

        if (fetchError || !experience) {
          return res.status(404).json({ error: 'Experience not found.' });
        }

        if (experience.user_id !== deleteUser.id) {
          return res.status(403).json({ error: 'Unauthorized. You can only delete your own experiences.' });
        }

        // Delete the experience
        const { error: deleteError } = await supabase
          .from('experiences')
          .delete()
          .eq('id', deleteExperienceId);

        if (deleteError) {
          return res.status(500).json({ error: 'Failed to delete experience.' });
        }

        res.status(200).json({ message: 'Experience deleted successfully.' });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
    default:
        res.status(405).json({ error: 'Method Not Allowed' });
  }
}