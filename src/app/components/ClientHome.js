'use client';

import { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, ListItemButton, Collapse } from '@mui/material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useActiveMenu } from '../context/ActiveMenuContext'; // Import the custom hook for activeMenu context
import supabase from '../utils/supabaseClient';
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import UserProfile from './UserProfile';
import SingleExperiencePage from './SingleExperiencePage';
import GeneralPosts from './GeneralPosts';
import MagicLinkLogin from './MagicLinkLogin';

// Dynamically import ExperienceForm and InterviewExperienceDashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const InterviewExperienceDashboard = dynamic(() => import('./InterviewExperienceDashboard'), { ssr: false });

const ClientHome = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path
  const { user, setUser } = useUser();
  const { activeMenu, setActiveMenu } = useActiveMenu(); // Access activeMenu from context
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    router.push('/'); // Push to the home page when changing menu
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

  const handleExploreToggle = () => {
    setExploreOpen(!exploreOpen);
  };

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
          {/* Parent ListItemButton - "Explore" */}
      <ListItemButton onClick={handleExploreToggle}>
        <span className="material-icons ml-2 mr-2">explore</span>
        <ListItemText primary="Explore" />
      </ListItemButton>
      {/* Collapsible Child ListItems */}
      <Collapse in={exploreOpen} timeout="auto" unmountOnExit>
        <List sx={{ paddingLeft: 3 }}> {/* Adding some left padding for nesting effect */}
          <ListItemButton onClick={() => handleMenuChange('interviewExperienceDashboard')}>
            <span className="material-icons ml-2 mr-2">work</span> {/* Icon for Interview Experiences */}
            <ListItemText primary="Interview Experiences" />
          </ListItemButton>
          <ListItemButton onClick={() => handleMenuChange('generalPosts')}>
            <span className="material-icons ml-2 mr-2">forum</span> {/* Icon for General Posts */}
            <ListItemText primary="General Posts" />
          </ListItemButton>
        </List>
      </Collapse>

        <ListItemButton onClick={() => handleMenuChange('postExperience')}>
          <span className="material-icons ml-2 mr-2">post_add</span>
          <ListItemText primary="New Post" />
        </ListItemButton>
        </List>

        {user.user_id && (
          <List sx={{ marginTop: '20px' }}>
            <ListItemButton onClick={() => handleMenuChange('UserProfile')}>
              <span className="material-icons ml-2 mr-2">account_circle</span>
              <ListItemText primary="View Profile" />
            </ListItemButton>
          </List>
        )}

        {/* SignOut Button */}
        {user.user_id && (
          <List sx={{ marginTop: '20px' }}>
            <ListItemButton onClick={handleSignOut}>
              <span className="material-icons ml-2 mr-2">logout</span>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
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
      <div className="flex-1 p-1 sm:p-6 overflow-auto" style={{ marginLeft: sidebarOpen ? 270 : 0 }}>
        {/* Show Experience Page if the user navigated to `/experience/[id]` */}
        {activeMenu === 'UserProfile' ? (
          <UserProfile />
        ) : activeMenu === 'landingPage' ? (
          <LandingPage setActiveMenu={setActiveMenu} />
        ) : !user.user_id ? (
          activeMenu === 'interviewExperienceDashboard' ? (
            <InterviewExperienceDashboard/>
          ):  activeMenu === 'generalPosts' ? (
              <GeneralPosts/>
          ) :activeMenu === 'singleExperiencePage' ? (
            <SingleExperiencePage experienceId={experienceId} />
          ): (
          <div className="text-center mt-24">
            <h2 className="text-2xl font-bold">Login to share your experiences! 🫵</h2>
          <button
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-48 mt-4"
          onClick={() => setActiveMenu('interviewExperienceDashboard')}
          >
          🧭  Explore
          </button>
          </div>
          )
        ) : user.username ? (
          activeMenu === 'interviewExperienceDashboard' ? (
            <InterviewExperienceDashboard />
          ): activeMenu === 'generalPosts' ? (
            <GeneralPosts/>
          ): activeMenu === 'postExperience' ? (
            <ExperienceForm/>
          ) : activeMenu === 'singleExperiencePage' ? (
            <SingleExperiencePage experienceId={experienceId} />
          ) : null
        ) : (
          <UserProfile />
        )}
        <MagicLinkLogin />
      </div>
    </div>
  );
};

export default ClientHome;
