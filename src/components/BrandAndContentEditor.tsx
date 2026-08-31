import React, { useState, useMemo } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Palette, 
  LayoutTemplate, 
  Check, 
  RotateCcw, 
  Save, 
  Upload, 
  Trash2, 
  Search, 
  HelpCircle,
  Eye,
  Sliders,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Star,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';
import { StoreConfig } from '../types';
import { StoreLogo } from './StoreLogo';
import { DEFAULT_STORE_CONFIG } from '../data';
import { DEFAULT_TRANSLATIONS } from '../translations';
import { readFileAsDataUrl, uploadImageToCloud } from '../utils/mediaUtils';

interface BrandAndContentEditorProps {
  storeConfig: StoreConfig;
  setStoreConfig: (config: StoreConfig | ((prev: StoreConfig) => StoreConfig)) => void;
  dashboardLang?: 'ar' | 'en';
  onSaveSuccess?: () => void;
}

const COLOR_PRESETS = [
  { nameAr: 'أزرق ملكي (Royal Blue)', nameEn: 'Royal Blue', value: '#2563eb', accentKey: 'indigo' },
  { nameAr: 'أخضر زمردي (Emerald Green)', nameEn: 'Emerald Green', value: '#059669', accentKey: 'emerald' },
  { nameAr: 'ذهبي إمبراطوري (Imperial Gold)', nameEn: 'Imperial Gold', value: '#d97706', accentKey: 'amber' },
  { nameAr: 'بنفسجي مخملي (Velvet Purple)', nameEn: 'Velvet Purple', value: '#7c3aed', accentKey: 'indigo' },
  { nameAr: 'أحمر قرمزي (Crimson Red)', nameEn: 'Crimson Red', value: '#dc2626', accentKey: 'rose' },
  { nameAr: 'وردي أنيق (Elegant Rose)', nameEn: 'Elegant Rose', value: '#e11d48', accentKey: 'rose' },
  { nameAr: 'فيروزي بحري (Ocean Teal)', nameEn: 'Ocean Teal', value: '#0d9488', accentKey: 'emerald' },
  { nameAr: 'أسود فحمي (Obsidian Slate)', nameEn: 'Obsidian Slate', value: '#0f172a', accentKey: 'slate' },
];

const FONT_STYLES = [
  { id: 'serif', labelAr: 'Serif Classic (إيطاليك كلاسيكي أنيق)', labelEn: 'Classic Elegant Serif', fontClass: 'font-logo italic' },
  { id: 'sans', labelAr: 'Modern Sans (عصري بدون زوائد)', labelEn: 'Modern Clean Sans', fontClass: 'font-sans font-black tracking-tight' },
  { id: 'display', labelAr: 'Bold Display (عريض وبارز)', labelEn: 'Bold Display Font', fontClass: 'font-serif font-black tracking-wide' },
  { id: 'mono', labelAr: 'Tech Monospace (تقني أنيق)', labelEn: 'Tech Monospace Font', fontClass: 'font-mono font-bold tracking-widest' },
];

