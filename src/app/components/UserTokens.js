'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';
import supabase from '../utils/supabaseClient';
import PremiumBadge from './PremiumBadge';
import DonationComponent from './DonationComponent';

const UserTokens = () => {
  const { user } = useUser();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [premiumUntil, setPremiumUntil] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [activeTab, setActiveTab] = useState('coins'); // 'coins' or 'donate'

  const fetchUserTokens = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        return;
      }
      
      const token = sessionData.session.access_token;
      const response = await fetch('/api/userTokens', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tokens');
      }
      
      const tokenData = await response.json();
      setCoins(tokenData.coins || 0);
      setPremiumUntil(tokenData.premium_until);
    } catch (err) {
      console.error('Error fetching user tokens:', err);
      setError('Failed to load token information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTokens();
  }, [user?.user_id]);

  const isPremiumActive = () => {
    if (!premiumUntil) return false;
    const now = new Date();
    const expiry = new Date(premiumUntil);
    return expiry > now;
  };

  const formatExpiryDate = () => {
    if (!premiumUntil) return 'Not active';
    const expiry = new Date(premiumUntil);
    return expiry.toLocaleDateString();
  };

  const showPurchaseConfirmation = (amount) => {
    if (processingPurchase) return;
    if (coins < amount) {
      setError('Not enough coins for this purchase');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Set pending purchase details and show confirmation dialog
    setPendingPurchase({
      amount,
      duration: amount === 100 ? '1 week' : '30 days'
    });
    setShowConfirmation(true);
  };
  
  const cancelPurchase = () => {
    setPendingPurchase(null);
    setShowConfirmation(false);
  };

  const handlePurchase = async () => {
    if (processingPurchase || !pendingPurchase) return;
    const amount = pendingPurchase.amount;
    
    try {
      setProcessingPurchase(true);
      setError('');
      setSuccess('');
      setShowConfirmation(false);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const token = sessionData.session.access_token;
      const response = await fetch('/api/userTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'spend',
          amount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process purchase');
      }
      
      const result = await response.json();
      setCoins(result.coins);
      setPremiumUntil(result.premium_until);
      
      // Show a success message
      setSuccess(`Premium access purchased successfully! Valid until ${new Date(result.premium_until).toLocaleDateString()}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error purchasing premium access:', err);
      setError(err.message || 'Failed to process purchase');
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingPurchase(false);
    }
  };

  return (
    <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-lg shadow-lg mb-6 border relative`}>
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-6 rounded-lg shadow-xl max-w-sm mx-auto`}>
            <h3 className="text-lg font-semibold mb-4">Confirm Purchase</h3>
            <p className="mb-4">
              Are you sure you want to spend <span className="font-bold text-yellow-500">{pendingPurchase?.amount} coins</span> for {pendingPurchase?.duration} of premium access?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelPurchase}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handlePurchase}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Your Coins
        </h2>
        <PremiumBadge />
      </div>
      
      {/* Tab Navigation - Improved version */}
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab('coins')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-tl-lg rounded-tr-lg transition-all ${
            activeTab === 'coins'
              ? darkMode 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-200 text-gray-800'
              : darkMode
                ? 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">monetization_on</span>
            My Coins
          </div>
        </button>
        <button
          onClick={() => setActiveTab('donate')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-tl-lg rounded-tr-lg transition-all ${
            activeTab === 'donate'
              ? darkMode 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-200 text-gray-800'
              : darkMode
                ? 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center">
            <span className="material-icons text-sm mr-1">volunteer_activism</span>
            Support & Earn
          </div>
        </button>
      </div>
      
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}
      
      {loading ? (
        <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
      ) : (
        <>
          {activeTab === 'coins' && (
            <>
              <div className="flex flex-col items-center justify-center mb-6 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-800/30 dark:to-amber-800/30 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons text-amber-500 mr-2 text-4xl">stars</span>
                  <div className={`text-4xl font-bold ${darkMode ? 'text-yellow-400' : 'text-amber-600'}`}>{coins}</div>
                </div>
                <span className={`mt-1 text-base ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>Available Coins</span>
              </div>
              
              {isPremiumActive() ? (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Premium Membership</h3>
                  <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center mb-2">
                      <span className="material-icons text-green-500 mr-2">verified</span>
                      <span className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                        Active Premium Status
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expires on:</span>
                      <span className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-semibold`}>
                        {formatExpiryDate()}
                      </span>
                    </div>
                    <div className="mt-2 text-center">
                      <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        You can purchase again after your current subscription expires
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 mr-2">warning_amber</span>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Premium Status</h3>
                    </div>
                    <div className={`p-2 mt-2 rounded-lg flex items-center ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      <span className="material-icons text-xs mr-1">cancel</span>
                      <span className="text-sm">Not active</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="material-icons text-indigo-500 mr-2">workspace_premium</span>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Get Premium Access</h3>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-indigo-50 border-indigo-100'} mb-3`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} block`}>1 Week Access</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best for trying premium</span>
                        </div>
                        <div className="flex items-center">
                          <span className="material-icons text-amber-500 mr-1">monetization_on</span>
                          <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-amber-600'}`}>100</span>
                        </div>
                      </div>
                      <button
                        onClick={() => showPurchaseConfirmation(100)}
                        disabled={processingPurchase || coins < 100}
                        className={`w-full py-2 rounded-lg ${
                          coins >= 100 && !processingPurchase
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:from-indigo-700 hover:to-blue-600'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        } transition-colors font-medium`}
                      >
                        {processingPurchase ? 'Processing...' : 'Purchase'}
                      </button>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-100'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'} block`}>30 Days Access</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best value!</span>
                        </div>
                        <div className="flex items-center">
                          <span className="material-icons text-amber-500 mr-1">monetization_on</span>
                          <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-amber-600'}`}>300</span>
                        </div>
                      </div>
                      <button
                        onClick={() => showPurchaseConfirmation(300)}
                        disabled={processingPurchase || coins < 300}
                        className={`w-full py-2 rounded-lg ${
                          coins >= 300 && !processingPurchase
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        } transition-colors font-medium`}
                      >
                        {processingPurchase ? 'Processing...' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              <div className={`mt-6 p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div className="flex items-start">
                  <span className="material-icons text-blue-500 mr-2 mt-0.5">info</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-semibold text-blue-500">Earn coins</span> by sharing your experiences! Get 100 coins for each interview experience and 25 coins for each general post.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'donate' && (
            <DonationComponent 
              isPremium={isPremiumActive()} 
              onClose={() => {}} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserTokens;
