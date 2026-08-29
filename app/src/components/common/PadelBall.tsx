import React from 'react';

interface PadelBallProps {
  size?: number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

export const PadelBall: React.FC<PadelBallProps> = ({
  size = 28,
  className = '',
  glow = true,
  animated = false,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${
        animated ? 'animate-ball-float' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-[6px] opacity-60 pointer-events-none"
          style={{ backgroundColor: '#C7F000' }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-sm"
      >
        {/* Ball Main Sphere */}
        <circle cx="50" cy="50" r="48" fill="#D6F800" stroke="#B0DC00" strokeWidth="2" />
        
        {/* Sphere Shading Gradient */}
        <radialGradient id={`ballGlow-${size}`} cx="38%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#D4F800" stopOpacity="1" />
          <stop offset="85%" stopColor="#A4D400" stopOpacity="1" />
          <stop offset="100%" stopColor="#7EAA00" stopOpacity="1" />
        </radialGradient>
        <circle cx="50" cy="50" r="48" fill={`url(#ballGlow-${size})`} />

        {/* Padel / Tennis Ball Curved Seams */}
        <path
          d="M 12,30 C 35,42 65,42 88,30"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 0.5"
          opacity="0.9"
        />
        <path
          d="M 12,70 C 35,58 65,58 88,70"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 0.5"
          opacity="0.9"
        />

        {/* Felt Texture dots */}
        <circle cx="36" cy="22" r="1.5" fill="#B0DC00" opacity="0.4" />
        <circle cx="64" cy="22" r="1.5" fill="#B0DC00" opacity="0.4" />
        <circle cx="50" cy="78" r="1.5" fill="#B0DC00" opacity="0.4" />
        <circle cx="28" cy="50" r="1.5" fill="#B0DC00" opacity="0.4" />
        <circle cx="72" cy="50" r="1.5" fill="#B0DC00" opacity="0.4" />
      </svg>
    </div>
  );
};
