'use client';

import { useState, useEffect } from 'react';
import { StatsigProvider, useStatsigUser } from '@statsig/react-bindings';
import { useUser } from './UserContext'; // Assuming you have a UserContext

export const FlagsProvider = ({ children }) => {
  const { user } = useUser(); // Get user from context
  const [currentUser, setCurrentUser] = useState({ userID: 'anonymous' });
  const { updateUserAsync } = useStatsigUser(); // Destructure `updateUserAsync` from useStatsigUser

  useEffect(() => {
    if (user?.user_id) {
      setCurrentUser({ userID: user.user_id });
      updateUserAsync({ userID: user.user_id }); // Update the user in Statsig when the user changes
    } else {
      setCurrentUser({ userID: 'anonymous' });
      updateUserAsync({ userID: 'anonymous' }); // Update Statsig to reflect anonymous user if no logged-in user
    }
  }, [user, updateUserAsync]); // Re-run effect when user changes

  return (
    <StatsigProvider sdkKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY} user={currentUser}>
      {children}
    </StatsigProvider>
  );
};
