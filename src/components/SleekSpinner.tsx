import React from 'react';

interface SleekSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'dark' | 'emerald' | 'amber' | 'gold';
  className?: string;
  text?: string;
  textPosition?: 'bottom' | 'right';
}

const sizeConfig = {
  xs: {
    px: 16,
    stroke: 2.2,
    textSize: 'text-[10px]',
    gap: 'gap-1.5',
    container: 'w-4 h-4',
  },
  sm: {
    px: 20,
    stroke: 2.4,
    textSize: 'text-xs',
    gap: 'gap-2',
    container: 'w-5 h-5',
  },
  md: {
    px: 28,
    stroke: 2.6,
    textSize: 'text-xs font-semibold',
    gap: 'gap-2.5',
    container: 'w-7 h-7',
  },
  lg: {
    px: 44,
    stroke: 3.2,
    textSize: 'text-sm font-bold',
    gap: 'gap-3',
    container: 'w-11 h-11',
  },
  xl: {
    px: 60,
    stroke: 3.8,
    textSize: 'text-base font-extrabold',
    gap: 'gap-3.5',
    container: 'w-15 h-15',
  },
};

const variantColors = {
  primary: {
    primary: '#2563eb',
    secondary: '#38bdf8',
    track: 'rgba(37, 99, 235, 0.15)',
    glow: 'rgba(37, 99, 235, 0.35)',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
  },
  white: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    track: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.4)',
    text: 'text-white',
    dot: 'bg-white',
  },
  dark: {
    primary: '#f4f4f5',
    secondary: '#a1a1aa',
    track: 'rgba(255, 255, 255, 0.12)',
    glow: 'rgba(255, 255, 255, 0.2)',
    text: 'text-stone-300',
    dot: 'bg-stone-300',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    track: 'rgba(16, 185, 129, 0.15)',
    glow: 'rgba(16, 185, 129, 0.35)',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    track: 'rgba(245, 158, 11, 0.15)',
    glow: 'rgba(245, 158, 11, 0.35)',
    text: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  gold: {
    primary: '#eab308',
    secondary: '#fef08a',
    track: 'rgba(234, 179, 8, 0.15)',
    glow: 'rgba(234, 179, 8, 0.35)',
    text: 'text-yellow-500',
    dot: 'bg-yellow-400',
  },
};

export default function SleekSpinner({
  size = 'md',
  variant = 'primary',
  className = '',
  text,
  textPosition = 'bottom',
}: SleekSpinnerProps) {
  const cfg = sizeConfig[size] || sizeConfig.md;
  const col = variantColors[variant] || variantColors.primary;
  const isVertical = textPosition === 'bottom';

  const radius = (cfg.px - cfg.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.7; // 70% visible smooth sweep arc

  const gradientId = `spinner-grad-${variant}-${size}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${cfg.gap} ${className}`}
    >
      <div className={`relative flex items-center justify-center ${cfg.container} shrink-0`}>
        <svg
          className="w-full h-full animate-spin"
          viewBox={`0 0 ${cfg.px} ${cfg.px}`}
          style={{
            animationDuration: '0.85s',
            animationTimingFunction: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
            filter: `drop-shadow(0 0 ${cfg.px > 30 ? '6px' : '3px'} ${col.glow})`,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={col.secondary} stopOpacity="1" />
              <stop offset="60%" stopColor={col.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={col.primary} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subdued base background track */}
          <circle
            cx={cfg.px / 2}
            cy={cfg.px / 2}
            r={radius}
            fill="none"
            stroke={col.track}
            strokeWidth={cfg.stroke}
          />

          {/* Main sweeping animated harmonic arc */}
          <circle
            cx={cfg.px / 2}
            cy={cfg.px / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={cfg.stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Micro harmonic center particle for larger sizes */}
        {(size === 'lg' || size === 'xl') && (
          <div
            className={`absolute rounded-full w-1.5 h-1.5 ${col.dot} animate-pulse shadow-xs`}
            style={{ animationDuration: '1.2s' }}
          />
        )}
      </div>

      {text && (
        <span
          className={`${cfg.textSize} ${col.text} tracking-wide font-medium flex items-center gap-1.5 animate-pulse`}
        >
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * Modern High-End Luxury Full Section / Card Loading State
 */
export function SleekLoadingBlock({
  title = 'جاري التحميل...',
  subtitle = 'يرجى الانتظار بينما نقوم بمزامنة البيانات',
  size = 'lg',
  variant = 'primary',
  className = '',
}: {
  title?: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'emerald' | 'dark';
  className?: string;
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl animate-fadeIn ${className}`}
    >
      <SleekSpinner size={size} variant={variant} />
      {title && (
        <h4 className="mt-4 text-sm sm:text-base font-extrabold text-stone-100 tracking-tight">
          {title}
        </h4>
      )}
      {subtitle && (
        <p className="mt-1.5 text-xs text-stone-400 max-w-sm font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
