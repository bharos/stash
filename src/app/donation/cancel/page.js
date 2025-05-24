'use client';

import { useRouter } from 'next/navigation';
import { useDarkMode } from '../../context/DarkModeContext';

export default function DonationCancelPage() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`max-w-md w-full rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-8 text-center">
          <div className="flex justify-center">
            <div className={`rounded-full h-12 w-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-xl font-bold mt-6">Donation Cancelled</h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your donation process has been cancelled. No charges have been made.
          </p>
          
          <div className="mt-8">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-6 py-3 rounded-lg ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } mb-4 w-full`}
            >
              Return to Dashboard
            </button>
            
            <button
              onClick={() => router.back()}
              className={`px-6 py-3 rounded-lg ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              } w-full`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}