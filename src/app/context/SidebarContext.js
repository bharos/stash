'use client';
import React, { createContext, useState, useContext } from 'react';

// Create the context
const SidebarContext = createContext();

// Custom hook to use the Sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Provider component
export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // State to manage sidebar visibility

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};
