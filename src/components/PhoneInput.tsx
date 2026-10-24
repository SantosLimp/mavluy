import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { ALL_COUNTRIES, Country } from '../data/countries';
import { CountryFlag } from './CountryFlag';

interface PhoneInputProps {
  selectedCountryCode: string;
  onSelectCountry: (countryCode: string) => void;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  lang?: 'ar' | 'en' | 'fr';
  placeholder?: string;
  className?: string;
  isDarkMode?: boolean;
  brandColor?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  selectedCountryCode,
  onSelectCountry,
  value,
  onChange,
  label,
  required = false,
  error,
  helperText,
  lang = 'ar',
  placeholder,
  className = '',
  isDarkMode: isDarkModeProp,
  brandColor
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const [autoDark, setAutoDark] = useState(false);

  useEffect(() => {
    const detectDark = () => {
      const rootEl = document.getElementById('online-store-root');
      if (rootEl) {
        const bg = window.getComputedStyle(rootEl).backgroundColor;
        const match = bg.match(/\d+/g);
        if (match && match.length >= 3) {
          const r = parseInt(match[0]);
          const g = parseInt(match[1]);
          const b = parseInt(match[2]);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 140) {
            setAutoDark(true);
          } else {
            setAutoDark(false);
          }
        }
      }
    };
    detectDark();
    const timer = setTimeout(detectDark, 500);
    return () => clearTimeout(timer);
  }, []);

  const isDarkMode = isDarkModeProp !== undefined ? isDarkModeProp : autoDark;

  const isRtl = lang === 'ar';
  const activeColor = brandColor || '#2563eb';

  const selectedCountry = ALL_COUNTRIES.find(c => c.code === (selectedCountryCode || 'MA')) ||
    ALL_COUNTRIES.find(c => c.code === 'MA') ||
    ALL_COUNTRIES[0];

  const filteredCountries = ALL_COUNTRIES.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.nameAr.includes(query) ||
      c.prefix.includes(query) ||
      c.code.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (isOpen) {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 260) {
          dropdownRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        return; // Inner scroll inside the countries panel, do not close!
      }
      setIsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen]);

  // Prevent page scroll and route wheel scrolling directly to countries list
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

  return (
    <div className={`space-y-1.5 text-start ${className}`}>
      {label && (
        <label className={`font-bold text-[11px] sm:text-xs tracking-wider uppercase block ${isDarkMode ? 'text-stone-300' : 'text-stone-700'}`}>
          {label.replace(/\s*\*\s*$/, '')} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`} ref={dropdownRef}>
        <div
          className={`flex items-center rounded-xl border transition-all ${
            isDarkMode
              ? (error
                  ? 'border-rose-500 bg-stone-900/90'
                  : 'border-stone-850 bg-stone-900/90 hover:bg-stone-900 focus-within:bg-stone-900')
              : (error
                  ? 'border-rose-400 bg-stone-50/80 hover:bg-white focus-within:bg-white'
                  : 'border-stone-200 bg-stone-50/80 hover:bg-white focus-within:bg-white')
          }`}
          style={{
            direction: 'ltr',
            borderColor: isFocused ? activeColor : undefined,
            boxShadow: isFocused ? `0 0 0 3px ${activeColor}15` : undefined
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-2.5 sm:py-3 border-r font-mono text-xs font-bold shrink-0 transition-all cursor-pointer select-none rounded-l-xl bg-transparent ${
              isDarkMode
                ? 'hover:bg-stone-800/40 border-stone-800/80 text-stone-200'
                : 'hover:bg-stone-200/20 border-stone-200/80 text-stone-800'
            }`}
            aria-label="Select Country"
          >
            <CountryFlag code={selectedCountry.code} size="xs" />
            <span className={`font-black tracking-tight ${isDarkMode ? 'text-stone-200' : 'text-stone-900'}`}>{selectedCountry.prefix}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'text-stone-400'}`} style={{ color: isOpen ? activeColor : undefined }} />
          </button>

          <input
            type="tel"
            required={required}
            value={(() => {
              if (!value) return '';
              let val = String(value).replace(/\s+/g, '');
              const prefix = selectedCountry.prefix;
              const prefixNoPlus = prefix.replace('+', '');
              
              if (val.startsWith(prefix)) return val.slice(prefix.length);
              if (val.startsWith('+' + prefixNoPlus)) return val.slice(prefixNoPlus.length + 1);
              if (val.startsWith(prefixNoPlus) && val.length > prefixNoPlus.length + 5) return val.slice(prefixNoPlus.length);
              
              return val;
            })()}
            onChange={(e) => {
              let val = e.target.value.replace(/\s+/g, '');
              
              // Handle paste/typing of full numbers
              if (val.startsWith('+')) {
                const found = ALL_COUNTRIES.find(c => val.startsWith(c.prefix));
                if (found) {
                  onSelectCountry(found.code);
                  val = val.slice(found.prefix.length);
                } else {
                  val = val.replace(/^\+/, '');
                }
              } else {
                const prefixNoPlus = selectedCountry.prefix.replace('+', '');
                if (val.startsWith(prefixNoPlus) && val.length > prefixNoPlus.length + 5) {
                  val = val.slice(prefixNoPlus.length);
                }
              }
              
              onChange(val);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || selectedCountry.placeholder || '6xxxxxxxx'}
            className={`flex-1 w-full bg-transparent px-3 py-2.5 sm:py-3 font-mono font-bold text-xs sm:text-sm focus:outline-none tracking-wider rounded-r-xl ${
              isDarkMode ? 'text-stone-100 placeholder-stone-600' : 'text-stone-900 placeholder-stone-400'
            }`}
            style={{ direction: 'ltr' }}
          />
        </div>

        {error ? (
          <p className="text-rose-500 text-[10px] sm:text-xs font-bold mt-1 px-1">{error}</p>
        ) : helperText ? (
          <p className={`text-[10px] sm:text-[11px] font-medium mt-1 px-1 ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>{helperText}</p>
        ) : null}

        {isOpen && (
          <div
            ref={panelRef}
            data-lenis-prevent="true"
            className={`absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-1.5 border rounded-2xl shadow-2xl z-30 overflow-hidden text-stone-900 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-900'
            }`}
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className={`p-2.5 border-b sticky top-0 z-10 ${isDarkMode ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-stone-50'}`}>
              <div className="relative flex items-center">
                {isRtl ? (
                  <>
                    <Search className="w-3.5 h-3.5 absolute right-3 text-stone-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="ابحث عن الدولة أو الرمز..."
                      className={`w-full border rounded-xl pr-9 pl-9 py-2 text-xs font-semibold focus:outline-none ${
                        isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-200 placeholder-stone-500' : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400'
                      }`}
                      style={{
                        borderColor: isSearchFocused ? activeColor : undefined,
                        boxShadow: isSearchFocused ? `0 0 0 2px ${activeColor}15` : undefined
                      }}
                      dir="rtl"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 absolute left-3 text-stone-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder={lang === 'fr' ? 'Rechercher un pays ou code...' : 'Search country or code...'}
                      className={`w-full border rounded-xl pl-9 pr-9 py-2 text-xs font-semibold focus:outline-none ${
                        isDarkMode ? 'bg-stone-950 border-stone-800 text-stone-200 placeholder-stone-500' : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400'
                      }`}
                      style={{
                        borderColor: isSearchFocused ? activeColor : undefined,
                        boxShadow: isSearchFocused ? `0 0 0 2px ${activeColor}15` : undefined
                      }}
                      dir="ltr"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              ref={listRef}
              data-lenis-prevent="true"
              className={`max-h-[190px] sm:max-h-[210px] overflow-y-auto divide-y overscroll-contain touch-pan-y ${isDarkMode ? 'divide-stone-900' : 'divide-stone-100'}`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDarkMode ? '#57534e #1c1917' : '#a8a29e #f5f5f4',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountryCode;
                  return (
                    <button
                      key={c.code}
                      ref={isSelected ? selectedItemRef : undefined}
                      type="button"
                      onClick={() => {
                        onSelectCountry(c.code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors text-start cursor-pointer ${
                        isSelected
                          ? 'font-bold'
                          : (isDarkMode ? 'text-stone-300 hover:bg-stone-900/60' : 'text-stone-800 hover:bg-blue-50/70')
                      }`}
                      style={isSelected ? {
                        backgroundColor: `${activeColor}15`,
                        color: activeColor
                      } : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CountryFlag code={c.code} size="sm" />
                        <span className={`truncate font-semibold text-xs ${isDarkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                          {isRtl ? c.nameAr : c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ltr:ml-2 rtl:mr-2" style={{ direction: 'ltr' }}>
                        <span className={`font-mono text-xs font-bold ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>{c.prefix}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: activeColor }} />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-stone-400 font-medium">
                  {isRtl ? 'لم يتم العثور على أي دولة' : lang === 'fr' ? 'Aucun pays trouvé' : 'No countries found'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
