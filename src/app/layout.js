import './globals.css';
import OneTap from './components/OneTap';
import { UserProvider } from './context/UserContext';  // Import the UserProvider
import ClientHome from './components/ClientHome';  // Import ClientHome

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
          <OneTap />  {/* This triggers One Tap when the page loads */}
          <ClientHome>  {/* Wrap the children with ClientHome */}
            {children}  {/* Content from individual pages */}
          </ClientHome>
        </UserProvider>
      </body>
    </html>
  );
}
