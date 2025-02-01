import supabase from '../../src/app/utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { company_name, level, rounds } = req.body;

    // Basic validation to ensure required data exists
    if (!company_name || !level || rounds.length === 0) {
      return res.status(400).json({ error: 'Company name, level, and at least one round is required.' });
    }

    try {
      // Insert the experience data into the experiences table
      const { data: experience, error: experienceError } = await supabase
        .from('experiences')
        .insert([{ company_name, level }])
        .select();

      if (experienceError) {
        return res.status(500).json({ error: experienceError.message });
      }

      if (!experience || !experience[0]?.id) {
        return res.status(500).json({ error: 'Failed to insert experience.' });
      }

      // Insert the round data for each round
      for (const round of rounds) {
        const { round_type, details } = round;

        if (!round_type || !details) {
          return res.status(400).json({ error: 'Each round must have a round_type and details.' });
        }

        const { error: roundError } = await supabase
          .from('rounds')
          .insert([{ experience_id: experience[0].id, round_type, details }]);

        if (roundError) {
          return res.status(500).json({ error: roundError.message });
        }
      }

      res.status(200).json({ message: 'Experience and rounds added successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    const { company_name, level } = req.query;

    try {
      let query = supabase
        .from('experiences')
        .select('id, company_name, level, rounds(id, round_type, details)') // Join rounds and fetch related data

      // Add filters if provided
      if (company_name) {
        query = query.ilike('company_name', `%${company_name}%`);
      }
      if (level) {
        query = query.ilike('level', `%${level}%`);
      }

      const { data: experiences, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ experiences });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
