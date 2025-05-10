'use client';
import { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';
import supabase from '../utils/supabaseClient';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { user } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check premium status when user changes
    const checkPremiumStatus = async () => {
      if (!user?.user_id) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) {
          setIsPremium(false);
          setLoading(false);
          return;
        }
        
        const token = sessionData.session.access_token;
        const response = await fetch('/api/userTokens', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          setIsPremium(false);
          setLoading(false);
          return;
        }
        
        const tokenData = await response.json();
        const premiumUntil = tokenData.premium_until;
        
        if (premiumUntil) {
          const now = new Date();
          const expiry = new Date(premiumUntil);
          setIsPremium(expiry > now);
        } else {
          setIsPremium(false);
        }
      } catch (err) {
        console.error('Error checking premium status:', err);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user?.user_id]);

  return (
    <PremiumContext.Provider value={{ isPremium, loading }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};
