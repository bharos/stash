'use client';

import React from 'react';
import { useState } from 'react';
import { IconButton, List, ListItemButton, ListItemText, Collapse, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/navigation';
import OAuthSignin from './OAuthSignin';
import { useDarkMode } from '../context/DarkModeContext'; // DarkMode Context
import { useUser } from '../context/UserContext'; // User Context
import {  useSidebar } from '../context/SidebarContext';
import { useActiveMenu } from '../context/ActiveMenuContext'; // Active Menu Context
import supabase from '../utils/supabaseClient';

const Sidebar = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const { sidebarOpen, setSidebarOpen, isLoginModalOpen, setIsLoginModalOpen } = useSidebar();
  const { darkMode, toggleDarkMode, resetToSystem } = useDarkMode();
  const { activeMenu, setActiveMenu } = useActiveMenu();
  const [exploreOpen, setExploreOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    router.push('/'); // Push to the home page when changing menu
    toggleSidebar();
  };
  

  const handleExploreToggle = () => {
    setExploreOpen(!exploreOpen);
  };

    const handleSignIn = () => {
      console.log('handleSignIn called');
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
  
  return (
    <>
          {/* Sidebar Toggle Button */}
          <IconButton
  onClick={toggleSidebar}
  sx={{
    position: 'fixed',
    top: 20,
    left: sidebarOpen ? 270 : 20,
    width: 50,
    height: 50,
    backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(66, 64, 64, 0.8)',
    borderRadius: '50%',
    zIndex: 1300,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(243, 237, 237, 0.95)',
      transform: 'scale(1.05)',
    },
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
        flexDirection: 'column',
        paddingTop: '20px',
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000',
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

    <List sx={{ marginTop: '20px' }}>
      {/* Invite Button */}
      <ListItemButton 
        onClick={() => handleMenuChange('invitePage')}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
          }
        }}
      >
        <span className="material-icons ml-2 mr-2 text-orange-600">person_add</span>
        <ListItemText 
          primary="Invite"
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

    {/* Dark Mode Toggle */}
    <List sx={{ marginTop: '20px' }}>
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => {
            toggleDarkMode();
            toggleSidebar();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            darkMode 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="material-icons text-lg">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="text-sm font-medium">
            {darkMode ? 'Light' : 'Dark'}
          </span>
        </button>
        <button
          onClick={() => {
            resetToSystem();
            toggleSidebar();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            darkMode 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="material-icons text-lg">refresh</span>
          <span className="text-sm font-medium">Auto</span>
        </button>
      </div>
    </List>

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
  <OAuthSignin isModalOpen={isLoginModalOpen} setIsModalOpen={setIsLoginModalOpen} />
  </>
);
};

export default Sidebar;
