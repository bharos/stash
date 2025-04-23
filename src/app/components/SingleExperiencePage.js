'use client';
import React, { useEffect, useState } from 'react';
import Experience from './Experience';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useSidebar } from '../context/SidebarContext';
import supabase from '../utils/supabaseClient';

const SingleExperiencePage = ({ experienceId }) => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser(); // Use user from context here
  const { sidebarOpen } = useSidebar();


  // Define the updateExperience function to update the experience state
  const updateExperience = (updatedData) => {
    setExperience((prevExperience) => {
      // Check if the updatedData contains a "deleted" flag
      if (updatedData.deleted) {
        // If deleted flag is true, set experience to null (deleted state)
        return null;
      }

      // Otherwise, update the experience with new data
      return {
        ...prevExperience,
        ...updatedData,
      };
    });
  };
  

  useEffect(() => {
    const fetchExperience = async () => {
      console.log("SinglePageExperience Fetching experience with ID:", experienceId);
      try {
        const typeResponse = await fetch(`/api/experienceType?experienceId=${experienceId}`);
        const typeData = await typeResponse.json();

        if (!typeResponse.ok) {
          throw new Error("Failed to fetch the experience");
        }

        // Prepare the fetch headers
        const headers = {
          'Content-Type': 'application/json',
        };
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          // If token is available, add it to the Authorization header
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }

        // Call the appropriate API based on the experience type
        let apiUrl;
        if (typeData.type === "general_post") {
          apiUrl = `/api/generalPosts?experienceId=${experienceId}`;
        } else if (typeData.type === "interview_experience") {
          apiUrl = `/api/interviewExperiences?experienceId=${experienceId}`;
        } else {
          throw new Error("Unknown experience type");
        }

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers
        });
        const data = await response.json();
  
        if (response.ok) {
          const fetchedExperience = data.experiences[0]; // Assuming the response contains an array
          fetchedExperience.isExpanded = true;
  
          // Fetch the comments for the experience
          const commentsResponse = await fetch(
            `/api/comments?experience_id=${fetchedExperience.id}`, {
              method: 'GET',
              headers: headers
            });
          const commentsData = await commentsResponse.json();
  
          if (commentsResponse.ok) {
            fetchedExperience.comments = commentsData.comments; // Add comments to experience
          } else {
            console.error('Failed to fetch comments:', commentsData.error);
          }
  
          setExperience(fetchedExperience); // Update the experience with comments
        } else {
          setError(data.error || 'Failed to fetch experience');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    // Fetch experience whenever experienceId or user changes (no check needed for user here)
    if (experienceId) {
      fetchExperience();
    }
  }, [experienceId, user]); // Re-fetch when experienceId or user changes

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`transition-all duration-300 ease-in-out`}
    style={{ 
      marginLeft: sidebarOpen ? 270 : 0,
    }}>
      {error ? (
        <div className="flex justify-center items-center h-screen text-lg text-red-500">
          {error} 🙅‍♀️
        </div>
      ) : experience === null ? (
        <div className="flex justify-center items-center h-screen text-lg text-gray-500">
          Experience not found ! 🤦‍♂️
        </div>
      ) : (
        <Experience experience={experience} updateExperience={updateExperience} showOpenInNewTabButton={false} />
      )}
    </div>
  );  
};

export default SingleExperiencePage;