// Defined editable content groups
const CONTENT_SECTIONS = [
  {
    id: 'hero',
    titleAr: 'البانر والواجهة الرئيسية (Hero & Landing)',
    titleEn: 'Hero & Landing Banner',
    icon: LayoutTemplate,
    fields: [
      { key: 'mavluyHeroTitle', labelAr: 'عنوان البانر الرئيسي', labelEn: 'Main Hero Title', defaultAr: DEFAULT_TRANSLATIONS.ar.mavluyHeroTitle, defaultEn: DEFAULT_TRANSLATIONS.en.mavluyHeroTitle },
      { key: 'mavluyHeroSubtitle', labelAr: 'النص التوضيحي للبانر (الوصف الرئيسي)', labelEn: 'Hero Subtitle / Description', defaultAr: DEFAULT_TRANSLATIONS.ar.mavluyHeroSubtitle, defaultEn: DEFAULT_TRANSLATIONS.en.mavluyHeroSubtitle, isLong: true },
      { key: 'mavluyHeroBadge', labelAr: 'شارة البانر العلوية', labelEn: 'Top Hero Badge', defaultAr: DEFAULT_TRANSLATIONS.ar.mavluyHeroBadge, defaultEn: DEFAULT_TRANSLATIONS.en.mavluyHeroBadge },
      { key: 'shopNow', labelAr: 'زر التسوق الرئيسي', labelEn: 'Shop Now CTA Button', defaultAr: DEFAULT_TRANSLATIONS.ar.shopNow, defaultEn: DEFAULT_TRANSLATIONS.en.shopNow },
      { key: 'topBestsellers', labelAr: 'عنوان قسم المنتجات الأكثر مبيعاً', labelEn: 'Top Bestsellers Title', defaultAr: DEFAULT_TRANSLATIONS.ar.topBestsellers, defaultEn: DEFAULT_TRANSLATIONS.en.topBestsellers },
    ]
  },
  {
    id: 'nav',
    titleAr: 'شريط التنقل والقائمة (Header & Navigation)',
    titleEn: 'Header & Navigation',
    icon: Layers,
    fields: [
      { key: 'home', labelAr: 'زر الرئيسية', labelEn: 'Home Tab', defaultAr: DEFAULT_TRANSLATIONS.ar.home, defaultEn: DEFAULT_TRANSLATIONS.en.home },
      { key: 'products', labelAr: 'زر المنتجات', labelEn: 'Products Tab', defaultAr: DEFAULT_TRANSLATIONS.ar.products, defaultEn: DEFAULT_TRANSLATIONS.en.products },
      { key: 'support', labelAr: 'زر الدعم الفني', labelEn: 'Support Tab', defaultAr: DEFAULT_TRANSLATIONS.ar.support, defaultEn: DEFAULT_TRANSLATIONS.en.support },
      { key: 'cart', labelAr: 'زر السلة', labelEn: 'Cart Tab', defaultAr: DEFAULT_TRANSLATIONS.ar.cart, defaultEn: DEFAULT_TRANSLATIONS.en.cart },
      { key: 'myAccount', labelAr: 'زر حسابي', labelEn: 'My Account Button', defaultAr: DEFAULT_TRANSLATIONS.ar.myAccount, defaultEn: DEFAULT_TRANSLATIONS.en.myAccount },
    ]
  },
  {
    id: 'products',
    titleAr: 'بطاقات المنتجات والأزرار (Products & Catalog)',
    titleEn: 'Products & Catalog',
    icon: Sliders,
    fields: [
      { key: 'orderNow', labelAr: 'زر الطلب المباشر والدفع عند الاستلام', labelEn: 'Order Now (COD) Button', defaultAr: DEFAULT_TRANSLATIONS.ar.orderNow, defaultEn: DEFAULT_TRANSLATIONS.en.orderNow },
      { key: 'addToCart', labelAr: 'زر إضافة إلى السلة', labelEn: 'Add to Cart Button', defaultAr: DEFAULT_TRANSLATIONS.ar.addToCart, defaultEn: DEFAULT_TRANSLATIONS.en.addToCart },
      { key: 'openPackageBeforePay', labelAr: 'عبارة فحص الشحنة قبل الدفع', labelEn: 'Inspect Package Before Pay Text', defaultAr: DEFAULT_TRANSLATIONS.ar.openPackageBeforePay, defaultEn: DEFAULT_TRANSLATIONS.en.openPackageBeforePay, isLong: true },
      { key: 'outOfStock', labelAr: 'عبارة نفذت الكمية', labelEn: 'Out of Stock Label', defaultAr: DEFAULT_TRANSLATIONS.ar.outOfStock, defaultEn: DEFAULT_TRANSLATIONS.en.outOfStock },
      { key: 'searchPlaceholder', labelAr: 'نص حقل البحث', labelEn: 'Search Input Placeholder', defaultAr: DEFAULT_TRANSLATIONS.ar.searchPlaceholder, defaultEn: DEFAULT_TRANSLATIONS.en.searchPlaceholder },
      { key: 'allProducts', labelAr: 'عنوان جميع المنتجات', labelEn: 'All Products Title', defaultAr: DEFAULT_TRANSLATIONS.ar.allProducts, defaultEn: DEFAULT_TRANSLATIONS.en.allProducts },
    ]
  },
  {
    id: 'checkout',
    titleAr: 'صفحة الطلب والشحن (Checkout & Shipping)',
    titleEn: 'Checkout & Shipping',
    icon: FileText,
    fields: [
      { key: 'checkout', labelAr: 'عنوان إتمام الطلب', labelEn: 'Checkout Title', defaultAr: DEFAULT_TRANSLATIONS.ar.checkout, defaultEn: DEFAULT_TRANSLATIONS.en.checkout },
      { key: 'shippingInfo', labelAr: 'عنوان معلومات الشحن والتوصيل', labelEn: 'Shipping Information Title', defaultAr: DEFAULT_TRANSLATIONS.ar.shippingInfo, defaultEn: DEFAULT_TRANSLATIONS.en.shippingInfo },
      { key: 'confirmPhoneCall', labelAr: 'تنبيه الاتصال لتأكيد الشحن', labelEn: 'Phone Confirmation Notice', defaultAr: DEFAULT_TRANSLATIONS.ar.confirmPhoneCall, defaultEn: DEFAULT_TRANSLATIONS.en.confirmPhoneCall, isLong: true },
      { key: 'placeOrder', labelAr: 'زر تأكيد الطلب النهائي', labelEn: 'Confirm Order Button', defaultAr: DEFAULT_TRANSLATIONS.ar.placeOrder, defaultEn: DEFAULT_TRANSLATIONS.en.placeOrder },
      { key: 'orderSuccessTitle', labelAr: 'عنوان نجاح الطلب', labelEn: 'Order Success Title', defaultAr: DEFAULT_TRANSLATIONS.ar.orderSuccessTitle, defaultEn: DEFAULT_TRANSLATIONS.en.orderSuccessTitle },
      { key: 'orderSuccessDesc', labelAr: 'وصف نجاح استلام الطلب', labelEn: 'Order Success Description', defaultAr: DEFAULT_TRANSLATIONS.ar.orderSuccessDesc, defaultEn: DEFAULT_TRANSLATIONS.en.orderSuccessDesc, isLong: true },
    ]
  },
  {
    id: 'reviews',
    titleAr: 'تقييمات وآراء العملاء (Customer Reviews)',
    titleEn: 'Customer Reviews',
    icon: Star,
    fields: [
      { key: 'verifiedReviews', labelAr: 'عنوان تقييمات العملاء الموثقة', labelEn: 'Verified Reviews Title', defaultAr: DEFAULT_TRANSLATIONS.ar.verifiedReviews, defaultEn: DEFAULT_TRANSLATIONS.en.verifiedReviews },
      { key: 'lovedByThousands', labelAr: 'عنوان ثقة العملاء', labelEn: 'Loved by Thousands Title', defaultAr: DEFAULT_TRANSLATIONS.ar.lovedByThousands, defaultEn: DEFAULT_TRANSLATIONS.en.lovedByThousands },
      { key: 'lovedByThousandsDesc', labelAr: 'وصف قسم آراء العملاء', labelEn: 'Reviews Section Description', defaultAr: DEFAULT_TRANSLATIONS.ar.lovedByThousandsDesc, defaultEn: DEFAULT_TRANSLATIONS.en.lovedByThousandsDesc, isLong: true },
      { key: 'writeReview', labelAr: 'زر كتابة تقييم', labelEn: 'Write Review Button', defaultAr: DEFAULT_TRANSLATIONS.ar.writeReview, defaultEn: DEFAULT_TRANSLATIONS.en.writeReview },
    ]
  },
  {
    id: 'support',
    titleAr: 'صفحة الدعم الفني والمساعدة (Support Center)',
    titleEn: 'Support Center',
    icon: HelpCircle,
    fields: [
      { key: 'supportTitle', labelAr: 'عنوان مكتب الدعم الفني', labelEn: 'Support Desk Title', defaultAr: DEFAULT_TRANSLATIONS.ar.supportTitle, defaultEn: DEFAULT_TRANSLATIONS.en.supportTitle },
      { key: 'supportDesc', labelAr: 'وصف صفحة الدعم والمساعدة', labelEn: 'Support Desk Description', defaultAr: DEFAULT_TRANSLATIONS.ar.supportDesc, defaultEn: DEFAULT_TRANSLATIONS.en.supportDesc, isLong: true },
      { key: 'sendSupportTicket', labelAr: 'زر إرسال تذكرة الدعم', labelEn: 'Send Support Ticket Button', defaultAr: DEFAULT_TRANSLATIONS.ar.sendSupportTicket, defaultEn: DEFAULT_TRANSLATIONS.en.sendSupportTicket },
      { key: 'howHelpYou', labelAr: 'سؤال كيف يمكننا مساعدتك', labelEn: 'How Can We Help You Title', defaultAr: DEFAULT_TRANSLATIONS.ar.howHelpYou, defaultEn: DEFAULT_TRANSLATIONS.en.howHelpYou },
    ]
  }
];

