'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../utils/supabaseClient'
import './OAuthSignin.css'

const OAuthSignin = () => {
  const router = useRouter()
  const [session, setSession] = useState(null) // Track session state

  // Initialize Google OAuth (OAuth SignIn using Google)
  const initializeGoogleOAuth = async () => {
    try {
      // Use Supabase's signInWithOAuth method to handle the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`, // Ensure it redirects properly
        }
        // No need for manual token passing, Supabase will handle the OAuth flow
      })

      if (error) throw error
      // If OAuth URL is received, open it in a new browser window/tab
    if (data?.url) {
      console.log('Opening Google OAuth page in a new window', data.url)
      window.open(data.url, '_blank'); // This opens the OAuth page in the default system browser
    }
      console.log('Successfully logged in with Google OAuth')

      // Update session state
      setSession(data.session)
      // Redirect to protected page
      router.push('/')
    } catch (error) {
      console.error('Error logging in with Google OAuth', error)
    }
  }

  useEffect(() => {
    // Fetch session on page load
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session', error)
      } else {
        setSession(data.session) // Update session state if available
      }
    }
    fetchSession() // Initialize session state

    // Listen for changes to authentication state
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session) // Update session state when it changes
    })

    return () => {
      listener?.unsubscribe() // Clean up listener on unmount
    }
  }, [])

  return (
    <>
      {/* Sign-in Button (Only shows if not signed in) */}
      {!session && (
        <button
          className="gsi-material-button fixed top-4 right-4 z-[100] flex items-center justify-center px-6 py-2 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-all hover:bg-blue-600 active:bg-blue-700"
          onClick={initializeGoogleOAuth}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: 'block' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Sign in with Google</span>
          </div>
        </button>
      )}
    </>
  )
}

export default OAuthSignin
