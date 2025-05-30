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
    const { templateId, userId } = req.body;

    if (!templateId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new interview session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        template_id: templateId,
        status: 'in_progress'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Create initial diagram board
    const { error: diagramError } = await supabase
      .from('diagram_boards')
      .insert({
        session_id: session.id,
        diagram_data: { elements: [], appState: {} }
      });

    if (diagramError) {
      console.error('Error creating diagram board:', diagramError);
    }

    // Get the template to send first question
    const { data: template, error: templateError } = await supabase
      .from('interview_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return res.status(500).json({ error: 'Failed to get template' });
    }

    // Send the first question
    const firstQuestion = template.questions[0];
    const welcomeMessage = `Welcome to the ${template.title}! Let's begin with our first question:\n\n${firstQuestion.text}`;

    // Log the initial AI question
    await supabase
      .from('interview_interactions')
      .insert({
        session_id: session.id,
        question_id: firstQuestion.id,
        message_type: 'ai_question',
        content: welcomeMessage,
        metadata: {
          question_index: 0,
          is_initial_question: true
        }
      });

    res.status(200).json({
      session,
      firstQuestion: welcomeMessage,
      template
    });

  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
