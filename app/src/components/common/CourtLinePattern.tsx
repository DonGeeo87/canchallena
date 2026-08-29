import React from 'react';

interface CourtLinePatternProps {
  className?: string;
  opacity?: number;
}

export const CourtLinePattern: React.FC<CourtLinePatternProps> = ({
  className = '',
  opacity = 0.15,
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Court Boundary */}
        <rect x="40" y="20" width="720" height="360" stroke="#7C3AED" strokeWidth="2.5" />
        
        {/* Service Lines */}
        <line x1="220" y1="20" x2="220" y2="380" stroke="#7C3AED" strokeWidth="2" />
        <line x1="580" y1="20" x2="580" y2="380" stroke="#7C3AED" strokeWidth="2" />
        
        {/* Center Service Line (T-Line) */}
        <line x1="220" y1="200" x2="580" y2="200" stroke="#7C3AED" strokeWidth="2" />
        
        {/* Center Net */}
        <line x1="400" y1="10" x2="400" y2="390" stroke="#101014" strokeWidth="3.5" strokeDasharray="4 4" />
        
        {/* Glass Wall Indicators */}
        <line x1="40" y1="20" x2="40" y2="380" stroke="#C7F000" strokeWidth="4" opacity="0.8" />
        <line x1="760" y1="20" x2="760" y2="380" stroke="#C7F000" strokeWidth="4" opacity="0.8" />
      </svg>
    </div>
  );
};
