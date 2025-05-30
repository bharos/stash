'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import InterviewInterface from './InterviewInterface';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const InterviewDashboard = ({ user }) => {
  const [templates, setTemplates] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadUserSessions();
  }, [user]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/interview/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadUserSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          interview_templates (title, type, difficulty_level)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setUserSessions(data || []);
      }
    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  };

  const startNewInterview = async (templateId) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          userId: user.id
        })
      });

      const data = await response.json();
      if (data.session) {
        setActiveSession(data.session);
        setSelectedTemplate(data.template);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSession = (session) => {
    setActiveSession(session);
    const template = templates.find(t => t.id === session.template_id);
    setSelectedTemplate(template);
  };

  const handleInterviewComplete = () => {
    setActiveSession(null);
    setSelectedTemplate(null);
    loadUserSessions(); // Refresh the sessions list
  };

  const viewSession = (session) => {
    setActiveSession(session);
    const template = templates.find(t => t.id === session.template_id);
    setSelectedTemplate(template);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (activeSession) {
    const isReadOnlySession = activeSession.status === 'completed' || activeSession.status === 'terminated';
    
    return (
      <div className="h-screen">
        <InterviewInterface
          sessionId={activeSession.id}
          userId={user.id}
          onComplete={handleInterviewComplete}
          isReadOnly={isReadOnlySession}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Interview Practice
          </h1>
          <p className="text-gray-600">
            Practice system design interviews with AI-powered feedback and real-time diagram collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Templates */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Interview Templates
            </h2>
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(template.difficulty_level)}`}>
                        {template.difficulty_level?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.type?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>📝 {template.questions?.length || 0} questions</span>
                      {template.estimated_duration && (
                        <span>⏱️ {formatDuration(template.estimated_duration)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => startNewInterview(template.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
                    >
                      Start Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Sessions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Sessions
            </h2>
            <div className="space-y-3">
              {userSessions.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No sessions yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start your first interview above
                  </p>
                </div>
              ) : (
                userSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {session.interview_templates?.title}
                      </h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      <div>Started: {new Date(session.created_at).toLocaleDateString()}</div>
                      {session.end_time && (
                        <div>Completed: {new Date(session.end_time).toLocaleDateString()}</div>
                      )}
                    </div>

                    {session.status === 'in_progress' && (
                      <button
                        onClick={() => resumeSession(session)}
                        className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Resume
                      </button>
                    )}

                    {(session.status === 'completed' || session.status === 'terminated') && (
                      <button
                        onClick={() => viewSession(session)}
                        className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        View Results
                      </button>
                    )}

                    {session.status === 'completed' && session.total_score && (
                      <div className="text-center py-2 bg-green-50 rounded text-sm mt-2">
                        Score: {session.total_score}/10
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDashboard;
