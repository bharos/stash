import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data: templates, error } = await supabase
        .from('interview_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({ error: 'Failed to fetch templates' });
      }

      res.status(200).json({ templates });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, type, questions, evaluationCriteria, estimatedDuration, difficultyLevel, userId } = req.body;

      if (!title || !questions || !evaluationCriteria) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: template, error } = await supabase
        .from('interview_templates')
        .insert({
          title,
          description,
          type: type || 'system_design',
          questions,
          evaluation_criteria: evaluationCriteria,
          estimated_duration: estimatedDuration,
          difficulty_level: difficultyLevel || 'medium',
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return res.status(500).json({ error: 'Failed to create template' });
      }

      res.status(201).json({ template });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
