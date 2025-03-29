import './globals.css';
import { UserProvider } from './context/UserContext';
import ClientHome from './components/ClientHome';
import { ActiveMenuProvider } from './context/ActiveMenuContext';
import { DraftExperienceProvider } from './context/DraftExperience';
import { FlagsProvider } from './context/flagContext';
import Footer from './components/Footer';
import { Inter } from 'next/font/google';
import { DarkModeProvider } from './context/DarkModeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Stash - Interview Database',
  description: 'Share and learn from interview experiences',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Stash - Interview Experiences</title>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <DarkModeProvider>
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
        </DarkModeProvider>
      </body>
    </html>
  );
}
