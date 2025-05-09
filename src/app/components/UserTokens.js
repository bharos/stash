'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';
import supabase from '../utils/supabaseClient';
import PremiumBadge from './PremiumBadge';

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
    <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-lg shadow-lg mb-6 border relative`}>
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
      
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Your Coins
        </h2>
        <PremiumBadge />
      </div>
      
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}
      
      {loading ? (
        <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
      ) : (
        <>
          <div className="flex items-center justify-center mb-6">
            <div className={`text-4xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>{coins}</div>
            <span className={`ml-2 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Coins</span>
          </div>
          
          {isPremiumActive() ? (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Premium Membership</h3>
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                    Active Status
                  </span>
                  <span className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-semibold`}>
                    Expires: {formatExpiryDate()}
                  </span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    You can purchase again after your current subscription expires
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Premium Status</h3>
                <div className={`p-2 rounded bg-gray-100 text-gray-800`}>
                  Inactive
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Get Premium Access</h3>
                
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>1 Week Access</span>
                    <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>100 Coins</span>
                  </div>
                  <button
                    onClick={() => showPurchaseConfirmation(100)}
                    disabled={processingPurchase || coins < 100}
                    className={`w-full py-2 rounded ${
                      coins >= 100 && !processingPurchase
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    } transition-colors`}
                  >
                    {processingPurchase ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
                
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>30 Days Access</span>
                    <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>300 Coins</span>
                  </div>
                  <button
                    onClick={() => showPurchaseConfirmation(300)}
                    disabled={processingPurchase || coins < 300}
                    className={`w-full py-2 rounded ${
                      coins >= 300 && !processingPurchase
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    } transition-colors`}
                  >
                    {processingPurchase ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Earn 100 coins for each interview experience and 25 coins for each general post you create! Use your coins to get premium access to the entire website.
          </p>
        </>
      )}
    </div>
  );
};

export default UserTokens;
