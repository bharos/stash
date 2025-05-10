'use client';

import React, { createContext, useContext, useState } from 'react';
import supabase from '../utils/supabaseClient';

// Create a context for view limit data
const ViewLimitContext = createContext();

export function ViewLimitProvider({ children }) {
  // Store actual limit data
  const [viewLimitData, setViewLimitData] = useState({
    isLimitReached: false,
    remainingViews: 0,
    isPremium: false
  });

  // Function to fetch view limit data from the API
  const fetchViewLimitData = async () => {
    try {
      // Get session token for API request
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return;
      
      // Call API to get limit status
      const response = await fetch('/api/contentViews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      console.log("View limit data fetched:", data);
      
      setViewLimitData({
        isLimitReached: data.isLimitReached,
        remainingViews: data.remainingViews,
        isPremium: data.isPremium
      });
      
      return data;
    } catch (err) {
      console.error('Error fetching view limit data:', err);
    }
  };

  return (
    <ViewLimitContext.Provider value={{ 
      viewLimitData, 
      fetchViewLimitData,
      setViewLimitData 
    }}>
      {children}
    </ViewLimitContext.Provider>
  );
}

// Custom hook to use the view limit context
export const useViewLimitContext = () => useContext(ViewLimitContext);