export const BrandAndContentEditor: React.FC<BrandAndContentEditorProps> = ({
  storeConfig,
  setStoreConfig,
  dashboardLang = 'ar',
  onSaveSuccess
}) => {
  const isAr = dashboardLang === 'ar';
  
  // Local form state
  const [formData, setFormData] = useState<StoreConfig>({ ...storeConfig });
  const [activeSubTab, setActiveSubTab] = useState<'logo' | 'colors' | 'content'>('logo');
  const [contentSection, setContentSection] = useState<string>('hero');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentLang, setContentLang] = useState<'ar' | 'en'>('ar');
  const [previewDarkBg, setPreviewDarkBg] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Keep form synchronized if storeConfig updates from outside
  React.useEffect(() => {
    setFormData({ ...storeConfig });
  }, [storeConfig]);

  // Handle Full Reset to Default Store Configuration
  const handleResetAllToDefault = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    setShowResetConfirmModal(false);
    try {
      const resetConfig: StoreConfig = {
        ...DEFAULT_STORE_CONFIG,
        // Preserve admin routing/keys if already setup
        customAdminSlug: formData.customAdminSlug || DEFAULT_STORE_CONFIG.customAdminSlug,
        customAdminLoginSlug: formData.customAdminLoginSlug || DEFAULT_STORE_CONFIG.customAdminLoginSlug,
        customAdminRegisterSlug: formData.customAdminRegisterSlug || DEFAULT_STORE_CONFIG.customAdminRegisterSlug,
        allowAdminRegistration: formData.allowAdminRegistration !== undefined ? formData.allowAdminRegistration : true,
      };

      setFormData(resetConfig);
      setStoreConfig(resetConfig);

      // Clean local storage cached primary & background colors
      localStorage.removeItem('ecom_cached_theme_primary_color');
      localStorage.removeItem('ecom_cached_store_bg_color');
      localStorage.setItem('ecom_cached_store_config', JSON.stringify(resetConfig));

      const res = await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetConfig)
      });

      if (res.ok) {
        setSaveSuccessMsg(isAr ? 'تمت استعادة كافة إعدادات وألوان ونصوص المتجر إلى الحالة الأصلية الافتراضية بنجاح!' : 'All store settings, themes, and content have been successfully reset to defaults!');
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error resetting store config:', err);
      setSaveSuccessMsg(isAr ? 'حدث خطأ أثناء استعادة الإعدادات الافتراضية' : 'Error resetting settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Update a custom text field
  const handleUpdateText = (key: string, lang: 'ar' | 'en', val: string) => {
    setFormData(prev => {
      const customTexts = { ...(prev.customTexts || {}) };
      if (!customTexts[lang]) customTexts[lang] = {};
      
      if (!val.trim()) {
        delete (customTexts[lang] as any)[key];
      } else {
        (customTexts[lang] as any)[key] = val;
      }
      
      // Also update direct banner properties if editing hero subtitle or title
      let bannerTitle = prev.bannerTitle;
      let bannerSubtitle = prev.bannerSubtitle;
      let bannerTitleEn = prev.bannerTitleEn;
      let bannerSubtitleEn = prev.bannerSubtitleEn;

      if (key === 'mavluyHeroSubtitle') {
        if (lang === 'ar') bannerSubtitle = val;
        else bannerSubtitleEn = val;
      }
      if (key === 'mavluyHeroTitle') {
        if (lang === 'ar') bannerTitle = val;
        else bannerTitleEn = val;
      }

      return {
        ...prev,
        customTexts,
        bannerTitle,
        bannerSubtitle,
        bannerTitleEn,
        bannerSubtitleEn
      };
    });
  };

  // Reset a custom text to default
  const handleResetText = (key: string, lang: 'ar' | 'en') => {
    handleUpdateText(key, lang, '');
  };

  // Save all branding and content changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      setStoreConfig(formData);
      
      const res = await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSaveSuccessMsg(isAr ? 'تم حفظ وتطبيق التعديلات بنجاح على المتجر!' : 'Brand and content settings saved successfully!');
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setSaveSuccessMsg(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered fields based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return CONTENT_SECTIONS.filter(s => s.id === contentSection);
    }
    const q = searchQuery.toLowerCase();
    return CONTENT_SECTIONS.map(section => {
      const matchingFields = section.fields.filter(f => 
        f.labelAr.toLowerCase().includes(q) ||
        f.labelEn.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.defaultAr.toLowerCase().includes(q) ||
        f.defaultEn.toLowerCase().includes(q) ||
        (formData.customTexts?.ar && (formData.customTexts.ar as any)[f.key]?.toLowerCase().includes(q)) ||
        (formData.customTexts?.en && (formData.customTexts.en as any)[f.key]?.toLowerCase().includes(q))
      );
      return { ...section, fields: matchingFields };
    }).filter(s => s.fields.length > 0);
  }, [searchQuery, contentSection, formData.customTexts]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181b] p-5 sm:p-6 rounded-[2rem] border border-stone-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[#2563eb]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-100 font-serif">
                {isAr ? 'تخصيص الهوية واللوجو ونصوص المتجر' : 'Brand, Logo & Content Customizer'}
              </h2>
              <p className="text-xs text-stone-400 font-medium">
                {isAr ? 'تحكم كامل في الشعار (لوجو نصي أو صورة)، ألوان المتجر، وتعديل أي نص أو عبارة تظهر للزبائن.' : 'Customize logo (text or image), store primary theme color, and edit any text shown to customers.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 hover:text-amber-300 text-stone-300 border border-stone-700 text-xs font-bold py-2.5 px-4 sm:px-5 rounded-full transition-all cursor-pointer shadow-sm"
            title={isAr ? 'إرجاع كافة إعدادات وألوان ونصوص المتجر إلى الحالة الأصلية' : 'Reset all store configurations to default'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'استعادة الإعدادات الأصلية' : 'Reset to Default'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-extrabold py-2.5 px-5 sm:px-6 rounded-full transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ ونشر التعديلات' : 'Save & Publish')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset to Defaults */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#18181b] border border-stone-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {isAr ? 'استعادة الحالة الأصلية للمتجر؟' : 'Reset Store to Default?'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {isAr ? 'إرجاع كافة الألوان والشعار والنصوص إلى أصلها' : 'Restore original colors, logo, and texts'}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
              {isAr
                ? 'هل أنت متأكد من رغبتك في إرجاع ألوان المتجر، ثيمات لوحة التحكم، الشعار، والنصوص إلى الحالة الافتراضية الأصلية؟ يمكنك إعادة تخصيصها في أي وقت.'
                : 'Are you sure you want to restore all store colors, themes, logo, and content to their original factory defaults?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700 cursor-pointer transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleResetAllToDefault}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'نعم، استعادة الكل' : 'Yes, Reset All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('logo')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'logo'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>{isAr ? '1. الشعار واللوجو (Logo & Brand)' : '1. Logo & Brand'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('colors')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'colors'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>{isAr ? '2. ألوان المتجر (Theme Colors)' : '2. Theme Colors'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('content')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'content'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? '3. محرر نصوص ومحتوى الموقع (Content CMS)' : '3. Content CMS'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: LOGO & BRAND */}
      {/* ========================================================= */}
      {activeSubTab === 'logo' && (
        <div className="space-y-6">
          {/* Live Preview Box */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-200">
                  {isAr ? 'معاينة حية للشعار (Live Logo Preview)' : 'Live Logo Preview'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400 font-medium">
                  {isAr ? 'خلفية المعاينة:' : 'Preview Background:'}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDarkBg(false)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    !previewDarkBg 
                      ? 'bg-white text-stone-900 border-white shadow-xs' 
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  {isAr ? 'فاتحة (Light)' : 'Light'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDarkBg(true)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    previewDarkBg 
                      ? 'bg-stone-950 text-white border-stone-700 shadow-xs' 
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  {isAr ? 'داكنة (Dark)' : 'Dark'}
                </button>
              </div>
            </div>

            {/* Interactive Preview Canvas */}
            <div className={`rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center transition-colors border ${
              previewDarkBg 
                ? 'bg-[#0f172a] border-stone-800 text-white' 
                : 'bg-[#faf8f5] border-[#e8e2d9] text-stone-900'
            }`}>
              <StoreLogo 
                config={formData} 
                variant={previewDarkBg ? 'dark' : 'light'} 
                size="hero" 
                showTagline={Boolean(formData.logoTagline)}
              />
              <span className="text-[10px] text-stone-400 mt-4 font-mono font-semibold">
                {formData.logoType === 'image' ? (isAr ? 'نوع الشعار: صورة مخصصة' : 'Logo Type: Custom Image') : (isAr ? 'نوع الشعار: نصي ثنائي الألوان' : 'Logo Type: Styled Dual Text')}
              </span>
            </div>
          </div>

          {/* Logo Type Selector */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider">
                {isAr ? 'اختر نمط الشعار (Logo Type)' : 'Select Logo Type'}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'يمكنك استخدام شعار نصي أنيق ثنائي الألوان، أو رفع صورة خاصة بشعار علامتك التجارية.' : 'Choose between an elegant styled text logo or upload your own brand image.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, logoType: 'text' }))}
                className={`p-5 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-4 ${
                  formData.logoType !== 'image'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${formData.logoType !== 'image' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-stone-100 flex items-center gap-2">
                    <span>{isAr ? 'شعار نصي راقي (Text Logo)' : 'Text Logo'}</span>
                    {formData.logoType !== 'image' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                    {isAr ? 'تصميم نصي ثنائي اللون مع تخصيص الخط واللون والبادئة واللاحقة وسلوجن.' : 'Dual-tone text with customized fonts, colors, prefix and suffix styling.'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, logoType: 'image' }))}
                className={`p-5 rounded-2xl border text-start transition-all cursor-pointer flex items-start gap-4 ${
                  formData.logoType === 'image'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className={`p-3 rounded-xl ${formData.logoType === 'image' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-stone-100 flex items-center gap-2">
                    <span>{isAr ? 'شعار مصور / صورة (Image Logo)' : 'Image / Photo Logo'}</span>
                    {formData.logoType === 'image' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                    {isAr ? 'رفع ملف صورة أو إدراج رابط الشعار (PNG / SVG / JPG) مع التحكم بالحجم.' : 'Upload your transparent PNG/SVG brand logo file or enter an image link.'}
                  </p>
                </div>
              </button>
            </div>

            {/* IF TEXT LOGO: Text Config Inputs */}
            {formData.logoType !== 'image' && (
              <div className="space-y-6 pt-4 border-t border-stone-800 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {isAr ? 'الجزء الأول من الاسم (Prefix - مثل: Mav)' : 'Logo First Part (Prefix)'} *
                    </label>
                    <input
                      type="text"
                      value={formData.logoTextPrefix ?? 'Mav'}
                      onChange={e => setFormData(prev => ({ ...prev, logoTextPrefix: e.target.value }))}
                      placeholder="e.g. Mav"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {isAr ? 'الجزء الملون من الاسم (Accent - مثل: luy)' : 'Logo Accent Part (Colored)'} *
                    </label>
                    <input
                      type="text"
                      value={formData.logoTextAccent ?? 'luy'}
                      onChange={e => setFormData(prev => ({ ...prev, logoTextAccent: e.target.value }))}
                      placeholder="e.g. luy"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {isAr ? 'العبارة التوضيحية للشعار (Tagline / Slogan - اختياري)' : 'Tagline / Slogan (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.logoTagline || ''}
                    onChange={e => setFormData(prev => ({ ...prev, logoTagline: e.target.value }))}
                    placeholder="e.g. Refined Living & Shopping"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Font Style Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {isAr ? 'نوع ونمط الخط (Typography Style)' : 'Typography Style'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {FONT_STYLES.map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoFontStyle: style.id as any }))}
                        className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                          (formData.logoFontStyle || 'serif') === style.id
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <span className={`text-base block mb-1 text-stone-100 ${style.fontClass}`}>
                          {formData.logoTextPrefix || 'Mav'}<span style={{ color: formData.logoAccentColor || formData.themePrimaryColor || '#2563eb' }}>{formData.logoTextAccent || 'luy'}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 font-sans block">{isAr ? style.labelAr : style.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Accent Color */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {isAr ? 'لون الجزء المميّز من الشعار (Logo Accent Color)' : 'Logo Accent Color'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoAccentColor: preset.value }))}
                        className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-all cursor-pointer ${
                          (formData.logoAccentColor || formData.themePrimaryColor || '#2563eb') === preset.value
                            ? 'border-white text-white scale-105 shadow-md'
                            : 'border-stone-800 text-stone-400 hover:text-white'
                        }`}
                        style={{ backgroundColor: `${preset.value}25` }}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.value }} />
                        <span>{isAr ? preset.nameAr.split(' ')[0] : preset.nameEn.split(' ')[0]}</span>
                      </button>
                    ))}
                    
                    {/* Custom Hex picker */}
                    <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-full">
                      <input
                        type="color"
                        value={formData.logoAccentColor || formData.themePrimaryColor || '#2563eb'}
                        onChange={e => setFormData(prev => ({ ...prev, logoAccentColor: e.target.value }))}
                        className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={formData.logoAccentColor || formData.themePrimaryColor || '#2563eb'}
                        onChange={e => setFormData(prev => ({ ...prev, logoAccentColor: e.target.value }))}
                        className="w-20 bg-transparent text-[11px] font-mono text-stone-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IF IMAGE LOGO: File upload / URL inputs */}
            {formData.logoType === 'image' && (
              <div className="space-y-6 pt-4 border-t border-stone-800 animate-fadeIn">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {isAr ? 'تحميل صورة الشعار (PNG شفاف مفضل)' : 'Upload Logo Image (Transparent PNG Recommended)'}
                  </label>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="flex-1 w-full border-2 border-dashed border-stone-800 hover:border-blue-500/50 bg-stone-900/50 hover:bg-stone-900 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files[0]) {
                            try {
                              const cloudUrl = await uploadImageToCloud(files[0], 800, 800, 0.90);
                              setFormData(prev => ({ ...prev, logoImage: cloudUrl }));
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      />
                      <Upload className="w-6 h-6 text-[#2563eb]" />
                      <span className="text-xs font-bold text-stone-200">
                        {isAr ? 'اضغط لرفع صورة الشعار من جهازك' : 'Click to upload logo image from device'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        PNG, SVG, JPG, WebP (Max 5MB)
                      </span>
                    </label>

                    {formData.logoImage && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-700 bg-stone-950 p-2 flex items-center justify-center">
                          <img src={formData.logoImage} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoImage: '' }))}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'حذف الشعار' : 'Remove Logo'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {isAr ? 'أو إدخال رابط الصورة مباشرة (Image URL):' : 'Or enter direct Image URL:'}
                  </label>
                  <input
                    type="url"
                    value={formData.logoImage || ''}
                    onChange={e => setFormData(prev => ({ ...prev, logoImage: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Logo Height Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {isAr ? 'ارتفاع وحجم الشعار في المتجر (Logo Display Height):' : 'Logo Display Height:'}
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {formData.logoImageHeight || 36}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={formData.logoImageHeight || 36}
                    onChange={e => setFormData(prev => ({ ...prev, logoImageHeight: Number(e.target.value) }))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: SITE THEME COLORS & DASHBOARD THEME */}
      {/* ========================================================= */}
      {activeSubTab === 'colors' && (
        <div className="space-y-6">
          {/* Section 1: Store Primary Color */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                <span>{isAr ? '1. اللون الأساسي لهوية المتجر (Store Primary Color)' : '1. Store Primary Brand Color'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'يتحكم في لون الأزرار الرئيسية، البادجات، شريط التحميل، السلة، وتفاصيل الشراء في جميع صفحات المتجر.' : 'Controls primary buttons, active badges, top loading bars, cart buttons, and key accent highlights.'}
              </p>
            </div>

            {/* Color Palettes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COLOR_PRESETS.map(preset => {
                const isSelected = (formData.themePrimaryColor || '#2563eb') === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      themePrimaryColor: preset.value,
                      accentColor: preset.accentKey as any,
                      logoAccentColor: prev.logoAccentColor || preset.value
                    }))}
                    className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-white bg-stone-850 shadow-lg scale-102 ring-2 ring-blue-500/20'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-8 h-8 rounded-xl shadow-md flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: preset.value }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-stone-100">{isAr ? preset.nameAr : preset.nameEn}</div>
                        <div className="text-[10px] font-mono text-stone-400">{preset.value}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-200">
                  {isAr ? 'أو اختر أي لون مخصص بدقة (Custom Primary Hex):' : 'Or choose any custom Hex color:'}
                </span>
                <p className="text-[10px] text-stone-400">
                  {isAr ? 'يمكنك كتابة كود اللون (مثل #2563eb أو #059669 أو #d97706) أو استخدام لوحة الألوان' : 'Enter standard hex code or pick from color wheel'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.themePrimaryColor || '#2563eb'}
                  onChange={e => setFormData(prev => ({ ...prev, themePrimaryColor: e.target.value }))}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formData.themePrimaryColor || '#2563eb'}
                  onChange={e => setFormData(prev => ({ ...prev, themePrimaryColor: e.target.value }))}
                  placeholder="#2563eb"
                  className="w-28 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Store Background Color (خلفية المتجر) */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>{isAr ? '2. لون وخلفية المتجر (Store Background Color)' : '2. Store Background Color'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'تحكم في لون الخلفية العام لمتجرك وصفحات المنتجات والسلة، بين الأبيض الناصع، الكريمي الراقي، أو الثيم الليلي الفخم.' : 'Customize the storefront body background color: clean pure white, warm ivory, modern slate, or dark luxury.'}
              </p>
            </div>

            {/* Background Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { nameAr: 'كريمي فاخر (أصلي)', nameEn: 'Warm Ivory', hex: '#faf8f5', border: '#e8e2d9' },
                { nameAr: 'أبيض ناصع', nameEn: 'Pure White', hex: '#ffffff', border: '#e2e8f0' },
                { nameAr: 'رمادي خفيف (Clean)', nameEn: 'Cool Slate', hex: '#f8fafc', border: '#cbd5e1' },
                { nameAr: 'كتان طبيعي دافئ', nameEn: 'Warm Linen', hex: '#fdfbf7', border: '#e6ded1' },
                { nameAr: 'لؤلؤي ناعم', nameEn: 'Soft Pearl', hex: '#f4f4f5', border: '#d4d4d8' },
                { nameAr: 'داكن فاخر (Luxury)', nameEn: 'Obsidian Dark', hex: '#09090b', border: '#27272a' },
              ].map(bgItem => {
                const isSelected = (formData.storeBackgroundColor || '#faf8f5').toLowerCase() === bgItem.hex.toLowerCase();
                return (
                  <button
                    key={bgItem.hex}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, storeBackgroundColor: bgItem.hex }))}
                    className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-stone-850 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="w-7 h-7 rounded-xl border shadow-xs flex items-center justify-center" 
                        style={{ backgroundColor: bgItem.hex, borderColor: bgItem.border }}
                      >
                        {isSelected && <Check className={`w-3.5 h-3.5 ${bgItem.hex === '#09090b' ? 'text-white' : 'text-stone-900'}`} />}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">{bgItem.hex}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-200">{isAr ? bgItem.nameAr : bgItem.nameEn}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Background Color Picker */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-200">
                  {isAr ? 'أو اختر كود لون خلفية المتجر المخصص:' : 'Or enter custom Store Background Hex:'}
                </span>
                <p className="text-[10px] text-stone-400">
                  {isAr ? 'اكتب كود الـ Hex المطلوب (مثال: #ffffff أو #faf8f5 أو #f1f5f9)' : 'Enter custom hex code (e.g. #ffffff or #faf8f5)'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.storeBackgroundColor || '#faf8f5'}
                  onChange={e => setFormData(prev => ({ ...prev, storeBackgroundColor: e.target.value }))}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formData.storeBackgroundColor || '#faf8f5'}
                  onChange={e => setFormData(prev => ({ ...prev, storeBackgroundColor: e.target.value }))}
                  placeholder="#faf8f5"
                  className="w-28 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dashboard Theme & Colors (ألوان لوحة التحكم) */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? '3. ثيم وألوان لوحة التحكم (Dashboard Theme & UI)' : '3. Dashboard Theme & UI Colors'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'خصص مظهر لوحة التحكم الخاصة بك: ثيم الفحم الحديث، الأزرق الليلي، ثيم الزمرد، أو المظهر الفاتح الناصع.' : 'Customize the admin dashboard theme palette: Modern Charcoal, Midnight Blue, Emerald, Indigo, or Clean Light.'}
              </p>
            </div>

            {/* Dashboard Preset Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  id: 'dark', 
                  nameAr: 'فحم حديث (Dark Charcoal)', 
                  nameEn: 'Dark Charcoal (Default)', 
                  bg: '#09090b', 
                  sidebar: '#18181b', 
                  accent: '#2563eb',
                  card: '#18181b'
                },
                { 
                  id: 'midnight', 
                  nameAr: 'أزرق كحلي ليلي (Midnight)', 
                  nameEn: 'Midnight Navy', 
                  bg: '#0b0f19', 
                  sidebar: '#111827', 
                  accent: '#3b82f6',
                  card: '#111827'
                },
                { 
                  id: 'slate', 
                  nameAr: 'رمادي أردوازي (Slate)', 
                  nameEn: 'Slate Deep', 
                  bg: '#0f172a', 
                  sidebar: '#1e293b', 
                  accent: '#38bdf8',
                  card: '#1e293b'
                },
                { 
                  id: 'emerald', 
                  nameAr: 'أخضر زمردي (Emerald Forest)', 
                  nameEn: 'Emerald Forest', 
                  bg: '#022c22', 
                  sidebar: '#064e3b', 
                  accent: '#10b981',
                  card: '#064e3b'
                },
                { 
                  id: 'royal-indigo', 
                  nameAr: 'أرجواني ملكي (Royal Indigo)', 
                  nameEn: 'Royal Indigo', 
                  bg: '#1e1b4b', 
                  sidebar: '#312e81', 
                  accent: '#818cf8',
                  card: '#312e81'
                },
                { 
                  id: 'luxury-black', 
                  nameAr: 'أسود ذهبي فاخر (Obsidian Gold)', 
                  nameEn: 'Obsidian Gold', 
                  bg: '#14110b', 
                  sidebar: '#221c11', 
                  accent: '#f59e0b',
                  card: '#221c11'
                },
                { 
                  id: 'light', 
                  nameAr: 'أبيض فاتح (Clean Light)', 
                  nameEn: 'Clean Modern Light', 
                  bg: '#f8fafc', 
                  sidebar: '#ffffff', 
                  accent: '#2563eb',
                  card: '#ffffff'
                },
                { 
                  id: 'custom', 
                  nameAr: 'تخصيص حر (Custom Palette)', 
                  nameEn: 'Custom Palette', 
                  bg: formData.dashboardBackgroundColor || '#09090b', 
                  sidebar: formData.dashboardSidebarColor || '#18181b', 
                  accent: formData.dashboardPrimaryColor || formData.themePrimaryColor || '#2563eb',
                  card: formData.dashboardCardColor || '#18181b'
                }
              ].map(themeItem => {
                const isSelected = (formData.dashboardTheme || 'dark') === themeItem.id;
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      dashboardTheme: themeItem.id as any,
                      dashboardBackgroundColor: themeItem.bg,
                      dashboardSidebarColor: themeItem.sidebar,
                      dashboardPrimaryColor: themeItem.accent,
                      dashboardCardColor: themeItem.card
                    }))}
                    className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-stone-850 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg border border-stone-700 shadow-xs" style={{ backgroundColor: themeItem.bg }} />
                        <span className="w-5 h-5 rounded-lg border border-stone-700 shadow-xs" style={{ backgroundColor: themeItem.sidebar }} />
                        <span className="w-5 h-5 rounded-lg shadow-xs" style={{ backgroundColor: themeItem.accent }} />
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-stone-100">{isAr ? themeItem.nameAr : themeItem.nameEn}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{themeItem.id === 'custom' ? (isAr ? 'تحكم في كل لون بنفسك' : 'Custom hex colors') : `${themeItem.bg} / ${themeItem.sidebar}`}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Dashboard Colors Picker (if custom or desired) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-800">
              {/* Dashboard Accent Color */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                  {isAr ? 'لون أزرار وتحديدات اللوحة (Accent):' : 'Dashboard Accent Color:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.dashboardPrimaryColor || formData.themePrimaryColor || '#2563eb'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardPrimaryColor: e.target.value }))}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.dashboardPrimaryColor || formData.themePrimaryColor || '#2563eb'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardPrimaryColor: e.target.value }))}
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 uppercase"
                  />
                </div>
              </div>

              {/* Dashboard Background Color */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                  {isAr ? 'خلفية لوحة التحكم (Background):' : 'Dashboard Background:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.dashboardBackgroundColor || '#09090b'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardBackgroundColor: e.target.value }))}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.dashboardBackgroundColor || '#09090b'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardBackgroundColor: e.target.value }))}
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 uppercase"
                  />
                </div>
              </div>

              {/* Dashboard Sidebar Color */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                  {isAr ? 'شريط القائمة الجانبية (Sidebar):' : 'Dashboard Sidebar:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.dashboardSidebarColor || '#18181b'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardSidebarColor: e.target.value }))}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.dashboardSidebarColor || '#18181b'}
                    onChange={e => setFormData(prev => ({ ...prev, dashboardTheme: 'custom', dashboardSidebarColor: e.target.value }))}
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: CONTENT & TEXTS CMS */}
      {/* ========================================================= */}
      {activeSubTab === 'content' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Search & Language Bar */}
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-4 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5 rtl:left-auto rtl:right-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن أي نص أو كلمة في المتجر للتعديل الفوري عليها (مثال: وجهتك الأولى، تسوق، اطلب...)' : 'Search any text or phrase to edit...'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 rtl:right-auto rtl:left-3 text-stone-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <span className="text-[11px] text-stone-400 font-bold">
                {isAr ? 'لغة النصوص المراد تعديلها:' : 'Target Language:'}
              </span>
              <button
                type="button"
                onClick={() => setContentLang('ar')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  contentLang === 'ar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                العربية (Arabic)
              </button>
              <button
                type="button"
                onClick={() => setContentLang('en')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  contentLang === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Section Pills (when not searching) */}
          {!searchQuery && (
            <div className="flex flex-wrap gap-2">
              {CONTENT_SECTIONS.map(section => {
                const Icon = section.icon;
                const isSelected = contentSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setContentSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-100 text-stone-900 shadow-md font-extrabold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{isAr ? section.titleAr : section.titleEn}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Editable Fields List */}
          <div className="space-y-6">
            {filteredSections.map(section => (
              <div 
                key={section.id} 
                className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xs"
              >
                <div className="border-b border-stone-800 pb-3">
                  <h3 className="text-sm font-extrabold text-stone-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{isAr ? section.titleAr : section.titleEn}</span>
                  </h3>
                </div>

                <div className="space-y-5">
                  {section.fields.map(field => {
                    const customVal = formData.customTexts?.[contentLang]?.[field.key];
                    const defaultVal = contentLang === 'ar' ? field.defaultAr : field.defaultEn;
                    const isCustomized = customVal !== undefined && customVal !== defaultVal;

                    return (
                      <div 
                        key={field.key} 
                        className="bg-stone-900/60 border border-stone-850 p-4 sm:p-5 rounded-2xl space-y-2 transition-all hover:border-stone-750"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-stone-200">
                              {isAr ? field.labelAr : field.labelEn}
                            </label>
                            {isCustomized && (
                              <span className="text-[9px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                                {isAr ? 'معدل مخصص' : 'Customized'}
                              </span>
                            )}
                          </div>

                          {isCustomized && (
                            <button
                              type="button"
                              onClick={() => handleResetText(field.key, contentLang)}
                              className="text-[10px] text-stone-400 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title={isAr ? 'استعادة النص الافتراضي الأصلي' : 'Reset to default'}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                            </button>
                          )}
                        </div>

                        {field.isLong ? (
                          <textarea
                            rows={3}
                            value={customVal ?? defaultVal}
                            onChange={e => handleUpdateText(field.key, contentLang, e.target.value)}
                            placeholder={defaultVal}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-medium leading-relaxed resize-y"
                          />
                        ) : (
                          <input
                            type="text"
                            value={customVal ?? defaultVal}
                            onChange={e => handleUpdateText(field.key, contentLang, e.target.value)}
                            placeholder={defaultVal}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-medium"
                          />
                        )}

                        <div className="text-[10px] text-stone-500 flex items-center justify-between font-mono">
                          <span>Key: {field.key}</span>
                          <span className="truncate max-w-[280px]">
                            {isAr ? 'الافتراضي:' : 'Default:'} "{defaultVal}"
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-12 text-center text-stone-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                <h4 className="text-sm font-bold text-stone-200">
                  {isAr ? 'لم يتم العثور على نصوص مطابقة' : 'No matching texts found'}
                </h4>
                <p className="text-xs text-stone-500">
                  {isAr ? 'جرب البحث بكلمة مختلفة أو تصفح الأقسام مباشرة.' : 'Try a different search term or browse categories directly.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
