import { useEffect, useState } from 'react';
import { sanitizeAndStripHTML } from '../utils/textUtils';
import { useDarkMode } from '../context/DarkModeContext';

const TrendingPosts = () => {
  const { darkMode } = useDarkMode();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const response = await fetch('/api/trending?limit=5');
        const data = await response.json();
        setTrendingPosts(data);
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  // Function to get post type color
  const getPostTypeColor = (type) => {
    return type === 'interview_experience' 
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' 
      : 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800';
  };

  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
        <h2 className={`text-xl font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <span className="material-icons text-gradient mr-2">trending_up</span>
          Trending
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm p-6 border`}>
      <h2 className={`text-xl font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <span className="material-icons text-gradient mr-2">trending_up</span>
        Trending
      </h2>
      <div className="space-y-4">
        {trendingPosts.map((post) => (
          <a
            key={post.experience_id}
            href={`/experience/${post.experience_id}`}
            className={`block rounded-lg p-4 transition-all duration-200 group ${
              darkMode 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPostTypeColor(post.type)} border`}>
                    {post.type === 'interview_experience' ? 'Interview' : 'Post'}
                  </span>
                  {post.level && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800">
                      {post.level}
                    </span>
                  )}
                </div>
                <h3 className={`font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.type === 'interview_experience' ? post.company_name : post.title}
                </h3>
                {post.type === 'general_post' ? (
                  <p className={`text-sm mt-2 line-clamp-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {sanitizeAndStripHTML(post.details, 150)}
                  </p>
                ) : (
                  <p className={`text-sm mt-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Interview experience for {post.level || 'Software Engineer'} role
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className={`flex items-center group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200 ${
                  post.likes > 0 
                    ? 'text-indigo-500 dark:text-indigo-400' 
                    : darkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-500'
                }`}>
                  <span className="material-icons text-sm">favorite</span>
                  <span className="text-sm ml-1">{post.likes || 0}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default TrendingPosts; 