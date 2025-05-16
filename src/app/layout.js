'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { UserProvider } from './context/UserContext';
import { PremiumProvider } from './context/PremiumContext';
import ClientHome from './components/ClientHome';
import { ActiveMenuProvider } from './context/ActiveMenuContext';
import { DraftExperienceProvider } from './context/DraftExperience';
import { SidebarProvider } from './context/SidebarContext';
import Footer from './components/Footer';
import { Inter } from 'next/font/google';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import { ViewLimitProvider } from './context/ViewLimitContext';
import { Suspense } from 'react';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

function RootLayoutContent({ children }) {
  const { darkMode } = useDarkMode();
  const pathname = usePathname();

  // Define which routes should use ClientHome
  const useClientHome = pathname === '/'

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <title>Stash - Interview Experiences</title>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <UserProvider>
          <PremiumProvider>
            <SidebarProvider>
              <DraftExperienceProvider>
                <ActiveMenuProvider>
                  <Sidebar />
                  {useClientHome ? (
                    <Suspense fallback={
                      <div className="flex items-center justify-center h-screen">
                        <div className="animate-pulse h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900"></div>
                        <p className="ml-4">Loading...</p>
                      </div>
                    }>
                      <ClientHome>{children}</ClientHome>
                    </Suspense>
                  ) : (
                    children
                  )}
                  <Footer />
                </ActiveMenuProvider>
              </DraftExperienceProvider>
            </SidebarProvider>
          </PremiumProvider>
        </UserProvider>
      </body>
    </html>
  );
}

export default function RootLayout({ children }) {
  return (
    <DarkModeProvider>
      <ViewLimitProvider>
        <RootLayoutContent>{children}</RootLayoutContent>
      </ViewLimitProvider>
    </DarkModeProvider>
  );
}
