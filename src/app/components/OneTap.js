'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../utils/supabaseClient'
import './one-tap.css'

const OneTap = () => {
  const router = useRouter()
  const [session, setSession] = useState(null) // Track session state

  // Generate nonce to use for Google ID token sign-in
  const generateNonce = async () => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonce)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return [nonce, hashedNonce]
  }

  // Initialize Google One Tap
  const initializeGoogleOneTap = async () => {
    const [nonce, hashedNonce] = await generateNonce()
    console.log('Nonce: ', nonce, hashedNonce)

    // Check if there's already an existing session before initializing the One Tap UI
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session', error)
    }
    if (data.session) {
      setSession(data.session) // Set the session state
      router.push('/') // Redirect to home page if already logged in
      return
    }

    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          console.log('One Tap response: ', response)
          // Send id token returned in response.credential to supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          })

          if (error) throw error
          console.log('Session data: ', data)
          console.log('Successfully logged in with Google One Tap')

          // Update session state
          setSession(data.session)
          // Redirect to protected page
          router.push('/')
        } catch (error) {
          console.error('Error logging in with Google One Tap', error)
        }
      },
      nonce: hashedNonce,
      use_fedcm_for_prompt: true, // With Chrome's removal of third-party cookies, we need to use FedCM instead
    })

    google.accounts.id.prompt() // Display the One Tap UI
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
      {/* Load the Google One Tap SDK script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => console.log('Google One Tap SDK loaded')}
        onError={() => console.error('Failed to load Google One Tap SDK')}
      />

      {/* Sign-in Button (Only shows if not signed in) */}
      {!session && (
        <button
          className="gsi-material-button fixed top-4 right-4 z-[100] flex items-center justify-center px-6 py-2 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-all hover:bg-blue-600 active:bg-blue-700"
          onClick={() => initializeGoogleOneTap()}
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

export default OneTap
