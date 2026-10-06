import React from 'react';
import { StoreConfig } from '../types';

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.32V8.75a8.16 8.16 0 0 0 4.91 1.62V6.92a4.85 4.85 0 0 1-1-.23z"/>
  </svg>
);

export const WhatsAppSocialIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export interface FooterSocialButtonsProps {
  config: StoreConfig;
  lang?: 'ar' | 'en' | string;
  isBgDark?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'pill' | 'expanded';
  showLabels?: boolean;
  primaryColor?: string;
}

export const FooterSocialButtons: React.FC<FooterSocialButtonsProps> = ({
  config,
  lang = 'ar',
  isBgDark = false,
  className = "",
  size = 'sm',
  showLabels = false
}) => {
  const isAr = lang === 'ar';

  const resolveSocialUrl = (rawUrl: string | undefined, genericHosts: string[], defaultUrl: string) => {
    const trimmed = rawUrl?.trim();
    if (!trimmed) return defaultUrl;
    const normalized = trimmed.replace(/\/+$/, '').toLowerCase();
    if (genericHosts.includes(normalized)) return defaultUrl;
    return trimmed;
  };

  const socialLinks = [
    {
      id: 'tiktok',
      name: isAr ? 'تيك توك' : 'TikTok',
      url: resolveSocialUrl(config.tiktokUrl, ['https://tiktok.com', 'https://www.tiktok.com', 'http://tiktok.com', 'http://www.tiktok.com'], 'https://www.tiktok.com/@mavluy.store'),
      icon: TikTokIcon,
      // Platform color in idle state: deep black in light mode, white in dark mode
      iconColor: isBgDark ? '#FFFFFF' : '#000000',
      // Full circle platform style on hover
      bgClass: 'bg-black',
      shadowClass: 'shadow-[0_4px_14px_rgba(0,0,0,0.5)]'
    },
    {
      id: 'facebook',
      name: isAr ? 'فيسبوك' : 'Facebook',
      url: resolveSocialUrl(config.facebookUrl, ['https://facebook.com', 'https://www.facebook.com', 'http://facebook.com', 'http://www.facebook.com'], 'https://www.facebook.com/mavluy'),
      icon: FacebookIcon,
      // Platform color in idle state
      iconColor: '#1877F2',
      // Full circle platform style on hover
      bgClass: 'bg-[#1877F2]',
      shadowClass: 'shadow-[0_4px_14px_rgba(24,119,242,0.45)]'
    },
    {
      id: 'instagram',
      name: isAr ? 'إنستغرام' : 'Instagram',
      url: resolveSocialUrl(config.instagramUrl, ['https://instagram.com', 'https://www.instagram.com', 'http://instagram.com', 'http://www.instagram.com'], 'https://www.instagram.com/mavluy.store/'),
      icon: InstagramIcon,
      // Platform color in idle state
      iconColor: '#E1306C',
      // Full circle platform style on hover
      bgClass: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      shadowClass: 'shadow-[0_4px_14px_rgba(220,39,67,0.45)]'
    }
  ];

  // Refined compact sizes:
  // xs: 28px
  // sm: 32px (sleek, standard compact footer icon size)
  // md: 38px
  // lg: 44px
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8 sm:w-8.5 sm:h-8.5',
    md: 'w-9.5 h-9.5 sm:w-10 sm:h-10',
    lg: 'w-11 h-11 sm:w-12 sm:h-12'
  }[size];

  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5 sm:w-5 sm:h-5',
    lg: 'w-5.5 h-5.5 sm:w-6 sm:h-6'
  }[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      {socialLinks.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
            className={`group relative ${sizeClasses} rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ease-out hover:scale-110 active:scale-95 overflow-hidden ${
              isBgDark
                ? 'bg-white/5 border border-white/10'
                : 'bg-stone-100 border border-stone-200/90'
            }`}
          >
            {/* Full Platform Background on Hover (Smooth Fade-in) */}
            <span
              className={`absolute inset-0 rounded-full transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 ${item.bgClass} ${item.shadowClass}`}
            />

            {/* Inner icon: platform brand color in normal state, turns white on hover */}
            <span
              style={{ color: item.iconColor }}
              className="relative z-10 flex items-center justify-center transition-colors duration-300 group-hover:!text-white"
            >
              <Icon className={`${iconSizeClasses} transition-transform duration-300 group-hover:scale-105`} />
            </span>

            {/* Optional visible text label beside if explicitly requested */}
            {showLabels && (
              <span className="sr-only">
                {item.name}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
};
