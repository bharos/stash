'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../utils/supabaseClient';
import { useDarkMode } from '../context/DarkModeContext';
import { useActiveMenu } from '../context/ActiveMenuContext';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const { setActiveMenu } = useActiveMenu();

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up a polling interval to check for new notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;
      
      // Count unread notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('seen', false);
      
      if (error) {
        console.error('Error fetching notifications count:', error);
        return;
      }
      
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error in fetchUnreadCount:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setActiveMenu('UserProfile');
    // Using a small timeout to ensure the menu change happens first
    setTimeout(() => {
      const profileTab = document.querySelector('[data-tab="notifications"]');
      if (profileTab) {
        profileTab.click();
      }
    }, 100);
  };

  if (loading) {
    return null;
  }

  return (
    <div 
      className="relative cursor-pointer"
      onClick={handleClick}
    >
      <span className={`material-icons ${unreadCount > 0 ? 'text-blue-500' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        notifications
      </span>
      
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
