import supabase from '../../src/app/utils/supabaseClient';

function isEmptyHtml(html) {
  const strippedHtml = html.replace(/<[^>]*>/g, "").trim(); // Strip HTML tags and check if it's empty
  return strippedHtml === "";
}

const handleExperienceUpsert = async (req, res) => {
  const { company_name, level, rounds, experienceId, username } = req.body;
  const token = req.headers['authorization']?.split('Bearer ')[1];

  console.log("Interview Experience ID ", experienceId);
  if (req.method === 'PUT' && !experienceId) {
    return res.status(400).json({ error: 'Interview Experience ID is required for updates.' });
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
    if (!company_name || !level || !Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({ error: 'Company name, level, and at least one round are required.' });
    }

    for (const round of rounds) {
      if (!round.round_type || !round.details || isEmptyHtml(round.details)) {
        return res.status(400).json({ error: 'Each round must have a round_type and details.' });
      }
    }

    let experience;

    if (req.method === 'POST') {
      // POST logic

       // Generate a slug using company_name, level, username, and a random string
      const slugify = (text) => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
          .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
      };

      const randomString = Math.random().toString(36).substring(2, 6); // Generate a random 4-character string
      const slug = slugify(company_name+"-"+level+"-interview-experience-question-post-by-"+username+"-"+randomString);
      console.log("Generated Slug: ", slug);

      const { data, error } = await supabase
        .from('experiences')
        .insert([{ company_name, level, user_id: user.id , username, type : 'interview_experience', slug}])
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
      
      // Award 100 coins to the user for posting a new interview experience
      try {
        // First, fetch current user tokens
        const { data: userData, error: userError } = await supabase
          .from('user_tokens')
          .select('coins')
          .eq('user_id', user.id)
          .single();
          
        const currentCoins = userData?.coins || 0;
        console.log("Current Coins: ", currentCoins);
        // Update or insert user tokens
        await supabase
          .from('user_tokens')
          .upsert([{
            user_id: user.id,
            coins: currentCoins + 100 // Add 100 coins for posting
          }], { 
            onConflict: 'user_id' // Specify the constraint to use for conflict detection
          });
        
        // Record the transaction in the ledger
        const { data: transactionData, error: transactionError } = await supabase
          .from('token_transactions')
          .insert([{
            user_id: user.id,
            amount: 100,
            transaction_type: 'earn',
            description: `Earned coins for posting interview experience: ${company_name}`,
            source: 'interview_post',
            reference_id: experience.id // Now using the actual experience ID
          }])
          .select();
          
        if (transactionError) {
          console.error('Error recording transaction:', transactionError);
          console.log('Transaction error details:', JSON.stringify(transactionError));
        } else {
          console.log("Successfully recorded transaction:", transactionData);
        }

        console.log("Successfully awarded 100 coins to user: ", user.id);
      } catch (tokenError) {
        console.error('Error awarding tokens:', tokenError);
        // Don't fail the request if token awarding fails
      }

    } else if (req.method === 'PUT') {
      // PUT logic
        const { data, error: experienceError } = await supabase
        .from('experiences')
        .update({ company_name, level })
        .eq('id', experienceId)
        .eq('user_id', user.id)
        .eq('type', 'interview_experience')
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
      const { company_name, level, experienceId } = req.query;

      if (!experienceId && !company_name) {
        return res.status(400).json({ error: 'Company name or experience ID is required' });
      }

      try {
        const token = req.headers['authorization']?.split('Bearer ')[1];
        let userId;
        if (token) {
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          // Check if authentication failed or the user is not found
          if (authError || !user?.id) {
            return res.status(401).json({ error: 'User not authenticated. Are you signed in?' });
          }
          userId = user.id;
        }
        // Start with fetching the experience data
        let query = supabase
          .from('experiences')
          .select(`
            id, 
            company_name, 
            level, 
            user_id,
            username,
            rounds(id, round_type, details),
            likes,
            type,
            created_at,
            slug
          `)
          .eq('type', 'interview_experience');

        // Apply sorting based on sort_by parameter
        const sort_by = req.query.sort_by || 'recent';
        if (sort_by === 'recent') {
          query = query.order('created_at', { ascending: false });
        } else if (sort_by === 'popular') {
          query = query.order('likes', { ascending: false });
        } else {
          // Default to recent
          query = query.order('created_at', { ascending: false });
        }
  
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
          // Keep only the first round for each experience if userId is not provided. Also add a flag to indicate more rounds
          experiences.forEach(exp => {
            const totalRounds = exp.rounds.length;
            exp.rounds = exp.rounds.slice(0, 1);
            exp.has_more_rounds = totalRounds > exp.rounds.length;
          });
        }
        const experiencesWithoutUserId = experiences.map(experience => {
          const { user_id, ...rest } = experience;  // Destructure and exclude `user_id`
          return rest;
        });
        res.status(200).json({ experiences: experiencesWithoutUserId });
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