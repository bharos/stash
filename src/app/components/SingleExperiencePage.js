import React, { useEffect, useState } from 'react';
import Experience from './Experience';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context

const SingleExperiencePage = ({ experienceId }) => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, setUser } = useUser(); // Use user from context here

  // Define the updateExperience function to update the experience state
  const updateExperience = (updatedData) => {
    setExperience((prevExperience) => ({
      ...prevExperience,
      ...updatedData,
    }));
  };

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        // Prepare the user query parameter, include userId if it's available
        const userQuery = user?.user_id ? `&userId=${user.user_id}` : '';
  
        // Fetch the experience data
        const response = await fetch(`/api/experiences?experienceId=${experienceId}${userQuery}`);
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
  
          console.log('Fetched experience:', fetchedExperience);
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {experience ? (
        <Experience experience={experience} updateExperience={updateExperience} />
      ) : (
        <div>No experience found</div>
      )}
    </div>
  );
};

export default SingleExperiencePage;
