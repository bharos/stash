import './globals.css';
import OneTap from './components/OneTap';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Stash - Interview Experiences</title>
        {/* Import Material Icons font */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <OneTap />  {/* This triggers One Tap when the page loads */}
        {children}
      </body>
    </html>
  );
}
