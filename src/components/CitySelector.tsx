import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Check, X, Plus } from 'lucide-react';
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
    .replace(/[\u0300-\u036f]/g, '') // remove accents (é -> e, etc.)
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
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean the value according to the current language
  const displayValue = useMemo(() => {
    return translateCity(value, lang);
  }, [value, lang]);

  // Search/input term tracked inside the input
  const [inputValue, setInputValue] = useState(displayValue);

  // Keep inputValue synced when external value changes
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  // Clean list of city options tailored to current language
  const localizedOptions = useMemo(() => {
    return options.map(opt => {
      const parsed = parseCityEntry(opt);
      return isAr ? parsed.ar : parsed.fr;
    });
  }, [options, isAr]);

  // Filtered options based on what user is typing
  const filteredCities = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return localizedOptions;

    const query = normalizeText(trimmed);

    return localizedOptions.filter(city => {
      const normalizedCity = normalizeText(city);
      if (normalizedCity.includes(query)) return true;

      // Also allow searching by French name if in Arabic mode, or vice versa
      const translated = translateCity(city, isAr ? 'fr' : 'ar');
      return normalizeText(translated).includes(query);
    });
  }, [localizedOptions, inputValue, isAr]);

  // Check if current input matches any existing city in the list
  const hasExactMatch = useMemo(() => {
    const trimmedNorm = normalizeText(inputValue);
    if (!trimmedNorm) return true;
    return localizedOptions.some(c => normalizeText(c) === trimmedNorm);
  }, [localizedOptions, inputValue]);

  // Close dropdown on click outside (no window scroll listeners that block scrolling)
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

  const handleSelectCity = (city: string) => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const defaultPlaceholder = isAr
    ? 'اختر مدينتك أو اكتبها هنا...'
    : 'Select or type your city here...';

  return (
    <div className={`space-y-1 ${className}`} ref={containerRef}>
      {/* Field Label - clean & simple, no toggle buttons */}
      {label && (
        <label className="font-bold text-stone-700 text-[11px] uppercase tracking-wider flex items-center gap-1 px-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Unified Input + Dropdown Box */}
      <div className="relative">
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all duration-200 ${
            isDark
              ? 'bg-stone-900 border-stone-800 text-white focus-within:border-blue-500'
              : 'bg-white border-stone-200 text-stone-900 shadow-2xs hover:border-stone-300 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/10'
          } ${error ? 'border-rose-400 ring-2 ring-rose-500/10' : ''}`}
        >
          {/* Map icon */}
          <MapPin
            className={`w-4 h-4 shrink-0 transition-colors ${
              isOpen ? 'text-[#2563eb]' : 'text-stone-400'
            }`}
          />

          {/* Unified Text & Select Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            placeholder={placeholder || defaultPlaceholder}
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 placeholder-stone-400 focus:outline-none"
            autoComplete="address-level2"
          />

          {/* Clear button if text exists */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 shrink-0 transition-colors"
              title={isAr ? 'مسح' : 'Clear'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chevron dropdown toggle */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(prev => !prev);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg shrink-0 transition-transform duration-200 cursor-pointer"
            aria-label="Toggle city dropdown"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#2563eb]' : ''
              }`}
            />
          </button>
        </div>

        {/* Dropdown Options List */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.12 }}
              className={`absolute z-50 left-0 right-0 mt-1.5 rounded-2xl shadow-xl border overflow-hidden backdrop-blur-sm ${
                isDark
                  ? 'bg-stone-900/98 border-stone-800 text-white'
                  : 'bg-white/98 border-stone-200 text-stone-900'
              }`}
            >
              {/* Option to use custom typed text if not in pre-defined list */}
              {!hasExactMatch && inputValue.trim() && (
                <div className="p-2 border-b border-stone-100 bg-blue-50/50">
                  <button
                    type="button"
                    onClick={() => handleSelectCity(inputValue.trim())}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#2563eb] bg-white rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs text-start"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr
                        ? `استخدام "${inputValue.trim()}" كمدينتي`
                        : `Use "${inputValue.trim()}" as my city`}
                    </span>
                  </button>
                </div>
              )}

              {/* Scrollable list of cities - smooth standard scroll */}
              <div
                ref={listRef}
                className="max-h-56 sm:max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-stone-50"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {filteredCities.length > 0 ? (
                  filteredCities.map(city => {
                    const isSelected =
                      normalizeText(city) === normalizeText(inputValue);
                    return (
                      <button
                        key={city}
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
                        ? `لم نجد "${inputValue}" في القائمة المقترحة`
                        : `"${inputValue}" not found in suggestions`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectCity(inputValue.trim())}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? `تأكيد "${inputValue.trim()}" كمدينتي`
                          : `Confirm "${inputValue.trim()}"`}
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
