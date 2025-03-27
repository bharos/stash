import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';

const MagicLinkLogin = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,  // Set to false to prevent auto-signup if the user does not exist
        emailRedirectTo: 'https://stashdb.fyi',  // Redirect URL after clicking the magic link
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Magic link sent! Please check your email.');
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Login with Magic Link</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default MagicLinkLogin;
