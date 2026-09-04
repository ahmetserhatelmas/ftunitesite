import React from 'react';
import { Team } from '../types';

interface FootballJerseyProps {
  number: number | string;
  team?: Partial<Team>;
  primaryColor?: string;
  secondaryColor?: string;
  teamLogo?: string;
  isGoalkeeper?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showNumber?: boolean;
}

export const FootballJersey: React.FC<FootballJerseyProps> = ({
  number,
  team,
  primaryColor: propPrimaryColor,
  secondaryColor: propSecondaryColor,
  teamLogo: propTeamLogo,
  isGoalkeeper = false,
  size = 'md',
  className = '',
  showNumber = true,
}) => {
  // Goalkeeper colors: standard stylish goalkeeper palette or inverted team colors
  const primaryColor = isGoalkeeper
    ? '#10b981'
    : propPrimaryColor || team?.primaryColor || '#059669';
  const secondaryColor = isGoalkeeper
    ? '#064e3b'
    : propSecondaryColor || team?.secondaryColor || '#047857';
  const collarColor = isGoalkeeper
    ? '#34d399'
    : (team?.secondaryColor || propSecondaryColor || '#ffffff');
  
  // Decide text number color based on background luminance
  const isLightJersey =
    primaryColor.toLowerCase() === '#ffffff' ||
    primaryColor.toLowerCase() === '#fde047' ||
    primaryColor.toLowerCase() === '#fbbf24';
  const numberColor = isLightJersey ? '#0f172a' : '#ffffff';

  // Sizing definitions
  const sizeMap = {
    xs: { width: 34, height: 38, numSize: 'text-[11px]' },
    sm: { width: 42, height: 46, numSize: 'text-xs' },
    md: { width: 50, height: 56, numSize: 'text-sm' },
    lg: { width: 62, height: 68, numSize: 'text-base' },
    xl: { width: 76, height: 84, numSize: 'text-lg' },
  };

  const { width, height, numSize } = sizeMap[size] || sizeMap.md;

  // Unique gradient ID per team to avoid collisions
  const teamId = team?.id || 't';
  const gradId = `jersey-grad-${teamId}-${isGoalkeeper ? 'gk' : 'field'}-${Math.abs(Number(number) || 1)}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center filter drop-shadow-md select-none transition-transform ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 100 110"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main 3D Shading Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondaryColor} />
            <stop offset="35%" stopColor={primaryColor} />
            <stop offset="70%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Torso lighting highlight */}
          <linearGradient id={`${gradId}-light`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          {/* Sleeve 3D shadow */}
          <linearGradient id={`${gradId}-sleeve`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* --- Jersey Outline & Body --- */}
        {/* Left Sleeve */}
        <path
          d="M 28 20 L 4 36 C 2 37.5 1 41 3 44 L 14 56 C 16 58.5 19.5 59 22 57 L 30 46 Z"
          fill={`url(#${gradId})`}
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Left Sleeve Cuff (Secondary Color Stripe) */}
        <path
          d="M 5 37 L 14 56 C 16 58.5 19.5 59 22 57 L 18 48 Z"
          fill={collarColor}
          opacity="0.85"
        />

        {/* Right Sleeve */}
        <path
          d="M 72 20 L 96 36 C 98 37.5 99 41 97 44 L 86 56 C 84 58.5 80.5 59 78 57 L 70 46 Z"
          fill={`url(#${gradId})`}
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Right Sleeve Cuff */}
        <path
          d="M 95 37 L 86 56 C 84 58.5 80.5 59 78 57 L 82 48 Z"
          fill={collarColor}
          opacity="0.85"
        />

        {/* Main Torso / Shirt */}
        <path
          d="M 28 20 
             C 32 18, 40 18, 50 25 
             C 60 18, 68 18, 72 20 
             L 74 48 
             L 76 96 
             C 76 99, 74 102, 70 102 
             L 30 102 
             C 26 102, 24 99, 24 96 
             L 26 48 
             Z"
          fill={`url(#${gradId})`}
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Vertical stripes / subtle team styling for multi-tone jerseys */}
        <rect
          x="44"
          y="24"
          width="12"
          height="78"
          fill={secondaryColor}
          opacity="0.25"
        />

        {/* Torso 3D Lighting Overlay */}
        <path
          d="M 28 20 
             C 32 18, 40 18, 50 25 
             C 60 18, 68 18, 72 20 
             L 74 48 
             L 76 96 
             C 76 99, 74 102, 70 102 
             L 30 102 
             C 26 102, 24 99, 24 96 
             L 26 48 
             Z"
          fill={`url(#${gradId}-light)`}
          pointerEvents="none"
        />

        {/* Collar (V-neck / Crew) */}
        <path
          d="M 37 19 C 43 28, 57 28, 63 19 C 57 24, 43 24, 37 19 Z"
          fill={collarColor}
          stroke={primaryColor}
          strokeWidth="0.8"
        />
        <circle cx="50" cy="22" r="3.5" fill={collarColor} />

        {/* Team mini emblem / crest badge on left chest */}
        <circle
          cx="38"
          cy="36"
          r="4.5"
          fill="#ffffff"
          stroke={secondaryColor}
          strokeWidth="0.8"
          opacity="0.9"
        />
        <text
          x="38"
          y="38.5"
          fontSize="4.5"
          fontWeight="900"
          textAnchor="middle"
          fill={primaryColor}
        >
          ★
        </text>

        {/* League sponsor / brand tick on right chest */}
        <path
          d="M 59 34 L 62 38 L 66 33"
          stroke={collarColor}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Jersey Number Centered in Middle of Shirt */}
      {showNumber && (
        <span
          className={`absolute font-mono font-black tracking-tighter drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] select-none ${numSize}`}
          style={{
            color: numberColor,
            top: '52%',
            transform: 'translateY(-50%)',
          }}
        >
          {number}
        </span>
      )}
    </div>
  );
};
