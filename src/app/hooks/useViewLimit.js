'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useViewLimitContext } from '../context/ViewLimitContext';
import supabase from '../utils/supabaseClient';

export const useViewLimit = (experienceId, experienceType) => {
  const { user } = useUser();
  const { triggerViewUpdate } = useViewLimitContext();
  const [viewStatus, setViewStatus] = useState({
    isChecking: true,
    canView: false,
    isLimitReached: false,
    remainingViews: 0,
    isPremium: false,
    error: null
  });

  // Function to check if the user can view this content
  const checkViewLimit = useCallback(async () => {
    if (!user?.user_id || !experienceId || !experienceType) {
      setViewStatus({
        isChecking: false,
        canView: true, // Allow view by default for non-logged in users
        isLimitReached: false,
        remainingViews: 0,
        isPremium: false,
        error: null
      });
      return;
    }
    
    try {
      setViewStatus(prev => ({ ...prev, isChecking: true }));
      
      // Get session token for API request
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No authentication token found');
      }
      
      const token = sessionData.session.access_token;
      
      // Call our API to check and record the view
      const response = await fetch('/api/contentViews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experienceId,
          experienceType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check view limit');
      }
      
      const data = await response.json();
      
      setViewStatus({
        isChecking: false,
        canView: data.canView,
        isLimitReached: data.isLimitReached,
        remainingViews: data.remainingViews,
        isPremium: data.isPremium,
        error: null
      });
      
      // Trigger an update to notify other components about the view limit change
      triggerViewUpdate();
    } catch (err) {
      console.error('Error checking view limit:', err);
      setViewStatus({
        isChecking: false,
        canView: true, // Allow view on error to avoid blocking content
        isLimitReached: false,
        remainingViews: 0,
        isPremium: false,
        error: err.message
      });
    }
  }, [user?.user_id, experienceId, experienceType]);

  // Check view limit when the component mounts
  useEffect(() => {
    checkViewLimit();
  }, [checkViewLimit]);
  
  return viewStatus;
};

// Hook to get overall limit status without recording a view
export const useViewLimitStatus = () => {
  const { user } = useUser();
  const { viewUpdateTimestamp } = useViewLimitContext();
  const [limitStatus, setLimitStatus] = useState({
    isChecking: true,
    isLimitReached: false,
    remainingViews: 0,
    isPremium: false,
    error: null
  });

  const checkLimitStatus = useCallback(async () => {
    if (!user?.user_id) {
      setLimitStatus({
        isChecking: false,
        isLimitReached: false,
        remainingViews: 0,
        isPremium: false,
        error: null
      });
      return;
    }
    
    try {
      setLimitStatus(prev => ({ ...prev, isChecking: true }));
      
      // Get session token for API request
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No authentication token found');
      }
      
      const token = sessionData.session.access_token;
      
      // Call our API to check the limit status
      const response = await fetch('/api/contentViews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check view limit status');
      }
      
      const data = await response.json();
      
      setLimitStatus({
        isChecking: false,
        isLimitReached: data.isLimitReached,
        remainingViews: data.remainingViews,
        isPremium: data.isPremium,
        error: null
      });
    } catch (err) {
      console.error('Error checking view limit status:', err);
      setLimitStatus({
        isChecking: false,
        isLimitReached: false,
        remainingViews: 0,
        isPremium: false,
        error: err.message
      });
    }
  }, [user?.user_id, viewUpdateTimestamp]);

  useEffect(() => {
    checkLimitStatus();
  }, [checkLimitStatus, viewUpdateTimestamp]);
  
  return limitStatus;
};
