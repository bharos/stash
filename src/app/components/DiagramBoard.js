'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

// Dynamically import ExcalidrawWrapper to avoid SSR issues
const ExcalidrawWrapper = dynamic(
  async () => (await import("./ExcalidrawWrapper")).default,
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

const DiagramBoard = ({ sessionId, isReadOnly = false, onDiagramChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [elements, setElements] = useState([]);
  const [appState, setAppState] = useState({
    viewBackgroundColor: "#ffffff",
    gridSize: null,
    theme: "light",
    collaborators: new Map()
  });


  // Load existing diagram data
  useEffect(() => {
    if (sessionId) {
      loadDiagramData();
    }
  }, [sessionId]);

  // Auto-save diagram data
  useEffect(() => {
    if (elements.length > 0 && !isReadOnly && sessionId) {
      const timer = setTimeout(() => {
        saveDiagramData();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [elements, isReadOnly, sessionId]);

  const loadDiagramData = async () => {
    try {
      const { data, error } = await supabase
        .from('diagram_boards')
        .select('diagram_data')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (data && data.diagram_data?.elements) {
        setElements(data.diagram_data.elements);
        setAppState(prev => ({
          ...prev,
          ...data.diagram_data.appState,
          collaborators: new Map() // Ensure collaborators is always a Map
        }));
      }
    } catch (error) {
      console.error('Error loading diagram:', error);
    }
  };

  const saveDiagramData = async () => {
    if (isReadOnly || !sessionId) return;
    
    try {
      // Prepare appState for serialization (exclude collaborators Map)
      const { collaborators, ...serializableAppState } = appState;
      
      const diagramData = {
        elements,
        appState: serializableAppState,
        timestamp: new Date().toISOString()
      };

      // Get the current highest version for this session
      const { data: existingVersions, error: versionError } = await supabase
        .from('diagram_boards')
        .select('version')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(1);

      if (versionError && versionError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw versionError;
      }

      // Calculate next version number (start from 1 if no existing versions)
      const nextVersion = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version + 1 
        : 1;

      const { error } = await supabase
        .from('diagram_boards')
        .upsert({
          session_id: sessionId,
          diagram_data: diagramData,
          version: nextVersion
        });

      if (error) throw error;
      console.log('Diagram saved successfully with version:', nextVersion);
    } catch (error) {
      console.error('Error saving diagram:', error);
    }
  };

  const handleChange = (newElements, newAppState) => {
    setElements(newElements);
    setAppState(newAppState);
    
    // Notify parent component of diagram changes
    if (onDiagramChange) {
      onDiagramChange(newElements);
    }
  };

  return (
    <div className="relative w-full h-full bg-white excalidraw-container">
      {/* Save Button - positioned to avoid conflict with Excalidraw's UI */}
      {!isReadOnly && (
        <div className="absolute bottom-4 left-4 z-50">
          <button
            onClick={() => saveDiagramData()}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow-md"
          >
            💾 Save
          </button>
        </div>
      )}

      {/* Main Excalidraw Canvas */}
      <div className="w-full h-full overflow-hidden">
        <ExcalidrawWrapper
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

export default DiagramBoard;
