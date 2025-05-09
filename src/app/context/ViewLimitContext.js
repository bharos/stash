'use client';

import React, { createContext, useContext, useState } from 'react';

// Create a context for view limit updates
const ViewLimitContext = createContext();

export function ViewLimitProvider({ children }) {
  // Use state to track the last view update timestamp
  const [viewUpdateTimestamp, setViewUpdateTimestamp] = useState(Date.now());

  // Function to trigger an update when a content is viewed
  const triggerViewUpdate = () => {
    setViewUpdateTimestamp(Date.now());
  };

  return (
    <ViewLimitContext.Provider value={{ viewUpdateTimestamp, triggerViewUpdate }}>
      {children}
    </ViewLimitContext.Provider>
  );
}

// Custom hook to use the view limit context
export const useViewLimitContext = () => useContext(ViewLimitContext);
