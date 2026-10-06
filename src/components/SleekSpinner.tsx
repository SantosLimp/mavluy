import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SleekSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'dark' | 'emerald' | 'amber' | 'gold';
  className?: string;
  text?: string;
  textPosition?: 'bottom' | 'right';
}

const sizeConfig = {
  xs: {
    iconSize: 'w-3.5 h-3.5',
    stroke: 2.2,
    textSize: 'text-[10px]',
    gap: 'gap-1.5',
  },
  sm: {
    iconSize: 'w-4 h-4',
    stroke: 2.2,
    textSize: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    iconSize: 'w-5 h-5',
    stroke: 2.2,
    textSize: 'text-xs font-semibold',
    gap: 'gap-2',
  },
  lg: {
    iconSize: 'w-7 h-7',
    stroke: 2.2,
    textSize: 'text-sm font-bold',
    gap: 'gap-2.5',
  },
  xl: {
    iconSize: 'w-10 h-10',
    stroke: 2.2,
    textSize: 'text-base font-extrabold',
    gap: 'gap-3',
  },
};

const variantColors = {
  primary: {
    icon: 'text-[#2563eb]',
    text: 'text-blue-600',
  },
  white: {
    icon: 'text-white',
    text: 'text-white',
  },
  dark: {
    icon: 'text-stone-300',
    text: 'text-stone-300',
  },
  emerald: {
    icon: 'text-emerald-500',
    text: 'text-emerald-500',
  },
  amber: {
    icon: 'text-amber-500',
    text: 'text-amber-500',
  },
  gold: {
    icon: 'text-yellow-500',
    text: 'text-yellow-500',
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

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${cfg.gap} ${className}`}
    >
      <RefreshCw
        strokeWidth={cfg.stroke}
        className={`${cfg.iconSize} ${col.icon} animate-spin shrink-0`}
        style={{ animationDuration: '0.8s' }}
      />

      {text && (
        <span
          className={`${cfg.textSize} ${col.text} tracking-wide font-medium flex items-center gap-1.5`}
        >
          {text}
        </span>
      )}
    </div>
  );
}

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
