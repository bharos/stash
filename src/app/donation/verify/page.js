'use client';

import { useSearchParams } from 'next/navigation';
import DonationVerification from '../../components/DonationVerification';
import { Suspense } from 'react';

function VerifyDonationContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  
  if (!reference) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Missing Reference</h2>
          <p className="mt-2">No donation reference provided. Please try again or contact support.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Verify Your Donation</h1>
      
      <DonationVerification reference={reference} />
      
      <div className="mt-8 max-w-md mx-auto p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
        <h3 className="text-lg font-medium mb-3">How to Find Your Donation ID</h3>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Check your email for a receipt from Every.org</li>
          <li>Look for a "Donation ID" or "Transaction ID" in the receipt</li>
          <li>Enter that ID and the exact amount you donated</li>
          <li>We'll verify your donation and grant premium access automatically</li>
        </ol>
        
        <div className="mt-4 text-sm">
          <p>Having trouble? <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact support</a></p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyDonationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8">Verify Your Donation</h1>
        <div className="animate-pulse flex justify-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900"></div>
        </div>
        <p className="mt-4">Loading verification form...</p>
      </div>
    }>
      <VerifyDonationContent />
    </Suspense>
  );
}
