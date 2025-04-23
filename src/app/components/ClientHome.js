'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '../context/UserContext'; // Use the custom hook to access user context
import { useActiveMenu } from '../context/ActiveMenuContext'; // Import the custom hook for activeMenu context
import dynamic from 'next/dynamic';
import LandingPage from './LandingPage';
import UserProfile from './UserProfile';
import SingleExperiencePage from './SingleExperiencePage';
import GeneralPosts from './GeneralPosts';
import { useSidebar } from '../context/SidebarContext';
import InvitePage from './InvitePage'; // Import InvitePage
import { useDarkMode } from '../context/DarkModeContext';

// Dynamically import ExperienceForm and InterviewExperienceDashboard
const ExperienceForm = dynamic(() => import('./ExperienceForm'), { ssr: false });
const InterviewExperienceDashboard = dynamic(() => import('./InterviewExperienceDashboard'), { ssr: false });

const ClientHome = () => {
  const pathname = usePathname(); // Get the current URL path
  const { user } = useUser();
  const { sidebarOpen } = useSidebar();
  const { activeMenu, setActiveMenu } = useActiveMenu(); // Access activeMenu from context
  const [isClient, setIsClient] = useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <div className={`flex h-screen relative ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Main Content Area */}
      <div 
        className={`flex-1 p-4 sm:p-8 overflow-auto transition-all duration-300 ease-in-out ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
        style={{ 
          marginLeft: sidebarOpen ? 270 : 0,
        }}
      >
        {/* Show Experience Page if the user navigated to `/experience/[id]` */}
        {pathname === '/invite' || activeMenu === 'invitePage' ? (
          <div className="max-w-7xl mx-auto">
            <InvitePage />
          </div>
        ) : activeMenu === 'UserProfile' ? (
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
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Login to share your experiences! 🫵</h2>
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
      </div>
    </div>
  );
};

export default ClientHome;
