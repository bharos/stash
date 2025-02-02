'use client';

import { useState, useContext, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, ListItemButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import supabase from '../utils/supabaseClient';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import CreateProfile from './CreateProfile';

// Dynamically import ExperienceForm and Dashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const Dashboard = dynamic(() => import('./Dashboard'), { ssr: false });

const ClientHome = () => {
  const router = useRouter();
  const { user, setUser } = useUser(); // Use user from context here
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('landingPage');
  const [isClient, setIsClient] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    toggleSidebar(); // Close sidebar on selection
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    } else {
      setUser({
        user_id: null,  // Reset user_id to null
        username: null,  // Reset username to null
      }); // Clear user state after successful sign-out
      router.push('/');
    }
    toggleSidebar(); // Close sidebar on sign-out
  };

  useEffect(() => {
    setIsClient(true);
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
      <span className="material-icons ml-2 mr-2">home</span>
      <ListItemText primary="Stash" />
    </ListItemButton>
  </List>

  {/* Menu Items */}
  <List sx={{ marginTop: '20px' }}>
    <ListItem button onClick={() => handleMenuChange('dashboard')}>
      <span className="material-icons ml-2 mr-2">dashboard</span>
      <ListItemText primary="Dashboard" />
    </ListItem>
    <ListItem button onClick={() => handleMenuChange('postExperience')}>
      <span className="material-icons ml-2 mr-2">post_add</span>
      <ListItemText primary="Post Experience" />
    </ListItem>
  </List>

  {user.user_id && (
  <List sx={{ marginTop: '20px' }}>
    <ListItem button onClick={() => handleMenuChange('createProfile')}>
      <span className="material-icons ml-2 mr-2">account_circle</span>
      <ListItemText primary="View Profile" />
    </ListItem>
  </List>
  )}

  {/* SignOut Button */}
  {user.user_id && (
    <List sx={{ marginTop: '20px' }}>
      <ListItem button onClick={handleSignOut}>
        <span className="material-icons ml-2 mr-2">logout</span>
        <ListItemText primary="Sign Out" />
      </ListItem>
    </List>
  )}

  {/* Welcome message at the bottom */}
  <List sx={{ marginTop: 'auto' }}>
    <ListItemButton sx={{ padding: '10px 20px' }}>
      <span className="material-icons ml-2 mr-2">account_circle</span>
      <ListItemText primary={`Welcome ${user.username || 'Guest'}`} />
    </ListItemButton>
  </List>
</Drawer>


      <div className="flex-1 p-6 overflow-auto" style={{ marginLeft: sidebarOpen ? 270 : 0 }}>
        {/* Show CreateProfile if no username exists */}
        {activeMenu === 'createProfile' ? (
          <CreateProfile />
        ) : activeMenu === 'landingPage' ? (
          <LandingPage setActiveMenu={setActiveMenu} />
        ) : !user.user_id ? (
          // If user is not logged in, show the login message
          <div className="text-center mt-24">
            <h2 className="text-2xl font-bold">Login to view the dashboard and share your experiences</h2>
          </div>
        ) : (
          user.username ? (
          // If user is logged in, show the menu or active content
          activeMenu === 'dashboard' ? (
            <Dashboard />
          ) : activeMenu === 'postExperience' ? (
            <ExperienceForm />
          ) : null
        ) :
        (<CreateProfile />)
        )}
      </div>
    </div>
  );
};

export default ClientHome;
