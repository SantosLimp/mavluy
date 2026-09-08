import { Product, StoreConfig, Order, SupportTicket, CountryStore, Coupon, Review, SupportFaq, AdSpendEntry, ExpenseEntry, FinancialSettings } from './types';

export const DEFAULT_SUPPORT_FAQS: SupportFaq[] = [
  {
    id: 'faq-1',
    q: 'كم يستغرق توصيل الطلب إلى عنواني؟',
    qEn: 'How long does delivery take to my address?',
    a: 'يتم شحن وتوصيل الطلبات خلال 24 إلى 48 ساعة كحد أقصى لجميع المدن. سيتصل بك مندوب التوصيل هاتفياً قبل الوصول لتأكيد موعد ومكان الاستلام المناسب لك.',
    aEn: 'Orders are delivered within 24 to 48 hours to all cities. The courier will contact you prior to delivery to arrange the most convenient time.'
  },
  {
    id: 'faq-2',
    q: 'هل يمكنني فحص ومعاينة المنتج قبل دفع المبلغ للمندوب؟',
    qEn: 'Can I inspect and check the product before paying the courier?',
    a: 'نعم بكل تأكيد! نحن نضمن لك حق فتح الطرد ومعاينة المنتج والتأكد من مطابقته وجودته أمام مندوب التوصيل قبل دفع أي مبلغ نقداً.',
    aEn: 'Yes, absolutely! You have the full right to open the package and inspect the product in front of the courier before making the cash payment.'
  },
  {
    id: 'faq-3',
    q: 'كيف تتم عملية الدفع؟ وهل توجد أي مصاريف إضافية؟',
    qEn: 'How does payment work? Are there any additional fees?',
    a: 'الدفع يتم نقداً عند الاستلام (COD) بنسبة 100% عند تسلمك للطرد بيدك. السعر الموضح في ملخص الطلب هو السعر النهائي الشامل لجميع الرسوم دون أي تكاليف خفية.',
    aEn: 'Payment is 100% Cash on Delivery (COD) upon receiving your order. The total displayed at checkout is final with zero hidden charges.'
  },
  {
    id: 'faq-4',
    q: 'كيف يمكنني تعديل بيانات الطلب (العنوان أو الهاتف) بعد إتمامه؟',
    qEn: 'How can I update my order details (address or phone) after placing it?',
    a: 'يمكنك التواصل معنا فوراً بإرسال استفسار برقم طلبك وسيقوم فريقنا بتعديل البيانات فوراً قبل خروج الشحنة للتوصيل.',
    aEn: 'Simply contact us with your order reference number, and our team will update your details immediately.'
  }
];

