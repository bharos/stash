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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-80 backdrop-blur-sm`}>
      <div 
        className={`w-full max-w-[95vw] sm:max-w-md max-h-[90vh] sm:max-h-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-2xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}
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
        <div className={`p-3 sm:p-5 ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-white to-gray-50'} rounded-t-xl border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className={`material-icons text-lg ${isViewsLeft ? 'text-yellow-500' : 'text-red-500'}`}>
                {isViewsLeft ? 'lock_clock' : 'lock'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                {isViewsLeft ? 'Limited Access' : 'Daily Limit Reached'}
              </h2>
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-7 flex items-center`}>
            <span className="material-icons text-xs mr-1">{isViewsLeft ? 'visibility' : 'visibility_off'}</span>
            {isViewsLeft 
              ? `You have ${remainingViews} view${remainingViews === 1 ? '' : 's'} left today.`
              : "You've reached your daily limit of 2 free experiences."}
          </p>
        </div>

        {/* Modern Pill Tabs */}
        <div className={`px-3 sm:px-5 pt-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex-shrink-0`}>
          <div className="flex p-1 rounded-lg bg-gray-100 dark:bg-gray-700 mb-3 sm:mb-5 shadow-inner">
            <button
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
                activeTab === 'post'
                  ? `${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'}`
                  : `${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50'}`
              }`}
              onClick={() => setActiveTab('post')}
            >
              <span className="material-icons text-sm">create</span>
              <span className="font-medium text-xs sm:text-sm">Post</span>
            </button>
            <button
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 mx-1 ${
                activeTab === 'premium'
                  ? `${darkMode ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md' : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md'}`
                  : `${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50'}`
              }`}
              onClick={() => setActiveTab('premium')}
            >
              <span className="material-icons text-sm">stars</span>
              <span className="font-medium text-xs sm:text-sm">Premium</span>
            </button>
            <button
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
                activeTab === 'donate'
                  ? `${darkMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'}`
                  : `${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50'}`
              }`}
              onClick={() => setActiveTab('donate')}
            >
              <span className="material-icons text-sm">favorite</span>
              <span className="font-medium text-xs sm:text-sm">Donate</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`px-3 sm:px-5 py-3 sm:py-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex-1 overflow-y-auto`}>
          {activeTab === 'post' ? (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center">
                <span className="material-icons text-blue-500 mr-2">create</span>
                <span className={`${darkMode ? 'text-blue-100' : 'text-blue-800'}`}>Share Your Experience</span>
              </h3>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 ml-1 border-l-2 border-blue-400 dark:border-blue-600 pl-3">
                Post your interview experiences or general posts to earn coins and get unlimited access.
              </p>
              <ul className="mb-4 sm:mb-5 space-y-2 sm:space-y-3">
                <li className="flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-100 dark:border-blue-800/30">
                  <span className="material-icons text-blue-500 mr-2 flex-shrink-0">check_circle</span>
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Earn 100 coins for interview experiences</span>
                </li>
                <li className="flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-100 dark:border-blue-800/30">
                  <span className="material-icons text-blue-500 mr-2 flex-shrink-0">check_circle</span>
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Earn 25 coins for general posts</span>
                </li>
                <li className="flex items-center p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-100 dark:border-blue-800/30">
                  <span className="material-icons text-blue-500 mr-2 flex-shrink-0">check_circle</span>
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Help the community with your insights</span>
                </li>
              </ul>
              <button
                onClick={handlePostContent}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 font-medium hover:shadow-xl active:scale-[0.98] text-sm sm:text-base"
              >
                <span className="material-icons text-sm">create</span>
                Start Posting
              </button>
            </div>
          ) : activeTab === 'premium' ? (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center">
                <span className="material-icons text-amber-500 mr-2">stars</span>
                <span className={`${darkMode ? 'text-amber-100' : 'text-amber-800'}`}>Premium Benefits</span>
              </h3>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 ml-1 border-l-2 border-amber-400 dark:border-amber-600 pl-3">
                Upgrade for unlimited access to everything!
              </p>
              <ul className="mb-4 sm:mb-5 space-y-2 sm:space-y-3">
                <li className="flex items-center p-2 rounded-lg bg-gradient-to-r from-amber-50/50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-100 dark:border-amber-800/30">
                  <span className="material-icons text-amber-500 mr-2 flex-shrink-0">check_circle</span>
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Unlimited access to all content</span>
                </li>
                <li className="flex items-center p-2 rounded-lg bg-gradient-to-r from-amber-50/50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-100 dark:border-amber-800/30">
                  <span className="material-icons text-amber-500 mr-2 flex-shrink-0">check_circle</span>
                  <span className={`text-sm sm:text-base ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>No daily limits</span>
                </li>
              </ul>
              <button
                onClick={handleGoPremium}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 font-medium hover:shadow-xl active:scale-[0.98] text-sm sm:text-base"
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
        <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 rounded-b-xl border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <span className="material-icons text-xs text-blue-500 dark:text-blue-400">update</span>
          <span className="text-xs sm:text-sm">Your views will reset at midnight in your local time zone.</span>
        </div>
      </div>
    </div>
  );
};

export default ContentPaywall;
