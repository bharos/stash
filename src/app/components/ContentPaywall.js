'use client';

import { useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { useActiveMenu } from '../context/ActiveMenuContext';
import { useRouter } from 'next/navigation';
import DonationComponent from './DonationComponent';

const ContentPaywall = ({ remainingViews, onClose }) => {
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const { setActiveMenu } = useActiveMenu();
  const [activeTab, setActiveTab] = useState('post'); // 'post', 'premium', or 'donate'
  const isViewsLeft = remainingViews > 0;

  const handlePostContent = () => {
    // Set activeMenu to 'postExperience' directly using context
    setActiveMenu('postExperience');
    // Navigate to home page
    router.push('/');
  };

  const handleGoPremium = () => {
    // Set activeMenu to 'UserProfile' directly using context
    setActiveMenu('UserProfile');
    // Navigate to home page
    router.push('/');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm`}>
      <div 
        className={`w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-2xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        style={{ animation: "fadeInUp 0.3s ease-out" }}
      >
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        
        {/* Header */}
        <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className={`material-icons ${isViewsLeft ? 'text-yellow-500' : 'text-red-500'}`}>
                {isViewsLeft ? 'lock_clock' : 'lock'}
              </span>
              <h2 className="text-xl font-bold">
                {isViewsLeft ? 'Limited Access' : 'Daily Limit Reached'}
              </h2>
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-7">
            {isViewsLeft 
              ? `You have ${remainingViews} view${remainingViews === 1 ? '' : 's'} left today.`
              : "You've reached your daily limit of 2 free experiences."}
          </p>
        </div>

        {/* Modern Pill Tabs */}
        <div className={`px-5 pt-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex p-1 rounded-full bg-gray-100 dark:bg-gray-700 mb-5 shadow-inner">
            <button
              className={`flex-1 py-2 rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'post'
                  ? `${darkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'}`
                  : `${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`
              }`}
              onClick={() => setActiveTab('post')}
            >
              <span className="material-icons text-sm">create</span>
              <span className="font-medium">Post</span>
            </button>
            <button
              className={`flex-1 py-2 rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'premium'
                  ? `${darkMode ? 'bg-yellow-600 text-white shadow-md' : 'bg-yellow-500 text-white shadow-md'}`
                  : `${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`
              }`}
              onClick={() => setActiveTab('premium')}
            >
              <span className="material-icons text-sm">stars</span>
              <span className="font-medium">Premium</span>
            </button>
            <button
              className={`flex-1 py-2 rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'donate'
                  ? `${darkMode ? 'bg-green-600 text-white shadow-md' : 'bg-green-500 text-white shadow-md'}`
                  : `${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`
              }`}
              onClick={() => setActiveTab('donate')}
            >
              <span className="material-icons text-sm">favorite</span>
              <span className="font-medium">Donate</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'post' ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Share Your Experience</h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                Post your interview experiences or general posts to earn coins and get unlimited access.
              </p>
              <ul className="mb-5 space-y-3">
                <li className="flex items-center">
                  <span className="material-icons text-blue-500 mr-2">check_circle</span>
                  <span>Earn 100 coins for interview experiences</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons text-blue-500 mr-2">check_circle</span>
                  <span>Earn 25 coins for general posts</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons text-blue-500 mr-2">check_circle</span>
                  <span>Help the community with your insights</span>
                </li>
              </ul>
              <button
                onClick={handlePostContent}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-icons text-sm">create</span>
                Start Posting
              </button>
            </div>
          ) : activeTab === 'premium' ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Premium Benefits</h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                Upgrade for unlimited access to everything!
              </p>
              <ul className="mb-5 space-y-3">
                <li className="flex items-center">
                  <span className="material-icons text-yellow-500 mr-2">check_circle</span>
                  <span>Unlimited access to all content</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons text-yellow-500 mr-2">check_circle</span>
                  <span>No daily limits</span>
                </li>
              </ul>
              <button
                onClick={handleGoPremium}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="material-icons text-sm">stars</span>
                Get Premium Access
              </button>
            </div>
          ) : (
            // Donation Tab
            <DonationComponent />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
          <span className="material-icons text-xs">update</span>
          Your views will reset at midnight in your local time zone.
        </div>
      </div>
    </div>
  );
};

export default ContentPaywall;
