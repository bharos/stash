'use client';
import React, { useEffect, useState } from 'react';
import Experience from './Experience';
import ContentPaywall from './ContentPaywall';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useSidebar } from '../context/SidebarContext';
import { useViewLimitContext } from '../context/ViewLimitContext'; // Import view limit context directly
import supabase from '../utils/supabaseClient';

const SingleExperiencePage = ({ experienceId }) => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const { user } = useUser(); // Use user from context here
  const { sidebarOpen } = useSidebar();
  const { viewLimitData, fetchViewLimitData } = useViewLimitContext(); // Access view limit context and the function to update it
  
  // Extract relevant view limit data from context
  const { 
    isLimitReached, 
    remainingViews, 
    isPremium 
  } = viewLimitData;

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
          
          // Refresh the view limit data after successfully fetching the experience
          // This ensures the latest view count and limit status is reflected
          fetchViewLimitData();
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
  
  // We've removed the recordView call since the API now handles this for us
  // The fetchExperience call is now responsible for recording views
  
  // Update showPaywall when viewLimitData or experience changes
  useEffect(() => {
    if (experience) {
      // Check if user has reached the view limit and is not premium
      // But make exception if it's the user's own post or already viewed
      const isAlreadyViewed = experience.alreadyViewed || false;
      
      // Show paywall only when:
      // 1. Limit is reached
      // 2. User is not premium
      // 3. It's not user's own post
      // 4. User hasn't already viewed this post
      const shouldShowPaywall = viewLimitData.isLimitReached && 
                               !viewLimitData.isPremium && 
                               !experience.posted_by_user && 
                               !isAlreadyViewed;
      
      setShowPaywall(shouldShowPaywall);
      
      console.log("Show paywall:", shouldShowPaywall);
      console.log("View limit data:", viewLimitData);
      console.log("Experience ID:", experienceId);
      console.log("Experience data:", experience);
      console.log("User ID:", user?.user_id);
      console.log("Is user's own post:", experience.posted_by_user);
      console.log("Is limit reached:", viewLimitData.isLimitReached);
      console.log("Is premium:", viewLimitData.isPremium);
      console.log("Already viewed:", isAlreadyViewed);
      console.log("Remaining views:", viewLimitData.remainingViews);
    }
  }, [experience, viewLimitData, user?.user_id, experienceId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
      ) : showPaywall ? (
        <div className="relative">
          {/* Show preview of content when limit is reached */}
          <div className="opacity-30 pointer-events-none">
            <Experience experience={experience} updateExperience={updateExperience} showOpenInNewTabButton={false} />
          </div>
          {/* Show paywall - Fixed absolute positioning to ensure it's visible */}
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <ContentPaywall remainingViews={viewLimitData.remainingViews} />
          </div>
        </div>
      ) : (
        <Experience experience={experience} updateExperience={updateExperience} showOpenInNewTabButton={false} />
      )}
    </div>
  );  
};

export default SingleExperiencePage;
