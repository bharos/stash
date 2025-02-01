'use client'

import { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; // Hamburger icon for opening/closing the sidebar
import supabase from '../utils/supabaseClient'; // Ensure this is set up correctly
import dynamic from 'next/dynamic';

// Dynamically import ExperienceForm and Dashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const Dashboard = dynamic(() => import('./Dashboard'), { ssr: false });

const ClientHome = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar initially closed
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [session, setSession] = useState(null); // To track the current session
  const [isClient, setIsClient] = useState(false); // Track if we are on the client-side

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu); // Set the active menu
    console.log('Menu changed to:', menu);
  };

  useEffect(() => {
    // Set isClient to true when on the client-side
    setIsClient(true);

    // Fetch session from Supabase
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData?.session); // Set session once fetched
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

  // Show loading state if session is not set yet or client-side rendering is pending
  if (!isClient) {
    return <div>Loading...</div>; // Show loading if session is not yet available
  }

  return (
    <div className="flex h-screen relative">
      {/* Hamburger Icon to toggle Sidebar */}
      <IconButton
  onClick={toggleSidebar}
  sx={{
    position: 'absolute',
    top: 20,
    left: sidebarOpen? 270 : 20, // Move the hamburger when sidebar is open
    width: 50,
    height: 50,
    backgroundColor: 'rgba(66, 64, 64, 0.7)', // Semi-transparent dark background
    borderRadius: '50%',
    zIndex: 1300, // Ensure it's above other content
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(243, 237, 237, 0.9)', // Darken on hover
    },
    display: sidebarOpen ? 'none' : 'block', // Hide hamburger when sidebar is open
  }}
>
  <MenuIcon sx={{ fontSize: 30, color: 'white' }} />
</IconButton>


      {/* Sidebar */}
      <Drawer
        open={sidebarOpen}
        onClose={toggleSidebar} // Close on clicking outside or using the hamburger
        variant="temporary" // Use 'temporary' for closable sidebar
        anchor="left"
        sx={{
          width: 270,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 270,
            boxSizing: 'border-box',
          },
        }}
      >
        <List>
          {/* Use button="true" to make ListItem clickable */}
          <ListItem button onClick={() => handleMenuChange('dashboard')}>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleMenuChange('postExperience')}>
            <ListItemText primary="Post Experience" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto" style={{ marginLeft: sidebarOpen ? 270 : 0 }}>
        {session ? (
            <>
            {activeMenu === 'dashboard' ? <Dashboard /> : <ExperienceForm />}
            </>
        ) : (
            <div className="text-center mt-16 flex flex-col justify-center items-center min-h-[80vh]">
            <p className="text-lg">
                Please sign in to view your dashboard and post experiences.
            </p>
            </div>
        )}
        </div>
    </div>
  );
};

export default ClientHome;
