import React, { useEffect, useState } from 'react';
import Experience from './Experience';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import supabase from '../utils/supabaseClient';

const SingleExperiencePage = ({ experienceId, clientHomeEditExperience }) => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser } = useUser(); // Use user from context here

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
      try {
        // Prepare the fetch headers
        const headers = {
          'Content-Type': 'application/json',
        };
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          // If token is available, add it to the Authorization header
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }

        const response = await fetch(`/api/experiences?experienceId=${experienceId}`, {
          method: 'GET',
          headers: headers
        });
        const data = await response.json();
  
        if (response.ok) {
          const fetchedExperience = data.experiences[0]; // Assuming the response contains an array
          fetchedExperience.isExpanded = true;
  
          // Fetch the comments for the experience
          const commentsResponse = await fetch(`/api/comments?experience_id=${fetchedExperience.id}`);
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

  const handleEditExperience = (experienceToEdit) => {
    clientHomeEditExperience(experienceToEdit);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {error ? (
        <div className="flex justify-center items-center h-screen text-lg text-red-500">
          {error} 🙅‍♀️
        </div>
      ) : experience === null ? (
        <div className="flex justify-center items-center h-screen text-lg text-gray-500">
          Experience not found ! 🤦‍♂️
        </div>
      ) : (
        <Experience experience={experience} updateExperience={updateExperience} showOpenInNewTabButton={false}
        editExperienceClicked={handleEditExperience} />
      )}
    </div>
  );  
};

export default SingleExperiencePage;
