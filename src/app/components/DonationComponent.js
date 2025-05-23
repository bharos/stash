'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';
import supabase from '../utils/supabaseClient';

const DonationComponent = ({ onClose, isPremium = false }) => {
  const { darkMode } = useDarkMode();
  const { user } = useUser();
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [donationAmount, setDonationAmount] = useState(10);
  const [customInputActive, setCustomInputActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [charities, setCharities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCharities, setFilteredCharities] = useState([]);
  
  // Calculate premium days based on amount
  const premiumDays = isPremium ? 0 : donationAmount >= 10 ? 30 : donationAmount === '' ? 0 : 7;
  
  // Calculate coins based on amount and premium status
  const coinsToReceive = isPremium 
    ? (donationAmount >= 10 ? Math.floor(donationAmount * 30) : 0) // Premium users get more coins
    : (donationAmount >= 10 && donationAmount > 10 ? Math.floor((donationAmount - 10) * 30) : 0); // Non-premium users get premium first
  
  // Fetch popular charities on component mount
  useEffect(() => {
    async function fetchPopularCharities() {
      // These are verified working nonprofits on Every.org
      const popularCharities = [
        { id: 'wildlife-conservation-network', name: 'Wildlife Conservation Network', category: 'Animals' },
        { id: 'doctors-without-borders-usa', name: 'Doctors Without Borders', category: 'Health' },
        { id: 'against-malaria-foundation-usa', name: 'Against Malaria Foundation', category: 'Global Health' },
        { id: 'givedirectly', name: 'GiveDirectly', category: 'Poverty' },
        { id: 'electronic-frontier-foundation', name: 'Electronic Frontier Foundation', category: 'Digital Rights' },
        { id: 'code-for-america', name: 'Code for America', category: 'Technology' },
        { id: 'wikimedia-foundation', name: 'Wikimedia Foundation', category: 'Education' },
        { id: 'khan-academy', name: 'Khan Academy', category: 'Education' },
        { id: 'water-org', name: 'Water.org', category: 'Clean Water' },
        { id: 'direct-relief', name: 'Direct Relief', category: 'Humanitarian' }
      ];
      
      setCharities(popularCharities);
      setFilteredCharities(popularCharities);
    }
    
    fetchPopularCharities();
  }, []);
  
  // Filter charities based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCharities(charities);
    } else {
      const filtered = charities.filter(charity => 
        charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charity.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCharities(filtered);
    }
  }, [searchTerm, charities]);
  
  // Handle donation
  const handleDonation = async () => {
    if (!selectedCharity) return;
    
    setIsLoading(true);
    
    try {
      // Get user token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('No authentication token');
      }
      
      // Call API to create donation with fundraiser instead of direct API
      const response = await fetch('/api/donations/fundraiser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          nonprofitId: selectedCharity.id,
          nonprofitName: selectedCharity.name,
          amount: donationAmount,
          isPremium: isPremium // Pass premium status to the API
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create donation');
      }
      
      // Store the reference for verification
      localStorage.setItem('donationReference', data.reference);
      
      // Open the fundraiser in a new tab
      window.open(data.donationUrl, '_blank');
      
      // Redirect to verification page in current tab
      setTimeout(() => {
        window.location.href = `/donation/verify?ref=${data.reference}`;
      }, 1000);
    } catch (error) {
      console.error('Error initiating donation:', error);
      alert('Sorry, there was a problem initiating your donation. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h2 className="text-lg font-bold mb-2">
        {isPremium ? 'Donate & Earn Coins' : 'Donate & Get Premium Access'}
      </h2>
      
      <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isPremium ? (
            <p className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              Get 30 coins for each $1 donated
            </p>
          ) : (
            <p className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              $10+ = 30 premium days
            </p>
          )}
          <p className={`text-sm ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
            100% to charity
          </p>
        </div>
        <p className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
          {isPremium
            ? 'Donate to worthy causes and earn coins to use on Stash!'
            : 'Premium access is automatic after donation + bonus coins for donations over $10!'}
        </p>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Select a nonprofit
          </label>
          {selectedCharity && (
            <button 
              onClick={() => setSelectedCharity(null)}
              className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              Change
            </button>
          )}
        </div>
        
        {selectedCharity ? (
          <div className={`p-2 rounded-lg border ${darkMode ? 'border-blue-800 bg-blue-900/30' : 'border-blue-200 bg-blue-50'}`}>
            <div className="font-medium">{selectedCharity.name}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedCharity.category}
            </div>
          </div>
        ) : (
          <>
            <input 
              type="text" 
              placeholder="Search for a nonprofit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 rounded-lg border mb-1 text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            <div className={`max-h-32 overflow-y-auto rounded-lg border ${
              darkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              {filteredCharities.map(charity => (
                <div
                  key={charity.id}
                  onClick={() => setSelectedCharity(charity)}
                  className={`p-2 cursor-pointer ${
                    darkMode ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-100 border-gray-200'
                  } border-b last:border-b-0`}
                >
                  <div className="text-sm font-medium">{charity.name}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {charity.category}
                  </div>
                </div>
              ))}
              {filteredCharities.length === 0 && (
                <div className={`p-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No results found
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="mb-3">
        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Donation Amount
        </label>
        <div className="flex gap-1">
          {[10, 15, 20, 25].map(amount => (
            <button 
              key={amount}
              onClick={() => {
                setDonationAmount(amount);
                setCustomInputActive(false);
              }}
              className={`px-3 py-1.5 rounded-full transition text-sm ${
                donationAmount === amount && !customInputActive
                  ? darkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white' 
                  : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              ${amount}
            </button>
          ))}
          <div className="relative flex-1 min-w-[90px]">
            <span className={`absolute left-2 top-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>$</span>
            <input
              type="number"
              min="10"
              step="any"
              value={customInputActive ? donationAmount : ''}
              onChange={e => {
                const inputValue = e.target.value;
                // Allow any input, don't force minimum here
                setDonationAmount(inputValue === '' ? '' : parseFloat(inputValue) || 0);
                setCustomInputActive(true);
              }}
              onFocus={() => {
                setCustomInputActive(true);
              }}
              placeholder="Custom"
              className={`w-full pl-5 pr-2 py-1.5 text-sm border rounded-full ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs">
          {!isPremium && (
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="material-icons text-xs mr-1">card_giftcard</span>
              {premiumDays} premium days
            </div>
          )}
          <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="material-icons text-xs mr-1">workspace_premium</span>
            +{isPremium 
              ? (donationAmount >= 10 ? Math.floor(donationAmount * 30) : 0)
              : (donationAmount >= 10 && donationAmount > 10 ? Math.floor((donationAmount - 10) * 30) : 0)
            } coins
          </div>
        </div>
        
        {donationAmount !== '' && donationAmount < 10 && (
          <div className="mt-1 text-xs text-red-500">
            Minimum donation amount is $10
          </div>
        )}
      </div>
      
      <button
        onClick={handleDonation}
        disabled={!selectedCharity || isLoading || donationAmount < 10}
        className={`w-full py-2.5 rounded-lg font-medium text-sm ${
          !selectedCharity || isLoading || donationAmount < 10
            ? darkMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
            : darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isLoading ? 'Processing...' : 
          donationAmount < 10 ? `Minimum $10 Required` : 
          `Donate $${typeof donationAmount === 'number' ? donationAmount.toFixed(2) : donationAmount} Now`}
      </button>
      
      <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        100% to charity. Tax receipts provided directly from nonprofit.
      </p>
    </div>
  );
};

export default DonationComponent;