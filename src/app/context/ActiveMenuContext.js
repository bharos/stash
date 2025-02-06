// ActiveMenuContext.js
'use client';
import React, { createContext, useState, useContext } from 'react';

// Create the context
const ActiveMenuContext = createContext();

// Create a custom hook to use the context
export const useActiveMenu = () => {
  const context = useContext(ActiveMenuContext);
  if (!context) {
    throw new Error('useActiveMenu must be used within an ActiveMenuProvider');
  }
  return context;
};

// Create a provider component
export const ActiveMenuProvider = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState('landingPage'); // Initialize with default value

  return (
    <ActiveMenuContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </ActiveMenuContext.Provider>
  );
};
