'use client';

import { useState, useEffect } from 'react';
import supabase from '../utils/supabaseClient';
import { useDarkMode } from '../context/DarkModeContext';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email_new_comments: true,
    email_comment_replies: true,
    email_post_likes: true,
    email_comment_likes: false,
    email_frequency: 'immediate',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Get the session token for the API request
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('Error getting user session:', sessionError);
        return;
      }
      
      // Make the API request to get notification settings
      const response = await fetch('/api/notificationSettings', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching notification settings:', data.error);
        return;
      }
      
      // Update state with the fetched settings
      setSettings({
        email_new_comments: data.email_new_comments,
        email_comment_replies: data.email_comment_replies,
        email_post_likes: data.email_post_likes,
        email_comment_likes: data.email_comment_likes,
        email_frequency: data.email_frequency,
      });
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleFrequencyChange = (e) => {
    setSettings(prev => ({
      ...prev,
      email_frequency: e.target.value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // Get the session token for the API request
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        setError('You must be logged in to update notification settings');
        return;
      }
      
      // Make the API request to save notification settings
      const response = await fetch('/api/notificationSettings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError('Failed to save notification settings');
        console.error('Error saving notification settings:', data.error);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Unexpected error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading notification settings...</div>;
  }

  return (
    <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Email Notification Settings
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label 
            className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            htmlFor="email_new_comments"
          >
            New comments on your posts
          </label>
          <div className="relative inline-block w-12 align-middle select-none">
            <input 
              type="checkbox" 
              id="email_new_comments"
              checked={settings.email_new_comments}
              onChange={() => handleToggle('email_new_comments')}
              className="sr-only"
            />
            <div 
              onClick={() => handleToggle('email_new_comments')}
              className={`block h-6 rounded-full ${settings.email_new_comments ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-pointer transition-colors duration-200`}
            ></div>
            <div 
              onClick={() => handleToggle('email_new_comments')}
              className={`absolute left-0 top-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.email_new_comments ? 'translate-x-6' : ''}`}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label 
            className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            htmlFor="email_comment_replies"
          >
            Replies to your comments
          </label>
          <div className="relative inline-block w-12 align-middle select-none">
            <input 
              type="checkbox" 
              id="email_comment_replies"
              checked={settings.email_comment_replies}
              onChange={() => handleToggle('email_comment_replies')}
              className="sr-only"
            />
            <div 
              onClick={() => handleToggle('email_comment_replies')}
              className={`block h-6 rounded-full ${settings.email_comment_replies ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-pointer transition-colors duration-200`}
            ></div>
            <div 
              onClick={() => handleToggle('email_comment_replies')}
              className={`absolute left-0 top-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.email_comment_replies ? 'translate-x-6' : ''}`}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label 
            className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            htmlFor="email_post_likes"
          >
            Likes on your posts
          </label>
          <div className="relative inline-block w-12 align-middle select-none">
            <input 
              type="checkbox" 
              id="email_post_likes"
              checked={settings.email_post_likes}
              onChange={() => handleToggle('email_post_likes')}
              className="sr-only"
            />
            <div 
              onClick={() => handleToggle('email_post_likes')}
              className={`block h-6 rounded-full ${settings.email_post_likes ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-pointer transition-colors duration-200`}
            ></div>
            <div 
              onClick={() => handleToggle('email_post_likes')}
              className={`absolute left-0 top-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.email_post_likes ? 'translate-x-6' : ''}`}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label 
            className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            htmlFor="email_comment_likes"
          >
            Likes on your comments
          </label>
          <div className="relative inline-block w-12 align-middle select-none">
            <input 
              type="checkbox" 
              id="email_comment_likes"
              checked={settings.email_comment_likes}
              onChange={() => handleToggle('email_comment_likes')}
              className="sr-only"
            />
            <div 
              onClick={() => handleToggle('email_comment_likes')}
              className={`block h-6 rounded-full ${settings.email_comment_likes ? 'bg-blue-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-pointer transition-colors duration-200`}
            ></div>
            <div 
              onClick={() => handleToggle('email_comment_likes')}
              className={`absolute left-0 top-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${settings.email_comment_likes ? 'translate-x-6' : ''}`}
            ></div>
          </div>
        </div>

        <div className="mt-6">
          <label 
            className={`block mb-2 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
            htmlFor="email_frequency"
          >
            Email Frequency
          </label>
          <select
            id="email_frequency"
            value={settings.email_frequency}
            onChange={handleFrequencyChange}
            className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
          >
            <option value="immediate">Send immediately</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {settings.email_frequency === 'immediate' ? 
              'You will receive emails as events happen.' :
              settings.email_frequency === 'daily' ?
              'You will receive a daily summary of all notifications.' :
              'You will receive a weekly summary of all notifications.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm">{error}</div>
        )}

        {success && (
          <div className="mt-4 text-green-500 text-sm">Settings saved successfully!</div>
        )}

        <div className="mt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`px-4 py-2 rounded-md text-white font-medium ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-200`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
