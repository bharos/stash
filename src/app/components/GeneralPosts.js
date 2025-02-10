import { useState, useEffect, useCallback, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import Select from 'react-select';
import debounce from 'lodash.debounce';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import Experience from './Experience';
import supabase from '../utils/supabaseClient';

const GeneralPosts = () => {
  const { user } = useUser(); // Use user from context here
  const [generalPosts, setGeneralPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  console.log('general posts page');
  const fetchGeneralPosts = useCallback(
    debounce(async () => {
      setPostsLoading(true);
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

        const postsResponse = await fetch(`/api/generalPosts`, {
          method: 'GET',
          headers: headers
        });
        const postsData = await postsResponse.json();

        if (postsResponse.ok) {
          setGeneralPosts(postsData.experiences);
  
          // Loop through the experiences and fetch comments for each
          for (let post of postsData.experiences) {
            const commentsResponse = await fetch(
              `/api/comments?experience_id=${post.id}`
            );
            const commentsData = await commentsResponse.json();
            
            if (commentsResponse.ok) {
                post.comments = commentsData.comments;
            } else {
              console.error('Failed to fetch comments:', commentsData.error);
            }
          }
  
          // Keep the 'isExpanded' flag true for the all experiences (UI state)
            postsData.experiences.map(experience => experience.isExpanded = true);
        } else {
          // If the fetch fails, clear the posts state
          setGeneralPosts([]);
          console.error('Failed to fetch posts:', postsData.error);
        }
      } catch (error) {
        setGeneralPosts([]);
        console.error('Error fetching posts:', error);
      } finally {
        setPostsLoading(false);
      }
    }, 500), // 500ms debounce delay
    [] // Empty dependency array ensures that 'fetchExperiences' doesn't get recreated on every render
  );

// This effect updates the refs whenever the state values change
useEffect(() => {
  fetchGeneralPosts(); // Trigger the debounced fetch function
}, [user]);

  /**
 * Updates the list of experiences in the state.
 * 
 * This function checks if the experience has been marked for deletion (i.e., `deleted: true`).
 * - If `deleted` is `true`, it removes the experience with the matching `id` from the list.
 * - If `deleted` is `false` or not present, it updates the experience in the list by replacing the one with the matching `id` with the updated data.
 * @param {Object} updatedExperience - The experience object containing updated data, including an `id` to identify the experience.
 * @param {boolean} updatedExperience.deleted - A flag indicating whether the experience should be deleted. If `true`, the experience will be removed from the list.
 * @param {string} updatedExperience.id - The unique identifier of the experience to update or delete.
 */
const updatePost = (updatedPost) => {
  setGeneralPosts((prevPosts) =>
    updatedPost.deleted
      ? prevPosts.filter((post) => post.id !== updatedPost.id)
      : prevPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
  );
};

  return (
    <div className="dashboard-container p-2 sm:p-6 space-y-6">

      {/* Posts List */}
      <div className="experience-list space-y-6">
        {postsLoading ? (
          <p className="text-center text-gray-500">Loading posts...</p>
        ) : generalPosts.length > 0 ? (
          generalPosts.map((post) => (
            <Experience
            key={post.id}
            experience={post}
            updateExperience={updatePost}
            showOpenInNewTabButton={true}
          />
          
        ))) : (
          <p className="text-center text-gray-500">No posts available 🤐</p> // Show this when no posts are available
        )}
      </div>
    </div>
  );
};

export default GeneralPosts;
