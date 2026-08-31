import React from 'react';
import { StoreConfig } from '../types';

interface StoreLogoProps {
  config?: Partial<StoreConfig>;
  variant?: 'light' | 'dark' | 'hero' | 'minimal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  showTagline?: boolean;
  className?: string;
}

export const StoreLogo: React.FC<StoreLogoProps> = ({
  config,
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = ''
}) => {
  const logoType = config?.logoType || (config?.logoImage || config?.logo ? 'image' : 'text');
  const logoImgSrc = config?.logoImage || config?.logo || '';
  
  const prefix = config?.logoTextPrefix !== undefined ? config.logoTextPrefix : 'Mav';
  const accent = config?.logoTextAccent !== undefined ? config.logoTextAccent : 'luy';
  const tagline = config?.logoTagline !== undefined ? config.logoTagline : 'Refined Living & Shopping';
  const fontStyle = config?.logoFontStyle || 'italic-luxury';
  const primaryBrand = config?.themePrimaryColor || config?.logoAccentColor || '#2563eb';
  const accentColor = config?.logoAccentColor || primaryBrand;

  // Font class mapping
  let fontClass = 'font-logo italic';
  if (fontStyle === 'serif') {
    fontClass = 'font-serif not-italic';
  } else if (fontStyle === 'modern-sans') {
    fontClass = 'font-sans font-black not-italic uppercase tracking-widest';
  } else if (fontStyle === 'display-bold') {
    fontClass = 'font-mono font-black not-italic tracking-wider';
  }

  // Size mapping for text
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
    '2xl': 'text-5xl sm:text-6xl',
    hero: 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl'
  }[size] || 'text-2xl sm:text-3xl';

  // Base prefix color depending on light vs dark / hero background
  const prefixColor = variant === 'dark' || variant === 'hero' 
    ? 'text-white' 
    : 'text-stone-900';

  if (logoType === 'image' && logoImgSrc) {
    const defaultHeight = size === 'xs' ? 24 : size === 'sm' ? 30 : size === 'md' ? 36 : size === 'lg' ? 48 : size === 'hero' ? 80 : 40;
    const height = config?.logoImageHeight || defaultHeight;

    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <img
          src={logoImgSrc}
          alt={config?.storeName || 'Store Logo'}
          style={{ height: `${height}px`, maxHeight: '100%', objectFit: 'contain' }}
          className="transition-transform duration-300 select-none max-w-full"
        />
        {showTagline && tagline && (
          <p className={`mt-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase font-mono ${variant === 'dark' || variant === 'hero' ? 'text-stone-300' : 'text-stone-500'}`}>
            {tagline}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <span className={`${fontClass} ${sizeClasses} tracking-normal leading-none transition-colors duration-300`}>
        <span className={`${prefixColor} transition-colors`}>{prefix}</span>
        <span style={{ color: accentColor }}>{accent}</span>
      </span>

      {showTagline && tagline && (
        <p className={`mt-1.5 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase font-mono ${variant === 'dark' || variant === 'hero' ? 'text-stone-300' : 'text-stone-500'}`}>
          {tagline}
        </p>
      )}
    </div>
  );
};
