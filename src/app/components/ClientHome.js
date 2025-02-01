'use client';

import { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, ListItemButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import supabase from '../utils/supabaseClient';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage'; // Import Landing Page

// Dynamically import ExperienceForm and Dashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const Dashboard = dynamic(() => import('./Dashboard'), { ssr: false });

const ClientHome = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('landingPage');
  const [session, setSession] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    toggleSidebar(); // Close sidebar on selection
  };

  useEffect(() => {
    setIsClient(true);

    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData?.session);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen relative">
      <IconButton
        onClick={toggleSidebar}
        sx={{
          position: 'absolute',
          top: 20,
          left: sidebarOpen ? 270 : 20,
          width: 50,
          height: 50,
          backgroundColor: 'rgba(66, 64, 64, 0.7)',
          borderRadius: '50%',
          zIndex: 1300,
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': { backgroundColor: 'rgba(243, 237, 237, 0.9)' },
          display: sidebarOpen ? 'none' : 'block',
        }}
      >
        <MenuIcon sx={{ fontSize: 30, color: 'white' }} />
      </IconButton>

      <Drawer
        open={sidebarOpen}
        onClose={toggleSidebar}
        variant="temporary"
        anchor="left"
        sx={{
          width: 270,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 270,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column', // Arrange items vertically
            paddingTop: '20px', // Add space between the top of the sidebar and app name
          },
        }}
      >
        {/* App Name at the Top */}
        <List>
          <ListItemButton onClick={() => handleMenuChange('landingPage')} sx={{ padding: '10px 20px' }}>
            <span className="material-icons">rocket_launch</span>
            <ListItemText primary="Stash" />
          </ListItemButton>
        </List>

        {/* Menu Items with some spacing between them */}
        <List sx={{ marginTop: '20px' }}> {/* Space between app name and menu items */}
          <ListItem button onClick={() => handleMenuChange('dashboard')}>
            <span className="material-icons">dashboard</span>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleMenuChange('postExperience')}>
            <span className="material-icons">post_add</span>
            <ListItemText primary="Post Experience" />
          </ListItem>
        </List>
      </Drawer>

      <div className="flex-1 p-6 overflow-auto" style={{ marginLeft: sidebarOpen ? 270 : 0 }}>
        {/* Show the LandingPage by default (no need to check login status for landing page) */}
        {activeMenu === 'landingPage' ? (
          <LandingPage setActiveMenu={setActiveMenu} />
        ) : !session ? (
          // If user is not logged in, show the login message
          <div className="text-center mt-24">
            <h2 className="text-2xl font-bold">Login to view the dashboard and share your experiences</h2>
          </div>
        ) : (
          // If user is logged in, show the menu or active content
          activeMenu === 'dashboard' ? (
            <Dashboard />
          ) : activeMenu === 'postExperience' ? (
            <ExperienceForm />
          ) : (
            <LandingPage setActiveMenu={setActiveMenu} />
          )
        )}
      </div>
    </div>
  );
};

export default ClientHome;
