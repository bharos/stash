import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { company_name, level, rounds } = req.body;
  
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
  
      // Check if all required fields are provided
      if (!company_name || !level || !Array.isArray(rounds) || rounds.length === 0) {
        return res.status(400).json({ error: 'Company name, level, and at least one round are required.' });
      }
  
      // Validate each round object to ensure it contains necessary details
      for (const round of rounds) {
        if (!round.round_type || !round.details) {
          return res.status(400).json({ error: 'Each round must have a round_type and details.' });
        }
      }
  
      // Insert experience data into the 'experiences' table
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .insert([{ company_name, level, user_id: user.id }])
        .select();
  
      if (experienceError) {
        return res.status(500).json({ error: experienceError.message });
      }
  
      if (!experience || !experience[0]?.id) {
        return res.status(500).json({ error: 'Failed to insert experience.' });
      }
  
      const experienceId = experience[0].id;
  
      // Insert rounds related to the experience into the 'rounds' table
      const roundInserts = rounds.map(({ round_type, details }) => ({
        experience_id: experienceId,
        round_type,
        details,
      }));
  
      const { error: roundError } = await supabase.from('rounds').insert(roundInserts);
  
      if (roundError) {
        return res.status(500).json({ error: roundError.message });
      }
  
      // Respond with success
      res.status(200).json({ message: 'Experience and rounds added successfully' });
  
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'GET') {
    const { company_name, level, experienceId, userId } = req.query; // Get experienceId and userId if present
    
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
}  else if (req.method === 'DELETE') {
  const { experienceId } = req.body;

  if (!experienceId) {
    return res.status(400).json({ error: 'Experience ID is required.' });
  }

  // Extract token from the Authorization header
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  try {
    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    // Fetch the experience to ensure it exists and belongs to the user
    const { data: experience, error: fetchError } = await supabase
      .from('experiences')
      .select('id, user_id')
      .eq('id', experienceId)
      .single();

    if (fetchError || !experience) {
      return res.status(404).json({ error: 'Experience not found.' });
    }

    if (experience.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own experiences.' });
    }

    // Delete the experience
    const { error: deleteError } = await supabase
      .from('experiences')
      .delete()
      .eq('id', experienceId);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete experience.' });
    }

    res.status(200).json({ message: 'Experience deleted successfully.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
}
  