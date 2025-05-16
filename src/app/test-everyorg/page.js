'use client';

import React, { useState } from 'react';

export default function TestEveryOrgUrls() {
  const [nonprofitId, setNonprofitId] = useState('direct-relief');
  const [amount, setAmount] = useState(10);
  const [useStaging, setUseStaging] = useState(true);
  
  const generateUrl = () => {
    const domain = useStaging ? 'staging.every.org' : 'www.every.org';
    return `https://${domain}/${nonprofitId}#/donate/card?amount=${amount}&frequency=ONCE`;
  };
  
  const handleOpenUrl = () => {
    const url = generateUrl();
    window.open(url, '_blank');
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Every.org URLs</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Settings</h2>
        
        <div className="mb-4">
          <label className="block mb-1">Nonprofit ID:</label>
          <input
            type="text"
            value={nonprofitId}
            onChange={(e) => setNonprofitId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Amount ($):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            min="1"
          />
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useStaging}
              onChange={(e) => setUseStaging(e.target.checked)}
              className="mr-2"
            />
            Use Staging Environment
          </label>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Generated URL:</h2>
        <div className="bg-white p-2 rounded border overflow-x-auto">
          <code>{generateUrl()}</code>
        </div>
      </div>
      
      <button
        onClick={handleOpenUrl}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open URL in New Tab
      </button>
      
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Known Working Nonprofit IDs:</h2>
        <ul className="list-disc pl-5">
          <li>direct-relief</li>
          <li>wildlife-conservation-network</li>
          <li>khan-academy</li>
          <li>givedirectly</li>
          <li>doctors-without-borders-usa</li>
        </ul>
      </div>
    </div>
  );
}
