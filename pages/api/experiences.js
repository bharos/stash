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
    const { company_name, level, experienceId } = req.query; // Get experienceId if present
  
    try {
      let query = supabase
        .from('experiences')
        .select(`
          id, 
          company_name, 
          level, 
          username:profiles(username),
          rounds(id, round_type, details)
        `);
  
      if (experienceId) {
        // Fetch experience by ID if experienceId is passed in the query
        query = query.eq('id', experienceId);
      } else {
        // If no experienceId is passed, use the company_name and level filters
        if (company_name) {
          query = query.ilike('company_name', `%${company_name}%`);
        } else {
          return res.status(400).json({ error: 'experience_id or company_name is required' });
        }
        if (level) {
          query = query.ilike('level', `%${level}%`);
        }
      }
  
      const { data: experiences, error } = await query;
  
      if (error) {
        return res.status(500).json({ error: error.message });
      }
  
      if (experiences && experiences.length === 0) {
        return res.status(404).json({ error: 'Experience not found' });
      }
  
      // Respond with the single experience if experienceId is provided, or a list of experiences if not
      res.status(200).json({ experiences });
    
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
  