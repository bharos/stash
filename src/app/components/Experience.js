
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import supabase from '../utils/supabaseClient';
import { useUser } from '../context/UserContext';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });


const Experience = ({ experience, updateExperience }) => {
  const { user } = useUser(); // Access the user from the context
  const [newComments, setNewComments] = useState({}); // State for comments per experience

  const toggleExperienceDetails = (experience) => {
    const updatedExperience = {
      ...experience, // Spread the original experience object
      isExpanded: !experience.isExpanded, // Toggle the isExpanded property
    };
    
    updateExperience(updatedExperience); // Pass the updated experience to updateExperience
  };
  
  const handleShareExperience = (experienceId) => {
          // Generate a shareable link, ensuring that the URL structure is correct
          const shareableLink = `${window.location.origin}/experience/${experience.id}`;
          // Display the link, or show a modal for better UX
          alert(`Share this experience: ${shareableLink}`);
      };

       // Handle comment submission
  const handleCommentSubmit = async (experienceId) => {
    const comment = newComments[experienceId];
  
    if (comment && comment.trim()) {
      try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session || !sessionData.session.access_token) {
        throw new Error('User is not authenticated or token is missing');
      }
      const token = sessionData.session.access_token; // Access token from the session object
  
        const response = await fetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify({ experience_id: experienceId, comment }),
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Attach token in the Authorization header
          },
        });
        const data = await response.json();
  
        if (response.ok) {
          console.log('Comment added:', data.comment);
          // Create a new comment object with the username field added
          const updatedComment = { 
            ...data.comment, // Spread the original comment object
            username: { username: user.username } // Add the username
          };
          const updatedExperience = {
            ...experience, // Spread the original experience object
            comments: [...experience.comments, updatedComment] // Add the new comment to the comments array
          };            
          // Pass the updated experience to updateExperience
          updateExperience(updatedExperience);
          // Clear the input for the specific experience
          setNewComments((prevState) => ({ ...prevState, [experienceId]: '' }));
        } else {
          console.error('Failed to add comment:', data.error);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    }
  };

      return (
    <div
      key={experience.id}
      className={`experience-card bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 mt-4 relative overflow-hidden ${
        experience.isExpanded ? 'h-auto' : 'h-[200px]'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <span className="text-lg font-bold">{experience.company_name[0]}</span>
        </div>
        <div className="flex-grow">
          <h3 className="text-2xl font-semibold text-gray-900">{experience.company_name}</h3>
          <p className="text-gray-500">
            Level: <span className="font-medium text-gray-700">{experience.level}</span>
          </p>
          {/* Display Username */}
          <p className="text-gray-400 text-sm">
          Submitted by: {experience.username ? experience.username.username : 'Anonymous'}
        </p>
        </div>
        <button
        onClick={() => handleShareExperience(experience.id)}
        className="absolute top-2 right-12 text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600"
      >
         <span className="material-icons ml-2 mr-2">share</span>
      </button>
        <button
          onClick={() => toggleExperienceDetails(experience)}
          className="absolute top-2 right-2 text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600"
        >
          {experience.isExpanded ? '–' : '+'}
        </button>
      </div>

      {/* Experience Details */}
      <div className="experience-details mt-4">
        {experience.rounds.map((round, index) => (
          <div key={index} className="round-container mb-4">
            <h4 className="font-semibold text-xl text-blue-600">
              Round {index + 1}: {round.round_type}
            </h4>
            <div className="w-full p-0 border-none rounded-md">
              <ReactQuill
                value={round.details}
                readOnly
                theme="snow"
                className="w-full bg-transparent p-0 text-gray-900 min-h-[100px]"
                modules={{
                  toolbar: false, // No toolbar
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#333',
                  margin: 0,
                  padding: 0,
                  width: '100%',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Comments Section */}
      <div className="comments mt-4">
        <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
        <div className="comments-list space-y-4">
          {experience.comments && experience.comments.length > 0 ? (
            experience.comments.map((comment, index) => (
              <div key={index} className="comment p-4 bg-gray-100 rounded-lg">
                <p>{comment?.comment || 'No content available'}</p>
                {/* Display Commenter's Username */}
                <p className="text-gray-400 text-sm">
                  By: {comment.username ? comment.username.username : 'Anonymous'}
                </p>
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
        </div>

        {/* Add Comment */}
        <div className="add-comment mt-4">
          <textarea
            value={newComments[experience.id] || ''}
            onChange={(e) =>
              setNewComments({ ...newComments, [experience.id]: e.target.value })
            }
            placeholder="Add a comment"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={() => handleCommentSubmit(experience.id)}
            className={`mt-2 p-2 rounded-lg text-white ${
              !newComments[experience.id] || !newComments[experience.id].trim()
                ? 'bg-gray-400 cursor-not-allowed' // Disabled button styles
                : 'bg-blue-600 hover:bg-blue-700' // Active button styles
            } ${!newComments[experience.id] || !newComments[experience.id].trim() ? 'hover:bg-gray-400' : ''}`} // Remove hover effect when disabled
            disabled={!newComments[experience.id] || !newComments[experience.id].trim()} // Disable button if empty or whitespace
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  )
};

export default Experience;