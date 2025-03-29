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
import OAuthSignin from './OAuthSignin';

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false) // To control login modal visibility

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

  const handleSignIn = () => {
    setIsLoginModalOpen(true) // Open modal to log in
    toggleSidebar();
  }

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

  useEffect(() => {
    // Capture the URL hash for magic link errors
    const hash = window.location.hash;
    if (hash) {
      const urlParams = new URLSearchParams(hash.replace('#', '?'));
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');

      if (errorCode || errorDescription) {
      alert(`Login failed. Error: ${errorCode}\n${errorDescription}`);
      }
    }
  }, [pathname]); // Re-run when the pathname changes

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const handleExploreToggle = () => {
    setExploreOpen(!exploreOpen);
  };

  return (
    <div className="flex h-screen relative bg-gray-50">
      {/* Sidebar Toggle Button */}
      <IconButton
        onClick={toggleSidebar}
        sx={{
          position: 'fixed',
          top: 20,
          left: sidebarOpen ? 270 : 20,
          width: 50,
          height: 50,
          backgroundColor: 'rgba(66, 64, 64, 0.8)',
          borderRadius: '50%',
          zIndex: 1300,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': { 
            backgroundColor: 'rgba(243, 237, 237, 0.95)',
            transform: 'scale(1.05)'
          },
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
            backgroundColor: '#ffffff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* App Name */}
        <List>
          <ListItemButton 
            onClick={() => handleMenuChange('landingPage')} 
            sx={{ 
              padding: '15px 20px',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              }
            }}
          >
            <span className="material-icons ml-2 mr-2 text-blue-600">home</span>
            <ListItemText 
              primary="Stash" 
              primaryTypographyProps={{
                style: { fontWeight: 600, fontSize: '1.2rem' }
              }}
            />
          </ListItemButton>
        </List>

        {/* Menu Items */}
        <List sx={{ marginTop: '20px' }}>
          {/* Parent ListItemButton - "Explore" */}
          <ListItemButton 
            onClick={handleExploreToggle}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              }
            }}
          >
            <span className="material-icons ml-2 mr-2 text-blue-600">explore</span>
            <ListItemText 
              primary="Explore"
              primaryTypographyProps={{
                style: { fontWeight: 500 }
              }}
            />
          </ListItemButton>
          {/* Collapsible Child ListItems */}
          <Collapse in={exploreOpen} timeout="auto" unmountOnExit>
            <List sx={{ paddingLeft: 3 }}>
              <ListItemButton 
                onClick={() => handleMenuChange('interviewExperienceDashboard')}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  }
                }}
              >
                <span className="material-icons ml-2 mr-2 text-gray-600">work</span>
                <ListItemText primary="Interview Experiences" />
              </ListItemButton>
              <ListItemButton 
                onClick={() => handleMenuChange('generalPosts')}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  }
                }}
              >
                <span className="material-icons ml-2 mr-2 text-gray-600">forum</span>
                <ListItemText primary="General Posts" />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItemButton 
            onClick={() => handleMenuChange('postExperience')}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              }
            }}
          >
            <span className="material-icons ml-2 mr-2 text-green-600">post_add</span>
            <ListItemText 
              primary="New Post"
              primaryTypographyProps={{
                style: { fontWeight: 500 }
              }}
            />
          </ListItemButton>
        </List>

        {user.user_id && (
          <List sx={{ marginTop: '20px' }}>
            <ListItemButton 
              onClick={() => handleMenuChange('UserProfile')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                }
              }}
            >
              <span className="material-icons ml-2 mr-2 text-purple-600">account_circle</span>
              <ListItemText 
                primary="View Profile"
                primaryTypographyProps={{
                  style: { fontWeight: 500 }
                }}
              />
            </ListItemButton>
          </List>
        )}

        {/* SignOut Button */}
        {user.user_id && (
          <List sx={{ marginTop: '20px' }}>
            <ListItemButton 
              onClick={handleSignOut}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                }
              }}
            >
              <span className="material-icons ml-2 mr-2 text-red-600">logout</span>
              <ListItemText 
                primary="Sign Out"
                primaryTypographyProps={{
                  style: { fontWeight: 500 }
                }}
              />
            </ListItemButton>
          </List>
        )}

        {/* Login Button */}
        {!user.user_id && (
          <List sx={{ marginTop: '20px' }}>
            <ListItemButton 
              onClick={handleSignIn}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                }
              }}
            >
              <span className="material-icons ml-2 mr-2 text-blue-600">login</span>
              <ListItemText 
                primary="Login"
                primaryTypographyProps={{
                  style: { fontWeight: 500 }
                }}
              />
            </ListItemButton>
          </List>
        )}

        {/* Welcome message */}
        <List sx={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
          <ListItemButton 
            sx={{ 
              padding: '15px 20px',
              '&:hover': {
                backgroundColor: 'transparent',
              }
            }}
          >
            <span className="material-icons ml-2 mr-2 text-gray-600">account_circle</span>
            <ListItemText 
              primary={`Welcome ${user.username || 'Guest'}`}
              primaryTypographyProps={{
                style: { fontWeight: 500, color: '#4b5563' }
              }}
            />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main Content Area */}
      <div 
        className="flex-1 p-4 sm:p-8 overflow-auto transition-all duration-300 ease-in-out" 
        style={{ 
          marginLeft: sidebarOpen ? 270 : 0,
          backgroundColor: '#f9fafb'
        }}
      >
        {/* Show Experience Page if the user navigated to `/experience/[id]` */}
        {activeMenu === 'UserProfile' ? (
          <div className="max-w-7xl mx-auto">
            <UserProfile />
          </div>
        ) : activeMenu === 'landingPage' ? (
          <div className="max-w-7xl mx-auto">
            <LandingPage setActiveMenu={setActiveMenu} />
          </div>
        ) : !user.user_id ? (
          activeMenu === 'interviewExperienceDashboard' ? (
            <div className="max-w-7xl mx-auto">
              <InterviewExperienceDashboard/>
            </div>
          ):  activeMenu === 'generalPosts' ? (
            <div className="max-w-7xl mx-auto">
              <GeneralPosts/>
            </div>
          ): activeMenu === 'singleExperiencePage' ? (
            <div className="max-w-7xl mx-auto">
              <SingleExperiencePage experienceId={experienceId} />
            </div>
          ): (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Login to share your experiences! 🫵</h2>
              <button
                className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-48 mt-4 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg"
                onClick={() => setIsLoginModalOpen(true)}
              >
                <span className="material-icons mr-2">login</span>
                Login
              </button>
            </div>
          )
        ) : user.username ? (
          activeMenu === 'interviewExperienceDashboard' ? (
            <div className="max-w-7xl mx-auto">
              <InterviewExperienceDashboard />
            </div>
          ): activeMenu === 'generalPosts' ? (
            <div className="max-w-7xl mx-auto">
              <GeneralPosts/>
            </div>
          ): activeMenu === 'postExperience' ? (
            <div className="max-w-7xl mx-auto">
              <ExperienceForm/>
            </div>
          ) : activeMenu === 'singleExperiencePage' ? (
            <div className="max-w-7xl mx-auto">
              <SingleExperiencePage experienceId={experienceId} />
            </div>
          ) : null
        ) : (
          <div className="max-w-7xl mx-auto">
            <UserProfile />
          </div>
        )}
        {/* OAuthSignin Modal */}
        <OAuthSignin isModalOpen={isLoginModalOpen} setIsModalOpen={setIsLoginModalOpen} />
      </div>
    </div>
  );
};

export default ClientHome;
