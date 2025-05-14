'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PendingVerificationPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verification in Progress</h1>
          
          <div className="my-6 flex justify-center">
            <div className="animate-pulse h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your donation verification has been submitted and is currently pending review.
            You will receive premium access as soon as your donation is verified.
          </p>
          
          {reference && (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-6">
              <p className="text-sm font-medium">Reference Code</p>
              <p className="font-mono">{reference}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This typically takes less than 24 hours. If you have any questions,
            please contact our support team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Return Home
            </Link>
            <Link href="/contactUs.html" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
