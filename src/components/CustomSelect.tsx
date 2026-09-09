import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
  labelSecondary?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export interface CustomSelectProps {
  options: (string | SelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  searchable?: boolean;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  theme = 'dark',
  searchable = false,
  searchPlaceholder = 'Search...',
  allowCustom = false,
  customPlaceholder = 'Enter custom value...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  id,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customValue, setCustomValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find(o => o.value.toLowerCase() === value.toLowerCase()) ||
      (value ? { value, label: value } : null);
  }, [normalizedOptions, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const lower = searchTerm.toLowerCase();
    return normalizedOptions.filter(
      opt => opt.label.toLowerCase().includes(lower) ||
             (opt.labelSecondary && opt.labelSecondary.toLowerCase().includes(lower)) ||
             opt.value.toLowerCase().includes(lower)
    );
  }, [normalizedOptions, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && containerRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
      setSearchTerm('');
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  const sizeClasses = {
    sm: 'py-2 px-3 text-xs rounded-xl',
    md: 'py-3 px-4 text-xs sm:text-sm rounded-2xl',
    lg: 'py-3.5 px-4 text-sm sm:text-base rounded-2xl'
  }[size];

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-40' : 'z-10'} ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer font-semibold outline-none ${sizeClasses} ${
          isDark
            ? `bg-stone-900/90 border text-stone-100 ${
                isOpen
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                  : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900'
              }`
            : `bg-white border text-stone-900 ${
                isOpen
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
              }`
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}

          <div className="truncate flex items-center gap-2">
            <span className={`truncate font-bold ${!selectedOption ? (isDark ? 'text-stone-500' : 'text-stone-400') : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.labelSecondary && (
              <span className={`text-[11px] font-normal truncate hidden sm:inline ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {selectedOption.labelSecondary}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              selectedOption.badgeColor || (isDark ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60' : 'bg-blue-50 text-blue-700 border border-blue-200')
            }`}>
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            } ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            data-lenis-prevent="true"
            className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-stone-900 border-stone-800 divide-y divide-stone-800 shadow-black'
                : 'bg-white border-stone-200 divide-y divide-stone-100 shadow-stone-900/15'
            } ${menuClassName}`}
          >
            {searchable && (
              <div className="p-2.5">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                  isDark
                    ? 'bg-stone-950 border-stone-800 text-stone-200 focus-within:border-blue-500'
                    : 'bg-stone-50 border-stone-200 text-stone-900 focus-within:border-blue-500'
                }`}>
                  <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent outline-none font-medium placeholder-stone-500"
                    onClick={e => e.stopPropagation()}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm('');
                      }}
                      className="p-0.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              data-lenis-prevent="true"
              className="max-h-56 sm:max-h-64 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain touch-pan-y"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? '#57534e transparent' : '#a8a29e transparent',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className={`py-4 px-3 text-center text-xs font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value.toLowerCase() === value.toLowerCase();
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left rtl:text-right ${
                        isSelected
                          ? isDark
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                          : isDark
                            ? 'text-stone-200 hover:bg-stone-800/80 hover:text-white border border-transparent'
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                        {option.icon && (
                          <span className={`shrink-0 ${isSelected ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-stone-400'}`}>
                            {option.icon}
                          </span>
                        )}
                        <div className="truncate flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          <span className="truncate">{option.label}</span>
                          {option.labelSecondary && (
                            <span className={`text-[11px] font-normal truncate ${
                              isSelected
                                ? (isDark ? 'text-blue-300/80' : 'text-blue-600/80')
                                : (isDark ? 'text-stone-400' : 'text-stone-500')
                            }`}>
                              {option.labelSecondary}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {option.badge && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            option.badgeColor || (isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700')
                          }`}>
                            {option.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className={`w-4 h-4 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {allowCustom && (
              <div className="p-2 bg-stone-950/40">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    placeholder={customPlaceholder}
                    className={`flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-800 text-stone-200 focus:border-blue-500 placeholder-stone-500'
                        : 'bg-white border-stone-200 text-stone-900 focus:border-blue-500 placeholder-stone-400'
                    }`}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customValue.trim()) {
                        e.preventDefault();
                        onChange(customValue.trim());
                        setCustomValue('');
                        setIsOpen(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!customValue.trim()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (customValue.trim()) {
                        onChange(customValue.trim());
                        setCustomValue('');
                        setIsOpen(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
