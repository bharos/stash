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
  const [page, setPage] = useState(1); // Track current page
  const [hasMore, setHasMore] = useState(true); // Check if more posts are available
  const limit = 5; // Number of posts per request

  console.log('general posts page');
  const fetchGeneralPosts = useCallback(
    debounce(async (currentPage) => {
      if (!hasMoreRef.current) return;  // Stop fetching if no more posts

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

        const postsResponse = await fetch(`/api/generalPosts?page=${currentPage}&limit=${limit}`, {
          method: 'GET',
          headers: headers
        });
        const postsData = await postsResponse.json();

        if (postsResponse.ok) {  
          // Loop through the experiences and fetch comments for each
          for (let post of postsData.experiences) {
            const commentsResponse = await fetch(
                `/api/comments?experience_id=${post.id}`, {
                  method: 'GET',
                  headers: headers
                });
            const commentsData = await commentsResponse.json();
            
            if (commentsResponse.ok) {
                post.comments = commentsData.comments;
            } else {
              console.error('Failed to fetch comments:', commentsData.error);
            }
          }
  
          // Keep the 'isExpanded' flag true for the all experiences (UI state)
            postsData.experiences.map(experience => experience.isExpanded = true);
            const newPosts = postsData.experiences;
            setGeneralPosts((prev) => [...prev, ...newPosts]);
            if (newPosts.length < limit) {
              setHasMore(false);
            }
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

const hasMoreRef = useRef(true); // Store latest value for hasMore in ref to use in the debounced callback

useEffect(() => {
  hasMoreRef.current = hasMore; // Keep ref updated when hasMore changes
}, [hasMore]);

// This effect updates the refs whenever the state values change
useEffect(() => {
  setGeneralPosts([]); // Reset posts when user changes
  setPage(1);
  setHasMore(true);
  fetchGeneralPosts(1);
}, [user]);

const loadMorePosts = () => {
  if (hasMore) {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGeneralPosts(nextPage);
  }
};

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
        {generalPosts.length > 0 ? (
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
      {/* Load More Button */}
      {hasMore ? (
        <div className="text-center mt-4">
          <button
            onClick={loadMorePosts}
            disabled={postsLoading}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {postsLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : (
        <div className="text-center mt-4">
          <p className="text-gray-500">🏁 You’ve reached the end of the posts 🔚</p>
        </div>
      )}
    </div>
  );
};

export default GeneralPosts;
