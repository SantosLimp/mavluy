import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { StoreConfig } from '../types';
import { StoreLogo } from './StoreLogo';

interface LoadingScreenProps {
  onComplete?: () => void;
  isReady?: boolean;
  storeConfig?: StoreConfig;
}

export default function LoadingScreen({ onComplete, isReady = true, storeConfig }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  const cachedColor = typeof window !== 'undefined' ? localStorage.getItem('ecom_cached_theme_primary_color') : null;
  const primaryColor = storeConfig?.themePrimaryColor || storeConfig?.logoAccentColor || cachedColor || '#2563eb';

  useEffect(() => {
    if (storeConfig?.themePrimaryColor) {
      localStorage.setItem('ecom_cached_theme_primary_color', storeConfig.themePrimaryColor);
    }
  }, [storeConfig?.themePrimaryColor]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isReady) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.max(2, Math.round((90 - prev) / 4));
          return Math.min(90, prev + increment);
        });
      }, 30);
    } else {
      setProgress(100);
      const finishTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 60);
      return () => clearTimeout(finishTimer);
    }

    return () => clearInterval(timer);
  }, [isReady, onComplete]);

  return (
    <motion.div
      id="mavluy-loading-screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-stone-900 overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center mb-8"
        >
          <StoreLogo
            config={storeConfig}
            variant="light"
            size="2xl"
            showTagline={false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="w-60 sm:w-72 flex items-center gap-3"
        >
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/70 p-[1px]">
            <motion.div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: primaryColor
              }}
              transition={{ ease: 'easeOut', duration: 0.03 }}
            />
          </div>

          <div className="font-mono tabular-nums text-right min-w-[42px] flex items-baseline justify-end">
            <span className="font-extrabold text-stone-900 text-sm">{progress}</span>
            <span
              className="font-bold text-[11px] ml-0.5"
              style={{ color: primaryColor }}
            >
              %
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
