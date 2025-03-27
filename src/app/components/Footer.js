import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <nav style={styles.nav}>
        <Link href="/privacyPolicy.html" style={styles.link}>
          Privacy Policy
        </Link>
        <span style={styles.separator}>|</span>
        <Link href="/contactUs.html" style={styles.link}>
          Contact Us
        </Link>
      </nav>
      <p style={styles.copyright}>
        © {new Date().getFullYear()} Stash. All rights reserved.
      </p>
    </footer>
  );
}

// Simple styles for the footer
const styles = {
  footer: {
    textAlign: 'center',
    padding: '20px',
    marginTop: '40px',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  nav: {
    marginBottom: '8px',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    margin: '0 10px',
  },
  separator: {
    color: '#666',
  },
  copyright: {
    fontSize: '12px',
    color: '#777',
  },
};
