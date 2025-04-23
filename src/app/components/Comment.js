'use client';
import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import supabase from '../utils/supabaseClient';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';

const Comment = ({ experienceId, comment }) => {
  const { user } = useUser(); // Access the user from the context
  const { darkMode } = useDarkMode();
    
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState(comment.comment);
  const [replyingTo, setReplyingTo] = useState(false);
  const [replies, setReplies] = useState(""); // Track replies for each comment
  const [menuOpen, setMenuOpen] = useState(null);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [likedByUser, setLikedByUser] = useState(comment.user_liked || false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");
  const [deleted, setDeleted] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

    useEffect(() => {
      if (comment.user_liked !== likedByUser) {
        setLikedByUser(comment.user_liked);  // Only update if hasLiked is different
      }
    }, [comment.user_liked]); // Update hasLiked when comment.user_liked changes

  useEffect(() => {
    const handleClickOutside = (event) => {
        console.log(menuRef, " menuOpen " ,menuOpen);
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false); // Close the dropdown if click is outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

const handleEditComment = async (commentId, editText) => {
  console.log("Editing comment ID ", commentId, " text ", editText);
  
  // Ensure the text is not empty before making the request
  if (!editText.trim()) {
    setCommentError('Comment text cannot be empty.');
    return;
  }

  try {
        // Get the user session
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session || !sessionData.session.access_token) {
        setCommentError('Sign in to edit a comment.');
        return;
        }

        const token = sessionData.session.access_token;
        
        // Send PUT request to edit the comment
        const response = await fetch('/api/comments', {
        method: 'PUT',
        body: JSON.stringify({
            comment_id: commentId,
            new_comment_text: editText,
        }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Add the token to the Authorization header
        },
        });

        const data = await response.json();
        
        if (response.ok) {
            comment.comment = data.comment.comment;
            setCommentError('');
            setCommentSuccess('Comment edit success!');
            // Reset the success message after timeout
            setTimeout(() => {
                setCommentSuccess('');
            }, 2000);
        } else {
            setCommentError(data.error || 'An error occurred while updating the comment.');
        }

    } catch (error) {
        setCommentError(error.message || 'An unexpected error occurred.');
    }
    setEditingComment(null); // Close the edit UI after submission
  }


  const handleDeleteComment = async (commentId) => {
    try {
    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;
      console.log("Delete comment ID ", commentId);
        // Get the user session
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session || !sessionData.session.access_token) {
        setCommentError('You need to be signed in to delete a comment.');
        return;
        }

    const token = sessionData.session.access_token;

      // Make the DELETE request
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comment_id: commentId }), // Send the commentId in the request body
      });

      // Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        setCommentError('Failed to delete comment:', errorData.error);
        return;
      }
  
      const responseData = await response.json();
      console.log(responseData.message); // Log success message, or handle as needed
      setCommentError('');
      setCommentSuccess('Comment delete success!');
      // Reset the success message after timeout
      setTimeout(() => {
          setCommentSuccess('');
          setDeleted(true);
      }, 2000);
    } catch (error) {
      setCommentError('Error deleting comment:', error);
    }
  };
  

  const handleLike = async (commentId) => {
    try {
      // Check if the user is signed in
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session || !sessionData.session.access_token) {
        setCommentError('Sign in to like a comment.');
        return;
      }
  
      const token = sessionData.session.access_token;
  
      // Make the LIKE/UNLIKE request
      const response = await fetch('/api/commentLikes', {
        method: 'POST', // Assuming the like/unlike action is handled by a POST request
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ commentId }), // Send the commentId in the request body
      });
  
      // Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        setCommentError('Failed to like/unlike comment:', errorData.error);
        return;
      }
      const responseData = await response.json();
      setLikes(responseData.liked ? likes + 1 : likes - 1);
      setLikedByUser(responseData.liked); // Update like status
      // Update UI with success response
      setCommentError('');
    } catch (error) {
      setCommentError('Error liking/unliking comment:', error);
    }
  };
  

