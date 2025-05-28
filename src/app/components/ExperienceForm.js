import { useState, useEffect, useRef, useCallback } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import './experience-form.css';
import dynamic from 'next/dynamic';
import supabase from '../utils/supabaseClient';
import Select from 'react-select';
import { debounce } from 'lodash';
import { useDraftExperience } from '../context/DraftExperience';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useRouter } from 'next/navigation';
import { useActiveMenu } from '../context/ActiveMenuContext'; // Import the custom hook for activeMenu context
import { useDarkMode } from '../context/DarkModeContext'; // Import the dark mode context

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ExperienceForm = () => {
  const router = useRouter(); // Next.js router
  const { setActiveMenu } = useActiveMenu(); // Access activeMenu from context
  const { draftExperience, setDraftExperience } = useDraftExperience(); // Use context
  const { user } = useUser();
  const { darkMode } = useDarkMode(); // Get dark mode state from context
  const [companyName, setCompanyName] = useState(draftExperience?.experience?.company_name || '');
  const [level, setLevel] = useState(draftExperience?.experience?.level || '');
  const [rounds, setRounds] = useState(() => {
    const initialRounds = draftExperience?.experience?.rounds || [{ round_type: '', details: '' }];
    // Filter out interview summaries and add unique IDs to regular rounds
    const regularRounds = initialRounds
      .filter(round => round.round_type.toLowerCase() !== 'interview summary')
      .map((round, index) => ({
        ...round,
        _uniqueId: round._uniqueId || `round_${Date.now()}_${index}`
      }));
    
    // If no regular rounds exist, add a default one
    return regularRounds.length > 0 ? regularRounds : [{ round_type: '', details: '', _uniqueId: `round_${Date.now()}_0` }];
  });
  const [interviewExperienceId, setInterviewExperienceId] = useState(draftExperience?.experience?.id || null);
    const [generalPostId, setGeneralPostId] = useState(draftExperience?.general_post?.id || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [generalPostTitle, setGeneralPostTitle] = useState(draftExperience?.general_post?.title || '');
  const [generalPostContent, setGeneralPostContent] = useState(draftExperience?.general_post?.details || ''); // State for general post content
  const [formType, setFormType] = useState(draftExperience?.draftType  || 'interview_experience'); // State to handle form type (experience or general_post)
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const [roundTypes, setRoundTypes] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [roundsVersion, setRoundsVersion] = useState(0); // Version to force ReactQuill re-render
  const [interviewSummary, setInterviewSummary] = useState(() => {
    // Check if there's an existing interview summary in the draft
    const existingRounds = draftExperience?.experience?.rounds || [];
    const summaryRound = existingRounds.find(round => round.round_type.toLowerCase() === 'interview summary');
    
    if (summaryRound) {
      return {
        details: summaryRound.details || '',
        _uniqueId: summaryRound._uniqueId || `summary_${Date.now()}`
      };
    }
    
    // Check if there's a separate interviewSummary in the draft
    if (draftExperience?.experience?.interviewSummary) {
      return {
        details: draftExperience.experience.interviewSummary.details || '',
        _uniqueId: `summary_${Date.now()}`
      };
    }
    
    return { details: null, _uniqueId: `summary_${Date.now()}` };
  });

  const resetFields = () => {
    if (formType === 'interview_experience') {
      setCompanyName('');
      setLevel('');
      setRounds([{ round_type: '', details: '', _uniqueId: `round_${Date.now()}_0` }]);
      setInterviewSummary({ details: null, _uniqueId: `summary_${Date.now()}` });
      setInterviewExperienceId(null);
    } else if (formType === 'general_post') {
      setGeneralPostTitle('');
      setGeneralPostContent('');
      setGeneralPostId(null);
    }
    setValidationErrors({});
    setError(null);
    setSuccessMessage(null);
    setRoundsVersion(0); // Reset version when resetting fields
  }

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    if (formType === 'interview_experience') {
      if (!companyName.trim()) {
        errors.companyName = 'Company name is required';
      }
      if (!level.trim()) {
        errors.level = 'Level is required';
      }

      // Validate regular rounds (excluding interview summary)
      rounds.forEach((round, index) => {
        if (!round.round_type.trim()) {
          errors[`round_${index}_type`] = 'Round type is required';
        }
        const isDetailsEmpty = !round.details.trim() || round.details === '<p><br></p>';
        
        if (isDetailsEmpty) {
          errors[`round_${index}_details`] = 'Round details are required';
        }
      });

      // Validate interview summary only if user has started typing content
      if (interviewSummary.details !== null && interviewSummary.details && interviewSummary.details.trim() && interviewSummary.details !== '<p><br></p>') {
        const isDetailsEmpty = !interviewSummary.details.trim() || interviewSummary.details === '<p><br></p>';
        if (isDetailsEmpty) {
          errors.interviewSummary = 'Interview summary details are required';
        }
      }
    } else if (formType === 'general_post') {
      if (!generalPostTitle.trim()) {
        errors.generalPostTitle = 'Title is required';
      }
      if (!generalPostContent.trim() || generalPostContent === '<p><br></p>') {
        errors.generalPostContent = 'Content is required';
      }
      if (generalPostTitle.length > 140) {
        errors.generalPostTitle = 'Title must be 140 characters or less';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  useEffect(() => {
    console.log("user id" , user);
    if ((interviewExperienceId !== null || generalPostId != null) && !user && (!draftExperience?.experience?.posted_by_user && !draftExperience?.experience?.posted_by_user)) {
       // Unauthorized user. Reset fields to clear the draft experience
       resetFields();
    }
  }, [user?.user_id]); // Trigger this effect on changes to user context

  useEffect(() => {
    const fetchRoundTypes = async () => {
      try {
        const response = await fetch('/api/roundTypes');
        const data = await response.json();
        setRoundTypes(data);
      } catch (err) {
        setError('Failed to load round types');
      }
    };

    const fetchCompanyNames = async () => {
      if (companyOptions.length > 0) return;
      try {
        const companyResponse = await fetch('/api/companyNames');
        const companyData = await companyResponse.json();
        if (companyResponse.ok) {
          setCompanyOptions(
            companyData.map((item) => ({
              label: item.name.trim(),
              value: item.name.trim(),
            }))
          );
        } else {
          console.error('Failed to fetch company names:', companyData.error);
        }
      } catch (err) {
        setError('Failed to load company names');
      }
    };

    fetchRoundTypes();
    fetchCompanyNames();
    if (typeof window !== 'undefined') setIsClient(true);
  }, [companyOptions.length]);

  const updateDraftExperience = useRef(
    debounce((companyName, level, rounds, interviewSummary, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, draftType) => {
      setDraftExperience((prevState) => {
        const updatedDraftExperience = { 
          ...prevState, // Spread previous state to preserve other properties
        };
        console.log('post title', generalPostTitle);
        console.log('post content', generalPostContent);
        if (draftType === 'interview_experience') {
          // Clean rounds data by removing _uniqueId before saving to draft
          const cleanRounds = rounds.map(({ _uniqueId, ...round }) => round);
          const cleanSummary = interviewSummary.details !== null ? { details: interviewSummary.details } : null;
          updatedDraftExperience.experience = {
            company_name: companyName,
            level,
            rounds: cleanRounds,
            interviewSummary: cleanSummary,
            id: interviewExperienceId,
          };
        } else if (draftType === 'general_post') {
          updatedDraftExperience.general_post = {
            id: generalPostId,
            title: generalPostTitle,
            details: generalPostContent,
          };
        }
        updatedDraftExperience.draftType = draftType;
        setDraftExperience(updatedDraftExperience); // Update the state with the new structure
        console.log('debounce');
        
        return updatedDraftExperience;
      });
    }, 1000) // Debounce for 1 second
  ).current;

  // Call the debounced function when the companyName, level, rounds, or interviewSummary change
  useEffect(() => {
    updateDraftExperience(companyName, level, rounds, interviewSummary, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, formType);
  }, [companyName, level, rounds, interviewSummary, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, formType]);

  const handleRoundChange = (index, value, field) => {
    setRounds((prevRounds) => {
      const updatedRounds = [...prevRounds];
      updatedRounds[index][field] = value;
      return updatedRounds;
    });
  };

  // Function to get available round types for a specific round index
  const getAvailableRoundTypes = (currentIndex) => {
    return roundTypes.filter(roundType => {
      // Always exclude "Interview Summary" from regular round types
      return roundType.name.toLowerCase() !== 'interview summary';
    });
  };

  // Helper function to check if interview summary has content
  const hasInterviewSummary = () => {
    return interviewSummary.details !== null && interviewSummary.details && interviewSummary.details.trim() && interviewSummary.details !== '<p><br></p>';
  };

  // Function to add/enable interview summary
  const addInterviewSummary = () => {
    setInterviewSummary({
      details: '',
      _uniqueId: `summary_${Date.now()}`
    });
  };

  // Function to remove/close interview summary
  const removeInterviewSummary = () => {
    setInterviewSummary({
      details: null,
      _uniqueId: `summary_${Date.now()}`
    });
    // Clear any validation errors for interview summary
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.interviewSummary;
      return newErrors;
    });
  };

  // Function to handle interview summary changes
  const handleInterviewSummaryChange = (value) => {
    setInterviewSummary(prev => ({
      ...prev,
      details: value
    }));
  };

  const handleLevelChange = (e) => {
    const newLevel = e.target.value; // Get the new level value from input
    setLevel(newLevel); // Update the local state with the new value
  };

  const handleCompanyChange = (selectedOption) => {
    setCompanyName(selectedOption?.value || '');
  };

  const addRound = () => {
    const newRound = { 
      round_type: '', 
      details: '', 
      _uniqueId: `round_${Date.now()}_${rounds.length}` 
    };
    const updatedRounds = [...rounds, newRound];
    setRounds(updatedRounds);
  };



  const removeRound = (index) => {
    const updatedRounds = rounds.filter((_, i) => i !== index);
    setRounds(updatedRounds);
    // Force ReactQuill components to re-render by incrementing version
    setRoundsVersion(prev => prev + 1);
  };

  const handleFormTypeChange = (selectedOption) => {
    setFormType(selectedOption.value);
    if (selectedOption === "interview_experience") {
      console.log("interview_experience");
    } else if (selectedOption === "general_post") {
        console.log("general post");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session || !data.session.access_token) {
        throw new Error('User is not authenticated or token is missing');
      }
      console.log('handleSubmit',draftExperience);
      console.log('handleSubmit interview expId', interviewExperienceId);
      console.log('handleSubmit post ID ', generalPostId);
      console.log('formType', formType);
      const token = data.session.access_token;
      const username = user.username;
      if (formType === 'interview_experience') {
        const method = interviewExperienceId ? 'PUT' : 'POST';
        // Clean rounds data by removing _uniqueId before sending to API
        const cleanRounds = rounds.map(({ _uniqueId, ...round }) => round);
        
        // Add interview summary to the end if it has content
        if (hasInterviewSummary()) {
          cleanRounds.push({
            round_type: 'Interview Summary',
            details: interviewSummary.details
          });
        }
        
        const requestBody = { company_name: companyName, level, rounds: cleanRounds, experienceId: interviewExperienceId, username  };
        const response = await fetch('/api/interviewExperiences', {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }

        setSuccessMessage(method === 'PUT'
          ? 'Experience updated successfully! 🥳 🎉'
          : 'Experience submitted successfully! 🎉 🎊');
        setShowSuccessAnimation(true);
        // Redirect to '/' after a short delay
        setTimeout(() => {
          setActiveMenu('landingPage')
          console.log('routing to /')
          router.push('/');  // Redirect to the home page
        }, 2000);
      } else if (formType === 'general_post') {
        const method = generalPostId ? 'PUT' : 'POST';
        const requestBody = { title: generalPostTitle, details: generalPostContent, experienceId: generalPostId, username };
        const response = await fetch('/api/generalPosts', {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }

        setSuccessMessage(method === 'PUT'
          ? 'Post updated successfully! 🥳 🎉'
          : 'Post submitted successfully! 🎉 🎊');
        setShowSuccessAnimation(true);
          // Redirect to '/' after a short delay
        setTimeout(() => {
          setActiveMenu('landingPage')
          console.log('routing to /')
          router.push('/');  // Redirect to the home page
        }, 2000);
      } else {
        throw new Error('Failed. Invalid form type');

      }
      // Clear the fields after submission
      resetFields();
    } catch (error) {
      setError(error.message || 'Failed to submit experience');
    } finally {
      setLoading(false);
    }
  };

  // Create unique toolbar configuration to prevent conflicts between multiple Quill instances
  const getToolbarOptions = () => [
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline'],
    ['link', 'image'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['code-block']
  ];

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-gray-800 text-white dark-mode' : 'bg-white text-gray-800'} shadow-xl rounded-xl transition-all duration-300`}>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8 text-center relative">
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'} mb-4`}>
            <span className="material-icons mr-2 text-sm sm:text-base">edit</span>
            <span className="text-xs sm:text-sm font-medium">
              {formType === 'interview_experience' ? 'Interview Experience' : 'General Post'}
            </span>
          </div>
        </div>
        
        {formType === 'interview_experience' ? (
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
            {interviewExperienceId 
              ? (
                  <span className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="material-icons text-amber-500">edit</span>
                    <span>Editing Your Interview Experience</span>
                  </span>
                )
              : (
                  <span className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="material-icons text-green-500">add_circle</span>
                    <span>Share Your Interview Experience</span>
                  </span>
                )
            }
          </h1>
        ) : (
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
            {generalPostId 
              ? (
                  <span className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="material-icons text-amber-500">edit</span>
                    <span>Editing Your Post</span>
                  </span>
                )
              : (
                  <span className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="material-icons text-green-500">add_circle</span>
                    <span>Create New Post</span>
                  </span>
                )
            }
          </h1>
        )}
        
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
          {formType === 'interview_experience' 
            ? 'Help others by sharing your interview experience. Earn coins and contribute to the community!' 
            : 'Share your thoughts, tips, or questions with the community.'
          }
        </p>
        
        {/* Discard Edit Button */}
        <button
          type="button"
          onClick={resetFields}
          className={`mt-4 inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 ${darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm`}
        >
          <span className="material-icons text-sm">delete_outline</span>
          <span className="hidden sm:inline">Discard Changes</span>
          <span className="sm:hidden">Discard</span>
        </button>
        
        {/* Helpful Tips */}
        {formType === 'interview_experience' && (
          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'} text-sm`}>
              <span className="material-icons text-sm">lightbulb</span>
              Tips for a great experience post:
            </h4>
            <ul className={`text-xs sm:text-sm space-y-1 ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
              <li>• Include specific details about questions asked</li>
              <li>• Share your overall interview experience and outcome</li>
              <li>• Be honest and constructive to help others</li>
            </ul>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Form type selection */}
          <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-3 flex items-center gap-2 text-sm sm:text-base`}>
              <span className="material-icons text-blue-500 text-base sm:text-lg">category</span>
              What would you like to share?
            </label>
            <Select
              value={{ 
                label: formType === 'interview_experience' ? 'Interview Experience' : 'General Post', 
                value: formType 
              }}
              onChange={handleFormTypeChange}
              options={[
                { 
                  label: '💼 Interview Experience', 
                  value: 'interview_experience' 
                },
                { 
                  label: '📝 General Post', 
                  value: 'general_post' 
                },
              ]}
              className="w-full"
              isSearchable={false}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: '#3b82f6',
                  primary75: '#60a5fa',
                  primary50: '#93c5fd',
                  primary25: '#bfdbfe',
                  neutral0: darkMode ? '#1f2937' : '#ffffff',
                  neutral5: darkMode ? '#374151' : '#f3f4f6',
                  neutral10: darkMode ? '#4b5563' : '#e5e7eb',
                  neutral20: darkMode ? '#6b7280' : '#d1d5db',
                  neutral30: darkMode ? '#9ca3af' : '#9ca3af',
                  neutral40: darkMode ? '#d1d5db' : '#6b7280',
                  neutral50: darkMode ? '#e5e7eb' : '#4b5563',
                  neutral60: darkMode ? '#f3f4f6' : '#374151',
                  neutral70: darkMode ? '#f9fafb' : '#1f2937',
                  neutral80: darkMode ? '#ffffff' : '#111827',
                  neutral90: darkMode ? '#ffffff' : '#111827',
                },
              })}
            />
          </div>
        {formType === 'interview_experience' ? (
          <>
        <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
            <span className="material-icons text-blue-500 text-lg sm:text-xl">work</span>
            Company & Role Details
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2 text-sm sm:text-base`}>
                <span className="material-icons text-sm text-blue-500">apartment</span>
                Company Name *
              </label>
              <Select
                value={companyName ? { label: companyName, value: companyName } : null}
                onChange={handleCompanyChange}
                options={companyOptions}
                placeholder="Search or type company name..."
                className={`w-full ${validationErrors.companyName ? 'border-red-500' : ''}`}
                isClearable
                isSearchable
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: validationErrors.companyName ? '#ef4444' : '#3b82f6',
                    primary75: validationErrors.companyName ? '#f87171' : '#60a5fa',
                    primary50: validationErrors.companyName ? '#fca5a5' : '#93c5fd',
                    primary25: validationErrors.companyName ? '#fecaca' : '#bfdbfe',
                    neutral0: darkMode ? '#1f2937' : '#ffffff',
                    neutral5: darkMode ? '#374151' : '#f3f4f6',
                    neutral10: darkMode ? '#4b5563' : '#e5e7eb',
                    neutral20: darkMode ? '#6b7280' : '#d1d5db',
                    neutral30: darkMode ? '#9ca3af' : '#9ca3af',
                    neutral40: darkMode ? '#d1d5db' : '#6b7280',
                    neutral50: darkMode ? '#e5e7eb' : '#4b5563',
                    neutral60: darkMode ? '#f3f4f6' : '#374151',
                    neutral70: darkMode ? '#f9fafb' : '#1f2937',
                    neutral80: darkMode ? '#ffffff' : '#111827',
                    neutral90: darkMode ? '#ffffff' : '#111827',
                  },
                })}
              />
              {validationErrors.companyName && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span className="material-icons text-xs">error</span>
                  {validationErrors.companyName}
                </p>
              )}
            </div>

            <div>
              <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                <span className="material-icons text-sm text-blue-500">badge</span>
                Level/Position *
              </label>
              <input
                type="text"
                value={level}
                onChange={handleLevelChange}
                placeholder="e.g., SDE-1, Senior Engineer, Intern"
                className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                  validationErrors.level 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-200' 
                      : 'bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-2 focus:outline-none`}
                required
              />
              {validationErrors.level && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span className="material-icons text-xs">error</span>
                  {validationErrors.level}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <span className="material-icons text-blue-500">quiz</span>
              Interview Rounds ({rounds.length})
            </h3>
          </div>

          <div className="space-y-4">
            {rounds.map((round, index) => {
              return (
                <div 
                  key={index} 
                  className={`p-4 border-2 rounded-xl relative transition-all duration-200 hover:shadow-md ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                {rounds.length > 1 && (
                  <button
                    type="button"
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white text-xs w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={() => removeRound(index)}
                    title="Remove this round"
                  >
                    <span className="material-icons text-sm">close</span>
                  </button>
                )}
                
                <div className="mb-4">
                  <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                    <span className="material-icons text-sm text-blue-500">psychology</span>
                    Round {index + 1} Type *
                  </label>
                  <Select
                    value={round.round_type ? { label: round.round_type, value: round.round_type } : null}
                    onChange={(selectedOption) => handleRoundChange(index, selectedOption?.value || '', 'round_type')}
                    options={getAvailableRoundTypes(index).map((roundType) => ({
                      label: roundType.name,
                      value: roundType.name,
                    }))}
                    placeholder="Select round type..."
                    className={`w-full ${validationErrors[`round_${index}_type`] ? 'border-red-500' : ''}`}
                    isClearable
                    isSearchable
                      theme={(theme) => ({
                        ...theme,
                        colors: {
                          ...theme.colors,
                          primary: validationErrors[`round_${index}_type`] ? '#ef4444' : '#3b82f6',
                          primary75: validationErrors[`round_${index}_type`] ? '#f87171' : '#60a5fa',
                          primary50: validationErrors[`round_${index}_type`] ? '#fca5a5' : '#93c5fd',
                          primary25: validationErrors[`round_${index}_type`] ? '#fecaca' : '#bfdbfe',
                          neutral0: darkMode ? '#1f2937' : '#ffffff',
                          neutral5: darkMode ? '#374151' : '#f3f4f6',
                          neutral10: darkMode ? '#4b5563' : '#e5e7eb',
                          neutral20: darkMode ? '#6b7280' : '#d1d5db',
                          neutral30: darkMode ? '#9ca3af' : '#9ca3af',
                          neutral40: darkMode ? '#d1d5db' : '#6b7280',
                          neutral50: darkMode ? '#e5e7eb' : '#4b5563',
                          neutral60: darkMode ? '#f3f4f6' : '#374151',
                          neutral70: darkMode ? '#f9fafb' : '#1f2937',
                          neutral80: darkMode ? '#ffffff' : '#111827',
                          neutral90: darkMode ? '#ffffff' : '#111827',
                        },
                      })}
                    />
                  {validationErrors[`round_${index}_type`] && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="material-icons text-xs">error</span>
                      {validationErrors[`round_${index}_type`]}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                    <span className="material-icons text-sm text-blue-500">description</span>
                    Round Details *
                  </label>
                  {isClient && (
                    <div className={`${validationErrors[`round_${index}_details`] ? 'border-red-500 border-2 rounded-lg' : ''}`}>
                      <ReactQuill
                        key={`${round._uniqueId}-v${roundsVersion}`}
                        value={round.details}
                        onChange={(value) => handleRoundChange(index, value, 'details')}
                        className={`border rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        modules={{
                          toolbar: getToolbarOptions()
                        }}
                        placeholder="Describe this interview round in detail..."
                        style={{
                          backgroundColor: darkMode ? '#4B5563' : '#FFFFFF',
                          color: darkMode ? '#FFFFFF' : '#000000',
                        }}
                      />
                    </div>
                  )}
                  {validationErrors[`round_${index}_details`] && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="material-icons text-xs">error</span>
                      {validationErrors[`round_${index}_details`]}
                    </p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          
          {/* Add Round button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={addRound}
              className={`inline-flex items-center gap-2 px-6 py-3 ${darkMode ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-dashed ${darkMode ? 'border-blue-700 hover:border-blue-600' : 'border-blue-300 hover:border-blue-400'}`}
            >
              <span className="material-icons text-sm">add_circle</span>
              Add Round
            </button>
          </div>
        </div>

        {/* Interview Summary Section */}
        {interviewSummary.details !== null && (
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <span className="material-icons text-green-500">summarize</span>
                Interview Summary
              </h3>
              <button
                type="button"
                onClick={removeInterviewSummary}
                className={`flex items-center gap-1 px-3 py-1 ${darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm`}
                title="Remove interview summary"
              >
                <span className="material-icons text-sm">close</span>
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>

            <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
              <div>
                <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                  <span className="material-icons text-sm text-green-500">summarize</span>
                  Overall Notes
                </label>
                {isClient && (
                  <div className={`${validationErrors.interviewSummary ? 'border-red-500 border-2 rounded-lg' : ''}`}>
                    <ReactQuill
                      key={`${interviewSummary._uniqueId}-v${roundsVersion}`}
                      value={interviewSummary.details}
                      onChange={handleInterviewSummaryChange}
                      className={`border rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                      modules={{
                        toolbar: getToolbarOptions()
                      }}
                      placeholder="Share your overall interview experience, outcome, preparation tips, and advice for future candidates..."
                      style={{
                        backgroundColor: darkMode ? '#4B5563' : '#FFFFFF',
                        color: darkMode ? '#FFFFFF' : '#000000',
                      }}
                    />
                  </div>
                )}
                {validationErrors.interviewSummary && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="material-icons text-xs">error</span>
                    {validationErrors.interviewSummary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Interview Summary button */}
        {interviewSummary.details === null && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addInterviewSummary}
              className={`inline-flex items-center gap-2 px-6 py-3 ${darkMode ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50 border-green-700 hover:border-green-600' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-300 hover:border-green-400'} rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-dashed`}
              title="Add an overall summary of your interview experience"
            >
              <span className="material-icons text-sm">summarize</span>
              Add Interview Summary
            </button>
          </div>
        )}
        </>
      ): formType === 'general_post' && (
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
            <span className="material-icons text-blue-500">create</span>
            Content
          </h3>
          
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                <span className="material-icons text-sm text-blue-500">title</span>
                Title *
                <span className={`text-xs ${generalPostTitle.length > 140 ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({generalPostTitle.length}/140)
                </span>
              </label>
              <input
                type="text"
                value={generalPostTitle}
                maxLength={140}
                onChange={(e) => setGeneralPostTitle(e.target.value)}
                placeholder="Enter an engaging title for your post..."
                className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                  validationErrors.generalPostTitle 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-200' 
                      : 'bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:ring-2 focus:outline-none`}
              />
              {validationErrors.generalPostTitle && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span className="material-icons text-xs">error</span>
                  {validationErrors.generalPostTitle}
                </p>
              )}
            </div>
            
            {/* Content Editor */}
            <div>
              <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2 flex items-center gap-2`}>
                <span className="material-icons text-sm text-blue-500">edit_note</span>
                Content *
              </label>
              <div className={`${validationErrors.generalPostContent ? 'border-red-500 border-2 rounded-lg' : ''}`}>
                <ReactQuill
                  value={generalPostContent}
                  onChange={setGeneralPostContent}
                  modules={{ toolbar: getToolbarOptions() }}
                  placeholder="Share your thoughts, experiences, tips, or ask questions..."
                  className={`bg-white border rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                  style={{
                    backgroundColor: darkMode ? '#4B5563' : '#FFFFFF',
                    color: darkMode ? '#FFFFFF' : '#000000',
                  }}
                />
              </div>
              {validationErrors.generalPostContent && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span className="material-icons text-xs">error</span>
                  {validationErrors.generalPostContent}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
        
        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : formType === 'interview_experience'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {formType === 'interview_experience' 
                    ? (interviewExperienceId ? 'Updating Experience...' : 'Submitting Experience...') 
                    : (generalPostId ? 'Updating Post...' : 'Publishing Post...')
                  }
                </span>
              </>
            ) : (
              <>
                <span className="material-icons">
                  {formType === 'interview_experience' 
                    ? (interviewExperienceId ? 'update' : 'send') 
                    : (generalPostId ? 'update' : 'publish')
                  }
                </span>
                <span>
                  {formType === 'interview_experience' 
                    ? (interviewExperienceId ? 'Update Experience' : 'Share Experience') 
                    : (generalPostId ? 'Update Post' : 'Publish Post')
                  }
                </span>
              </>
            )}
          </button>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-600 border border-red-200'} flex items-center gap-2`}>
            <span className="material-icons text-red-500">error</span>
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-50 text-green-600 border border-green-200'} flex items-center gap-2 ${showSuccessAnimation ? 'animate-bounce' : ''}`}>
            <span className="material-icons text-green-500">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExperienceForm;
