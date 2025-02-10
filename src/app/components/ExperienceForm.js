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

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ExperienceForm = () => {
  const router = useRouter(); // Next.js router
  const { setActiveMenu } = useActiveMenu(); // Access activeMenu from context
  const { draftExperience, setDraftExperience } = useDraftExperience(); // Use context
  const { user } = useUser();
  const [companyName, setCompanyName] = useState(draftExperience?.experience?.company_name || '');
  const [level, setLevel] = useState(draftExperience?.experience?.level || '');
  const [rounds, setRounds] = useState(draftExperience?.experience?.rounds || [{ round_type: '', details: '' }]);
  const [interviewExperienceId, setInterviewExperienceId] = useState(draftExperience?.experience?.id || null);
  const [generalPostId, setGeneralPostId] = useState(draftExperience?.general_post?.id || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [generalPostTitle, setGeneralPostTitle] = useState(draftExperience?.general_post?.title || '');
  const [generalPostContent, setGeneralPostContent] = useState(draftExperience?.general_post?.details || ''); // State for general post content
  const [formType, setFormType] = useState(draftExperience?.draftType  || 'interview_experience'); // State to handle form type (experience or general_post)
  
  const quillRefs = useRef([]);
  const [roundTypes, setRoundTypes] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  const resetFields = () => {
    if (formType === 'interview_experience') {
      setCompanyName('');
      setLevel('');
      setRounds([{ round_type: '', details: '' }]);
      setInterviewExperienceId(null);
    } else if (formType === 'general_post') {
      setGeneralPostTitle('');
      setGeneralPostContent('');
      setGeneralPostId(null);
    }
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
    debounce((companyName, level, rounds, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, draftType) => {
      setDraftExperience((prevState) => {
        const updatedDraftExperience = { 
          ...prevState, // Spread previous state to preserve other properties
        };
        console.log('post title', generalPostTitle);
        console.log('post content', generalPostContent);
        if (draftType === 'interview_experience') {
          updatedDraftExperience.experience = {
            company_name: companyName,
            level,
            rounds,
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
      });
    }, 1000) // Debounce for 1 second
  ).current;

  // Call the debounced function when the companyName, level, or rounds change
  useEffect(() => {
    updateDraftExperience(companyName, level, rounds, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, formType);
  }, [companyName, level, rounds, interviewExperienceId, generalPostId, generalPostTitle, generalPostContent, formType]);

  const handleRoundChange = (index, value, field) => {
    setRounds((prevRounds) => {
      const updatedRounds = [...prevRounds];
      updatedRounds[index][field] = value;
      return updatedRounds;
    });
  };

  const handleLevelChange = (e) => {
    const newLevel = e.target.value; // Get the new level value from input
    setLevel(newLevel); // Update the local state with the new value
  };

  const handleCompanyChange = (selectedOption) => {
    setCompanyName(selectedOption?.value || '');
  };

  const addRound = () => {
    const updatedRounds = [...rounds, { round_type: '', details: '' }];
    setRounds(updatedRounds);
  };

  const removeRound = (index) => {
    const updatedRounds = rounds.filter((_, i) => i !== index);
    setRounds(updatedRounds);
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
        const requestBody = { company_name: companyName, level, rounds, experienceId: interviewExperienceId, username  };
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

  const toolbarOptions = [
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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <div className="mb-12 text-center">
        {formType === 'interview_experience' ? (
          <h2 className="text-xl font-semibold">
            {interviewExperienceId 
              ? `Editing Your Interview Experience [ID ${interviewExperienceId}]` 
              : 'Posting new Interview Experience'} 👩🏻‍💻
          </h2>
        ) : formType === 'general_post' && (
          <h2 className="text-xl font-semibold">
            {generalPostId 
              ? `Editing Your Post [ID ${generalPostId}]` 
              : 'New Post'} 👩🏻‍💻
          </h2>
        )}
        {/* Discard Edit Button */}
        <button
          type="button"
          onClick={resetFields}
          className="w-auto p-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-all"
        >
          Discard Edit
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-1">
          {/* Form type selection */}
          <div className="mb-4">
            <label className="block text-gray-700">Select Post Type</label>
            <Select
              value={{ label: formType === 'interview_experience' ? 'Interview Experience' : 'General Post', value: formType }}
              onChange={handleFormTypeChange}
              options={[
                { label: 'Interview Experience', value: 'interview_experience' },
                { label: 'General Post', value: 'general_post' },
              ]}
              className="w-full"
            />
          </div>
        {formType === 'interview_experience' ? (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700">Company Name</label>
            <Select
              value={companyName ? { label: companyName, value: companyName } : null}
              onChange={handleCompanyChange}
              options={companyOptions}
              placeholder="Company Name"
              className="w-full mb-3 sm:mb-0"
              isClearable
              isSearchable
            />
          </div>

          <div>
            <label className="block text-gray-700">Level</label>
            <input
              type="text"
              value={level}
              onChange={handleLevelChange}
              className="w-full p-3 border rounded-md"
              required
            />
          </div>
        </div>

        {rounds.map((round, index) => (
          <div key={index} className="p-4 border rounded-md relative details-textarea">
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full"
              onClick={() => removeRound(index)}
            >
              ✖
            </button>
            <label className="block text-gray-700">Round {index + 1}</label>
            <Select
              value={round.round_type ? { label: round.round_type, value: round.round_type } : null}
              onChange={(selectedOption) => handleRoundChange(index, selectedOption?.value || '', 'round_type')}
              options={roundTypes.map((roundType) => ({
                label: roundType.name,
                value: roundType.name,
              }))}
              placeholder="Select Round Type"
              className="w-full sm:w-1/2 mb-3 sm:mb-0"
              isClearable
              isSearchable
            />
            <label className="block text-gray-700 mt-2">Details</label>
            {isClient && (
              <ReactQuill
                ref={(el) => quillRefs.current[index] = el}
                value={round.details}
                onChange={(value) => handleRoundChange(index, value, 'details')}
                className="bg-white border rounded-md"
                modules={{
                  toolbar: {
                    container: toolbarOptions,
                  }
                }}
              />
            )}
          </div>
        ))}

        <div className="form-button-area">
          <button
            type="button"
            onClick={addRound}
            className="w-full p-3 m-1 bg-blue-500 text-white rounded-md"
          >
            Add Round
          </button>
        </div>
        </>
      ): formType === 'general_post' && (
        <div className="w-full">
        {/* Title Input */}
          <input
            type="text"
            value={generalPostTitle}
            maxLength={140}
            onChange={(e) => setGeneralPostTitle(e.target.value)}
            placeholder="Enter title..."
            className="w-full p-2 mb-2 border rounded-md"
          />
          <div className="w-full">
              <ReactQuill
                value={generalPostContent}
                onChange={setGeneralPostContent}
                modules={{ toolbar: toolbarOptions }}
                className="bg-white border rounded-md"
              />
            </div>
          </div>
      )}
        {error && <p className="text-red-500 m-2 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 m-2 text-center">{successMessage}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 m-1 bg-green-500 text-white rounded-md"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default ExperienceForm;
