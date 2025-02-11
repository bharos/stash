import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import supabase from '../utils/supabaseClient';
import { useUser } from '../context/UserContext';

const Comment = ({ experienceId, comment }) => {
  const { user } = useUser(); // Access the user from the context
    
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState(comment.comment);
  const [replyingTo, setReplyingTo] = useState(false);
  const [replies, setReplies] = useState(""); // Track replies for each comment
  const [menuOpen, setMenuOpen] = useState(null);
  const [likedByUser, setLikedByUser] = useState(comment.user_liked || false);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

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

  const handleEditComment = (commentId, editText) => {
    console.log("Editing comment ID ", commentId, " text ", editText);
    setEditingComment(null);
  };


  const handleDeleteComment = (commentId) => {
    console.log("Delete comment ID ", commentId);
  };

  const handleLike = (commentId) => {
    console.log("Like comment ID ", commentId);
  };

// Handle comment submission
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
          setCommentError('You need to be signed in to post a comment.');
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
          comment.replies = [...comment.replies, replies];
            setReplies("");
            setReplyingTo(null);
        } else {
          console.error('Failed to add comment:', data.error);
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    }
  };
  

  return (
          <div key={comment.id} className="comment p-4 bg-gray-100 rounded-lg relative">
              {/* Comment Content */}
              {editingComment === comment.id ? (
                <textarea
                  value={editText}
                  onChange={(e) =>
                    setEditText(e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-800">{comment?.comment || "No content available"}</p>
              )}
    
              {/* Commenter Info */}
              <p className="text-gray-500 text-sm mt-1">
                By:{" "}
                {comment?.is_op ? (
                  <span className="font-bold text-red-500" title="Original Poster (OP)">
                    OP
                  </span>
                ) : (
                  comment?.username || "Anonymous"
                )}
              </p>
    
    
            <div className="flex items-center justify-between mt-3">
                  {/* Left Section (Reply and Like Buttons) */}
                  <div className="flex items-center gap-4">
                    {/* Reply Button */}
                    <span
                      onClick={() => setReplyingTo(prev => !prev)}
                      className="material-icons text-blue-600 text-xl cursor-pointer"
                    >
                      reply
                    </span>
    
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
                      <span className="font-semibold text-sm">{comment.likes}</span> {/* Like Count */}
                    </div>
                  </div>
    
                  {/* Right Section (More Options) */}
                  <div className="relative flex items-center">
                    {/* Three Dots Button */}
                    <button
                      ref={buttonRef} // Attach ref to the button
                      onClick={() => setMenuOpen(prev => !prev)}
                      className="p-1 hover:bg-gray-400 bg-gray-200 rounded-full"
                    >
                      <FiMoreVertical className="text-gray-500 text-lg" />
                    </button>
    
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
                    className="w-full p-2 border border-gray-300 rounded-lg"
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
            </div>
    );
};

export default Comment;
