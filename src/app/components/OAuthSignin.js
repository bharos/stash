'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../utils/supabaseClient'
import './OAuthSignin.css'
import Modal from './Modal'

const OAuthSignin = ({ isModalOpen, setIsModalOpen }) => {
  const router = useRouter()
  const [session, setSession] = useState(null) // Track session state
  const [email, setEmail] = useState('') // For Magic Link email input

  // Initialize Google OAuth (OAuth SignIn using Google)
  const initializeGoogleOAuth = async () => {
    try {
      // Use Supabase's signInWithOAuth method to handle the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        // No need for manual token passing, Supabase will handle the OAuth flow
      })

      if (error) throw error
      console.log('Successfully logged in with Google OAuth')

      // Update session state
      setSession(data.session)
      // Redirect to protected page
      router.push('/')
    } catch (error) {
      console.error('Error logging in with Google OAuth', error)
    }
  }

   // Magic Link Sign-In (Email-based login)
   const handleMagicLinkLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      console.log('Magic link sent to:', email)

      // Optionally, show some confirmation message to the user
      alert('Check your email for the magic link!')
    } catch (error) {
      console.error('Error sending magic link', error)
      alert('Failed to send magic link. Please try again.')
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
  }, [])

  return (
    <>
     {/* Modal with sign-in options */}
     <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fade-in">
          {/* Close Button */}
          <button
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>

          {/* Modal Header */}
          <h2 className="text-xl font-semibold text-center mb-4">Sign In</h2>

          {/* Google OAuth Button */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg shadow-md hover:bg-blue-600 transition active:scale-95"
            onClick={initializeGoogleOAuth}
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="mx-2 text-gray-500 text-sm">or</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Magic Link Section */}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            className="w-full bg-gray-800 text-white py-3 mt-3 rounded-lg shadow-md hover:bg-gray-900 transition active:scale-95"
            onClick={handleMagicLinkLogin}
          >
            Send Magic Link
          </button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default OAuthSignin
