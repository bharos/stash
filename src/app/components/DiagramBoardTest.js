'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

// Simple test wrapper for Excalidraw
const ExcalidrawTest = dynamic(
  async () => {
    const module = await import('@excalidraw/excalidraw');
    return { 
      default: ({ excalidrawRef, ...props }) => (
        <div className="w-full h-full">
          <module.Excalidraw ref={excalidrawRef} {...props} />
        </div>
      )
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading diagram editor...</div>
      </div>
    )
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DiagramBoardTest = ({ sessionId, isReadOnly = false, onDiagramChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [elements, setElements] = useState([]);
  const [appState, setAppState] = useState({
    viewBackgroundColor: "#ffffff",
    gridSize: null,
    theme: "light"
  });

  const handleChange = (newElements, newAppState) => {
    setElements(newElements);
    setAppState(newAppState);
    
    if (onDiagramChange) {
      onDiagramChange(newElements);
    }
  };

  return (
    <div className="relative w-full h-full bg-white">
      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow-md">
            Save
          </button>
          <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 shadow-md">
            Export PNG
          </button>
        </div>
      )}

      {/* Main Excalidraw Canvas */}
      <div className="w-full h-full">
        <ExcalidrawTest
          excalidrawRef={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements,
            appState
          }}
          onChange={handleChange}
          viewModeEnabled={isReadOnly}
          theme="light"
          name="System Design Interview"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false
            },
            tools: {
              image: false
            }
          }}
        />
      </div>
    </div>
  );
};

export default DiagramBoardTest;
