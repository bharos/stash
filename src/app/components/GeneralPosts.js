import { useState, useEffect, useCallback, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import { useUser } from '../context/UserContext';
import Experience from './Experience';
import TrendingPosts from './TrendingPosts';
import ContentPaywall from './ContentPaywall';
import supabase from '../utils/supabaseClient';
import { useDarkMode } from '../context/DarkModeContext';
import { useViewLimitContext } from '../context/ViewLimitContext'; // Import view limit context directly

const GeneralPosts = () => {
  const { user } = useUser();
  const { darkMode } = useDarkMode();
  const [generalPosts, setGeneralPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const limit = 5;
  
  // Access view limit data and functions directly from context
  const { viewLimitData, fetchViewLimitData } = useViewLimitContext();
  
  // State to track whether to show the paywall
  const [showPaywall, setShowPaywall] = useState(false);

  // Update showPaywall when viewLimitData changes
  useEffect(() => {
    // Check if user has reached the view limit and is not premium
    const shouldShowPaywall = user?.user_id && viewLimitData.isLimitReached && !viewLimitData.isPremium;
    setShowPaywall(shouldShowPaywall);
  }, [viewLimitData, user?.user_id]);

  const fetchGeneralPosts = useCallback(
    async (currentPage) => {
      if (!hasMoreRef.current) return;

      setPostsLoading(true);
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }

        const postsResponse = await fetch(`/api/generalPosts?page=${currentPage}&limit=${limit}&sort_by=${sortBy}`, {
          method: 'GET',
          headers: headers
        });
        const postsData = await postsResponse.json();

        if (postsResponse.ok) {
          // Fetch comments for each post
          for (let post of postsData.experiences) {
            const commentsResponse = await fetch(
              `/api/comments?experience_id=${post.id}`, {
                method: 'GET',
                headers: headers
              });
            const commentsData = await commentsResponse.json();
            
            if (commentsResponse.ok) {
              post.comments = commentsData.comments;
            }
          }

          // Set isExpanded to true for all posts
          const newPosts = postsData.experiences.map(post => ({
            ...post,
            isExpanded: true
          }));

          if (currentPage === 1) {
            // For first page, replace all posts
            setGeneralPosts(newPosts);
          } else {
            // For subsequent pages, append new posts
            setGeneralPosts(prev => [...prev, ...newPosts]);
          }
          
          // Update hasMore based on the number of posts received
          setHasMore(newPosts.length === limit);
        } else {
          console.error('Failed to fetch posts:', postsData.error);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setPostsLoading(false);
        
        // Fetch the view limit data to update the UI if needed
        // Only necessary if viewing posts affects the limit count
        if (user?.user_id) {
          fetchViewLimitData(); // Use directly
        }
      }
    },
    [sortBy, user?.user_id] // fetchViewLimitData intentionally omitted from dependencies
  );

  const hasMoreRef = useRef(true);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Reset state when sort changes
  useEffect(() => {
    setGeneralPosts([]);
    setPage(1);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchGeneralPosts(1);
  }, [sortBy, fetchGeneralPosts]);

  const loadMorePosts = () => {
    if (hasMore && !postsLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGeneralPosts(nextPage);
    }
  };

  const updatePost = (updatedPost) => {
    setGeneralPosts((prevPosts) =>
      updatedPost.deleted
        ? prevPosts.filter((post) => post.id !== updatedPost.id)
        : prevPosts.map((post) =>
            post.id === updatedPost.id ? updatedPost : post
          )
    );
  };

  // Sort posts for trending section
  const sortedPosts = [...generalPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* View Limit Warning - Only show for warning (not when paywall is displayed) */}
          {user?.user_id && !viewLimitData.isPremium && viewLimitData.remainingViews <= 1 && !viewLimitData.isLimitReached && (
            <div className={`p-4 mb-4 border ${darkMode ? 'bg-gray-800 border-yellow-600' : 'bg-yellow-50 border-yellow-200'} rounded-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="material-icons text-yellow-500">warning</span>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                    Almost at daily view limit
                  </h3>
                  <div className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {viewLimitData.remainingViews === 0 ? (
                      <p>You've reached your daily view limit. Post content to earn coins or upgrade to premium for unlimited access.</p>
                    ) : (
                      <p>You have {viewLimitData.remainingViews} view left today. Consider posting content to earn coins or upgrading to premium.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Sort Controls */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 space-y-4`}>
              {/* Sort Options */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSortBy('recent')}
                  disabled={postsLoading}
                  className={`px-4 py-2 rounded-lg ${
                    sortBy === 'recent'
                      ? 'bg-purple-600 text-white'
                      : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  disabled={postsLoading}
                  className={`px-4 py-2 rounded-lg ${
                    sortBy === 'popular'
                      ? 'bg-purple-600 text-white'
                      : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
              {postsLoading && page === 1 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading posts...</p>
                </div>
              ) : generalPosts.length > 0 ? (
                <>
                  {generalPosts.map((post) => (
                    <Experience
                      key={post.id}
                      experience={post}
                      updateExperience={updatePost}
                      showOpenInNewTabButton={true}
                    />
                  ))}
                  {hasMore ? (
                    <div className="text-center mt-4">
                      <button
                        onClick={loadMorePosts}
                        disabled={postsLoading}
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors duration-200"
                      >
                        {postsLoading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 mt-4">🏁 You've reached the end 🔚</p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800">No posts available yet 🤐</h3>
                    <p className="text-gray-600">Be the first to share your thoughts!</p>
                  </div>
                  {/* Show Trending Posts on mobile when no posts are available */}
                  <div className="lg:hidden">
                    <TrendingPosts />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <TrendingPosts />
        </div>
      </div>

      {/* Content Paywall - Shown when view limit is reached */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <ContentPaywall />
        </div>
      )}
    </div>
  );
};

export default GeneralPosts;
