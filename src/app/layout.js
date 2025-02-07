import './globals.css';
import OAuthSignin from './components/OAuthSignin';
import { UserProvider } from './context/UserContext';  // Import the UserProvider
import ClientHome from './components/ClientHome';  // Import ClientHome
import { ActiveMenuProvider } from './context/ActiveMenuContext';  // Import ActiveMenuProvider
import { DraftExperienceProvider } from './context/DraftExperience';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Stash - Interview Experiences</title>
        {/* Import Material Icons font */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <UserProvider>
          <DraftExperienceProvider>
          <ActiveMenuProvider> {/* Wrap UserProvider with ActiveMenuProvider */}
            <OAuthSignin />  {/* This triggers OAuth signin when the page loads */}
            <ClientHome>  {/* Wrap the children with ClientHome */}
              {children}  {/* Content from individual pages */}
            </ClientHome>
          </ActiveMenuProvider>
          </DraftExperienceProvider>
        </UserProvider>
      </body>
    </html>
  );
}