export const DEFAULT_STORES: CountryStore[] = [
  {
    id: 'store-ma',
    name: 'Morocco',
    nameAr: 'المغرب',
    code: 'MA',
    currency: 'MAD',
    currencySymbol: 'د.م.',
    language: 'ar',
    status: 'active',
    storeName: 'Mavluy',
    slug: 'ma',
    shippingFee: 35,
    flag: '🇲🇦'
  },
  {
    id: 'store-ly',
    name: 'Libya',
    nameAr: 'ليبيا',
    code: 'LY',
    currency: 'LYD',
    currencySymbol: 'د.ل.',
    language: 'ar',
    status: 'active',
    storeName: 'Mavluy',
    slug: 'ly',
    shippingFee: 20,
    flag: '🇱🇾'
  },
  {
    id: 'store-sa',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    code: 'SA',
    currency: 'SAR',
    currencySymbol: 'ر.س.',
    language: 'ar',
    status: 'active',
    storeName: 'Mavluy',
    slug: 'sa',
    shippingFee: 25,
    flag: '🇸🇦'
  }
];

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'المتجر المغربي الفاخر',
  storeNameEn: 'Mavluy',
  description: 'وجهتكم الأولى والموثوقة للتسوق الإلكتروني الشامل في المغرب. نوفر لكم تشكيلة واسعة ومختارة بعناية من أفضل المنتجات الحصرية، أحدث صيحات الموضة، العناية والجمال، ديكورات المنزل، والأجهزة العصرية بأفضل الأسعار. توصيل سريع ومجاني لجميع المدن المغربية، مع ضمان فحص ومعاينة طلبك بالكامل قبل الدفع نقداً عند الاستلام.',
  descriptionEn: 'Your premier destination for all-in-one online shopping. Discover an exclusive selection of trending fashion, premium beauty & self-care rituals, modern home decor, smart accessories, and everyday essentials at unbeatable value. Delivered fast with guaranteed quality and cash on delivery with inspection before payment.',
  phone: '0661234567',
  email: 'contact@mavluy-store.ma',
  bannerTitle: 'Mavluy Shop',
  bannerTitleEn: 'Mavluy Shop',
  bannerSubtitle: 'وجهتك الأولى للتسوق الراقي — منتجات فاخرة، جودة استثنائية، وتجربة تسوق فريدة تليق بك.',
  bannerSubtitleEn: 'Your premier destination for refined living & luxury essentials. Exceptional quality delivered to your doorstep.',
  bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
  accentColor: 'blue',
  themePrimaryColor: '#2563eb',
  currency: 'د.م.',
  shippingFee: 35,
  location: 'المغرب (Morocco)',
  logoType: 'text',
  logoTextPrefix: 'Mav',
  logoTextAccent: 'luy',
  logoTagline: 'Refined Living & Shopping',
  logoFontStyle: 'italic-luxury',
  logoAccentColor: '#2563eb',
  logoImage: '',
  logoImageHeight: 36,
  supportStatusMode: 'schedule',
  supportIsOnline: true,
  supportStartTime: '09:00',
  supportEndTime: '22:00',
  supportWorkDays: 'طيلة أيام الأسبوع (7j/7)',
  supportFaqs: DEFAULT_SUPPORT_FAQS,
  customAdminSlug: 'admin/dashboard',
  customAdminLoginSlug: 'admin/login',
  customAdminRegisterSlug: 'admin/register',
  customSupportSlug: 'support',
  customProductsSlug: 'products',
  customProfileSlug: 'profile',
  customFavoritesSlug: 'favorites',
  customCartSlug: 'cart',
  customCheckoutSlug: 'checkout',
  allowAdminRegistration: true,
  storeBackgroundColor: '#faf8f5',
  headerBackgroundColor: '#ffffff',
  googleSheetWebhookUrl: 'https://script.google.com/macros/s/AKfycbyAomdcsYMu020y9XOcFiMGhL1Yu8-GLnJxsmhHDNAZhlsBexRjSMcSCVScyPycgO4n/exec',
  googleSheetAutoSync: true,
  customTexts: {
    ar: {
      mavluyHeroSubtitle: 'وجهتك الأولى للتسوق الراقي — منتجات فاخرة، جودة استثنائية، وتجربة تسوق فريدة تليق بك.',
      mavluyHeroTitle: 'Mavluy Shop',
      mavluyHeroBadge: 'متجر مافلوي الرسمي',
      shopNow: 'تسوق الآن',
      topBestsellers: 'أفضل خيارات المنتجات الأكثر مبيعاً',
      allProducts: 'جميع المنتجات',
      verifiedReviews: 'تقييمات العملاء الموثقة',
      lovedByThousands: 'ثقة حازت رضا الآلاف',
      saudiFreeShipping: 'توصيل سريع ومضمون لجميع المدن والمناطق',
      openPackageBeforePay: 'فحص الشحنة متاح قبل الدفع لضمان رضاك التام 100%'
    },
    en: {
      mavluyHeroSubtitle: 'Your premier destination for refined living & luxury essentials. Exceptional quality delivered to your doorstep.',
      mavluyHeroTitle: 'Mavluy Shop',
      mavluyHeroBadge: 'Official Mavluy Store',
      shopNow: 'Shop Now',
      topBestsellers: 'Top Bestselling Products',
      allProducts: 'All Products',
      verifiedReviews: 'Verified Customer Reviews',
      lovedByThousands: 'Trusted by Thousands',
      saudiFreeShipping: 'Fast & Guaranteed delivery to all cities & regions',
      openPackageBeforePay: 'Inspect your order before paying cash on delivery'
    }
  }
};

export const DEFAULT_ORDERS: Order[] = [];

export const GALLERY_IMAGES: { url: string; label: string }[] = [];

export { COUNTRY_CITIES, getCitiesForCountry } from './data/cities';

export const GLOBAL_CITIES = [
  'الدار البيضاء (Casablanca)',
  'الرباط (Rabat)',
  'مراكش (Marrakech)',
  'طنجة (Tanger)',
  'فاس (Fès)',
  'أكادير (Agadir)',
  'مكناس (Meknès)',
  'وجدة (Oujda)',
  'القنيطرة (Kénitra)',
  'تطوان (Tétouan)',
  'تمارة (Témara)',
  'سلا (Salé)',
  'الناظور (Nador)',
  'الجديدة (El Jadida)',
  'المحمدية (Mohammédia)',
  'بني ملال (Béni Mellal)',
  'خريبكة (Khouribga)',
  'تازة (Taza)',
  'الصويرة (Essaouira)',
  'العيون (Laâyoune)'
];

export const DEFAULT_TICKETS: SupportTicket[] = [];

export const DEFAULT_COUPONS: Coupon[] = [];

export const DEFAULT_REVIEWS: Review[] = [];

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  defaultDeliveryFeePerOrder: 35,
  defaultReturnFeePerOrder: 15,
  defaultPackagingCostPerOrder: 3,
  defaultCallCenterCostPerOrder: 5,
  targetMarginPercent: 30,
  targetRoas: 3.5,
};

export const DEFAULT_AD_SPENDS: AdSpendEntry[] = [];

export const DEFAULT_EXPENSES: ExpenseEntry[] = [];

