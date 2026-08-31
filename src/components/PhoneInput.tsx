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
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isRtl = lang === 'ar';

  // Get current country
  const selectedCountry = ALL_COUNTRIES.find(c => c.code === selectedCountryCode) || ALL_COUNTRIES[0];

  // Filter countries by search query
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`space-y-1.5 text-start ${className}`}>
      {label && (
        <label className="font-bold text-stone-700 text-[11px] sm:text-xs tracking-wider uppercase block">
          {label.replace(/\s*\*\s*$/, '')} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative z-30" ref={dropdownRef}>
        {/* Input Outer Container */}
        <div 
          className={`flex items-center rounded-xl border bg-stone-50/80 hover:bg-white focus-within:bg-white transition-all shadow-xs ${
            error 
              ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/10' 
              : 'border-stone-200 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10'
          }`}
          style={{ direction: 'ltr' }}
        >
          {/* Country Selector Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-3 bg-stone-100/80 hover:bg-stone-200/60 border-r border-stone-200 text-stone-800 font-mono text-xs font-bold shrink-0 transition-colors cursor-pointer select-none rounded-l-xl"
            aria-label="Select Country"
          >
            <CountryFlag code={selectedCountry.code} size="xs" />
            <span className="text-stone-900 font-black tracking-tight">{selectedCountry.prefix}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2563eb]' : ''}`} />
          </button>

          {/* Number Input */}
          <input
            type="tel"
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || selectedCountry.placeholder || (lang === 'ar' ? 'رقم الجوال' : 'Phone number')}
            className="flex-1 w-full bg-transparent px-3.5 py-3 text-stone-900 font-mono font-bold text-xs sm:text-sm placeholder-stone-400 focus:outline-none tracking-wider rounded-r-xl"
            style={{ direction: 'ltr' }}
          />
        </div>

        {/* Error or Helper Message */}
        {error ? (
          <p className="text-rose-500 text-[10px] sm:text-xs font-bold mt-1 px-1">{error}</p>
        ) : helperText ? (
          <p className="text-stone-500 text-[10px] sm:text-[11px] font-medium mt-1 px-1">{helperText}</p>
        ) : null}

        {/* Searchable Country Modal / Dropdown */}
        {isOpen && (
          <div 
            className="absolute left-0 right-0 sm:right-auto sm:w-80 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-2xl z-[100] overflow-hidden text-stone-900 animate-in fade-in slide-in-from-top-2 duration-150"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Search Header */}
            <div className="p-2.5 border-b border-stone-200 bg-stone-50 sticky top-0 z-10">
              <div className="relative flex items-center">
                {isRtl ? (
                  <>
                    <Search className="w-3.5 h-3.5 absolute right-3 text-stone-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن الدولة أو الرمز..."
                      className="w-full bg-white border border-stone-200 rounded-xl pr-9 pl-9 py-2 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
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
                      placeholder={lang === 'fr' ? 'Rechercher un pays ou code...' : 'Search country or code...'}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-9 py-2 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
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

            {/* Countries List - max-h-[280px] to comfortably show 5-7 countries + smooth scrollbar */}
            <div className="max-h-[280px] overflow-y-auto divide-y divide-stone-100">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountryCode;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onSelectCountry(c.code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors text-start hover:bg-blue-50/70 cursor-pointer ${
                        isSelected ? 'bg-blue-50 text-[#2563eb] font-bold' : 'text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CountryFlag code={c.code} size="sm" />
                        <span className="truncate font-semibold text-stone-800 text-xs">
                          {isRtl ? c.nameAr : c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ltr:ml-2 rtl:mr-2" style={{ direction: 'ltr' }}>
                        <span className="font-mono text-xs font-bold text-stone-600">{c.prefix}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />}
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
