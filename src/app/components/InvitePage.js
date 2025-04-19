import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams

const InvitePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Access query parameters
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''; // Dynamically derive base URL
  const inviteLink = `${baseUrl}/invite?ref=newUser`; // Use derived base URL
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Redirect if the query parameter `ref=newUser` is present
    if (searchParams.get('ref') === 'newUser') {
      router.push('/');
    }
  }, [searchParams, router]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
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
    </div>
  );
};

export default InvitePage;
