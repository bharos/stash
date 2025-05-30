"use client";

import React from 'react';
import { Excalidraw, exportToCanvas, exportToSvg } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const ExcalidrawWrapper = ({ 
  initialData, 
  onChange, 
  viewModeEnabled, 
  theme, 
  name, 
  UIOptions,
  excalidrawRef 
}) => {
  return (
    <div className="w-full h-full">
      <Excalidraw
        ref={excalidrawRef}
        initialData={initialData}
        onChange={onChange}
        viewModeEnabled={viewModeEnabled}
        theme={theme}
        name={name}
        UIOptions={UIOptions}
      />
    </div>
  );
};

// Export the utility functions as well
export { exportToCanvas, exportToSvg };
export default ExcalidrawWrapper;
