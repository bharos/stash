import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import supabase from '../utils/supabaseClient';
import Link from 'next/link';


const UserProfile = () => {
  const { user, setUser } = useUser();
  const [newUsername, setNewUsername] = useState(user.username || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserActivityData = async () => {
    try {
      // Fetch user's activity (posts + likes)
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session || !sessionData.session.access_token) {
        setExperiences([]);
        setActivity([]);
        return;
      }

      const token = sessionData.session.access_token;
      if (!token) {
        console.error('No token found. User is not authenticated.');
        return;
      }

      const activityRes = await fetch('/api/activity', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!activityRes.ok) {
        throw new Error('Failed to fetch activity');
      }
  
      const activityData = await activityRes.json();
      // Assuming activityData contains posts and likes
      setExperiences(activityData.activity.filter(item => item.type === 'experience_posted'));
      setActivity(activityData.activity);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    setLoading(true);
    fetchUserActivityData();
  }, [user.user_id]); // Re-fetch when user_id changes

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.user_id) {
      setError('You must be logged in to update your username.');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      // if new username is same as current, don't call API
      if (newUsername === user.username) {
        setError('Same as current.');
        return;
      }

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, username: newUsername }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage('Username updated successfully!');
        setUser({ ...user, username: newUsername });
        router.push('/'); // Redirect after update
      } else {
        setError(result.error ? result.error : 'Something went wrong. Failed to update username.'); 
      }
    } catch (err) {
      setError('Failed to update username.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      {/* Username Section */}
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          {user.username ? 'Change Your Username 🎭' : 'Set Username 🥷'}
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
        <div className="text-center mb-4">
          {user.username && <p className="text-gray-700">Current Username: {user.username}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg">
            Save Changes
          </button>
        </form>
      </div>

      {/* Experiences & Activity Section - Side by Side on Large Screens */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Experiences Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-3">Your Experiences 📩</h2>
          {loading ? (
            <p>Loading...</p>
          ) : experiences.length > 0 ? (
            experiences.map((exp) => (
              <div key={exp.id} className="border p-4 rounded-md shadow mb-3">
                <h3 className="text-lg font-medium">
                  <Link href={`/experience/${exp.id}`} className="text-blue-600 hover:underline">
                    {exp.company_name}
                  </Link>
                </h3>
                <p className="text-gray-700">{exp.level}</p>
                <p className="text-sm text-gray-500">{new Date(exp.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p>No experiences posted yet.</p>
          )}
        </div>

        {/* Your Activity Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-3">Your Activity 🎊</h2>
          {loading ? (
            <p>Loading...</p>
          ) : activity.length > 0 ? (
            activity.map((act, index) => (
              <div key={`${act.id}-${act.type}-${index}`} className="border p-4 rounded-md shadow mb-3">
                {act.type === 'experience_posted' ? (
                  <>
                    <h3 className="text-lg font-medium">
                      Posted an experience for {' '}
                      <Link href={`/experience/${act.id}`} className="text-blue-600 hover:underline">
                        {act.company_name}
                      </Link>
                    </h3>
                    <p className="text-gray-700">Level: {act.level}</p>
                  </>
                ) : act.type === 'liked_experience' ? (
                  <h3 className="text-lg font-medium">
                    Liked an{' '}
                    <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                      experience
                    </Link>{' '}
                    at {act.company_name} (Level: {act.level})
                  </h3>
                ) : act.type === 'commented_experience' ? (
                  <h3 className="text-lg font-medium">
                    Commented on{' '}
                    <Link href={`/experience/${act.experience_id}`} className="text-blue-600 hover:underline">
                      experience
                    </Link>{' '}
                    at {act.company_name} (Level: {act.level})
                  </h3>
                ) : (
                  <div>Invalid activity</div>
                )}
                <p className="text-sm text-gray-500">{new Date(act.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p>No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
