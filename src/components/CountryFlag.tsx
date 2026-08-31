import React from 'react';

interface CountryFlagProps {
  code?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ 
  code = '', 
  className = '',
  size = 'md' 
}) => {
  const normalizedCode = (code || '').trim().toUpperCase();

  const sizeClasses = {
    xs: 'w-4 h-3 rounded-[2px]',
    sm: 'w-5 h-3.5 rounded-[3px]',
    md: 'w-6 h-4 rounded-[3px]',
    lg: 'w-8 h-5.5 rounded-sm',
    xl: 'w-10 h-7 rounded-md'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Render high-precision SVG flags for core countries
  const renderFlagSvg = () => {
    switch (normalizedCode) {
      // Morocco
      case 'MA':
      case 'MOROCCO':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#c1272d" />
            <polygon
              points="450,180 479,271 575,271 497,327 527,419 450,363 373,419 403,327 325,271 421,271"
              fill="none"
              stroke="#006233"
              strokeWidth="24"
              strokeLinejoin="miter"
            />
          </svg>
        );

      // Saudi Arabia
      case 'SA':
      case 'SAUDI ARABIA':
      case 'SAUDI':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#006c35" />
            {/* White Stylized Inscription line */}
            <path
              d="M200 240 Q450 180 700 240 Q450 280 200 240 Z"
              fill="#ffffff"
            />
            <circle cx="340" cy="230" r="14" fill="#006c35" />
            <circle cx="450" cy="225" r="14" fill="#006c35" />
            <circle cx="560" cy="230" r="14" fill="#006c35" />
            {/* White Sword */}
            <path
              d="M240 370h420v14H240z M280 355l-40 22 40 22v-12h380v-20H280z"
              fill="#ffffff"
            />
            <rect x="630" y="345" width="16" height="64" rx="4" fill="#ffffff" />
            <circle cx="680" cy="377" r="14" fill="#ffffff" />
          </svg>
        );

      // Libya
      case 'LY':
      case 'LIBYA':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="150" fill="#e70013" />
            <rect y="150" width="900" height="300" fill="#000000" />
            <rect y="450" width="900" height="150" fill="#239e46" />
            {/* Crescent & Star */}
            <circle cx="450" cy="300" r="75" fill="#ffffff" />
            <circle cx="470" cy="300" r="60" fill="#000000" />
            <polygon
              points="485,300 460,308 470,285 450,298 475,300 465,315"
              fill="#ffffff"
            />
          </svg>
        );

      // UAE
      case 'AE':
      case 'UAE':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#00732f" />
            <rect y="200" width="900" height="200" fill="#ffffff" />
            <rect y="400" width="900" height="200" fill="#000000" />
            <rect width="250" height="600" fill="#ff0000" />
          </svg>
        );

      // Kuwait
      case 'KW':
      case 'KUWAIT':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#007a3d" />
            <rect y="200" width="900" height="200" fill="#ffffff" />
            <rect y="400" width="900" height="200" fill="#ce1126" />
            <polygon points="0,0 300,200 300,400 0,600" fill="#000000" />
          </svg>
        );

      // Qatar
      case 'QA':
      case 'QATAR':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#8d1b3d" />
            <polygon points="0,0 280,0 340,33 280,67 340,100 280,133 340,167 280,200 340,233 280,267 340,300 280,333 340,367 280,400 340,433 280,467 340,500 280,533 340,567 280,600 0,600" fill="#ffffff" />
          </svg>
        );

      // Bahrain
      case 'BH':
      case 'BAHRAIN':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#da291c" />
            <polygon points="0,0 260,0 340,60 260,120 340,180 260,240 340,300 260,360 340,420 260,480 340,540 260,600 0,600" fill="#ffffff" />
          </svg>
        );

      // Oman
      case 'OM':
      case 'OMAN':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#ffffff" />
            <rect y="200" width="900" height="200" fill="#db161b" />
            <rect y="400" width="900" height="200" fill="#008000" />
            <rect width="250" height="600" fill="#db161b" />
            {/* Khanjar emblem representation */}
            <circle cx="125" cy="100" r="30" fill="none" stroke="#ffffff" strokeWidth="8" />
          </svg>
        );

      // Algeria
      case 'DZ':
      case 'ALGERIA':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="450" height="600" fill="#006633" />
            <rect x="450" width="450" height="600" fill="#ffffff" />
            <circle cx="450" cy="300" r="100" fill="#d21034" />
            <circle cx="475" cy="300" r="80" fill="#ffffff" />
            <polygon points="490,300 460,310 470,285 450,298 475,300" fill="#d21034" />
          </svg>
        );

      // Tunisia
      case 'TN':
      case 'TUNISIA':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#e70013" />
            <circle cx="450" cy="300" r="120" fill="#ffffff" />
            <circle cx="465" cy="300" r="90" fill="#e70013" />
            <circle cx="485" cy="300" r="70" fill="#ffffff" />
            <polygon points="495,300 470,310 480,285 460,298 485,300" fill="#e70013" />
          </svg>
        );

      // Egypt
      case 'EG':
      case 'EGYPT':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#c8102e" />
            <rect y="200" width="900" height="200" fill="#ffffff" />
            <rect y="400" width="900" height="200" fill="#000000" />
            <circle cx="450" cy="300" r="35" fill="#c69214" />
          </svg>
        );

      // Jordan
      case 'JO':
      case 'JORDAN':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#000000" />
            <rect y="200" width="900" height="200" fill="#ffffff" />
            <rect y="400" width="900" height="200" fill="#007a3d" />
            <polygon points="0,0 400,300 0,600" fill="#ce1126" />
            <polygon points="140,300 130,285 145,290 140,275 150,290 160,280 152,295 165,300 152,305 160,320 150,310 140,325 145,310 130,315" fill="#ffffff" />
          </svg>
        );

      // Palestine
      case 'PS':
      case 'PALESTINE':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#000000" />
            <rect y="200" width="900" height="200" fill="#ffffff" />
            <rect y="400" width="900" height="200" fill="#007a3d" />
            <polygon points="0,0 350,300 0,600" fill="#e4312b" />
          </svg>
        );

      // France
      case 'FR':
      case 'FRANCE':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="300" height="600" fill="#002654" />
            <rect x="300" width="300" height="600" fill="#ffffff" />
            <rect x="600" width="300" height="600" fill="#ce1126" />
          </svg>
        );

      // Spain
      case 'ES':
      case 'SPAIN':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="150" fill="#aa151b" />
            <rect y="150" width="900" height="300" fill="#f1bf00" />
            <rect y="450" width="900" height="150" fill="#aa151b" />
          </svg>
        );

      // Germany
      case 'DE':
      case 'GERMANY':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="200" fill="#000000" />
            <rect y="200" width="900" height="200" fill="#dd0000" />
            <rect y="400" width="900" height="200" fill="#ffce00" />
          </svg>
        );

      // UK
      case 'GB':
      case 'UK':
      case 'UNITED KINGDOM':
      case 'EN':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#012169" />
            <path d="M0 0 L900 600 M900 0 L0 600" stroke="#ffffff" strokeWidth="100" />
            <path d="M0 0 L900 600 M900 0 L0 600" stroke="#c8102e" strokeWidth="40" />
            <path d="M450 0 V600 M0 300 H900" stroke="#ffffff" strokeWidth="160" />
            <path d="M450 0 V600 M0 300 H900" stroke="#c8102e" strokeWidth="90" />
          </svg>
        );

      // USA
      case 'US':
      case 'USA':
      case 'UNITED STATES':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#ffffff" />
            <g fill="#b22234">
              <rect y="0" width="900" height="46" />
              <rect y="92" width="900" height="46" />
              <rect y="184" width="900" height="46" />
              <rect y="276" width="900" height="46" />
              <rect y="368" width="900" height="46" />
              <rect y="460" width="900" height="46" />
              <rect y="552" width="900" height="48" />
            </g>
            <rect width="360" height="322" fill="#3c3b6e" />
            <circle cx="180" cy="160" r="60" fill="#ffffff" opacity="0.8" />
          </svg>
        );

      // Turkey
      case 'TR':
      case 'TURKEY':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="900" height="600" fill="#e30a17" />
            <circle cx="380" cy="300" r="140" fill="#ffffff" />
            <circle cx="410" cy="300" r="110" fill="#e30a17" />
            <polygon points="500,300 465,312 478,280 450,296 482,300" fill="#ffffff" />
          </svg>
        );

      // Italy
      case 'IT':
      case 'ITALY':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="300" height="600" fill="#009246" />
            <rect x="300" width="300" height="600" fill="#ffffff" />
            <rect x="600" width="300" height="600" fill="#ce2b37" />
          </svg>
        );

      // Canada
      case 'CA':
      case 'CANADA':
        return (
          <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
            <rect width="225" height="600" fill="#ff0000" />
            <rect x="225" width="450" height="600" fill="#ffffff" />
            <rect x="675" width="225" height="600" fill="#ff0000" />
            <polygon points="450,150 470,260 520,240 480,310 520,350 450,320 380,350 420,310 380,240 430,260" fill="#ff0000" />
          </svg>
        );

      // Default fallback: Elegant minimal country badge
      default:
        return (
          <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-[9px] uppercase tracking-wider font-mono shadow-xs">
            {normalizedCode.slice(0, 2) || 'GL'}
          </div>
        );
    }
  };

  return (
    <span 
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden shadow-2xs border border-black/10 select-none ${currentSizeClass} ${className}`}
      title={code}
    >
      {renderFlagSvg()}
    </span>
  );
};
