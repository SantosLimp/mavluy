import React, { useState } from 'react';
import { Search, X, Check, Shapes } from 'lucide-react';
import { ALL_FEATURE_ICONS, FeatureIconItem, renderFeatureVectorIcon } from '../utils/iconMap';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
  lang?: 'ar' | 'en';
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Select Vector Icon',
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'trust' | 'tech' | 'shipping' | 'beauty' | 'general'>('all');

  const filteredIcons = ALL_FEATURE_ICONS.filter(icon => {
    const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      icon.value.toLowerCase().includes(query) ||
      icon.name.toLowerCase().includes(query) ||
      icon.nameAr.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const activeIconItem = ALL_FEATURE_ICONS.find(i => i.value.toLowerCase() === (value || '').toLowerCase()) || ALL_FEATURE_ICONS[0];

  return (
    <div className="relative">
      {/* Trigger Button showing the current crisp vector icon and label */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 bg-stone-950 border border-stone-800 hover:border-[#2563eb] text-stone-100 rounded-xl p-2.5 text-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-[#2563eb] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600/20 transition-all">
            {renderFeatureVectorIcon(activeIconItem.value, "w-4.5 h-4.5")}
          </div>
          <div className="text-left rtl:text-right min-w-0">
            <span className="font-bold text-stone-200 text-xs block truncate">
              {activeIconItem.value}
            </span>
            <span className="text-[10px] text-stone-400 block truncate">
              {isAr ? activeIconItem.nameAr : activeIconItem.name}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-950/40 px-2 py-1 rounded-md border border-blue-900/30 shrink-0">
          {isAr ? 'تغيير' : 'Change'}
        </span>
      </button>

      {/* Visual Modal / Popover */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/75" 
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed sm:absolute z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-full sm:translate-y-0 sm:left-0 sm:right-0 mt-2 bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-4 space-y-3.5 max-h-[85vh] sm:max-h-[420px] overflow-hidden flex flex-col animate-fadeIn text-stone-100">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Shapes className="w-4 h-4 text-[#2563eb]" />
                <h4 className="font-bold text-xs sm:text-sm text-stone-100">
                  {label}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث عن أيقونة (مثال: Zap, Battery, Shield, Leaf, Truck)...' : 'Search icon (e.g. Zap, Battery, Shield, Leaf, Truck)...'}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#2563eb]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'tech', label: isAr ? 'أجهزة وإلكترونيات' : 'Electronics & Tech' },
                { id: 'trust', label: isAr ? 'ثقة وضمان وجودة' : 'Quality & Trust' },
                { id: 'shipping', label: isAr ? 'توصيل وسرعة شحن' : 'Speed & Delivery' },
                { id: 'beauty', label: isAr ? 'جمال وصحة وعناية' : 'Beauty & Health' },
                { id: 'general', label: isAr ? 'عام ومنزل' : 'General' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'bg-stone-800/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Icons Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pr-1 max-h-[220px]">
              {filteredIcons.map(icon => {
                const isSelected = (value || '').toLowerCase() === icon.value.toLowerCase();
                const IconComp = icon.component;
                return (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => {
                      onChange(icon.value);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'bg-blue-950/60 border-[#2563eb] text-white shadow-md shadow-blue-500/10'
                        : 'bg-stone-950 border-stone-800/80 hover:border-stone-700 hover:bg-stone-850 text-stone-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#2563eb] rounded-full flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-[#2563eb] bg-blue-500/10' : 'text-stone-400 group-hover:text-blue-400'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold block truncate w-full">
                      {icon.value}
                    </span>
                    <span className="text-[9px] text-stone-400 block truncate w-full">
                      {icon.nameAr}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className="py-6 text-center text-stone-500 text-xs">
                No icons found matching "{search}"
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};
