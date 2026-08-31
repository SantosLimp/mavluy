import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TopLoadingBarProps {
  isLoading: boolean;
  progress?: number; // Optional 0 - 100
  color?: 'primary' | 'emerald' | 'amber' | 'indigo';
  customColor?: string;
  className?: string;
  position?: 'fixed-top' | 'relative' | 'under-header';
}

const colorMap = {
  primary: {
    gradient: 'from-[#2563eb] via-[#38bdf8] to-[#60a5fa]',
    glow: 'shadow-[0_0_12px_#38bdf8,0_0_20px_#2563eb]',
    headColor: 'bg-white',
    headGlow: 'shadow-[0_0_10px_#ffffff,0_0_18px_#38bdf8]',
  },
  emerald: {
    gradient: 'from-emerald-600 via-emerald-400 to-teal-300',
    glow: 'shadow-[0_0_12px_#34d399,0_0_20px_#059669]',
    headColor: 'bg-white',
    headGlow: 'shadow-[0_0_10px_#ffffff,0_0_18px_#34d399]',
  },
  amber: {
    gradient: 'from-amber-600 via-amber-400 to-yellow-300',
    glow: 'shadow-[0_0_12px_#fbbf24,0_0_20px_#d97706]',
    headColor: 'bg-white',
    headGlow: 'shadow-[0_0_10px_#ffffff,0_0_18px_#fbbf24]',
  },
  indigo: {
    gradient: 'from-indigo-600 via-violet-400 to-sky-300',
    glow: 'shadow-[0_0_12px_#a78bfa,0_0_20px_#4f46e5]',
    headColor: 'bg-white',
    headGlow: 'shadow-[0_0_10px_#ffffff,0_0_18px_#a78bfa]',
  },
};

export default function TopLoadingBar({
  isLoading,
  progress: externalProgress,
  color = 'primary',
  customColor,
  className = '',
  position = 'under-header',
}: TopLoadingBarProps) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: any;
    let stepTimer: any;

    if (isLoading) {
      setVisible(true);
      if (externalProgress === undefined) {
        // Natural progress simulation: jumps quickly to ~30%, then to ~75%, then creeps toward 95%
        setInternalProgress(15);
        timer = setTimeout(() => {
          setInternalProgress(55);
        }, 120);

        stepTimer = setTimeout(() => {
          setInternalProgress(85);
        }, 320);
      } else {
        setInternalProgress(externalProgress);
      }
    } else {
      if (visible) {
        setInternalProgress(100);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          setInternalProgress(0);
        }, 320);
        return () => clearTimeout(hideTimer);
      }
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(stepTimer);
    };
  }, [isLoading, externalProgress, visible]);

  if (!visible) return null;

  const col = colorMap[color] || colorMap.primary;

  const positionClasses = 
    position === 'fixed-top'
      ? 'fixed top-0 left-0 right-0 z-[9999]'
      : position === 'under-header'
      ? 'absolute bottom-0 left-0 right-0 z-50'
      : 'relative w-full z-40';

  return (
    <div
      id="mavluy-top-loading-bar"
      className={`h-[3px] bg-stone-900/10 overflow-hidden pointer-events-none ${positionClasses} ${className}`}
    >
      <motion.div
        className={`h-full ${customColor ? '' : `bg-gradient-to-r ${col.gradient}`} relative ${customColor ? '' : col.glow}`}
        style={customColor ? {
          background: `linear-gradient(to right, ${customColor}, ${customColor}cc, ${customColor}88)`,
          boxShadow: `0 0 12px ${customColor}88, 0 0 20px ${customColor}`
        } : undefined}
        initial={{ width: '0%' }}
        animate={{ width: `${internalProgress}%` }}
        transition={{
          duration: internalProgress === 100 ? 0.2 : 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Leading edge energetic spark light */}
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-full ${col.headColor} ${col.headGlow} rounded-full`}
        />

        {/* Shimmer beam passing through */}
        <div
          className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white to-transparent animate-marquee"
          style={{ animationDuration: '1.2s' }}
        />
      </motion.div>
    </div>
  );
}
