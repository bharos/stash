'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';
import supabase from '../utils/supabaseClient';

export default function DonationVerification({ reference }) {
  const [donationId, setDonationId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  
  const { user } = useUser();
  const router = useRouter();
  
  // Get access token on component mount
  useEffect(() => {
    async function fetchAccessToken() {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
    }
    
    fetchAccessToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!donationId) {
      setError('Please enter the donation ID from your receipt');
      return;
    }
    
    if (!amount || isNaN(amount) || Number(amount) < 10) {
      setError('Please enter a valid donation amount (minimum $10)');
      return;
    }
    
    if (!accessToken) {
      setError('Authentication required. Please sign in and try again.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/donations/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          donationId,
          reference,
          amount: parseFloat(amount),
          // Enable auto-verify for testing if needed
          // autoVerify: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify donation');
      }
      
      // Handle successful verification or submission
      setSuccess(data.message);
      
      // If premium was granted immediately (auto-verify)
      if (data.premiumDays) {
        setTimeout(() => {
          router.push('/donation/success?verified=true');
        }, 2000);
      } else {
        // For manual verification
        setTimeout(() => {
          router.push('/donation/pending?ref=' + reference);
        }, 2000);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">Verify Your Donation</h2>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
          Manual Verification (Only if Needed)
        </p>
        <p className="text-sm mt-2">
          Donations are normally verified automatically. You only need to use this form if:
        </p>
        <ul className="list-disc pl-5 mt-1 text-sm">
          <li>You didn't receive premium access within 5 minutes of donation</li>
          <li>You donated directly on Every.org without using our donation link</li>
        </ul>
        <p className="text-sm mt-2 text-blue-700 dark:text-blue-300">
          Your donation of $10+ will give you 30 days of premium access and 300 coins, plus 30 additional coins for every dollar above $10.
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="donationId">
            Donation ID
          </label>
          <input
            id="donationId"
            type="text"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Enter the donation ID from your receipt"
            value={donationId}
            onChange={(e) => setDonationId(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="amount">
            Donation Amount ($)
          </label>
          <input
            id="amount"
            type="number"
            min="10"
            step="0.01"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Enter the amount you donated"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Submit Verification'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Your reference code: <span className="font-mono">{reference}</span></p>
      </div>
    </div>
  );
}
