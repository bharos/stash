import { createClient } from '@supabase/supabase-js';
const { AIInterviewService } = require('../../../src/app/utils/aiInterviewService');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const aiService = new AIInterviewService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, elements } = req.body;

    if (!sessionId || !elements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current session and question
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_templates (*)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentQuestion = session.interview_templates.questions[session.current_question_index];
    
    // Generate diagram suggestions
    const suggestions = await aiService.generateDiagramSuggestions(elements, currentQuestion);

    res.status(200).json({
      suggestions,
      analysis: aiService.analyzeDiagram(elements)
    });

  } catch (error) {
    console.error('Error analyzing diagram:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
