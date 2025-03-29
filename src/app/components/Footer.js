'use client';

import Link from 'next/link';
import { useDarkMode } from '../context/DarkModeContext';

export default function Footer() {
  const { darkMode } = useDarkMode();

  return (
    <footer className={`text-center py-5 mt-10 text-sm ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
      <nav className="mb-2">
        <Link 
          href="/privacyPolicy.html" 
          className={`mx-2.5 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors duration-200`}
        >
          Privacy Policy
        </Link>
        <span className={`mx-2.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>|</span>
        <Link 
          href="/contactUs.html" 
          className={`mx-2.5 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors duration-200`}
        >
          Contact Us
        </Link>
      </nav>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        © {new Date().getFullYear()} Stash. All rights reserved.
      </p>
    </footer>
  );
}

// Simple styles for the footer
const styles = {
  footer: {
    textAlign: 'center',
    padding: '20px',
    marginTop: '40px',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  nav: {
    marginBottom: '8px',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    margin: '0 10px',
  },
  separator: {
    color: '#666',
  },
  copyright: {
    fontSize: '12px',
    color: '#777',
  },
};
