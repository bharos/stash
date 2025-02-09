import { useEffect, useState } from 'react';

const LandingPage = ({ setActiveMenu }) => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; // Number of posts per page

  // List of character emojis to randomly assign to users
  const userEmojis = ['🥸', '👱🏻‍♂️', '🧙🏻', '👩🏻‍💻', '👨‍🦱', '🧑‍🏫', '🧑‍🎤', '👩‍🚀', '👨‍🍳', '👨‍⚖️'];

  // List of post smileys/icons
  const postSmileys = ['✏️', '📚', '🖊️', '📜', '📝', '💬', '🗣️', '✍️', '📤'];

  // Function to fetch trending posts
  const fetchTrendingPosts = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/trending?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (data.length < limit) setHasMore(false); // No more posts to load if fewer than the limit

      setTrendingPosts((prev) => [...prev, ...data]); // Append new posts to the existing list
      setPage(page + 1); // Increment page number for the next fetch
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
  }, []); // Only fetch once on component mount

  // Function to get a random user emoji
  const getRandomUserEmoji = () => {
    const randomIndex = Math.floor(Math.random() * userEmojis.length);
    return userEmojis[randomIndex];
  };

  // Function to get a random post smiley
  const getRandomPostSmiley = () => {
    const randomIndex = Math.floor(Math.random() * postSmileys.length);
    return postSmileys[randomIndex];
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen text-center p-6">
      <h1 className="text-4xl font-bold mb-4 mt-4">Welcome to Stash – The Ultimate Interview Database! 🚀</h1>
      <p className="text-lg mb-8">Post your interview stories, learn from the community, and prepare smarter! 🤓</p>

      {/* Trending Posts Section */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">🔥 Trending Posts</h2>

        {trendingPosts.length === 0 && !loading ? (
          <p>No trending posts available.</p>
        ) : (
          <ul className="space-y-4">
            {trendingPosts.map((post) => (
              <li key={post.experience_id} className="p-1">
                <a
                  href={`/experience/${post.experience_id}`}
                  className="block p-3 bg-gray-100 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-lg hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    <span className="text-purple-500">{getRandomUserEmoji()}</span>
                    <span className="ml-2">{post.username || 'Anonymous'}</span>
                    <span className="ml-2 text-teal-600">{getRandomPostSmiley()} </span>
                    <span className="font-bold text-zinc-600"> {post.company_name}</span>
                    <span className="font-bold text-slate-500"> [ {post.level} ]</span>
                  </h3>
                  <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400">
                    {/* Using Material Icons for thumbs up */}
                    <span className="material-icons mr-2">thumb_up</span>
                    {post.likes}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="mt-6">
            <button
              onClick={fetchTrendingPosts}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-4 text-lg text-gray-500">
            <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
