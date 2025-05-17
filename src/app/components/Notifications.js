'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../utils/supabaseClient';
import { useDarkMode } from '../context/DarkModeContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        setError('You must be logged in to view notifications');
        return;
      }

      const token = sessionData.session.access_token;

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      let url = '';
      
      // Determine the URL based on notification type and content type
      if (notification.content_type === 'post') {
        // Get the post details to navigate to the post page
        const { data } = await supabase
          .from('experiences')
          .select('id, slug')
          .eq('id', notification.content_id)
          .single();
          
        if (data) {
          url = `/experience/${data.id}/${data.slug || ''}`;
        }
      } else if (notification.content_type === 'comment') {
        // Get the comment details to navigate to the post with the comment
        const { data: commentData } = await supabase
          .from('comments')
          .select('experience_id')
          .eq('id', notification.content_id)
          .single();
          
        if (commentData) {
          const { data: experienceData } = await supabase
            .from('experiences')
            .select('id, slug')
            .eq('id', commentData.experience_id)
            .single();
            
          if (experienceData) {
            url = `/experience/${experienceData.id}/${experienceData.slug || ''}#comment-${notification.content_id}`;
          }
        }
      }
      
      if (url) {
        router.push(url);
      }
    } catch (err) {
      console.error('Error navigating to notification content:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationText = (notification) => {
    const actor = notification.actor_username || 'Someone';
    
    switch (notification.type) {
      case 'comment':
        return `${actor} commented on your post`;
      case 'reply':
        return `${actor} replied to your comment`;
      case 'post_like':
        return `${actor} liked your post`;
      case 'comment_like':
        return `${actor} liked your comment`;
      default:
        return 'You have a new notification';
    }
  };

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'comment':
      case 'reply':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900 flex items-center justify-center rounded-full">
            <span className="material-icons text-blue-600 dark:text-blue-300" style={{fontSize: '18px'}}>comment</span>
          </div>
        );
      case 'post_like':
      case 'comment_like':
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-red-100 dark:bg-red-900 flex items-center justify-center rounded-full">
            <span className="material-icons text-red-600 dark:text-red-300" style={{fontSize: '18px'}}>favorite</span>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-full">
            <span className="material-icons text-gray-600 dark:text-gray-300" style={{fontSize: '18px'}}>notifications</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <span className="material-icons animate-spin inline-block mr-2">refresh</span>
        Loading notifications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <span className="material-icons inline-block mr-2">error</span>
        {error}
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}>
        <h3 className="font-semibold">Notifications</h3>
      </div>

      <div style={{ maxHeight: '400px' }} className="overflow-y-auto">
        {notifications.length === 0 ? (
          <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="material-icons block mx-auto mb-2">notifications_off</span>
            No notifications yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-4 cursor-pointer hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-150 ${!notification.seen ? (darkMode ? 'bg-gray-750' : 'bg-blue-50') : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification)}
                  <div className="ml-3 flex-1">
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getNotificationText(notification)}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.seen && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
