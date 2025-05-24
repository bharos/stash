'use client';
import { usePremium } from '../context/PremiumContext';
import { useDarkMode } from '../context/DarkModeContext';

const PremiumBadge = () => {
  const { isPremium, loading } = usePremium();
  const { darkMode } = useDarkMode();
  
  if (loading) return null;
  
  if (!isPremium) return null;
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      darkMode 
        ? 'bg-gradient-to-r from-amber-700 to-yellow-700 text-yellow-200 border border-amber-600/50' 
        : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200'
    } shadow-sm`}>
      <span className="material-icons text-xs mr-1">stars</span>
      Premium
    </div>
  );
};

export default PremiumBadge;
