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
      darkMode ? 'bg-yellow-800 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
    }`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-3 w-3 mr-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
        />
      </svg>
      Premium
    </div>
  );
};

export default PremiumBadge;
