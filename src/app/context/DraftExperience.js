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
      experience: {
        company_name: '',
        level: '',
        rounds: [{ round_type: '', details: '' }],
        experienceId: null,
      },
      general_post: {
        details: '',
      },
      draftType: '', // Can be either 'experience' or 'general_post'
    });

  // Log changes to the draftExperience
  useEffect(() => {
    console.log('Draft experience changed:', draftExperience);
  }, [draftExperience]); // This effect will run whenever draftExperience changes

// Function to reset the draft based on the draftType
const resetDraftExperience = (draftType) => {
    setDraftExperience((prevState) => {
      if (draftType === 'experience') {
        return {
          ...prevState,
          experience: {
            company_name: '',
            level: '',
            rounds: [{ round_type: '', details: '' }],
            experienceId: null,
          },
        };
      } else if (draftType === 'general_post') {
        return {
          ...prevState,
          general_post: {
            details: '',
          },
        };
      }
      return prevState; // If the draftType doesn't match, return the current state as is
    });
  };

  return (
    <DraftExperienceContext.Provider value={{ draftExperience, setDraftExperience, resetDraftExperience }}>
      {children}
    </DraftExperienceContext.Provider>
  );
};
