'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import DiagramBoard from './DiagramBoard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const InterviewInterface = ({ sessionId, userId, onComplete, isReadOnly = false }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSession();
    loadMessages();
    
    // Only subscribe to real-time updates if not in read-only mode
    if (!isReadOnly) {
      // Subscribe to new messages with better error handling
      const subscription = supabase
        .channel(`interview_${sessionId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'interview_interactions',
          filter: `session_id=eq.${sessionId}`
        }, (payload) => {
          console.log('Real-time message received:', payload.new);
          // Check if message already exists locally to prevent duplicates
          setMessages(prev => {
            const exists = prev.some(msg => 
              msg.id === payload.new.id || 
              (msg.content === payload.new.content && 
               msg.message_type === payload.new.message_type &&
               Math.abs(new Date(msg.timestamp) - new Date(payload.new.timestamp)) < 5000)
            );
            if (exists) {
              console.log('Message already exists, skipping duplicate');
              return prev;
            }
            return [...prev, payload.new];
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'interview_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          console.log('Session updated:', payload.new);
          setSession(payload.new);
          if (payload.new.status === 'completed') {
            setIsComplete(true);
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [sessionId, isReadOnly]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    const { data } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_templates (*)
      `)
      .eq('id', sessionId)
      .single();
    
    setSession(data);
    // Set as complete if the session is completed or terminated, or if in read-only mode
    setIsComplete(data?.status === 'completed' || data?.status === 'terminated' || isReadOnly);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('interview_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    setMessages(data || []);
  };

  // Add final feedback to messages if viewing completed session
  useEffect(() => {
    if (session && isReadOnly && session.ai_feedback?.finalFeedback) {
      setMessages(prevMessages => {
        // Check if final feedback is already in messages
        const hasFinalFeedback = prevMessages.some(msg => msg.message_type === 'ai_feedback');
        if (!hasFinalFeedback) {
          const finalFeedbackMessage = {
            id: `final_feedback_${sessionId}`,
            session_id: sessionId,
            message_type: 'ai_feedback',
            content: session.ai_feedback.finalFeedback,
            timestamp: session.end_time || session.updated_at,
            metadata: { isFinalFeedback: true }
          };
          return [...prevMessages, finalFeedbackMessage];
        }
        return prevMessages;
      });
    }
  }, [session, isReadOnly, sessionId]);

  const sendMessage = async () => {
    if (!currentInput.trim() || isLoading || isComplete) return;

    setIsLoading(true);
    const userMessage = currentInput;
    setCurrentInput('');

    try {
      // Add user message to local state immediately
      const userMsg = {
        id: Date.now(),
        session_id: sessionId,
        message_type: 'user_response',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      // Send to backend for AI processing
      const response = await fetch('/api/interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userResponse: userMessage,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response received:', data);
      
      if (data.isComplete) {
        setIsComplete(true);
        // Don't call onComplete immediately - let user see the feedback first
        
        // Add final feedback message
        const finalMsg = {
          id: Date.now() + 1,
          session_id: sessionId,
          message_type: 'ai_feedback',
          content: data.aiResponse,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, finalMsg]);
      } else if (data.aiResponse) {
        // Add regular AI response to chat during ongoing conversation
        const aiMsg = {
          id: Date.now() + 1,
          session_id: sessionId,
          message_type: 'ai_question',
          content: data.aiResponse,
          timestamp: new Date().toISOString(),
          metadata: {
            hints: data.hints || [],
            currentQuestionIndex: data.currentQuestionIndex
          }
        };
        setMessages(prev => [...prev, aiMsg]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMsg = {
        id: Date.now() + 2,
        session_id: sessionId,
        message_type: 'ai_question',
        content: `I apologize, but I encountered an error processing your response. Please try again. Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Restore user input if there was an error
      setCurrentInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageStyle = (messageType) => {
    switch (messageType) {
      case 'user_response':
        return 'bg-blue-500 text-white border border-blue-600';
      case 'ai_question':
        return 'bg-white text-gray-800 border border-gray-200';
      case 'ai_feedback':
        return 'bg-green-50 border border-green-200 text-green-900';
      default:
        return 'bg-white text-gray-800 border border-gray-200';
    }
  };

  const getMessageIcon = (messageType) => {
    switch (messageType) {
      case 'user_response':
        return '👤';
      case 'ai_question':
        return '🤖';
      case 'ai_feedback':
        return '📊';
      default:
        return '💬';
    }
  };

  const terminateSession = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to terminate this interview session?\n\n' +
      'This will end the session permanently and you won\'t be able to continue. ' +
      'Your progress and diagram will be saved.'
    );

    if (!confirmed) return;

    try {
      // Update session status to 'terminated'
      const { error } = await supabase
        .from('interview_sessions')
        .update({ 
          status: 'terminated',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Add a final interaction to record termination
      await supabase
        .from('interview_interactions')
        .insert({
          session_id: sessionId,
          message_type: 'system',
          content: 'Interview session terminated by user.',
          timestamp: new Date().toISOString()
        });

      // Update local state
      setIsComplete(true);
      setSession(prev => ({ ...prev, status: 'terminated' }));

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete('terminated');
      }

      console.log('Interview session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      alert('Failed to terminate session. Please try again.');
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col border-r bg-white">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {isReadOnly && <span className="text-lg">📋</span>}
                <h2 className="text-xl font-semibold">
                  {isReadOnly 
                    ? `Review: ${session?.interview_templates?.title || 'System Design Interview'}`
                    : session?.interview_templates?.title || 'System Design Interview'
                  }
                </h2>
              </div>
              <p className="text-sm opacity-90">
                {isReadOnly 
                  ? `Completed on ${session?.end_time ? new Date(session.end_time).toLocaleDateString() : 'Unknown'}`
                  : `Question ${(session?.current_question_index || 0) + 1} of ${session?.interview_templates?.questions?.length || 1}`
                }
              </p>
              {session?.interview_templates?.estimated_duration && !isReadOnly && (
                <p className="text-xs opacity-75">
                  Estimated Duration: {session.interview_templates.estimated_duration} minutes
                </p>
              )}
              {session?.total_score && isReadOnly && (
                <p className="text-xs opacity-75">
                  Final Score: {session.total_score}/10
                </p>
              )}
              {isComplete && (
                <div className="mt-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                  {session?.status === 'terminated' ? 'Interview Terminated' : 'Interview Completed'}
                </div>
              )}
            </div>
            
            {/* Back to Dashboard Button - show in read-only mode */}
            {isReadOnly && (
              <button
                onClick={() => window.location.href = '/interview'}
                className="ml-4 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm rounded transition-colors duration-200 flex items-center space-x-1"
                title="Back to interview dashboard"
              >
                <span>←</span>
                <span>Dashboard</span>
              </button>
            )}
            
            {/* Terminate Button - only show if session is active */}
            {!isComplete && session?.status === 'in_progress' && !isReadOnly && (
              <button
                onClick={terminateSession}
                className="ml-4 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors duration-200 flex items-center space-x-1"
                title="Terminate interview session"
              >
                <span>✕</span>
                <span>End</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 min-h-0">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.message_type === 'user_response' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-3 max-w-4xl">
                {message.message_type !== 'user_response' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getMessageIcon(message.message_type)}
                  </div>
                )}
                <div
                  className={`px-5 py-4 rounded-xl shadow-sm ${getMessageStyle(message.message_type)}`}
                >
                  {message.message_type === 'ai_feedback' ? (
                    <div>
                      <div className="font-semibold mb-3 text-lg">📊 Interview Feedback</div>
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className={`text-xs mt-3 flex items-center justify-between ${
                    message.message_type === 'user_response' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {message.metadata?.hints && message.metadata.hints.length > 0 && (
                      <div className="ml-2 text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs">
                        💡 {message.metadata.hints.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                {message.message_type === 'user_response' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getMessageIcon(message.message_type)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">🤖</div>
                <div className="bg-white border rounded-xl px-5 py-4 shadow-sm">
                  <div className="flex space-x-1 items-center">
                    <span className="text-sm text-gray-600 mr-2">AI is thinking</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t bg-white shadow-lg flex-shrink-0">
          {!isComplete && !isReadOnly ? (
            <div className="space-y-3">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your detailed response here... 

💡 Tips:
• Explain your reasoning step by step
• Consider scalability, reliability, and performance
• Mention specific technologies when relevant
• Press Shift+Enter for new lines, Enter to send"
                className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px] max-h-[200px] text-sm leading-relaxed transition-colors duration-200"
                rows={6}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center space-x-4">
                  <span>Characters: {currentInput.length}</span>
                  <span className="text-blue-600">Shift+Enter for new line</span>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !currentInput.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Send Response</span>
                      <span>↵</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : isReadOnly ? (
            <div className="text-center py-6">
              <div className="text-lg font-semibold mb-3 text-blue-600">
                📋 Session Review Mode
              </div>
              <p className="text-gray-600 mb-4">
                You are viewing a completed interview session. All chat history and AI feedback are preserved below.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.location.href = '/interview'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Print Results
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className={`text-xl font-semibold mb-3 ${
                session?.status === 'terminated' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {session?.status === 'terminated' ? '⚠️ Interview Terminated' : '🎉 Interview Completed!'}
              </div>
              <p className="text-gray-600 mb-4">
                {session?.status === 'terminated' 
                  ? 'The interview session was terminated. Your progress and diagram have been saved.'
                  : 'Thank you for participating. Review your feedback above and download your diagram.'
                }
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.location.href = '/interview'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Start New Interview
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Print Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Diagram */}
      <div className="w-1/2 bg-white flex flex-col">
        <div className="flex-1 border-l min-h-0">
          <DiagramBoard
            sessionId={sessionId}
            isReadOnly={isComplete}
            onDiagramChange={(elements) => {
              console.log('Diagram updated:', elements.length, 'elements');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewInterface;
