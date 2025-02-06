'use client';
import React, { useEffect, createContext, useState, useContext } from 'react';

// Create the context
const DraftExperienceContext = createContext();

// Create a custom hook to use the context
export const useDraftExperience = () => {
  const context = useContext(DraftExperienceContext);
  if (!context) {
    throw new Error('useDraftExperience must be used within a DraftExperienceProvider');
  }
  return context;
};

// Create a provider component
export const DraftExperienceProvider = ({ children }) => {
  const [draftExperience, setDraftExperience] = useState({
    company_name: '',
    level: '',
    rounds: [{ round_type: '', details: '' }],
    experienceId: null,
  });

  // Log changes to the draftExperience
  useEffect(() => {
    console.log('Draft experience changed:', draftExperience);
  }, [draftExperience]); // This effect will run whenever draftExperience changes
  
  // Reset method to clear the draftExperience and set default values
  const resetDraftExperience = () => {
    setDraftExperience({
      company_name: '',
      level: '',
      rounds: [{ round_type: '', details: '' }],
      experienceId: null,
    });
  };

  return (
    <DraftExperienceContext.Provider value={{ draftExperience, setDraftExperience, resetDraftExperience }}>
      {children}
    </DraftExperienceContext.Provider>
  );
};
