// src/components/ui/HoverInfoBox.tsx
import React from 'react';

interface HoverInfoBoxProps {
  children: React.ReactNode;
  infoText: string;
  position?: 'top' | 'bottom' | 'left' | 'right'; // Prop to control position
}

export function HoverInfoBox({ children, infoText, position = 'top' }: HoverInfoBoxProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={`
          absolute z-[9999] px-3 py-1.5 text-sm font-medium text-white bg-gray-900/80 backdrop-blur-sm rounded-md shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none
          whitespace-nowrap
          ${/* Dynamic positioning classes */''}
          ${position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2'}
          ${position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2'}
          ${position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2'}
          ${position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2'}
        `}
      >
        {infoText}
      </div>
    </div>
  );
}