'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewLimitContext } from '../../context/ViewLimitContext';
import { useDarkMode } from '../../context/DarkModeContext';
import supabase from '../../utils/supabaseClient';

function DonationSuccessContent() {
  const [status, setStatus] = useState('checking');
  const [donationData, setDonationData] = useState(null);
  const { fetchViewLimitData } = useViewLimitContext();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const donationRef = searchParams.get('ref');
  
  useEffect(() => {
    async function checkDonationStatus() {
      try {
        // Check donation status in your database
        const response = await fetch(`/api/donations/status?reference=${donationRef}`);
        const data = await response.json();
        
        if (response.ok) {
          setDonationData(data);
          
          if (data.status === 'completed') {
            // If webhook has already processed the donation
            setStatus('success');
            // Refresh view limit data to get updated premium status
            await fetchViewLimitData();
          } else {
            // If webhook hasn't processed it yet, show pending
            setStatus('pending');
            
            // Check again in 5 seconds
            setTimeout(checkDonationStatus, 5000);
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking donation status:', error);
        setStatus('error');
      }
    }
    
    if (donationRef) {
      checkDonationStatus();
    } else {
      setStatus('error');
    }
  }, [donationRef, fetchViewLimitData]);
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`max-w-md w-full rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {status === 'checking' && (
          <div className="p-8 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
            <h1 className="text-xl font-bold mt-6">Checking donation status...</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Please wait while we verify your donation.
            </p>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="p-8 text-center">
            <div className="flex justify-center">
              <div className={`animate-pulse rounded-full h-12 w-12 ${darkMode ? 'bg-yellow-600' : 'bg-yellow-500'}`}></div>
            </div>
            <h1 className="text-xl font-bold mt-6">Processing Your Donation</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your donation is being processed. This should only take a moment.
            </p>
            <p className={`text-sm mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              If this page doesn't update soon, you can return to the dashboard.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className={`mt-4 px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Return to Dashboard
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div className={`p-6 text-center ${darkMode ? 'bg-green-800' : 'bg-green-500'} text-white`}>
              <div className="flex justify-center">
                <div className="rounded-full bg-white p-2">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold mt-4">Thank You for Your Donation!</h1>
              <p className="mt-2 text-green-100">
                Your premium access has been activated successfully.
              </p>
            </div>
            
            <div className="p-6">
              <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-medium">Donation Details:</h3>
                <div className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <p>Amount: ${donationData?.amount?.toFixed(2) || '–'}</p>
                  <p>Status: {donationData?.status === 'completed' ? 'Completed' : 'Processing'}</p>
                  <p>Date: {donationData?.created_at ? new Date(donationData.created_at).toLocaleDateString() : '–'}</p>
                  <p>Nonprofit: {donationData?.nonprofit_name || donationData?.nonprofit_id || '–'}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                <h3 className={`font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>Premium Benefits:</h3>
                <div className={`mt-2 ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                  <p>Premium Access: {donationData?.premium_days || 'Activated'} days</p>
                  {donationData?.premium_until && (
                    <p>Valid until: {new Date(donationData.premium_until).toLocaleDateString()}</p>
                  )}
                  {donationData?.tokens_granted && (
                    <p>Bonus Tokens: +{donationData.tokens_granted} tokens added</p>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className={`px-6 py-3 rounded-lg ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Continue to Dashboard
                </button>
                <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You will receive a receipt from the nonprofit organization.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="p-8 text-center">
            <div className="flex justify-center">
              <div className={`rounded-full h-12 w-12 ${darkMode ? 'bg-red-700' : 'bg-red-500'} flex items-center justify-center text-white`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-6">Verification Problem</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              We couldn't verify your donation. If you completed the donation, please contact support.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className={`mt-6 px-6 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full rounded-xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-8 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h1 className="text-xl font-bold mt-6">Loading donation details...</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Please wait while we verify your donation.
          </p>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  );
}