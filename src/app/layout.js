'use client';

import './globals.css';
import { UserProvider } from './context/UserContext';
import ClientHome from './components/ClientHome';
import { ActiveMenuProvider } from './context/ActiveMenuContext';
import { DraftExperienceProvider } from './context/DraftExperience';
import { FlagsProvider } from './context/flagContext';
import Footer from './components/Footer';
import { Inter } from 'next/font/google';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';

const inter = Inter({ subsets: ['latin'] });

function RootLayoutContent({ children }) {
  const { darkMode } = useDarkMode();

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <title>Stash - Interview Experiences</title>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <UserProvider>
          <DraftExperienceProvider>
            <ActiveMenuProvider>
              <FlagsProvider>
                <ClientHome>
                  {children}
                </ClientHome>
                <Footer />
              </FlagsProvider>
            </ActiveMenuProvider>
          </DraftExperienceProvider>
        </UserProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <DarkModeProvider>
      <RootLayoutContent>{children}</RootLayoutContent>
    </DarkModeProvider>
  );
}
