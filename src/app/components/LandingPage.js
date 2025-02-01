'use client';

import Image from 'next/image';

const LandingPage = ({ setActiveMenu }) => {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen text-center p-6">
      {/* Adjusted for more space at the top */}
      <h1 className="text-4xl font-bold mb-4 mt-24">Welcome to Stash – The Ultimate Interview Database! 🚀</h1>
      <p className="text-lg mb-8">
        Post your interview stories, learn from the community, and prepare smarter!
      </p>
      <div className="flex gap-4 mb-12">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={() => setActiveMenu('dashboard')}
        >
          Go to Dashboard
        </button>
        <button
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          onClick={() => setActiveMenu('postExperience')}
        >
          Post an Experience
        </button>
      </div>
      
      {/* Adjusted video container */}
      <div className="relative w-full sm:max-w-2xl md:max-w-2xl lg:max-w-4xl h-64 sm:h-80 md:h-[500px] lg:h-[800px] mb-6 overflow-hidden">
        <video className="object-cover w-full h-full" autoPlay loop muted>
            <source src="/LandingVideo.mp4" type="video/mp4" />
            Your browser does not support the video.
        </video>
      </div>
    </div>
  );
};

export default LandingPage;
