import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Check, X, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseCityEntry, translateCity } from '../data/cities';

export interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  options: string[];
  label?: string;
  required?: boolean;
  error?: string;
  lang?: 'ar' | 'en' | 'fr';
  theme?: 'light' | 'dark';
  className?: string;
  placeholder?: string;
}

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_()]/g, ' ')
    .trim();
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  error,
  lang = 'ar',
  theme = 'light',
  className = '',
  placeholder
}) => {
  const isAr = (lang || 'ar').startsWith('ar');
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Clean current display value
  const displayValue = useMemo(() => {
    return translateCity(value, lang);
  }, [value, lang]);

  // Clean list of city options tailored to current language
  const localizedOptions = useMemo(() => {
    const list = options.map(opt => {
      const parsed = parseCityEntry(opt);
      return isAr ? parsed.ar : parsed.fr;
    });
    return Array.from(new Set(list));
  }, [options, isAr]);

  // Filtered options based on what user is typing in the search box
  const filteredCities = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return localizedOptions;

    const query = normalizeText(trimmed);

    return localizedOptions.filter(city => {
      const normalizedCity = normalizeText(city);
      if (normalizedCity.includes(query)) return true;

      // Also allow searching by alternate language
      const translated = translateCity(city, isAr ? 'fr' : 'ar');
      return normalizeText(translated).includes(query);
    });
  }, [localizedOptions, searchQuery, isAr]);

  // Check if search query matches any existing city exactly
  const hasExactMatch = useMemo(() => {
    const trimmedNorm = normalizeText(searchQuery);
    if (!trimmedNorm) return true;
    return localizedOptions.some(c => normalizeText(c) === trimmedNorm);
  }, [localizedOptions, searchQuery]);

  // Auto-focus search input when opened, calculate direction & scroll inner list to selected item
  useEffect(() => {
    if (isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }

      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
        if (selectedItemRef.current && listRef.current) {
          const itemTop = selectedItemRef.current.offsetTop;
          const containerTop = listRef.current.offsetTop;
          listRef.current.scrollTop = Math.max(0, itemTop - containerTop - 20);
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
      setOpenUpward(false);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown when scrolling outside the dropdown (e.g. scrolling the page)
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (
        panelRef.current &&
        target &&
        (panelRef.current === target || panelRef.current.contains(target))
      ) {
        return; // Inner scroll inside the dropdown panel, do not close!
      }
      setIsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen]);

  // Prevent page scroll and route wheel scrolling directly to cities list
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (listRef.current) {
        listRef.current.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      panel.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  const handleSelectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearchQuery('');
  };

  const defaultPlaceholder = isAr
    ? 'اختر مدينتك (جميع مدن المغرب متاحة)...'
    : 'Select your city...';

  return (
    <div className={`space-y-1 relative ${isOpen ? 'z-30' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Field Label */}
      {label && (
        <label className="font-bold text-stone-700 text-[11px] uppercase tracking-wider flex items-center gap-1 px-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border transition-all duration-200 text-start cursor-pointer select-none ${
            isDark
              ? 'bg-stone-900 border-stone-800 text-white hover:border-stone-700 focus:border-blue-500'
              : 'bg-white border-stone-200 text-stone-900 shadow-2xs hover:border-stone-300 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10'
          } ${error ? 'border-rose-400 ring-2 ring-rose-500/10' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin
              className={`w-4 h-4 shrink-0 transition-colors ${
                isOpen ? 'text-[#2563eb]' : 'text-stone-400'
              }`}
            />
            <span
              className={`truncate text-xs sm:text-sm font-semibold ${
                displayValue ? 'text-stone-900' : 'text-stone-400 font-normal'
              }`}
            >
              {displayValue || placeholder || defaultPlaceholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#2563eb]' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Panel with Integrated Search and Independent Scroll */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              data-lenis-prevent="true"
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.12 }}
              style={{
                overscrollBehavior: 'contain',
              }}
              className={`absolute z-30 left-0 right-0 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm ${
                isDark
                  ? 'bg-stone-900/98 border-stone-800 text-white'
                  : 'bg-white/98 border-stone-200 text-stone-900'
              }`}
            >
              {/* Search input in the panel header */}
              <div className="p-2.5 border-b border-stone-100 bg-stone-50/90">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute ltr:left-3 rtl:right-3 text-stone-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث عن مدينتك أو اختر من القائمة...' : 'Search city or choose from list...'}
                    className="w-full bg-white border border-stone-200 rounded-xl ltr:pl-9 ltr:pr-8 rtl:pr-9 rtl:pl-8 py-2 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute ltr:right-2.5 rtl:left-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium px-1 mt-1.5">
                  <span>{isAr ? 'جميع مدن ومناطق المغرب' : 'All Moroccan Cities'}</span>
                  <span>{filteredCities.length} {isAr ? 'مدينة' : 'cities'}</span>
                </div>
              </div>

              {/* Option to use custom typed text if not found */}
              {!hasExactMatch && searchQuery.trim() && (
                <div className="p-2 border-b border-stone-100 bg-blue-50/50">
                  <button
                    type="button"
                    onClick={() => handleSelectCity(searchQuery.trim())}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#2563eb] bg-white rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs text-start cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr
                        ? `استخدام "${searchQuery.trim()}" كمدينتي`
                        : `Use "${searchQuery.trim()}" as my city`}
                    </span>
                  </button>
                </div>
              )}

              {/* Scrollable list of cities - strictly contained scroll, no page scroll */}
              <div
                ref={listRef}
                data-lenis-prevent="true"
                className="max-h-56 sm:max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-stone-50 overscroll-contain touch-pan-y"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#a8a29e #f5f5f4',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, idx) => {
                    const isSelected =
                      normalizeText(city) === normalizeText(displayValue);
                    return (
                      <button
                        key={`${city}-${idx}`}
                        ref={isSelected ? selectedItemRef : undefined}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-[13px] text-start transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-[#2563eb] font-bold shadow-2xs'
                            : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900 font-medium'
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#2563eb] shrink-0 ltr:ml-2 rtl:mr-2" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-stone-500 font-semibold mb-2">
                      {isAr
                        ? `لم نجد "${searchQuery}" في القائمة`
                        : `"${searchQuery}" not found`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectCity(searchQuery.trim())}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? `تأكيد "${searchQuery.trim()}" كمدينتي`
                          : `Confirm "${searchQuery.trim()}"`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-rose-500 text-[10px] sm:text-xs font-bold px-1">{error}</p>}
    </div>
  );
};
