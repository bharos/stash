import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const InvitePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${baseUrl}/invite?ref=newUser`;
  const [copied, setCopied] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  
  // Run on component mount to check URL directly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if URL contains ref=newUser
      const url = new URL(window.location.href);
      const refParam = url.searchParams.get('ref');
      console.log('Direct URL check - ref parameter:', refParam);
      
      if (refParam === 'newUser') {
        console.log('Setting user as invited user from direct URL check');
        setIsInvitedUser(true);
      }
    }
  }, []);

  useEffect(() => {
    // Check if the user came from an invite link
    const refValue = searchParams?.get('ref');
    console.log('Invite link ref parameter:', refValue); // Debug log
    
    if (refValue === 'newUser') {
      console.log('Setting user as invited user'); // Debug log
      setIsInvitedUser(true);
      // We'll show them a welcome message instead of redirecting
    }
  }, [searchParams]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Small debugging component that will only show in development
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div style={{ 
          position: 'fixed', 
          top: '5px', 
          right: '5px', 
          background: '#f0f0f0', 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <p>Debug Info (dev only):</p>
          <p>isInvitedUser: {isInvitedUser ? 'true' : 'false'}</p>
          <p>ref param: {searchParams?.get('ref') || 'none'}</p>
          <p>pathname: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
          <p>full URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <DebugInfo />
      {isInvitedUser ? (
        <div style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2>Welcome to StashDB! 🎉</h2>
          <p>You've been invited to join our community of professionals sharing interview experiences.</p>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p>Get started by:</p>
            <ol style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Creating your account</li>
              <li>Exploring interview experiences</li>
              <li>Sharing your own experiences</li>
            </ol>
          </div>
          
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4F46E5',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '1.5rem',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Get Started
          </button>
        </div>
      ) : (
        <div style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2>Invite your friends 🌟</h2>
          <p>Help us grow this community — invite others to join!</p>

          <label htmlFor="inviteLink"><strong>Your invite link:</strong></label>
          <input
            id="inviteLink"
            value={inviteLink}
            readOnly
            style={{ width: '100%', padding: '0.75rem', margin: '1rem 0', fontSize: '1rem' }}
          />
          <button
            onClick={copyLink}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4F46E5',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            📋 {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <div style={{ marginTop: '1.5rem' }}>
            <p><strong>Share directly:</strong></p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=Hey!%20I%20found%20this%20amazing%20platform%20to%20share%20and%20explore%20interview%20experiences.%20Join%20me%20here:%20${encodeURIComponent(inviteLink)}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#25D366', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}
              >
              WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=Discover%20this%20awesome%20platform%20to%20share%20and%20explore%20interview%20experiences.%20Join%20me%20here:%20${encodeURIComponent(inviteLink)}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#1DA1F2', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}
              >
              Twitter
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitePage;
