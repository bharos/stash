import { useState, useEffect, useCallback } from 'react';

const TrendingPosts = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/trending?limit=5');
      const data = await response.json();
      if (response.ok) {
        // Map the trending data to include necessary fields
        const mappedPosts = data.map(post => ({
          id: post.experience_id,
          title: post.title,
          company_name: post.company_name,
          level: post.level,
          likes: post.likes,
          comments: post.comments,
          trending_score: post.trending_score
        }));
        setTrendingPosts(mappedPosts);
      } else {
        console.error('Failed to fetch trending posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingPosts();
  }, [fetchTrendingPosts]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="material-icons text-red-500 mr-2">trending_up</span>
          Trending
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="material-icons text-red-500 mr-2">trending_up</span>
        Trending
      </h2>
      <div className="space-y-4">
        {trendingPosts.map((post) => (
          <a
            key={post.id}
            href={`/experience/${post.id}`}
            className="block border-b border-gray-100 pb-4 last:border-0 hover:bg-gray-50 -mx-6 px-6 transition-colors duration-200"
          >
            <h3 className="font-medium text-gray-800 hover:text-blue-600">
              {post.title || post.company_name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {post.company_name} • {post.level}
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span className="material-icons text-sm mr-1">favorite</span>
              <span>{post.likes || 0}</span>
              <span className="mx-2">•</span>
              <span className="material-icons text-sm mr-1">comment</span>
              <span>{post.comments?.length || 0}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts; 