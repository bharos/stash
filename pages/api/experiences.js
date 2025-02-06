import supabase from '../../src/app/utils/supabaseClient';

const handleExperienceUpsert = async (req, res) => {
  const { company_name, level, rounds, experienceId } = req.body;
  const token = req.headers['authorization']?.split('Bearer ')[1];

  console.log("Experience ID ", experienceId);
  if (req.method === 'PUT' && !experienceId) {
    return res.status(400).json({ error: 'Experience ID is required for updates.' });
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
    if (!company_name || !level || !Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({ error: 'Company name, level, and at least one round are required.' });
    }

    for (const round of rounds) {
      if (!round.round_type || !round.details) {
        return res.status(400).json({ error: 'Each round must have a round_type and details.' });
      }
    }

    let experience;

    if (req.method === 'POST') {
      // POST logic
      const { data, error } = await supabase
        .from('experiences')
        .insert([{ company_name, level, user_id: user.id }])
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      experience = data[0];

      const roundInserts = rounds.map(({ round_type, details }) => ({
        experience_id: experience.id,
        round_type,
        details,
      }));

      const { error: roundError } = await supabase.from('rounds').insert(roundInserts);

      if (roundError) {
        return res.status(500).json({ error: roundError.message });
      }

    } else if (req.method === 'PUT') {
      // PUT logic
        const { data, error: experienceError } = await supabase
        .from('experiences')
        .update({ company_name, level })
        .eq('id', experienceId)
        .eq('user_id', user.id)
        .select(); // Add .select() here
      
      if (experienceError) {
        return res.status(500).json({ error: experienceError.message });
      }
      
      if (!data || data.length === 0) {  // Check if data is empty
        return res.status(403).json({ error: 'Experience not found or you do not have permission to edit this one. 😥' });
      }
      
      experience = data[0]; // data will contain the updated experience object

      if (!experience) {
        return res.status(404).json({ error: 'Experience not found for update.' });
      }

      const { error: deleteError } = await supabase
          .from('rounds')
          .delete()
          .eq('experience_id', experience.id);

      if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
      }

      const roundInserts = rounds.map(({ round_type, details }) => ({
        experience_id: experience.id,
        round_type,
        details,
      }));

      const { error: roundError } = await supabase.from('rounds').insert(roundInserts);

      if (roundError) {
        return res.status(500).json({ error: roundError.message });
      }

    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.status(200).json({ message: `Experience and rounds ${req.method === 'POST' ? 'added' : 'updated'} successfully` });

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
      const { company_name, level, experienceId, userId } = req.query;

      if (!experienceId && !company_name) {
        return res.status(400).json({ error: 'Company name or experience ID is required' });
      }
      try {
        // Start with fetching the experience data
        let query = supabase
          .from('experiences')
          .select(`
            id, 
            company_name, 
            level, 
            user_id,
            username:profiles(username),
            rounds(id, round_type, details),
            likes
          `);
  
        if (company_name) {
          query = query.ilike('company_name', `%${company_name}%`);
        }
  
        if (level) {
          query = query.ilike('level', `%${level}%`);
        }
        if (experienceId) {
          query = query.eq('id', experienceId);
        }
  
        // Execute the first part of the query
        const { data: experiences, error } = await query;
  
        if (error) {
          return res.status(500).json({ error: error.message });
        }
  
        if (!experiences || experiences.length === 0) {
          return res.status(404).json({ error: 'Experience not found' });
        }
  
        // If userId is provided, check if the user has liked any of these experiences
        // and also if user is the owner of the experience
        if (userId) {
          const experienceIds = experiences.map(exp => exp.id);
  
          // Fetch likes for all experiences in one query
          const { data: userLikes, error: userLikeError } = await supabase
            .from('user_likes')
            .select('experience_id')
            .in('experience_id', experienceIds)
            .eq('user_id', userId);
  
          if (userLikeError) {
            return res.status(500).json({ error: userLikeError.message });
          }
  
          // Convert userLikes array to a Set for faster lookup
          const likedExperienceIds = new Set(userLikes.map(like => like.experience_id));
  
          // Update each experience with the user_liked flag
          experiences.forEach(exp => {
            exp.user_liked = likedExperienceIds.has(exp.id);
          });
          // Set posted_by_user to true if the experience belongs to the user
          experiences.forEach(exp => {
            exp.posted_by_user = exp.user_id === userId;
          });
        } else {
          // If no userId is provided, set user_liked and posted_by_user to false for all
          experiences.forEach(exp => {
            exp.user_liked = false;
          });
          experiences.forEach(exp => {
            exp.posted_by_user = false;
          });
        }
        console.log(experiences)
        res.status(200).json({ experiences });
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