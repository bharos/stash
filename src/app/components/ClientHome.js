'use client';

import { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, ListItemButton } from '@mui/material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import supabase from '../utils/supabaseClient';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import CreateProfile from './CreateProfile';
import SingleExperiencePage from './SingleExperiencePage';

// Dynamically import ExperienceForm and Dashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const Dashboard = dynamic(() => import('./Dashboard'), { ssr: false });

const ClientHome = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path
  const { user, setUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('landingPage');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    // router.push('/'); // Push to the home page when changing menu
    toggleSidebar();
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
    } else {
      setUser({ user_id: null, username: null });
      // router.push('/');
    }
    toggleSidebar();
  };

  // Extract experienceId from URL (/experience/123)
  const experienceMatch = pathname.match(/^\/experience\/(\d+)$/);
  const experienceId = experienceMatch ? experienceMatch[1] : null;
  useEffect(() => {
    if (experienceId) {
      setActiveMenu('singleExperiencePage');
    }
  }, [experienceId]); // Only trigger when experienceId changes

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen relative">
      {/* Sidebar Toggle Button */}
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

      {/* Sidebar Navigation */}
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
            flexDirection: 'column',
            paddingTop: '20px',
          },
        }}
      >
        {/* App Name */}
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

        {/* Welcome message */}
        <List sx={{ marginTop: 'auto' }}>
          <ListItemButton sx={{ padding: '10px 20px' }}>
            <span className="material-icons ml-2 mr-2">account_circle</span>
            <ListItemText primary={`Welcome ${user.username || 'Guest'}`} />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto" style={{ marginLeft: sidebarOpen ? 270 : 0 }}>
        {/* Show Experience Page if the user navigated to `/experience/[id]` */}
        {activeMenu === 'createProfile' ? (
          <CreateProfile />
        ) : activeMenu === 'landingPage' ? (
          <LandingPage setActiveMenu={setActiveMenu} />
        ) : !user.user_id ? (
          activeMenu === 'dashboard' ? (
            <Dashboard />
          ):  activeMenu === 'singleExperiencePage' ? (
            <SingleExperiencePage experienceId={experienceId} />
          ): (
          <div className="text-center mt-24">
            <h2 className="text-2xl font-bold">Login to share your experiences! 🫵</h2>
          <button
          className="px-5 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-48 mt-4"
          onClick={() => setActiveMenu('dashboard')}
          >
          Go to Dashboard
          </button>
          </div>
          )
        ) : user.username ? (
          activeMenu === 'dashboard' ? (
            <Dashboard />
          ) : activeMenu === 'postExperience' ? (
            <ExperienceForm />
          ) : activeMenu === 'singleExperiencePage' ? (
            <SingleExperiencePage experienceId={experienceId} />
          ) : null
        ) : (
          <CreateProfile />
        )}
      </div>
    </div>
  );
};

export default ClientHome;
