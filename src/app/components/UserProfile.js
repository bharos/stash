import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '../context/DarkModeContext';
import supabase from '../utils/supabaseClient';
import Link from 'next/link';
import UserTokens from './UserTokens';
import TokenHistory from './TokenHistory';
import PremiumBadge from './PremiumBadge';
import NotificationSettings from './NotificationSettings';
import Notifications from './Notifications';

const UserProfile = () => {
  const { user, setUser } = useUser();
  const [newUsername, setNewUsername] = useState(user.username || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("experiences");
  const [experiences, setExperiences] = useState([]);
  const [generalPosts, setGeneralPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [pageExperiences, setPageExperiences] = useState(1);
  const [pageGeneralPosts, setPageGeneralPosts] = useState(1);
  const [pageLikes, setPageLikes] = useState(1);
  const [pageComments, setPageComments] = useState(1);
  const [limit] = useState(10); // Set a limit for the number of items per page
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const isNewUser = !user.username; // Check if username is not set

  const fetchUserActivityData = async () => {
    try {
      // Fetch the user's session data
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session || !sessionData.session.access_token) {
        setPosts([]);
        setLikes([]);
        setComments([]);
        return;
      }
  
      const token = sessionData.session.access_token;
      if (!token) {
        console.error('No token found. User is not authenticated.');
        return;
      }
  
      // Construct the API endpoint with the query parameters based on activeTab
      const type = getTypeFromTab(activeTab); // Get the correct activity type based on the active tab
      const page = getPageFromTab(activeTab);  // Get the page for the active tab
      const activityRes = await fetch(`/api/activity?type=${type}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!activityRes.ok) {
        throw new Error('Failed to fetch activity');
      }
      const activityData = await activityRes.json();
      if (activeTab === 'general posts') {
        setGeneralPosts(activityData.data);
      } else if (activeTab === 'likes') {
        setLikes(activityData.data);
      } else if (activeTab === 'comments') {
        setComments(activityData.data);
      } else if (activeTab === 'experiences') {
        setExperiences(activityData.data);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getTypeFromTab = (tab) => {
    switch (tab) {
      case 'general posts':
        return 'general_post';
      case 'likes':
        return 'like';
      case 'comments':
        return 'comment';
      default:
        return 'experience';
    }
  };

  const getPageFromTab = (tab) => {
    switch (tab) {
      case 'general posts':
        return pageGeneralPosts;
      case 'likes':
        return pageLikes;
      case 'comments':
        return pageComments;
      default:
        return pageExperiences;
    }
  };

  const handlePageChange = (direction) => {
    if (activeTab === 'general posts') {
      setPageGeneralPosts(prevPage => prevPage + direction);
    } else if (activeTab === 'likes') {
      setPageLikes(prevPage => prevPage + direction);
    } else if (activeTab === 'comments') {
      setPageComments(prevPage => prevPage + direction);
    } else {
      setPageExperiences(prevPage => prevPage + direction);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/profiles?user_id=${user.user_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profileData = await response.json();
      setIsUnsubscribed(profileData.is_unsubscribed || false); // Set the checkbox state
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    if (user.user_id) {
      fetchUserProfile(); // Fetch profile data on component load
    }
  }, [user.user_id]);

  useEffect(() => {
    setLoading(true);  // Set loading to true before making the fetch request
    fetchUserActivityData();
  }, [user.user_id, activeTab, pageExperiences, pageGeneralPosts, pageLikes, pageComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.user_id) {
      setError('You must be logged in to update your settings.');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.user_id, 
          username: newUsername, 
          isUnSubscribed: isUnsubscribed
        }),
      });

      const result = await response.json();
      if (response.ok) {
        const isNewUserSetting = !user.username;
        
        // Update user context with new username
        setUser({ ...user, username: newUsername });
        
        if (isNewUserSetting) {
          // For new users, show different message and redirect to home
          setSuccessMessage('Username set successfully! You can now use all features of Stash.');
          // Allow the success message to be visible briefly before redirect
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          // For existing users updating settings
          setSuccessMessage('Settings updated successfully!');
        }
      } else {
        setError(result.error ? result.error : 'Something went wrong. Failed to update settings.');
      }
    } catch (err) {
      setError('Failed to update settings.');
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-6`}>
      {/* Welcome banner for new users */}
      {isNewUser && (
        <div className={`w-full max-w-4xl mb-6 p-6 ${darkMode ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-800'} rounded-lg shadow-lg text-center border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
          <h2 className="text-2xl font-bold mb-2">Welcome to Stash!</h2>
          <p className="text-lg">Please set your username below to start using all features of Stash.</p>
        </div>
      )}
      
      {/* User Tokens Section */}
      <UserTokens />
      
      {/* Settings Section */}
      <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-lg shadow-lg mb-6 border ${isNewUser ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}>
        <h2 className={`text-2xl font-semibold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {isNewUser ? 'Set Your Username' : 'Settings'}
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-1">
          <label 
            htmlFor="username" 
            className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} block text-sm font-medium ${isNewUser ? 'font-bold' : ''}`}
          >
            {isNewUser ? 'Username (required)' : (user.username ? 'Change Username' : 'Set Username')}
          </label>
          {isNewUser && <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Choose a unique username to identify yourself in the community</p>}
          <input
            id="username"
            type="text"
            value={newUsername}
            maxLength={12}
            onChange={(e) => setNewUsername(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } ${isNewUser ? 'border-blue-500' : ''}`}
            placeholder={isNewUser ? "Enter a username" : ""}
            required
          />
          <div className="flex items-center justify-between mt-4">
            <label className={`${darkMode ? 'text-white' : 'text-gray-800'} block text-sm font-medium`}>Unsubscribe to Emails</label>
            <input
              type="checkbox"
              checked={isUnsubscribed}
              onChange={() => setIsUnsubscribed(!isUnsubscribed)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
          <button type="submit" className={`w-full py-2 ${isNewUser ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors mt-2`}>
            {isNewUser ? 'Set Username & Continue' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className={`w-full max-w-4xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-lg shadow-lg border`}>
        {/* Tab Navigation */}
        <div className="mb-6">
          <h2 className={`text-2xl font-semibold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your Activity</h2>
          <div className={`flex space-x-4 sm:space-x-6 md:space-x-10 border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} overflow-x-auto`}>
            {["experiences", "general posts", "likes", "comments", "transactions", "notifications", "settings"].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? `${darkMode ? 'text-blue-400 border-b-4 border-blue-400' : 'text-blue-600 border-b-4 border-blue-600'}`
                    : `${darkMode ? 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent' : 'text-gray-600 hover:text-blue-600 border-b-2 border-transparent'}`
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {loading ? (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
          ) : (
            <>
              {activeTab === "experiences" && (
                <div>
                  {experiences.length > 0 ? (
                    experiences.map((exp) => (
                      <div key={exp.id} className={`border p-4 rounded-md shadow mb-3 ${
                        darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                      }`}>
                        <h3 className={`text-sm sm:text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Link href={`/experience/${exp.id}/${exp.slug}`} className="text-blue-600 hover:underline">
                            {exp.company_name}
                          </Link>
                        </h3>
                        <p className={`text-sm sm:text-md ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{exp.level}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(exp.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No posts yet.</p>
                  )}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handlePageChange(-1)}
                      disabled={pageExperiences <= 1}
                      className={`px-4 py-2 rounded ${pageExperiences <= 1 ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={experiences.length < limit}
                      className={`px-4 py-2 rounded ${experiences.length < limit ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "general posts" && (
                <div>
                  {generalPosts.length > 0 ? (
                    generalPosts.map((post) => (
                      <div key={post.experience_id} className={`border p-4 rounded-md shadow mb-3 ${
                        darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                      }`}>
                        <h3 className={`text-sm sm:text-md font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <Link href={`/experience/${post.experience_id}`} className="text-blue-600 hover:underline break-words">
                            {post.title}
                          </Link>
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No posts yet.</p>
                  )}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handlePageChange(-1)}
                      disabled={pageGeneralPosts <= 1}
                      className={`px-4 py-2 rounded ${pageGeneralPosts <= 1 ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={generalPosts.length < limit}
                      className={`px-4 py-2 rounded ${generalPosts.length < limit ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "likes" && (
                <div>
                  {likes.length > 0 ? (
                    likes.map((act, index) => (
                      <div key={`${act.experience_id}-comment-${index}`} className={`border p-4 rounded-md shadow mb-3 ${
                        darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                      }`}>
                        <h3 className={`text-sm sm:text-md ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Liked {" "}
                          {act.experiences?.type === "general_post" ? (
                            <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                              {act.title}
                            </Link>
                          ) : (
                            <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                              experience
                            </Link>
                          )}
                        </h3>

                        {act.experiences?.type !== "general_post" && act.experiences?.company_name && act.experiences?.level && (
                          <p className={`text-sm sm:text-md ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            at {act.experiences.company_name} (Level: {act.experiences.level})
                          </p>
                        )}

                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No likes yet.</p>
                  )}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handlePageChange(-1)}
                      disabled={pageLikes <= 1}
                      className={`px-4 py-2 rounded ${pageLikes <= 1 ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={likes.length < limit}
                      className={`px-4 py-2 rounded ${likes.length < limit ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div>
                  {comments.length > 0 ? (
                    comments.map((act, index) => (
                      <div key={`${act.experience_id}-comment-${index}`} className={`border p-4 rounded-md shadow mb-3 ${
                        darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                      }`}>
                        <h3 className={`text-sm sm:text-md ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Commented on{" "}
                          {act.experiences?.type === "general_post" ? (
                            <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                              {act.title}
                            </Link>
                          ) : (
                            <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                              experience
                            </Link>
                          )}
                        </h3>

                        {act.experiences?.type !== "general_post" && act.experiences?.company_name && act.experiences?.level && (
                          <p className={`text-sm sm:text-md ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            at {act.experiences.company_name} (Level: {act.experiences.level})
                          </p>
                        )}

                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No comments yet.</p>
                  )}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handlePageChange(-1)}
                      disabled={pageComments <= 1}
                      className={`px-4 py-2 rounded ${pageComments <= 1 ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={comments.length < limit}
                      className={`px-4 py-2 rounded ${comments.length < limit ? 'bg-gray-400' : 'bg-blue-400'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === "transactions" && (
                <div className="mt-4">
                  <TokenHistory />
                </div>
              )}
              
              {activeTab === "notifications" && (
                <div className="mt-4">
                  <Notifications />
                </div>
              )}
              
              {activeTab === "settings" && (
                <div className="mt-4">
                  <NotificationSettings />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
