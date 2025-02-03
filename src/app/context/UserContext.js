'use client';
import { createContext, useState, useContext, useEffect } from 'react';
import supabase from '../utils/supabaseClient';

const UserContext = createContext();  // Ensure this is created

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    user_id: null,
    username: null,
  });

  // Fetch and set user info (user_id and username)
  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Fetch session data", sessionData);
      if (sessionData?.user) {
        const username = await fetchUsername(sessionData.user.id);
        console.log("Fetched username", username);
        setUser({ user_id: sessionData.user.id, username: username });  // Store both user_id and username
      }
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("State changed. Fetch user info");
      if (session?.user) {
        fetchUsername(session.user.id).then((username) => {
          setUser((prevUser) => {
            const newUser = { user_id: session.user.id, username };
            console.log("Updating user context prev user", prevUser, "new user", newUser);
            return newUser;
          });
        });
      } else {
        setUser((prevUser) => {
          const newUser = { user_id: null, username: null };
          console.log("Unset user prev user", prevUser, " new user", newUser);
          return newUser;
        });
      }
    });

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  const fetchUsername = async (userId) => {
    const response = await fetch(`/api/profiles?user_id=${userId}`);
    const data = await response.json();
    return data.username || null;
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Exporting UserContext to be used in other components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
