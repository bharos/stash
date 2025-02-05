import React, { useState, useEffect} from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import supabase from '../utils/supabaseClient';
import { useUser } from '../context/UserContext';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

/**
 * Experience Component
 * 
 * This component displays an individual experience card and handles various actions such as:
 * - Expanding/collapsing the experience details
 * - Posting comments
 * - Liking/unliking the experience
 * - Deleting the experience
 * 
 * The `updateExperience` function passed by the caller is expected to handle updating the state
 * of the experience with the latest changes. It should expect an updated `experience` object 
 * with properties as needed based on the action being performed (e.g., isExpanded, comments, deleted, etc.).
 * 
 * The updated experience object should contain at least the following properties:
 * - id (string): Unique identifier for the experience
 * - [other properties that might change, such as comments, isExpanded, likes, etc.]
 * 
 * Example of how the component might call updateExperience with an updated experience:
 * {
 *   ...experience, // Spread the original experience properties
 *   isExpanded: !experience.isExpanded, // Toggle the isExpanded flag
 *   comments: updatedComments, // Updated list of comments
 *   deleted: true, // Flag for deleted experience (if applicable)
 * }
 */
const Experience = ({ experience, updateExperience, showOpenInNewTabButton }) => {
  const { user } = useUser(); // Access the user from the context
  const [newComments, setNewComments] = useState({}); // State for comments per experience
  const [isLinkCopied, setIsLinkCopied] = useState(false); // State to track if the link is copied
  const [showShareModal, setShowShareModal] = useState(false); // State to show/hide the share modal
  const [commentError, setCommentError] = useState(''); // State to store the error message
  const [likes, setLikes] = useState(experience.likes || 0);
  const [hasLiked, setHasLiked] = useState(experience.user_liked || false);

  useEffect(() => {
    if (experience.user_liked !== hasLiked) {
      setHasLiked(experience.user_liked);  // Only update if hasLiked is different
    }
  }, [experience.user_liked]); // Update hasLiked when experience.user_liked changes

  useEffect(() => {
    if (experience.likes !== likes) {
      setLikes(experience.likes); // Only update if likes is different
    }
  }, [experience.likes]); // Update likes when experience.likes changes

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
    setShowShareModal(true); // Show the modal when the share button is clicked
  };

  // Handle comment submission
  const handleCommentSubmit = async (experienceId) => {
    const comment = newComments[experienceId];
    if (comment && comment.trim()) {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session || !sessionData.session.access_token) {
          setCommentError('You need to be signed in to post a comment.');
          return; // Stop the process if user is not authenticated
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
          // Create a new comment object with the username field added
          const updatedComment = {
            ...data.comment, // Spread the original comment object
            username: { username: user.username }, // Add the username
          };
          const updatedExperience = {
            ...experience, // Spread the original experience object
            comments: [...experience.comments, updatedComment], // Add the new comment to the comments array
          };
          updateExperience(updatedExperience);
          setNewComments((prevState) => ({ ...prevState, [experienceId]: '' }));
          setCommentError(''); // Clear the comment error
        } else {
          console.error('Failed to add comment:', data.error);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    }
  };

  // Handle copy to clipboard
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setIsLinkCopied(true); // Show confirmation message
      setTimeout(() => setIsLinkCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const handleLike = async () => {
    if (!user) {
      alert('Sign in to like an experience.');
      return;
    }

    // if (hasLiked) return;

    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session || !sessionData.session.access_token) {
        alert('Sign in to like an experience.');
        return;
      }
      const token = sessionData.session.access_token;
      const response = await fetch('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ experienceId: experience.id }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const responseData = await response.json();
        setLikes(responseData.liked ? likes + 1 : likes - 1);
        setHasLiked(responseData.liked); // Update like status
      } else {
        console.error('Failed to like experience');
      }
    } catch (error) {
      console.error('Error liking experience:', error);
    }
  };

  const handleDelete = async (experienceId) => {
    if (!experienceId) return;
  
    const confirmDelete = window.confirm("Are you sure you want to delete this experience?");
    if (!confirmDelete) return;
    try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData?.session || !sessionData.session.access_token) {
      setCommentError('You need to be signed in to delete experience.');
      return; // Stop the process if user is not authenticated
    }
    const token = sessionData.session.access_token; // Access token from the session object
    const response = await fetch("/api/experiences", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ experienceId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete experience.");
    }
    const updatedExperience = {
      ...experience, // Spread the original experience object
      deleted: true, // Set the deleted flag to true
    };
    updateExperience(updatedExperience); 
      alert("Experience deleted successfully!");
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('Failed to delete experience.');
    }
  }

  return (
    <div
    key={experience.id}
    className={`experience-card bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 mt-4 relative overflow-hidden ${
      experience.isExpanded ? 'h-auto' : 'h-[200px]'
    }`}
  >
    {/* Buttons Section (separate row above the company name) */}
    <div className="flex justify-end w-full absolute top-2 right-2">
      {/* If posted_by_user is set, add a delete button */}
      {experience.posted_by_user && (
        <button
        onClick={() => handleDelete(experience.id)}
        className="text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600 ml-2"
      >
        <span className="material-icons">delete</span>
      </button>
      )}
      
      {/* Open in New Tab Button (conditionally rendered) */}
      {showOpenInNewTabButton && (
        <button
          onClick={() =>
            window.open(`${window.location.origin}/experience/${experience.id}`, '_blank')
          }
          className="text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600 ml-2"
        >
          <span className="material-icons">open_in_new</span>
        </button>
      )}
  {/* Share button */}
      <button
        onClick={() => handleShareExperience(experience.id)}
        className="text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600 ml-2"
      >
        <span className="material-icons ml-2 mr-2">share</span>
      </button>
  
      {/* Toggle details button */}
      <button
        onClick={() => toggleExperienceDetails(experience)}
        className="text-blue-600 font-semibold text-2xl w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600 ml-2"
      >
        {experience.isExpanded ? '–' : '+'}
      </button>
    </div>
  
    {/* Card Content */}
    <div className="flex items-center gap-4 mt-3 relative">
      {/* Profile Image */}
      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center">
        <span className="text-lg font-bold">{experience.company_name[0]}</span>
      </div>
  
      {/* Company Details Section */}
      <div className="flex-grow min-w-0">
        <h3 className="text-2xl font-semibold text-gray-900 truncate">{experience.company_name}</h3>
        <p className="text-gray-500">
          Level: <span className="font-medium text-gray-700">{experience.level}</span>
        </p>
        {/* Display Username */}
        <p className="text-gray-400 text-sm">
          Submitted by: {experience.username ? experience.username.username : 'Anonymous'}
        </p>
      </div>
    </div>
  
{/* Share Modal */}
{showShareModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h4 className="text-2xl font-semibold mb-6 text-center text-gray-800">Share this Experience</h4>
      <div className="flex items-center space-x-2 mb-6">
        <input
          type="text"
          readOnly
          value={`${window.location.origin}/experience/${experience.id}`}
          className="w-full p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
        />
        <button
          onClick={() => handleCopyLink(`${window.location.origin}/experience/${experience.id}`)}
          className="p-3 bg-blue-600 text-white rounded-r-lg font-medium text-sm transition-all duration-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isLinkCopied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
      <button
        onClick={() => setShowShareModal(false)}
        className="w-full py-2 mt-4 text-center text-white-600 font-medium hover:text-gray-800 transition-all duration-200"
      >
        Close
      </button>
    </div>
  </div>
)}
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
                className="w-full bg-transparent p-0 text-gray-900 min-h-[50px]"
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

{/* Like and Comment counts Section */}
<div className="like-comment-section flex items-center gap-14 mt-6 ml-6">
  {/* Like icon and counts */}
  <div
    onClick={handleLike}
    className={`flex items-center gap-2 cursor-pointer text-xl transition-all duration-200 ease-in-out transform hover:scale-110`}
  >
    <span
      className={`material-icons ${hasLiked ? 'text-red-500' : 'text-gray-500'}`}
    >
      {hasLiked ? 'favorite' : 'favorite_border'}
    </span> {/* Heart Icon */}
    <span className="font-semibold">{likes}</span> {/* Like Count */}
  </div>

  {/* Comment icon and counts */}
  <div className="flex items-center gap-2">
    <span className="material-icons text-gray-500">comment</span> {/* Comment Icon */}
    <span className="font-semibold">{experience.comments ? experience.comments.length : 0}</span> {/* Comment Count */}
  </div>
</div>


      {/* Comments Section */}
      <div className="comments mt-4">
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
          {/* Display Comment Error */}
          {commentError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-500 rounded-lg">
              {commentError}
            </div>
          )}
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
  );
};

export default Experience;
