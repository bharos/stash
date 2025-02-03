import React, { useEffect, useState } from 'react';
import Experience from './Experience';

const SingleExperiencePage = ({ experienceId }) => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Fetch the experience data
        const response = await fetch(`/api/experiences?experienceId=${experienceId}`);
        const data = await response.json();

        if (response.ok) {
          const fetchedExperience = data.experiences[0]; // Assuming the response contains an array
           // Set isExpanded to true for this experience so that the details are shown by default
          fetchedExperience.isExpanded = true;
          console.log('Experience:', fetchedExperience);
          setExperience(fetchedExperience);

          // Fetch the comments for the experience
          const commentsResponse = await fetch(`/api/comments?experience_id=${fetchedExperience.id}`);
          const commentsData = await commentsResponse.json();

          if (commentsResponse.ok) {
            fetchedExperience.comments = commentsData.comments; // Add comments to experience
            setExperience(fetchedExperience); // Update the experience with comments
          } else {
            console.error('Failed to fetch comments:', commentsData.error);
          }
        } else {
          setError(data.error || 'Failed to fetch experience');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (experienceId) {
      fetchExperience();
    }
  }, [experienceId]); // Re-fetch when experienceId changes

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
