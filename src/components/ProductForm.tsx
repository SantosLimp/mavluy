import React, { useRef, useState } from 'react';
import {
  Package,
  Layers,
  Image as ImageIcon,
  Trash2,
  Plus,
  Info,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Video,
  Play,
  Film,
  Link as LinkIcon,
  Sliders,
  MoveVertical,
  ExternalLink,
  Minus,
  Cloud,
  HelpCircle,
  Tag,
  Star,
  CheckCircle2,
  Percent,
  Flame,
  RotateCcw,
  Shirt,
  Footprints,
  FileText
} from 'lucide-react';
import { Product, StoreConfig, PricingTier } from '../types';
import { readFileAsDataUrl, readMultipleFilesAsDataUrls, uploadImageToCloud, uploadMultipleImagesToCloud, extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from '../utils/mediaUtils';
import { ALL_STORE_CATEGORIES, FEATURE_ICONS_LIST, renderFeatureVectorIcon } from '../utils/iconMap';
import { IconPicker } from './IconPicker';
import { CustomSelect } from './CustomSelect';
import { getDisplayCurrency } from '../utils/adminTranslations';

export { FEATURE_ICONS_LIST };

interface ProductFormProps {
  isEdit: boolean;
  product: Partial<Product>;
  onChange: (updater: (prev: Partial<Product>) => Partial<Product>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  storeConfig: StoreConfig;
  modalTab: 'basic' | 'landing' | 'media';
  setModalTab: (tab: 'basic' | 'landing' | 'media') => void;
  extraImage: string;
  setExtraImage: (val: string) => void;
  dashboardLang?: 'en' | 'ar';
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isEdit,
  product,
  onChange,
  onSubmit,
  onCancel,
  storeConfig,
  modalTab,
  setModalTab,
  dashboardLang = 'ar'
}) => {
  const isAr = dashboardLang === 'ar';
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [dragActiveMain, setDragActiveMain] = useState(false);
  const [dragActiveGallery, setDragActiveGallery] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [isVideoPreviewPlaying, setIsVideoPreviewPlaying] = useState(false);

  const handleAddGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return;
    onChange(prev => ({
      ...prev,
      additionalImages: [...(prev.additionalImages || []), galleryUrlInput.trim()]
    }));
    setGalleryUrlInput('');
  };

  const displayCurrency = getDisplayCurrency(storeConfig.currency, dashboardLang);

  const handleMainImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert(isAr ? 'يرجى رفع ملف صورة صالح (PNG, JPG, WEBP, إلخ)' : 'Please upload an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    try {
      setIsUploadingMain(true);
      const cloudUrl = await uploadImageToCloud(file, 1400, 1400, 0.85);
      onChange(prev => ({ ...prev, image: cloudUrl }));
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert(isAr ? 'فشل رفع الصورة، يرجى المحاولة مرة أخرى.' : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingMain(false);
      if (mainImageInputRef.current) mainImageInputRef.current.value = '';
    }
  };

  const handleGalleryImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setIsUploadingGallery(true);
      const newUrls = await uploadMultipleImagesToCloud(files, 1400, 1400, 0.85);
      if (newUrls.length > 0) {
        onChange(prev => ({
          ...prev,
          additionalImages: [...(prev.additionalImages || []), ...newUrls]
        }));
      }
    } catch (err) {
      console.error('Failed to upload gallery images:', err);
      alert(isAr ? 'فشل رفع بعض صور المعرض.' : 'Failed to upload some gallery images.');
    } finally {
      setIsUploadingGallery(false);
      if (galleryImageInputRef.current) galleryImageInputRef.current.value = '';
    }
  };

  const currentYouTubeId = product.videoUrl ? extractYouTubeId(product.videoUrl) : null;

  const handleVideoUrlChange = (val: string) => {
    setIsVideoPreviewPlaying(false);
    const id = extractYouTubeId(val);
    const thumb = id ? getYouTubeThumbnail(id) : undefined;
    onChange(prev => ({
      ...prev,
      videoUrl: val,
      videoThumbnail: thumb,
      videoPosition: prev.videoPosition || 'after_photos',
      videoAsPrimary: prev.videoPosition === 'first',
      videoAutoplay: false
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-2xl border border-stone-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">{isAr ? 'العودة للمنتجات' : 'Back to Products'}</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">
              {isEdit
                ? (isAr ? `تعديل: ${product.name || 'المنتج'}` : `Edit: ${product.name || 'Product'}`)
                : (isAr ? 'إضافة منتج جديد' : 'Add New Product Item')}
            </h2>
            <p className="text-xs text-stone-400">
              {isEdit
                ? (isAr ? 'تحديث الأسعار، المخزون، الوصف، الصور، الفيديو وصفحة الهبوط' : 'Update pricing, inventory, descriptions, photos, YouTube video, and landing sections')
                : (isAr ? 'رفع الصور من حاسوبك، تحديد الأسعار، وتخصيص صفحة الهبوط' : 'Upload images from your device, set prices, and customize your product landing page')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-5 py-2.5 sm:py-3 rounded-full text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-all cursor-pointer uppercase tracking-wider"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            form="product-editor-form"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 sm:py-3 rounded-full shadow-md shadow-blue-600/20 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Check className="w-4 h-4" />
            <span>{isEdit ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'نشر المنتج' : 'Publish Product')}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#18181b] p-1.5 rounded-2xl border border-stone-800 w-full sm:max-w-xl">
        <button
          type="button"
          onClick={() => setModalTab('basic')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            modalTab === 'basic' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isAr ? '1. البيانات الأساسية' : '1. Basic Info'}</span>
        </button>
        <button
          type="button"
          onClick={() => setModalTab('landing')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            modalTab === 'landing' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? '2. صفحة الهبوط والمميزات' : '2. Landing & Features'}</span>
        </button>
        <button
          type="button"
          onClick={() => setModalTab('media')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            modalTab === 'media' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{isAr ? '3. الصور والفيديو' : '3. Media & Video'}</span>
        </button>
      </div>

      <form id="product-editor-form" onSubmit={onSubmit} className="space-y-6">
        {modalTab === 'basic' && (
          <div className="bg-[#18181b] rounded-3xl p-5 sm:p-8 border border-stone-800 shadow-sm space-y-6 animate-fadeIn">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-stone-100 font-bold text-sm sm:text-base font-serif">
                {isAr ? 'المعلومات الأساسية للمنتج' : 'Core Product Information'}
              </h3>
              <p className="text-xs text-stone-400">
                {isAr ? 'حدد الاسم، الأسعار، المخزون، والصورة الرئيسية المرفوعة من جهازك' : 'Specify name, pricing, stock and main image uploaded from your device'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'اسم المنتج *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={product.name || ''}
                  onChange={e => onChange(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isAr ? 'مثال: زيت الأرغان العضوي النقي 100 مل' : 'e.g. ORGANIC ARGAN OIL 100ML'}
                  className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#2563eb] font-semibold"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                    {isAr ? 'التصنيف *' : 'Category *'}
                  </label>
                  <span className="text-[10px] text-blue-400 font-medium">
                    {isAr
                      ? (ALL_STORE_CATEGORIES.find(c => c.name.toLowerCase() === (product.category || '').toLowerCase())?.nameAr || 'تصنيف مخصص')
                      : (ALL_STORE_CATEGORIES.find(c => c.name.toLowerCase() === (product.category || '').toLowerCase())?.nameEn || 'Custom Category')}
                  </span>
                </div>
                <CustomSelect
                  options={ALL_STORE_CATEGORIES.map(cat => ({
                    value: cat.name,
                    label: isAr ? cat.nameAr : cat.nameEn,
                    labelSecondary: isAr ? cat.nameEn : cat.nameAr,
                    icon: renderFeatureVectorIcon(cat.iconName, "w-4 h-4 text-blue-400"),
                    badge: cat.id === 'general' ? undefined : (isAr ? cat.nameAr : cat.nameEn)
                  }))}
                  value={product.category || 'Clothing'}
                  onChange={val => onChange(prev => ({ ...prev, category: val }))}
                  theme="dark"
                  searchable={true}
                  searchPlaceholder={isAr ? 'ابحث عن تصنيف...' : 'Search category...'}
                  allowCustom={true}
                  customPlaceholder={isAr ? 'اكتب تصنيفاً خاصاً...' : 'Type a custom category name...'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'المخزون المتوفر *' : 'Stock Level *'}
                </label>
                <div className="flex items-center border border-stone-800 bg-stone-900 rounded-2xl overflow-hidden focus-within:border-[#2563eb]">
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, stock: Math.max(0, (Number(prev.stock) || 0) - 1) }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-r border-stone-800 cursor-pointer select-none"
                    aria-label="Decrease stock"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    required
                    min="0"
                    value={product.stock ?? 20}
                    onChange={e => onChange(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full bg-transparent text-stone-100 text-center text-xs sm:text-sm focus:outline-none font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, stock: (Number(prev.stock) || 0) + 1 }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-l border-stone-800 cursor-pointer select-none"
                    aria-label="Increase stock"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? `سعر البيع (${displayCurrency}) *` : `Retail Price (${displayCurrency}) *`}
                </label>
                <div className="flex items-center border border-stone-800 bg-stone-900 rounded-2xl overflow-hidden focus-within:border-[#2563eb]">
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, price: Math.max(1, (Number(prev.price) || 0) - 10) }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-r border-stone-800 cursor-pointer select-none"
                    aria-label="Decrease price"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    required
                    min="1"
                    value={product.price || ''}
                    onChange={e => onChange(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="299"
                    className="w-full bg-transparent text-stone-100 text-center text-xs sm:text-sm focus:outline-none font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, price: (Number(prev.price) || 0) + 10 }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-l border-stone-800 cursor-pointer select-none"
                    aria-label="Increase price"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                    {isAr ? `سعر الشراء / التكلفة (${displayCurrency})` : `Cost Price / COGS (${displayCurrency})`}
                  </label>
                  <span className="text-[9px] text-stone-500 font-bold">
                    {isAr ? 'لحساب الأرباح بدقة' : 'For P&L'}
                  </span>
                </div>
                <div className="flex items-center border border-emerald-900/40 bg-emerald-950/10 rounded-2xl overflow-hidden focus-within:border-emerald-500">
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, costPrice: Math.max(0, (Number(prev.costPrice) || 0) - 5) }))}
                    className="w-11 h-12 flex items-center justify-center bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-200 border-r border-emerald-900/40 cursor-pointer select-none"
                    aria-label="Decrease cost"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={product.costPrice !== undefined ? product.costPrice : ''}
                    onChange={e => onChange(prev => ({ ...prev, costPrice: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                    placeholder={isAr ? 'مثال: 80' : 'e.g. 80'}
                    className="w-full bg-transparent text-emerald-300 text-center text-xs sm:text-sm focus:outline-none font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, costPrice: (Number(prev.costPrice) || 0) + 5 }))}
                    className="w-11 h-12 flex items-center justify-center bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 hover:text-emerald-200 border-l border-emerald-900/40 cursor-pointer select-none"
                    aria-label="Increase cost"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {Boolean(product.price && product.costPrice && product.price > 0) && (
                  <div className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg flex items-center justify-between ${
                    (product.price - (product.costPrice || 0)) >= 0
                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                      : 'bg-red-950/50 text-red-400 border border-red-900/40'
                  }`}>
                    <span>
                      {isAr ? 'هامش الربح الإجمالي للقطعة:' : 'Gross Margin per Unit:'}
                    </span>
                    <span>
                      {(product.price - (product.costPrice || 0)) >= 0 ? '+' : ''}
                      {product.price - (product.costPrice || 0)} {displayCurrency} ({Math.round(((product.price - (product.costPrice || 0)) / product.price) * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? `السعر قبل التخفيض (${displayCurrency}) - اختياري` : `Compare Price (${displayCurrency}) - Optional`}
                </label>
                <div className="flex items-center border border-stone-800 bg-stone-900 rounded-2xl overflow-hidden focus-within:border-[#2563eb]">
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, originalPrice: Math.max(0, (Number(prev.originalPrice) || 0) - 10) }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-r border-stone-800 cursor-pointer select-none"
                    aria-label="Decrease compare price"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={e => onChange(prev => ({ ...prev, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="450"
                    className="w-full bg-transparent text-stone-100 text-center text-xs sm:text-sm focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, originalPrice: (Number(prev.originalPrice) || 0) + 10 }))}
                    className="w-11 h-12 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-400 hover:text-white border-l border-stone-800 cursor-pointer select-none"
                    aria-label="Increase compare price"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest flex items-center justify-between">
                  <span>{isAr ? 'رمز المنتج (SKU) - اختياري' : 'Product SKU - Optional'}</span>
                  <span className="text-[9px] text-stone-500 font-normal">Stock Keeping Unit</span>
                </label>
                <input
                  type="text"
                  value={product.sku || ''}
                  onChange={e => onChange(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder={isAr ? 'مثال: PRD-ORG-001' : 'e.g. PRD-ORG-001'}
                  className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#2563eb] font-mono uppercase font-bold tracking-wider"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs sm:text-sm font-extrabold text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#2563eb]" />
                      <span>{isAr ? 'عروض وباقات الكميات (اشتري 1، 2، 3 قطع بتخفيض خاص)' : 'Quantity Pricing Tiers & Bundle Offers (Buy 1, 2, 3+)'}</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 max-w-2xl leading-relaxed">
                    {isAr
                      ? 'حدد أسعار خاصة وتخفيضات عند شراء قطعتين أو 3 قطع، مع إمكانية تحديد أي باقة كـ "الأكثر طلباً للزبناء" لتحفيز المشتري وزيادة المبيعات.'
                      : 'Define special bundle discounts for 1, 2, 3+ items and select whichever tier you want as "Most Popular" to boost conversions.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const currentTiers = product.pricingTiers || [];
                      const nextQty = currentTiers.length > 0
                        ? Math.max(...currentTiers.map(t => t.quantity)) + 1
                        : (currentTiers.length === 0 ? 1 : 2);
                      const basePrice = Number(product.price) || 299;
                      const nextPrice = Math.round(basePrice * (nextQty * 0.8));
                      const newTier: PricingTier = {
                        id: `tier-${Date.now()}`,
                        quantity: nextQty,
                        price: nextPrice,
                        labelAr: isAr ? `${nextQty} قطع` : `${nextQty} Pieces`,
                        label: `${nextQty} Pieces`,
                        badge: '',
                        isPopular: false
                      };
                      onChange(prev => ({ ...prev, pricingTiers: [...currentTiers, newTier] }));
                    }}
                    className="text-[11px] font-bold text-white bg-[#2563eb] hover:bg-blue-600 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة خيار كمية مخصص' : 'Add Custom Tier'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-stone-300 text-xs font-bold">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isAr ? 'توليد باقات جاهزة بنقرة زر واحدة:' : 'Instant 1-Click Smart Presets:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const basePrice = Number(product.price) || 299;
                      const p2 = Math.round((basePrice * 2) * 0.82);
                      const p3 = Math.round((basePrice * 3) * 0.72);
                      const defaultTiers: PricingTier[] = [
                        {
                          id: 'tier-1',
                          quantity: 1,
                          price: basePrice,
                          labelAr: 'قطعة واحدة',
                          label: '1 Piece',
                          badge: '',
                          isPopular: false
                        },
                        {
                          id: 'tier-2',
                          quantity: 2,
                          price: p2,
                          labelAr: 'قطعتين (توفير إضافي)',
                          label: '2 Pieces (Special Savings)',
                          badge: isAr ? 'الأكثر طلباً للزبناء' : 'Most Popular',
                          isPopular: true
                        },
                        {
                          id: 'tier-3',
                          quantity: 3,
                          price: p3,
                          labelAr: '3 قطع (أفضل قيمة وتوفير)',
                          label: '3 Pieces (Best Value Offer)',
                          badge: isAr ? 'توفير كبير + توصيل مجاني' : 'Best Value + Free Shipping',
                          isPopular: false
                        }
                      ];
                      onChange(prev => ({ ...prev, pricingTiers: defaultTiers }));
                    }}
                    className="p-2.5 bg-stone-950/80 hover:bg-stone-800/90 border border-stone-800 hover:border-blue-500/60 rounded-xl text-left rtl:text-right transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-200 group-hover:text-blue-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-400" />
                        <span>{isAr ? 'باقة التوفير (1، 2، 3 قطع)' : 'Standard Bundle (1, 2, 3)'}</span>
                      </span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{isAr ? 'مستحسن' : 'Recommended'}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {isAr ? '1 قطعة (عادي) + 2 قطع (الأكثر طلباً) + 3 قطع (أفضل توفير)' : '1 Unit + 2 Units (Popular) + 3 Units (Best Value)'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const basePrice = Number(product.price) || 299;
                      const p2 = Math.round((basePrice * 2) * 0.80);
                      const defaultTiers: PricingTier[] = [
                        {
                          id: 'tier-1',
                          quantity: 1,
                          price: basePrice,
                          labelAr: 'قطعة واحدة',
                          label: '1 Piece',
                          badge: '',
                          isPopular: false
                        },
                        {
                          id: 'tier-2',
                          quantity: 2,
                          price: p2,
                          labelAr: 'قطعتين (عرض خاص مع توصيل مجاني)',
                          label: '2 Pieces (Special Offer + Free Delivery)',
                          badge: isAr ? 'الأكثر طلباً للزبناء' : 'Most Popular',
                          isPopular: true
                        }
                      ];
                      onChange(prev => ({ ...prev, pricingTiers: defaultTiers }));
                    }}
                    className="p-2.5 bg-stone-950/80 hover:bg-stone-800/90 border border-stone-800 hover:border-blue-500/60 rounded-xl text-left rtl:text-right transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-200 group-hover:text-blue-400 flex items-center gap-1">
                        <Package className="w-3 h-3 text-blue-400" />
                        <span>{isAr ? 'باقة الثنائي (1 و 2 قطع)' : 'Duo Pack (1 & 2)'}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {isAr ? '1 قطعة عادية + قطعتين بخصم 20% مع شارة الأكثر طلباً' : '1 Unit standard + 2 Units at 20% off with Popular badge'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const basePrice = Number(product.price) || 299;
                      const defaultTiers: PricingTier[] = [
                        {
                          id: 'tier-1',
                          quantity: 1,
                          price: basePrice,
                          labelAr: 'قطعة واحدة',
                          label: '1 Piece',
                          badge: '',
                          isPopular: false
                        },
                        {
                          id: 'tier-2',
                          quantity: 2,
                          price: Math.round((basePrice * 2) * 0.85),
                          labelAr: 'قطعتين (توفير إضافي)',
                          label: '2 Pieces',
                          badge: isAr ? 'الأكثر طلباً للزبناء' : 'Most Popular',
                          isPopular: true
                        },
                        {
                          id: 'tier-3',
                          quantity: 3,
                          price: Math.round((basePrice * 3) * 0.75),
                          labelAr: '3 قطع (توفير كبير)',
                          label: '3 Pieces',
                          badge: isAr ? 'أفضل توفير' : 'Best Value',
                          isPopular: false
                        },
                        {
                          id: 'tier-4',
                          quantity: 4,
                          price: Math.round((basePrice * 4) * 0.70),
                          labelAr: '4 قطع (باقة العائلة والمهنيين)',
                          label: '4 Pieces (Family Pack)',
                          badge: isAr ? 'العرض الأقوى' : 'Mega Value',
                          isPopular: false
                        }
                      ];
                      onChange(prev => ({ ...prev, pricingTiers: defaultTiers }));
                    }}
                    className="p-2.5 bg-stone-950/80 hover:bg-stone-800/90 border border-stone-800 hover:border-blue-500/60 rounded-xl text-left rtl:text-right transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-200 group-hover:text-blue-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span>{isAr ? 'باقة العائلة (1، 2، 3، 4 قطع)' : 'Family Pack (1, 2, 3, 4)'}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {isAr ? 'خيارات متعددة للأسر والطلبات الكبرى بخصومات تصاعدية' : 'Full scale discounts up to 4 items for higher orders'}
                    </p>
                  </button>
                </div>
              </div>

              {(!product.pricingTiers || product.pricingTiers.length === 0) ? (
                <div className="bg-stone-900/50 rounded-2xl border border-dashed border-stone-800 p-6 text-center space-y-2">
                  <Tag className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs text-stone-400 font-semibold">
                    {isAr ? 'لا توجد باقات كميات مضافة حالياً لهذا المنتج (سيتم البيع بالكمية العادية).' : 'No bulk pricing tiers configured (standard single unit pricing is active).'}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                    {isAr
                      ? 'اختر أحد الباقات الجاهزة أعلاه لتوليد خيارات فورية (1 قطعة، 2 قطع، 3 قطع) مع تحديد الخيار الأكثر طلباً لزيادة المبيعات.'
                      : 'Select a preset above or click Add Tier to let customers choose bundles with custom discounts and a Best-Seller tag.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {product.pricingTiers.map((tier, tIdx) => {
                    const baseUnitPrice = Number(product.price) || 0;
                    const regularTotal = baseUnitPrice * tier.quantity;
                    const bundlePrice = Number(tier.price) || 0;
                    const savings = regularTotal > bundlePrice ? regularTotal - bundlePrice : 0;
                    const savingsPercent = regularTotal > bundlePrice && regularTotal > 0
                      ? Math.round(((regularTotal - bundlePrice) / regularTotal) * 100)
                      : 0;
                    const unitPriceInBundle = tier.quantity > 0 ? (bundlePrice / tier.quantity).toFixed(1) : 0;

                    const quickBadges = [
                      isAr ? 'الأكثر طلباً للزبناء' : 'Most Popular',
                      isAr ? 'الأكثر مبيعاً' : 'Best Seller',
                      isAr ? 'أفضل توفير' : 'Best Savings',
                      isAr ? 'توصيل مجاني' : 'Free Shipping',
                      isAr ? 'العرض الأقوى' : 'Mega Offer',
                    ];

                    return (
                      <div
                        key={tier.id || tIdx}
                        className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                          tier.isPopular
                            ? 'bg-blue-950/25 border-blue-500/70 shadow-sm ring-1 ring-blue-500/30'
                            : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-stone-800 text-stone-300 font-mono font-bold text-xs flex items-center justify-center">
                              #{tIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-stone-100">
                              {isAr ? `الباقة رقم ${tIdx + 1} (${tier.quantity} ${tier.quantity === 1 ? 'قطعة' : 'قطع'})` : `Bundle #${tIdx + 1}: ${tier.quantity} Items`}
                            </span>
                            {tier.isPopular && (
                              <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-600/70 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{isAr ? 'الخيار الأكثر اختياراً للزبناء (يتم اختياره تلقائياً للمشتري)' : 'Most Popular Choice (Auto-selected for buyer)'}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) => ({
                                    ...t,
                                    isPopular: idx === tIdx ? !t.isPopular : false
                                  }))
                                }));
                              }}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                tier.isPopular
                                  ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black border-amber-400 shadow-xs'
                                  : 'bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border-stone-700'
                              }`}
                              title={isAr ? 'تحديد هذا الخيار كأكثر خيار يختاره الزبناء ليظهر مميزاً في صفحة المنتج' : 'Mark as the top choice selected by customers'}
                            >
                              <Star className={`w-3.5 h-3.5 ${tier.isPopular ? 'fill-stone-950 text-stone-950' : 'text-amber-400'}`} />
                              <span>{tier.isPopular ? (isAr ? 'الأكثر طلباً (مفعل)' : 'Most Popular (Active)') : (isAr ? 'تعيين كأكثر طلباً' : 'Set as Most Popular')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).filter((_, idx) => idx !== tIdx)
                                }));
                              }}
                              className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                              title={isAr ? 'حذف هذا الخيار' : 'Delete tier'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                              {isAr ? 'الكمية (عدد القطع)' : 'Quantity (Units)'} *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={tier.quantity}
                              onChange={e => {
                                const val = Math.max(1, Number(e.target.value));
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) =>
                                    idx === tIdx ? { ...t, quantity: val } : t
                                  )
                                }));
                              }}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                              {isAr ? `السعر الإجمالي للباقة (${displayCurrency})` : `Bundle Total (${displayCurrency})`} *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={tier.price || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) =>
                                    idx === tIdx ? { ...t, price: val } : t
                                  )
                                }));
                              }}
                              placeholder="e.g. 499"
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-black text-blue-400 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                              {isAr ? 'عنوان الباقة (اختياري)' : 'Tier Title (Optional)'}
                            </label>
                            <input
                              type="text"
                              value={tier.labelAr || tier.label || ''}
                              onChange={e => {
                                const val = e.target.value;
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) =>
                                    idx === tIdx ? { ...t, labelAr: val, label: val } : t
                                  )
                                }));
                              }}
                              placeholder={isAr ? 'مثال: قطعتين (توفير 100 درهم)' : 'e.g. 2 Pieces (Save 100)'}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                              {isAr ? 'الشريط الترويجي' : 'Promo Badge'}
                            </label>
                            <input
                              type="text"
                              value={tier.badge || ''}
                              onChange={e => {
                                const val = e.target.value;
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) =>
                                    idx === tIdx ? { ...t, badge: val } : t
                                  )
                                }));
                              }}
                              placeholder={isAr ? 'مثال: الأكثر طلباً للزبناء أو توفير 25%' : 'e.g. Most Popular or Save 25%'}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-stone-500 font-medium">{isAr ? 'شارات سريعة:' : 'Quick badges:'}</span>
                          {quickBadges.map((badgeText, bIdx) => (
                            <button
                              key={bIdx}
                              type="button"
                              onClick={() => {
                                onChange(prev => ({
                                  ...prev,
                                  pricingTiers: (prev.pricingTiers || []).map((t, idx) =>
                                    idx === tIdx ? { ...t, badge: badgeText } : t
                                  )
                                }));
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                tier.badge === badgeText
                                  ? 'bg-blue-900/60 text-blue-300 border-blue-500'
                                  : 'bg-stone-800/80 hover:bg-stone-750 text-stone-400 hover:text-stone-200 border-stone-700'
                              }`}
                            >
                              {badgeText}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 flex-wrap gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-stone-400">
                              {isAr ? 'السعر العادي المنفرد:' : 'Regular single total:'} <span className="font-mono text-stone-300 font-bold">{regularTotal} {displayCurrency}</span>
                            </span>
                            {savings > 0 && (
                              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                                {isAr ? `توفير: ${savings} ${displayCurrency} (${savingsPercent}% خصم)` : `Save: ${savings} ${displayCurrency} (${savingsPercent}% OFF)`}
                              </span>
                            )}
                          </div>

                          <div className="text-stone-300 font-mono text-[10px]">
                            {isAr ? `(سعر القطعة في الباقة: ${unitPriceInBundle} ${displayCurrency})` : `(Unit Price: ${unitPriceInBundle} ${displayCurrency}/pc)`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                    {isAr ? 'الصورة الرئيسية للمنتج *' : 'Main Product Image *'}
                  </label>
                  <p className="text-xs text-stone-400">
                    {isAr ? 'ارفع من جهازك أو ضع رابط صورة خارجي مع إمكانية تحريك الصورة للأعلى والأسفل' : 'Upload from device or paste direct URL with vertical alignment adjustment'}
                  </p>
                </div>
                {product.image && (
                  <button
                    type="button"
                    onClick={() => onChange(prev => ({ ...prev, image: '' }))}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {isAr ? 'حذف الصورة' : 'Remove Image'}
                  </button>
                )}
              </div>

              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleMainImageFiles(e.target.files)}
              />

              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'أو أدخل رابط صورة مباشر:' : 'Or Paste Direct Image URL:'}</span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">.jpg, .png, .webp</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={product.image || ''}
                    onChange={e => onChange(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://i.postimg.cc/... or https://i.ibb.co/..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                  {product.image && (
                    <button
                      type="button"
                      onClick={() => onChange(prev => ({ ...prev, image: '' }))}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-all"
                    >
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div
                  onDragOver={e => { e.preventDefault(); setDragActiveMain(true); }}
                  onDragLeave={() => setDragActiveMain(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragActiveMain(false);
                    handleMainImageFiles(e.dataTransfer.files);
                  }}
                  onClick={() => mainImageInputRef.current?.click()}
                  className={`lg:col-span-7 border-2 border-dashed rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActiveMain
                      ? 'border-[#2563eb] bg-blue-950/20'
                      : product.image
                        ? 'border-stone-800 hover:border-blue-500/50 bg-stone-900/40 hover:bg-stone-900'
                        : 'border-blue-600/40 hover:border-[#2563eb] bg-blue-950/10 hover:bg-blue-950/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-[#2563eb] mb-2.5">
                    <Upload className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-100 mb-1">
                    {isUploadingMain
                      ? (isAr ? 'جاري رفع الصورة...' : 'Uploading image...')
                      : (isAr ? 'انقر لرفع صورة من جهازك' : 'Click or Drag to upload from device')}
                  </h4>
                  <p className="text-[11px] text-stone-400 max-w-sm">
                    {isAr ? 'يدعم صيغ (PNG, JPG, WEBP). يتم الحفظ محلياً أو بالرابط.' : 'Supports PNG, JPG, WEBP. Drag and drop supported.'}
                  </p>
                  <button
                    type="button"
                    className="mt-3 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm cursor-pointer transition-all"
                  >
                    {product.image
                      ? (isAr ? 'تغيير الصورة من الجهاز' : 'Change Image from Device')
                      : (isAr ? 'اختر صورة من الجهاز' : 'Browse Device Files')}
                  </button>
                </div>

                <div className="lg:col-span-5 bg-stone-900/70 p-4 rounded-3xl border border-stone-800 flex flex-col items-center justify-center text-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {isAr ? 'المعاينة المباشرة' : 'Live Preview'}
                    </span>
                    {product.image && (
                      <span className="text-[10px] text-blue-400 font-mono font-bold">
                        {product.imageOffsetY !== undefined ? `${product.imageOffsetY}%` : (isAr ? '50% (وسط)' : '50% (Center)')}
                      </span>
                    )}
                  </div>
                  {product.image ? (
                    <div className="relative w-full aspect-square max-w-[210px] rounded-2xl overflow-hidden border border-stone-700 shadow-md group bg-stone-950">
                      <img
                        src={product.image}
                        alt="Main product cover"
                        className="w-full h-full transition-all duration-150"
                        style={{
                          objectFit: (product.imageFit || 'cover') as any,
                          objectPosition: `center ${product.imageOffsetY ?? 50}%`
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            mainImageInputRef.current?.click();
                          }}
                          className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          {isAr ? 'تغيير' : 'Change'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-square max-w-[210px] rounded-2xl bg-stone-850 border border-stone-800 flex flex-col items-center justify-center text-stone-500 text-xs font-medium gap-2">
                      <ImageIcon className="w-8 h-8 text-stone-600" />
                      <span>{isAr ? 'لم يتم رفع صورة بعد' : 'No image uploaded yet'}</span>
                    </div>
                  )}
                </div>
              </div>

              {product.image && (
                <div className="bg-stone-900/90 p-4 sm:p-5 rounded-3xl border border-stone-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-stone-100">
                        {isAr ? 'ضبط موضع ومحاذاة الصورة' : 'Adjust Image Alignment & Fit'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                      {isAr ? 'معاينة فورية' : 'Live Sync'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-stone-950/70 p-3.5 rounded-2xl border border-stone-855">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                          <MoveVertical className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isAr ? 'تحريك الصورة عمودياً:' : 'Vertical Focus (Up / Down):'}</span>
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {product.imageOffsetY ?? 50}%
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={product.imageOffsetY ?? 50}
                        onChange={e => {
                          const val = Number(e.target.value);
                          onChange(prev => ({
                            ...prev,
                            imageOffsetY: val,
                            imagePosition: `center ${val}%`
                          }));
                        }}
                        className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                      />

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onChange(prev => ({ ...prev, imageOffsetY: 15, imagePosition: 'center 15%' }))}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            (product.imageOffsetY ?? 50) <= 25
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                          }`}
                        >
                          {isAr ? '⬆️ أعلى' : '⬆️ Top (15%)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange(prev => ({ ...prev, imageOffsetY: 50, imagePosition: 'center 50%' }))}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            (product.imageOffsetY ?? 50) > 25 && (product.imageOffsetY ?? 50) < 75
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                          }`}
                        >
                          {isAr ? '⏺️ وسط' : '⏺️ Center (50%)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange(prev => ({ ...prev, imageOffsetY: 85, imagePosition: 'center 85%' }))}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            (product.imageOffsetY ?? 50) >= 75
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                          }`}
                        >
                          {isAr ? '⬇️ أسفل' : '⬇️ Bottom (85%)'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 bg-stone-950/70 p-3.5 rounded-2xl border border-stone-855">
                      <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider block">
                        {isAr ? 'طريقة ملاءمة الصورة:' : 'Image Fit Mode:'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onChange(prev => ({ ...prev, imageFit: 'cover' }))}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            (product.imageFit || 'cover') === 'cover'
                              ? 'border-[#2563eb] bg-blue-950/40 text-blue-300 font-bold'
                              : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{isAr ? 'ملء الإطار' : 'Cover (Fill)'}</div>
                          <div className="text-[9.5px] text-stone-400 mt-0.5">{isAr ? 'ملء المربع بالكامل' : 'Fills container'}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange(prev => ({ ...prev, imageFit: 'contain' }))}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            product.imageFit === 'contain'
                              ? 'border-[#2563eb] bg-blue-950/40 text-blue-300 font-bold'
                              : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{isAr ? 'كامل الصورة' : 'Contain (Fit)'}</div>
                          <div className="text-[9.5px] text-stone-400 mt-0.5">{isAr ? 'بدون أي قص' : 'No cropping'}</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-800">
              <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                {isAr ? 'وصف وتفاصيل المنتج' : 'Product Description'}
              </label>
              <textarea
                rows={4}
                value={product.description || ''}
                onChange={e => onChange(prev => ({ ...prev, description: e.target.value }))}
                placeholder={isAr ? 'اكتب تفاصيل المنتج، مميزاته، فوائده، ومكوناته...' : 'Provide rich details, benefits, ingredients, or sizing...'}
                className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Field for Clothing Sizes / Customer Notes in Checkout */}
            <div className="space-y-3 pt-4 border-t border-stone-800">
              <div className="bg-stone-900/90 border border-stone-800 hover:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-4 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#2563eb]" />
                      <h4 className="text-xs sm:text-sm font-bold text-stone-100 font-serif">
                        {isAr ? 'خانة المقاس والملاحظات (استمارة الطلب)' : 'Size & Notes Field (Checkout Form)'}
                      </h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        product.enableNotesField ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {product.enableNotesField ? (isAr ? 'مفعلة' : 'Active') : (isAr ? 'معطلة (مخفية)' : 'Disabled (Hidden)')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed max-w-xl">
                      {isAr
                        ? 'تفعيل أو إخفاء خانة كتابة المقاس أو الملاحظات (مثل مقاس XL للملابس) في استمارة الشراء المباشر. إذا لم تفعلها فلن تظهر للمشتري أبداً.'
                        : 'Enable or hide the sizing & notes field (e.g. Size XL for clothes) in the direct checkout form. If disabled, it will never show to customers.'}
                    </p>
                  </div>

                  {/* Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(product.enableNotesField)}
                      onChange={e => {
                        const checked = e.target.checked;
                        onChange(prev => ({
                          ...prev,
                          enableNotesField: checked,
                          notesFieldLabel: checked ? (prev.notesFieldLabel || (isAr ? 'ملاحظات إضافية (اختياري)' : 'Special Notes (Optional)')) : prev.notesFieldLabel,
                          notesFieldPlaceholder: checked ? (prev.notesFieldPlaceholder || (isAr ? 'مقاس XL / يرجى الاتصال قبل التوصيل' : 'e.g. Size XL please / Call before delivering...')) : prev.notesFieldPlaceholder
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                  </label>
                </div>

                {product.enableNotesField && (
                  <div className="pt-3 border-t border-stone-800/80 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                          {isAr ? 'عنوان الخانة في صفحة الطلب' : 'Field Label in Checkout'}
                        </label>
                        <input
                          type="text"
                          value={product.notesFieldLabel || ''}
                          onChange={e => onChange(prev => ({ ...prev, notesFieldLabel: e.target.value }))}
                          placeholder={isAr ? 'ملاحظات إضافية (اختياري)' : 'Special Notes (Optional)'}
                          className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb] font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                          {isAr ? 'النص التوضيحي (Placeholder)' : 'Field Placeholder'}
                        </label>
                        <input
                          type="text"
                          value={product.notesFieldPlaceholder || ''}
                          onChange={e => onChange(prev => ({ ...prev, notesFieldPlaceholder: e.target.value }))}
                          placeholder={isAr ? 'مقاس XL / يرجى الاتصال قبل التوصيل' : 'e.g. Size XL please / Call before delivering...'}
                          className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb] font-semibold"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-stone-400">
                        {isAr ? 'نماذج جاهزة سريعة:' : 'Quick Presets:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChange(prev => ({
                          ...prev,
                          notesFieldLabel: isAr ? 'المقاس المطلوب (S, M, L, XL...)' : 'Size Needed (S, M, L, XL...)',
                          notesFieldPlaceholder: isAr ? 'اكتب المقاس المطلوب: مثال XL أو L...' : 'Type size: e.g. XL or L...'
                        }))}
                        className="text-[10px] bg-stone-800 hover:bg-stone-750 text-stone-200 px-2.5 py-1 rounded-lg border border-stone-700 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      >
                        <Shirt className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{isAr ? 'مقاسات ملابس (XL, L...)' : 'Clothing Sizes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(prev => ({
                          ...prev,
                          notesFieldLabel: isAr ? 'مقاس الحذاء (39 إلى 45)' : 'Shoe Size (39 to 45)',
                          notesFieldPlaceholder: isAr ? 'اكتب مقاس الحذاء: مثال 42' : 'Type shoe size: e.g. 42'
                        }))}
                        className="text-[10px] bg-stone-800 hover:bg-stone-750 text-stone-200 px-2.5 py-1 rounded-lg border border-stone-700 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      >
                        <Footprints className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{isAr ? 'مقاسات أحذية' : 'Shoe Sizes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(prev => ({
                          ...prev,
                          notesFieldLabel: isAr ? 'ملاحظات إضافية (اختياري)' : 'Special Notes (Optional)',
                          notesFieldPlaceholder: isAr ? 'مقاس XL / يرجى الاتصال قبل التوصيل' : 'e.g. Size XL please / Call before delivering...'
                        }))}
                        className="text-[10px] bg-stone-800 hover:bg-stone-750 text-stone-200 px-2.5 py-1 rounded-lg border border-stone-700 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{isAr ? 'افتراضي (الصورة)' : 'Default (Screenshot)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {modalTab === 'landing' && (
          <div className="bg-[#18181b] rounded-3xl p-5 sm:p-8 border border-stone-800 shadow-sm space-y-6 animate-fadeIn">
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="p-2 bg-[#2563eb]/20 rounded-xl text-[#2563eb] shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-blue-200/90 leading-relaxed font-medium space-y-1">
                <strong className="text-white block font-bold text-xs sm:text-sm font-serif">
                  {isAr ? 'آراء وتقييمات الزبناء' : 'Customer Reviews & Feedback'}
                </strong>
                <p>
                  {isAr
                    ? 'تقييمات الزبناء تظهر تلقائياً على صفحة هذا المنتج. يمكنك تخصيص باقي البطاقات والمميزات بحرية أدناه.'
                    : 'Customer reviews appear automatically on this product page. You can customize the highlight cards below.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                {isAr ? 'عبارة تسويقية جذابة' : 'Catchphrase / Tagline'}
              </label>
              <input
                type="text"
                value={product.tagline || ''}
                onChange={e => onChange(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder={isAr ? 'مثال: تركيبة عضوية فاخرة تمنح بشرتك إشراقة طبيعية تدوم طوال اليوم' : 'e.g. Premium organic formula for vibrant, radiant skin all day'}
                className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs sm:text-sm focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'المميزات الرئيسية الثلاث' : 'Key Feature Highlights (3 Cards)'}
                </label>
                <span className="text-[10px] text-stone-500 font-mono">
                  {isAr ? '3 بطاقات تظهر بصفحة المنتج' : '3 highlights shown on landing page'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(product.features || [
                  { title: '', desc: '', icon: 'Award' },
                  { title: '', desc: '', icon: 'ShieldCheck' },
                  { title: '', desc: '', icon: 'Leaf' }
                ]).map((feat, idx) => (
                  <div key={idx} className="bg-stone-900/70 p-4 rounded-2xl border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                        {isAr ? `الميزة #${idx + 1}` : `Feature Card #${idx + 1}`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">
                        {isAr ? 'أيقونة فيكتور' : 'Vector Icon'}
                      </label>
                      <IconPicker
                        value={feat.icon || 'Award'}
                        onChange={iconVal => {
                          onChange(prev => {
                            const updated = [...(prev.features || [
                              { title: '', desc: '', icon: 'Award' },
                              { title: '', desc: '', icon: 'ShieldCheck' },
                              { title: '', desc: '', icon: 'Leaf' }
                            ])];
                            updated[idx] = { ...updated[idx], icon: iconVal };
                            return { ...prev, features: updated };
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">
                        {isAr ? 'العنوان' : 'Title'}
                      </label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={e => {
                          const val = e.target.value;
                          onChange(prev => {
                            const updated = [...(prev.features || [
                              { title: '', desc: '', icon: 'Award' },
                              { title: '', desc: '', icon: 'ShieldCheck' },
                              { title: '', desc: '', icon: 'Leaf' }
                            ])];
                            updated[idx] = { ...updated[idx], title: val };
                            return { ...prev, features: updated };
                          });
                        }}
                        placeholder={isAr ? 'عنوان الميزة (مثال: نقي وعضوي 100%)' : 'Feature Title (e.g. 100% Pure Organic)'}
                        className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb] font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">
                        {isAr ? 'الوصف' : 'Description'}
                      </label>
                      <input
                        type="text"
                        value={feat.desc}
                        onChange={e => {
                          const val = e.target.value;
                          onChange(prev => {
                            const updated = [...(prev.features || [
                              { title: '', desc: '', icon: 'Award' },
                              { title: '', desc: '', icon: 'ShieldCheck' },
                              { title: '', desc: '', icon: 'Leaf' }
                            ])];
                            updated[idx] = { ...updated[idx], desc: val };
                            return { ...prev, features: updated };
                          });
                        }}
                        placeholder={isAr ? 'تفاصيل الميزة (مثال: مستخلص بطريقة العصر البارد)' : 'Feature details (e.g. Cold-pressed virgin extraction)'}
                        className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'طريقة الاستخدام والخطوات' : 'How To Use / Steps'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onChange(prev => ({
                      ...prev,
                      howToUse: [...(prev.howToUse || []), '']
                    }));
                  }}
                  className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة خطوة' : 'Add Step'}
                </button>
              </div>

              <div className="space-y-2.5">
                {(product.howToUse || ['', '', '']).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-stone-800 text-stone-200 text-xs font-bold flex items-center justify-center shrink-0 border border-stone-700 font-mono">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={e => {
                        const val = e.target.value;
                        onChange(prev => {
                          const updated = [...(prev.howToUse || ['', '', ''])];
                          updated[idx] = val;
                          return { ...prev, howToUse: updated };
                        });
                      }}
                      placeholder={isAr ? `إرشادات الخطوة ${idx + 1}...` : `Step ${idx + 1} instructions...`}
                      className="flex-1 border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                    />
                    {(product.howToUse || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange(prev => {
                            const cur = prev.howToUse || [];
                            return { ...prev, howToUse: cur.filter((_, i) => i !== idx) };
                          });
                        }}
                        className="text-stone-500 hover:text-rose-400 p-2 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'الأسئلة الشائعة الخاصة بهذا المنتج' : 'Product Specific FAQs'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onChange(prev => ({
                      ...prev,
                      faqs: [...(prev.faqs || []), { q: '', a: '' }]
                    }));
                  }}
                  className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة سؤال وجواب' : 'Add FAQ'}
                </button>
              </div>

              <div className="space-y-3">
                {(product.faqs || [{ q: '', a: '' }, { q: '', a: '' }]).map((faq, idx) => (
                  <div key={idx} className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {isAr ? `السؤال #${idx + 1}` : `Question #${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(prev => {
                            const cur = prev.faqs || [];
                            return { ...prev, faqs: cur.filter((_, i) => i !== idx) };
                          });
                        }}
                        className="text-stone-500 hover:text-rose-400 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={e => {
                        const val = e.target.value;
                        onChange(prev => {
                          const updated = [...(prev.faqs || [])];
                          updated[idx] = { ...updated[idx], q: val };
                          return { ...prev, faqs: updated };
                        });
                      }}
                      placeholder={isAr ? 'السؤال (مثال: هل الدفع عند الاستلام متاح؟)' : 'Question (e.g. Is cash on delivery available?)'}
                      className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb] font-semibold"
                    />
                    <input
                      type="text"
                      value={faq.a}
                      onChange={e => {
                        const val = e.target.value;
                        onChange(prev => {
                          const updated = [...(prev.faqs || [])];
                          updated[idx] = { ...updated[idx], a: val };
                          return { ...prev, faqs: updated };
                        });
                      }}
                      placeholder={isAr ? 'الإجابة والتوضيح...' : 'Answer...'}
                      className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {modalTab === 'media' && (
          <div className="bg-[#18181b] rounded-3xl p-5 sm:p-8 border border-stone-800 shadow-sm space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-stone-100 font-bold text-sm sm:text-base font-serif flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#2563eb]" />
                    <span>{isAr ? 'صور المعرض الإضافية من الجهاز' : 'Additional Gallery Photos'}</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isAr ? 'ارفع صوراً إضافية متعددة من جهازك لتظهر في معرض صور المنتج' : 'Upload additional photos from your device for the product gallery'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => galleryImageInputRef.current?.click()}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'رفع صور من الجهاز' : 'Upload from Device'}</span>
                </button>
              </div>

              <input
                ref={galleryImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleGalleryImageFiles(e.target.files)}
              />

              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'أو أضف صورة للمعرض عبر رابط مباشر (Direct URL):' : 'Or Add Gallery Image via Direct URL:'}</span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">PostImages, ImgBB, Cloudinary...</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={galleryUrlInput}
                    onChange={e => setGalleryUrlInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl();
                      }
                    }}
                    placeholder="https://i.postimg.cc/... or https://i.ibb.co/..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    disabled={!galleryUrlInput.trim()}
                    className="px-4 py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة للصورة' : 'Add Image'}</span>
                  </button>
                </div>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragActiveGallery(true); }}
                onDragLeave={() => setDragActiveGallery(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragActiveGallery(false);
                  handleGalleryImageFiles(e.dataTransfer.files);
                }}
                onClick={() => galleryImageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActiveGallery
                    ? 'border-[#2563eb] bg-blue-950/20'
                    : 'border-stone-800 hover:border-blue-500/40 bg-stone-900/30 hover:bg-stone-900/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-[#2563eb] mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-200">
                  {isUploadingGallery
                    ? (isAr ? 'جاري رفع الصور...' : 'Uploading gallery photos...')
                    : (isAr ? 'اسحب وأفلت صوراً متعددة هنا أو انقر للاختيار من جهازك' : 'Drag & drop multiple photos here or click to browse')}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isAr ? 'يمكنك اختيار عدة صور في وقت واحد' : 'You can select multiple photos at once'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {(product.additionalImages || []).map((imgUrl, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-stone-800 group h-32 bg-stone-900 shadow-sm">
                    <img src={imgUrl} className="w-full h-full object-cover" alt={`Gallery ${i + 1}`} referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => {
                        onChange(prev => ({
                          ...prev,
                          additionalImages: (prev.additionalImages || []).filter((_, idx) => idx !== i)
                        }));
                      }}
                      className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1.5 rounded-full opacity-90 hover:opacity-100 cursor-pointer shadow-md transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1.5 left-2 bg-black/70 text-stone-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-stone-100 font-bold text-sm sm:text-base font-serif flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    <span>{isAr ? 'فيديو توضيحي للمنتج من يوتيوب' : 'Product Video (YouTube)'}</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isAr ? 'ضع رابط يوتيوب مع إمكانية اختيار إظهار غلاف الفيديو بالخارج أو صورة المنتج' : 'Add a YouTube video link with flexible cover display options'}
                  </p>
                </div>

                {product.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsVideoPreviewPlaying(false);
                      onChange(prev => ({
                        ...prev,
                        videoUrl: '',
                        videoThumbnail: '',
                        videoPosition: 'after_photos',
                        videoAsPrimary: false
                      }));
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {isAr ? 'حذف الفيديو' : 'Remove Video'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                  {isAr ? 'رابط فيديو يوتيوب' : 'YouTube Video URL'}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={product.videoUrl || ''}
                    onChange={e => handleVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs focus:outline-none focus:border-[#2563eb] font-mono pl-10"
                  />
                  <Video className="w-4 h-4 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  {isAr ? 'يدعم جميع روابط يوتيوب (روابط عادية، روابط قصيرة youtu.be، وفيديوهات Shorts).' : 'Supports standard YouTube links, youtu.be shorts, and full embeds.'}
                </p>
              </div>

              {product.videoUrl && (
                <div className="bg-stone-900/60 p-4 sm:p-5 rounded-3xl border border-stone-800 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block mb-1">
                      {isAr ? 'ترتيب ظهور الغلاف في واجهة المتجر:' : 'Cover Display Priority:'}
                    </label>
                    <p className="text-xs text-stone-400">
                      {isAr ? 'حدد ما الذي يجب أن يظهر كغلاف لبطاقة هذا المنتج أمام الزوار:' : 'Choose what appears as the card cover on the store catalog:'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onChange(prev => ({
                          ...prev,
                          videoPosition: 'after_photos',
                          videoAsPrimary: false,
                          videoAutoplay: false
                        }));
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        product.videoPosition === 'after_photos' || product.videoAsPrimary === false
                          ? 'border-[#2563eb] bg-blue-950/30 ring-1 ring-[#2563eb]'
                          : 'border-stone-800 hover:border-stone-700 bg-stone-900/40 text-stone-400'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        product.videoPosition === 'after_photos' || product.videoAsPrimary === false
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-stone-100">
                            {isAr ? 'الصورة أولاً + زر Play Video' : 'Photo First + Play Video'}
                          </h4>
                          <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-md">
                            {isAr ? 'الموصى به' : 'Recommended'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          {isAr
                            ? 'تظهر صورة المنتج كغلاف، مع إضافة زر (Play Video) لمشاهدة الفيديو عند نقر الزائر فقط (بدون تشغيل تلقائي).'
                            : 'Photo displays on card cover, with a Play Video button inside for visitors to watch on click (no autoplay).'}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onChange(prev => ({
                          ...prev,
                          videoPosition: 'first',
                          videoAsPrimary: true
                        }));
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        product.videoPosition === 'first' || product.videoAsPrimary === true
                          ? 'border-[#2563eb] bg-blue-950/30 ring-1 ring-[#2563eb]'
                          : 'border-stone-800 hover:border-stone-700 bg-stone-900/40 text-stone-400'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        product.videoPosition === 'first' || product.videoAsPrimary === true
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-100">
                          {isAr ? 'الفيديو أولاً' : 'Video First'}
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          {isAr
                            ? 'يظهر غلاف الفيديو كصورة رئيسية للمنتج بالخارج مع شارة تشغيل الفيديو.'
                            : 'YouTube video cover displays as the primary card image with play badge.'}
                        </p>
                      </div>
                    </button>
                  </div>

                  {currentYouTubeId && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          {isAr ? 'معاينة مشغل الفيديو:' : 'Video Player Preview:'}
                        </span>
                        {isVideoPreviewPlaying && (
                          <button
                            type="button"
                            onClick={() => setIsVideoPreviewPlaying(false)}
                            className="text-[10px] font-bold text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isAr ? 'إغلاق المعاينة' : 'Close Preview'}</span>
                          </button>
                        )}
                      </div>
                      <div className="relative aspect-video max-w-lg rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-lg">
                        {isVideoPreviewPlaying ? (
                          <iframe
                            src={getYouTubeEmbedUrl(currentYouTubeId, true)}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        ) : (
                          <div
                            onClick={() => setIsVideoPreviewPlaying(true)}
                            className="relative w-full h-full cursor-pointer group flex items-center justify-center select-none"
                            title={isAr ? 'انقر لتشغيل معاينة الفيديو' : 'Click to preview video'}
                          >
                            <img
                              src={getYouTubeThumbnail(currentYouTubeId)}
                              alt="Video Thumbnail"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 group-hover:bg-black/40 transition-colors" />
                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl border border-white/80 group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 fill-white ml-0.5" />
                              </div>
                              <span className="text-[11px] font-bold text-white bg-black/75 px-3 py-1 rounded-full border border-white/20">
                                {isAr ? 'تشغيل الفيديو (Play Video)' : 'Play Video Preview'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {modalTab !== 'basic' && (
              <button
                type="button"
                onClick={() => setModalTab(modalTab === 'media' ? 'landing' : 'basic')}
                className="bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold px-4 py-2.5 rounded-full cursor-pointer text-xs flex items-center gap-1"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} /> {isAr ? 'السابق' : 'Back'}
              </button>
            )}
            {modalTab !== 'media' && (
              <button
                type="button"
                onClick={() => setModalTab(modalTab === 'basic' ? 'landing' : 'media')}
                className="bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold px-4 py-2.5 rounded-full cursor-pointer text-xs flex items-center gap-1"
              >
                {isAr ? 'التالي' : 'Next'} <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className={`flex items-center gap-3 ${isAr ? 'mr-auto' : 'ml-auto'}`}>
            <button
              type="button"
              onClick={onCancel}
              className="bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white font-bold px-5 py-2.5 sm:py-3 rounded-full cursor-pointer text-xs uppercase tracking-wider"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold px-6 py-2.5 sm:py-3 rounded-full shadow-lg shadow-blue-600/20 cursor-pointer text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'نشر المنتج' : 'Publish Product')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
