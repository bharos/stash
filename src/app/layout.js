'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { UserProvider } from './context/UserContext';
import ClientHome from './components/ClientHome';
import { ActiveMenuProvider } from './context/ActiveMenuContext';
import { DraftExperienceProvider } from './context/DraftExperience';
import { FlagsProvider } from './context/flagContext';
import { SidebarProvider } from './context/SidebarContext';
import Footer from './components/Footer';
import { Inter } from 'next/font/google';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
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
          <SidebarProvider>
          <DraftExperienceProvider>
            <ActiveMenuProvider>
              <FlagsProvider>
                <Sidebar />
                {useClientHome ? (
                  <ClientHome>{children}</ClientHome>
                ) : (
                  children
                )}
                <Footer />
              </FlagsProvider>
            </ActiveMenuProvider>
          </DraftExperienceProvider>
        </SidebarProvider>
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
