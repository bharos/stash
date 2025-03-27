import './globals.css';
import OAuthSignin from './components/OAuthSignin';
import { UserProvider } from './context/UserContext';
import ClientHome from './components/ClientHome';
import { ActiveMenuProvider } from './context/ActiveMenuContext';
import { DraftExperienceProvider } from './context/DraftExperience';
import Footer from './components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Stash - Interview Experiences</title>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <UserProvider>
          <DraftExperienceProvider>
            <ActiveMenuProvider>
              <OAuthSignin />
              <ClientHome>
                {children}
              </ClientHome>
              <Footer />
            </ActiveMenuProvider>
          </DraftExperienceProvider>
        </UserProvider>
      </body>
    </html>
  );
}
