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
      <h2 className="text-xl font-semibold mb-2 flex items-center">
        <span className="material-icons text-green-500 mr-2">favorite</span>
        <span className={`${darkMode ? 'text-green-100' : 'text-green-800'}`}>
          {isPremium ? 'Donate & Earn Coins' : 'Donate & Get Premium Access'}
        </span>
      </h2>
      
      <p className="mb-4 text-gray-500 dark:text-gray-400 ml-1 border-l-2 border-green-400 dark:border-green-600 pl-3">
        Support great causes and earn premium benefits!
      </p>
      
      <div className={`p-3 rounded-lg mb-4 bg-gradient-to-r ${darkMode ? 'from-green-900/40 to-emerald-800/40 border border-green-800' : 'from-green-50 to-emerald-50 border border-green-100'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isPremium ? (
            <p className={`text-sm font-medium ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
              Get 30 coins for each $1 donated
            </p>
          ) : (
            <p className={`text-sm font-medium ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
              $10+ = 30 premium days
            </p>
          )}
          <p className={`text-sm ${darkMode ? 'text-green-100' : 'text-green-700'}`}>
            100% to charity
          </p>
        </div>
        <p className={`text-xs mt-1 ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
          {isPremium
            ? 'Donate to worthy causes and earn coins to use on Stash!'
            : 'Premium access is automatic after donation + bonus coins for donations over $10!'}
        </p>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
            <span className="material-icons text-xs mr-1">business</span>
            Select a nonprofit
          </label>
          {selectedCharity && (
            <button 
              onClick={() => setSelectedCharity(null)}
              className={`text-xs ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} flex items-center`}
            >
              <span className="material-icons text-xs mr-1">refresh</span>
              Change
            </button>
          )}
        </div>
        
        {selectedCharity ? (
          <div className={`p-3 rounded-lg border ${darkMode ? 'border-green-800 bg-gradient-to-r from-green-900/30 to-emerald-900/30' : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
            <div className="font-medium text-base flex items-center">
              <span className="material-icons text-green-500 mr-1.5">verified</span>
              {selectedCharity.name}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-6`}>
              Category: {selectedCharity.category}
            </div>
          </div>
        ) : (
          <>
            <div className={`relative rounded-lg overflow-hidden ${darkMode ? 'border-gray-700 border' : 'border-gray-300 border'}`}>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="material-icons text-sm text-gray-400">search</span>
              </div>
              <input 
                type="text" 
                placeholder="Search for a nonprofit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-2.5 pl-10 text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div className={`mt-1.5 max-h-32 overflow-y-auto rounded-lg border ${
              darkMode ? 'border-gray-700 shadow-inner' : 'border-gray-300 shadow-inner'
            }`}>
              {filteredCharities.map(charity => (
                <div
                  key={charity.id}
                  onClick={() => setSelectedCharity(charity)}
                  className={`p-2.5 cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-100 border-gray-300'
                  } border-b last:border-b-0 group`}
                >
                  <div className="text-sm font-medium flex items-center">
                    <span className={`material-icons text-sm mr-1.5 ${darkMode ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-500 group-hover:text-green-600'}`}>volunteer_activism</span>
                    {charity.name}
                  </div>
                  <div className={`text-xs ml-6 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {charity.category}
                  </div>
                </div>
              ))}
              {filteredCharities.length === 0 && (
                <div className={`p-3 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center justify-center`}>
                  <span className="material-icons text-sm mr-1.5">search_off</span>
                  No results found
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="mb-3">
        <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'} flex items-center`}>
          <span className="material-icons text-xs mr-1">payments</span>
          Donation Amount
        </label>
        <div className="flex gap-1.5">
          {[10, 15, 20, 25].map(amount => (
            <button 
              key={amount}
              onClick={() => {
                setDonationAmount(amount);
                setCustomInputActive(false);
              }}
              className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                donationAmount === amount && !customInputActive
                  ? darkMode 
                    ? 'bg-gradient-to-r from-green-700 to-green-600 text-white shadow-md' 
                    : 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md' 
                  : darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              ${amount}
            </button>
          ))}
          <div className="relative flex-1 min-w-[90px]">
            <span className={`absolute left-3 top-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>$</span>
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
              className={`w-full pl-6 pr-3 py-2 text-sm border rounded-lg ${
                customInputActive
                  ? darkMode 
                    ? 'bg-gray-700 border-green-600 text-white ring-1 ring-green-500' 
                    : 'bg-white border-green-400 text-gray-900 ring-1 ring-green-400'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
        
        <div className={`mt-3 p-2 rounded-lg bg-gradient-to-r ${darkMode ? 'from-gray-700 to-gray-800 border border-gray-600' : 'from-gray-50 to-gray-100 border border-gray-200'}`}>
          <div className="flex justify-between items-center">
            {!isPremium && (
              <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="material-icons text-amber-500 mr-1.5">card_membership</span>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{premiumDays}</span> premium days
                </div>
              </div>
            )}
            <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="material-icons text-amber-500 mr-1.5">monetization_on</span>
              <div>
                <span className={`font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>+{coinsToReceive}</span> coins
              </div>
            </div>
          </div>
        </div>
        
        {donationAmount !== '' && donationAmount < 10 && (
          <div className="mt-2 text-xs text-red-500 flex items-center">
            <span className="material-icons text-xs mr-1">error</span>
            Minimum donation amount is $10
          </div>
        )}
      </div>
      
      <button
        onClick={handleDonation}
        disabled={!selectedCharity || isLoading || donationAmount < 10}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-all mt-1 ${
          !selectedCharity || isLoading || donationAmount < 10
            ? darkMode ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-gray-300 cursor-not-allowed text-gray-500'
            : darkMode 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-md hover:shadow-lg' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-md hover:shadow-lg'
        } flex items-center justify-center`}
      >
        {isLoading ? (
          <>
            <span className="material-icons text-sm animate-spin mr-2">refresh</span>
            Processing...
          </>
        ) : donationAmount < 10 ? (
          <>
            <span className="material-icons text-sm mr-2">info</span>
            Minimum $10 Required
          </>
        ) : (
          <>
            <span className="material-icons text-sm mr-2">favorite</span>
            Donate ${typeof donationAmount === 'number' ? donationAmount.toFixed(2) : donationAmount} Now
          </>
        )}
      </button>
      
      <div className={`flex items-center justify-center mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <span className="material-icons text-xs mr-1.5">verified</span>
        100% to charity. Tax receipts provided directly from nonprofit.
      </div>
    </div>
  );
};

export default DonationComponent;