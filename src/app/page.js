'use client'

import { useState, useEffect } from 'react';
import ExperienceForm from '../app/components/ExperienceForm';
import Dashboard from '../app/components/Dashboard';
import supabase from '../app/utils/supabaseClient';

const Home = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [session, setSession] = useState(null); // To track the current session

  useEffect(() => {
    // Check for existing session when the page loads
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);
    };

    fetchSession(); // Fetch session on page load

    // Listen for auth state changes (e.g., sign-in, sign-out)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); // Update session state on authentication change
    });

    return () => {
      listener?.unsubscribe(); // Clean up the listener when the component unmounts
    };
  }, []);

  const handleMenuChange = (menu) => {
    setActiveMenu(menu); // Set the active menu
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-6 sticky top-0 h-screen">
        <h2 className="text-2xl font-bold mb-6">Stash.</h2>
        <ul>
          <li
            className={`cursor-pointer py-2 px-4 mb-4 rounded-md ${activeMenu === 'dashboard' ? 'bg-blue-600' : 'hover:bg-blue-500'}`} 
            onClick={() => handleMenuChange('dashboard')}
          >
            Dashboard
          </li>
          <li 
            className={`cursor-pointer py-2 px-4 mb-4 rounded-md ${activeMenu === 'postExperience' ? 'bg-blue-600' : 'hover:bg-blue-500'}`} 
            onClick={() => handleMenuChange('postExperience')}
          >
            Post Experience
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {session ? (
          <>
            {activeMenu === 'dashboard' ? <Dashboard /> : <ExperienceForm />}
          </>
        ) : (
          <div className="text-center">
            <p>Please sign in to view your dashboard and post experiences.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