// Handle reply submission
const handleReplySubmit = async (experienceId, parentCommentId = null) => {
    if (!parentCommentId) {
        console.error('No parent comment ID for reply submit');
        return;
    }
  
    console.log('submit reply ', replies, ' experienceId ' , experienceId, 'username ', user.username, ' parentCommentId ', parentCommentId);
    if (replies && replies.trim()) {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session || !sessionData.session.access_token) {
          setCommentError('Sign in to post a comment.');
          return;
        }
  
        const token = sessionData.session.access_token;
        const username = user.username;
  
        const response = await fetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify({ 
            experience_id: experienceId, 
            comment: replies, 
            username: user.username, 
            parent_comment_id: parentCommentId // Include parentCommentId for replies
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
  
        const data = await response.json();
        if (response.ok) {
            comment.replies.unshift(data.comment);
            setReplies("");
            setReplyingTo(null);
        } else {
          throw new Error('Failed to add reply:', data.error);
        }
      } catch (error) {
        setCommentError(error.message || 'Error occurred while submitting reply.');
      }
    }
  };

  // If the comment is deleted, don't render anything
  if (deleted) {
    return null;
  }

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}mo`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'just now';
  };

  return (
          <div key={comment.id} className={`comment p-4 rounded-lg mb-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          } border`}>
              {/* Comment Content */}
              {editingComment === comment.id ? (
                <textarea
                  value={editText}
                  onChange={(e) =>
                    setEditText(e.target.value)
                  }
                  className={`w-full p-2 border rounded-lg mb-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows="3"
                />
              ) : (
                <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {comment?.comment || "No content available"}
                </p>
              )}
    
              {/* Commenter Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-500">face</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {comment?.is_op ? (
                      <span className="font-bold text-red-500" title="Original Poster (OP)">
                        OP
                      </span>
                    ) : (
                      comment?.username || "Anonymous"
                    )}
                  </span>
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {getRelativeTime(comment.created_at)}
                </span>
              </div>
              {commentError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-500 rounded-lg">
                    {commentError}
                </div>
                )}
                {commentSuccess && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 border border-green-500 rounded-lg">
                        {commentSuccess}
                    </div>
                )}

            <div className="flex items-center justify-between mt-3">
                  {/* Left Section (Reply and Like Buttons) */}
                  <div className="flex items-center gap-4">
                    {/* Reply Button, show only for top level comment */}
                    { !comment.parent_comment_id &&
                        <span
                        onClick={() => setReplyingTo(prev => !prev)}
                        className="material-icons text-blue-600 text-xl cursor-pointer"
                        >
                        reply
                        </span>
                    }
                    {/* Like Button */}
                    <div
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-2 cursor-pointer text-xl transition-all duration-200 ease-in-out transform hover:scale-110`}
                    >
                      <span
                        className={`material-icons ${likedByUser ? 'text-red-500' : 'text-gray-500'}`}
                      >
                        {likedByUser ? 'favorite' : 'favorite_border'}
                      </span>
                      {/* Heart Icon */}
                      <span className="font-semibold text-sm">{likes}</span> {/* Like Count */}
                    </div>
                    {/* Right Section (More Options) */}
                  <div className="relative flex items-center">
                    {/* Three Dots Button */}
                    { comment.posted_by_user &&
                    <button
                      ref={buttonRef} // Attach ref to the button
                      onClick={() => setMenuOpen(prev => !prev)}
                      className="p-1 hover:bg-gray-400 bg-gray-200 rounded-full"
                    >
                      <FiMoreVertical className="text-gray-500 text-lg" />
                    </button>
                    }
                    {/* Dropdown Menu */}
                    {menuOpen && (
                      <div
                        ref={menuRef} // Attach ref to the dropdown menu
                        className="absolute right-0 mt-1 w-24 bg-slate-500 shadow-md rounded-md border text-sm"
                      >
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditText(comment.comment);
                            setMenuOpen(null);
                          }}
                          className="block w-full px-2 py-1 text-left bg-transparent hover:bg-gray-400 border-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteComment(comment.id);
                            setMenuOpen(null);
                          }}
                          className="block w-full px-2 py-1 text-left bg-gray-400 bg-transparent hover:bg-red-400 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
              </div>
                  </div>
            </div>
    
    
              {/* Edit & Save Buttons */}
              {editingComment === comment.id && (
                <div className="flex mt-2 space-x-2">
                  <button
                    onClick={() => {
                      handleEditComment(comment.id, editText);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingComment(null)}
                    className="px-3 py-1 bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
    
              {/* Reply Box */}
              {replyingTo && (
                <div className="mt-3">
                  <textarea
                    value={replies || ""}
                    onChange={(e) => setReplies(e.target.value)}
                    placeholder="Write a reply..."
                    className={`w-full p-2 border rounded-lg mb-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows="3"
                  />
                  <button
                  onClick={() => {
                    handleReplySubmit(experienceId, comment.id); // Pass parent comment ID
                    setReplies("");
                    setReplyingTo(false);
                  }}
                  className={`mt-2 px-3 py-1 rounded-lg text-white ${
                    !replies || !replies.trim()
                      ? 'bg-gray-400 cursor-not-allowed' // Disabled button styles
                      : 'bg-blue-600 hover:bg-blue-700' // Active button styles
                  } ${!replies || !replies.trim() ? 'hover:bg-gray-400' : ''}`} // Remove hover effect when disabled
                  disabled={!replies || !replies.trim()} // Disable button if empty or whitespace
                >
                  Reply
                </button>
                </div>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 ml-6 border-l-2 border-gray-300 pl-4">
                    {comment.replies.map((reply) => (
                    <Comment key={reply.id} comment={reply} experienceId={experienceId} />
                    ))}
                </div>
                )}
            </div>
    );
};

export default Comment;
