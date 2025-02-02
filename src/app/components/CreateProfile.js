import { useState } from 'react';
import { useUser } from '../context/UserContext'; // Import the useUser hook
import { useRouter } from 'next/navigation';

const CreateProfile = () => {
  const { user, setUser } = useUser(); // Use user from context here
  const [newUsername, setNewUsername] = useState(user.username || ''); // Track username in local state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.user_id) {
      setError('You must be logged in to create a profile');
      return;
    }

    // Reset success and error states before submitting
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id, // Use Google user_id here
          username: newUsername, // Use the new username
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage('Username updated successfully!');
        setUser({ user_id: user.user_id, username: newUsername }); // Corrected: Update the username in context
        router.push('/'); // Redirect to home or dashboard after success
      } else {
        // Handle specific error cases
        if (result.error && result.error.message.includes('duplicate key value')) {
          setError('Username is already taken. Please choose a different one.');
        } else {
          setError(result.error || 'Something went wrong');
        }
      }
    } catch (err) {
      setError('Failed to create profile');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          {user.username ? 'Change Your Username' : 'Set Username'}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

        <div className="text-center mb-4">
          {user.username && (
            <p className="text-gray-700">Current Username: {user.username}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Choose a cool & unique Username!😃
            </label>
            <input
              type="text"
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)} // Update local state as user types
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
