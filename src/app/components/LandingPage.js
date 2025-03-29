import { useEffect, useState } from 'react';
import { sanitizeAndStripHTML } from '../utils/textUtils';
import { useDarkMode } from '../context/DarkModeContext';

const LandingPage = ({ setActiveMenu }) => {
  const { darkMode } = useDarkMode();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // Modern emoji categories for different types of posts
  const postCategories = {
    'interview_experience': {
      emojis: ['💼', '🎯', '💪', '🎓', '🚀'],
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100'
    },
    'general_post': {
      emojis: ['💡', '💭', '📝', '✍️', '💬'],
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-100'
    }
  };

  // Function to fetch trending posts
  const fetchTrendingPosts = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/trending?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (data.length < limit) setHasMore(false);
      setTrendingPosts((prev) => [...prev, ...data]);
      setPage(page + 1);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  // Function to get random emoji based on post type
  const getPostEmoji = (type) => {
    const category = postCategories[type] || postCategories['general_post'];
    const randomIndex = Math.floor(Math.random() * category.emojis.length);
    return {
      emoji: category.emojis[randomIndex],
      bgColor: category.bgColor,
      textColor: category.textColor,
      borderColor: category.borderColor
    };
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Function to get difficulty level color
  const getDifficultyColor = (level) => {
    const colors = {
      'Easy': 'bg-green-50 text-green-700 border-green-100',
      'Medium': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      'Hard': 'bg-red-50 text-red-700 border-red-100',
      'Expert': 'bg-purple-50 text-purple-700 border-purple-100'
    };
    return colors[level] || 'bg-gray-50 text-gray-700 border-gray-100';
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      {/* Modern Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 opacity-95 z-0"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px] z-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome to Stash – The Ultimate Interview Database! 🚀
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl">
              Post your interview stories, learn from the community, and prepare smarter! 🤓
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => setActiveMenu('postExperience')}
                className="text-white hover:text-blue-100 transition-colors duration-300 flex items-center gap-2 text-sm"
              >
                <span className="material-icons">add_circle</span>
                Share Experience
              </button>
              <button
                onClick={() => setActiveMenu('interviewExperienceDashboard')}
                className="text-white hover:text-blue-100 transition-colors duration-300 flex items-center gap-2 text-sm"
              >
                <span className="material-icons">explore</span>
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Why use Stash Section */}
        <div className="mb-12">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm p-6 border animate-fade-in`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="material-icons text-purple-500 mr-2">lightbulb</span>
              Why use Stash?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start group">
                <span className="material-icons text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300">check_circle</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share experiences anonymously with confidence</p>
              </div>
              <div className="flex items-start group">
                <span className="material-icons text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300">check_circle</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">Real interview experiences from verified users</p>
              </div>
              <div className="flex items-start group">
                <span className="material-icons text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300">check_circle</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">Community-driven insights and tips</p>
              </div>
              <div className="flex items-start group">
                <span className="material-icons text-green-500 mr-2 group-hover:scale-110 transition-transform duration-300">check_circle</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">Stay updated with latest interview trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Posts Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="material-icons text-blue-500 mr-2">trending_up</span>
              Trending Posts
            </h2>
          </div>

          {trendingPosts.length === 0 && !loading ? (
            <div className={`text-center py-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border`}>
              <p className="text-gray-500 dark:text-gray-400">No trending posts available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingPosts.map((post, index) => {
                const { emoji, bgColor, textColor, borderColor } = getPostEmoji(post.type);
                return (
                  <a
                    key={post.experience_id}
                    href={`/experience/${post.experience_id}`}
                    className={`group block ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border animate-fade-in-up`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Header with Emoji and Company/Title */}
                    <div className={`p-6 ${bgColor} border-b ${borderColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            {emoji}
                          </div>
                          <div className="ml-3">
                            <h3 className={`text-base font-semibold ${textColor} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300`}>
                              {post.type === 'interview_experience' ? post.company_name : post.title}
                            </h3>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{post.username || 'Anonymous'}</span>
                              <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                              <span className={`text-xs ${textColor}`}>
                                {post.type === 'interview_experience' ? 'Interview' : 'Post'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(post.level)} border`}>
                          {post.level}
                        </span>
                      </div>
                      
                      {/* Post Preview */}
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {post.type === 'interview_experience' 
                          ? `Interview experience for ${post.level || 'Software Engineer'} role`
                          : sanitizeAndStripHTML(post.details, 150)}
                      </p>
                    </div>

                    {/* Footer with Tags and Likes */}
                    <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-between`}>
                      <div className="flex flex-wrap gap-2">
                        {post.tags?.slice(0, 2).map((tag, index) => (
                          <span key={index} className={`px-2 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'} text-xs rounded-full border shadow-sm group-hover:border-blue-200 transition-colors duration-300`}>
                            {tag}
                          </span>
                        ))}
                        {post.tags?.length > 2 && (
                          <span className={`px-2 py-0.5 ${darkMode ? 'bg-gray-800 text-gray-500 border-gray-600' : 'bg-white text-gray-400 border-gray-200'} text-xs rounded-full border shadow-sm`}>
                            +{post.tags.length - 2} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <span className="material-icons text-sm mr-1">thumb_up</span>
                        <span className="text-xs">{post.likes || 0}</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="text-center mt-8">
              <button
                onClick={fetchTrendingPosts}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-icons">expand_more</span>
                Load More Posts
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading more posts...</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
