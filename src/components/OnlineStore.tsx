import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Truck,
  ShieldCheck,
  Award,
  ArrowRight,
  Star,
  X,
  Settings,
  SlidersHorizontal,
  MapPin,
  Ticket,
  BadgePercent,
  AlertCircle,
  PhoneCall,
  Phone,
  Mail,
  ShoppingBag,
  Info,
  ArrowLeft,
  Clock,
  ThumbsUp,
  CheckCircle2,
  MessageSquare,
  Send,
  User,
  UserPlus,
  ChevronDown,
  Shirt,
  Droplets,
  Home,
  LayoutGrid,
  Leaf,
  BadgeCheck,
  MessageCircle,
  Package,
  PackageOpen,
  Sprout,
  HeartPulse,
  Scissors,
  Crown,
  ChevronRight,
  ChevronLeft,
  Shield,
  Palette,
  Heart,
  Globe,
  XCircle,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Headphones,
  ChevronUp,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  FileText,
  Play,
  Video,
  Film,
  Tag,
  Percent,
  Camera,
  Upload,
  Key,
  Edit3
} from 'lucide-react';
import SleekSpinner from './SleekSpinner';
import TopLoadingBar from './TopLoadingBar';
import { StoreLogo } from './StoreLogo';
import { Product, StoreConfig, Order, CartItem, OrderItem, SupportTicket, TicketMessage, CountryStore, Category, Coupon, ShippingMethod, Review, SupportFaq } from '../types';
import { GLOBAL_CITIES, getCitiesForCountry, translateCity, DEFAULT_SUPPORT_FAQS } from '../data';
import { PhoneInput } from './PhoneInput';
import { CountryFlag } from './CountryFlag';
import { CustomSelect } from './CustomSelect';
import { CitySelector } from './CitySelector';
import { ALL_COUNTRIES as COUNTRIES } from '../data/countries';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl, readFileAsDataUrl, uploadImageToCloud } from '../utils/mediaUtils';
import { renderFeatureVectorIcon } from '../utils/iconMap';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '../utils/dateUtils';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

export const getCustomerInitials = (name?: string, phone?: string): string => {
  if (!name || !name.trim()) {
    if (phone && phone.trim()) {
      const digits = phone.trim().replace(/\D/g, '');
      return digits.length >= 2 ? digits.slice(-2) : 'CL';
    }
    return 'CL';
  }

  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const single = words[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.charAt(0).toUpperCase();
  }

  const firstInitial = words[0].charAt(0);
  const secondInitial = words[words.length - 1].charAt(0);
  return `${firstInitial}${secondInitial}`.toUpperCase();
};

interface CustomerAvatarProps {
  avatar?: string;
  name?: string;
  phone?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  avatar,
  name,
  phone,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px] rounded-lg',
    sm: 'w-10 h-10 text-xs rounded-xl',
    md: 'w-14 h-14 text-base rounded-2xl',
    lg: 'w-20 h-20 text-xl sm:text-2xl rounded-[1.5rem]',
    xl: 'w-24 h-24 text-2xl sm:text-3xl rounded-[1.75rem]'
  };

  const initials = getCustomerInitials(name, phone);

  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={name || 'Customer Avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} object-cover border border-stone-200 shadow-sm shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-stone-900 text-stone-100 font-bold tracking-wider flex items-center justify-center border border-stone-800 shadow-sm shrink-0 select-none ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      }}
      title={name || phone || 'Customer'}
    >
      <span className="leading-none">{initials}</span>
    </div>
  );
};

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.455h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const translations = {
  ar: {
    home: "الرئيسية",
    products: "المنتجات",
    support: "الدعم الفني",
    cart: "السلة",
    login: "تسجيل الدخول",
    myAccount: "حسابي",
    welcome: "مرحباً بكم في متجر الفخامة",
    exclusive: "التميز الفاخر",
    everyday: "رقي يومي دائم",
    discover: "اكتشف مجموعتنا الفاخرة من الملابس الراقية ومنتجات العناية بالبشرة العضوية والمصممة خصيصاً لتمنحك الأناقة اليومية المثالية. نشحن منتجاتنا بجودة استثنائية وبكل ثقة.",
    shopNow: "تسوق الآن",
    all: "الكل",
    clothing: "ملابس",
    skincare: "العناية بالبشرة",
    homeDecor: "ديكور المنزل",
    popularOnly: "الأكثر مبيعاً فقط",
    addToCart: "إضافة إلى السلة",
    outOfStock: "نفذت الكمية",
    originalPrice: "السعر الأصلي",
    orderNow: "اطلب الآن (الدفع عند الاستلام)",
    searchPlaceholder: "البحث عن المنتجات...",
    filterTitle: "تصفية وترتيب",
    cartEmpty: "سلتك فارغة",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    free: "مجاني",
    total: "الإجمالي",
    checkout: "إتمام الطلب",
    shippingInfo: "معلومات الشحن والتوصيل",
    confirmPhoneCall: "هام: سنتصل بك على هذا الرقم لتأكيد الشحن وتفاصيل طلبك.",
    phone: "رقم الهاتف (للتحقق من الطلب)",
    address: "العنوان الكامل بالتفصيل",
    city: "المدينة",
    name: "الاسم الكامل",
    notes: "ملاحظات إضافية (اختياري)",
    placeOrder: "تأكيد الطلب الآن",
    orderSuccessTitle: "تم استلام طلبك بنجاح!",
    orderSuccessDesc: "تلقينا طلبك بنجاح! سيتصل بك فريقنا قريباً لتأكيد الشحن الفوري والدفع عند الاستلام.",
    expressCheckoutTitle: "طلب سريع ومباشر",
    expressCheckoutDesc: "أدخل معلوماتك أدناه لتأكيد طلبك. سيتواصل معك أحد مستشارينا لتأكيد الشحن فوراً.",
    quantity: "الكمية",
    codSaudi: "الدفع نقداً عند الاستلام",
    feedback: "آراء العملاء",
    writeReview: "اكتب تقييمك",
    submitReview: "إرسال التقييم",
    addReviewSuccess: "شكراً لك! تم إضافة تقييمك بنجاح.",
    customerLogin: "تسجيل الدخول",
    enterPhone: "أدخل رقم الجوال للمتابعة",
    loginBtn: "تسجيل الدخول",
    enterName: "الرجاء إدخال اسمك لإكمال التسجيل",
    namePlaceholder: "الاسم الثنائي أو الثلاثي",
    completeRegister: "إكمال التسجيل والدخول",
    myOrders: "سجل طلباتي",
    myFavorites: "المنتجات المفضلة",
    noFavorites: "ليس لديك منتجات مفضلة حالياً.",
    noOrders: "لا توجد طلبات سابقة مسجلة لهذا الرقم.",
    logout: "تسجيل الخروج",
    backToHome: "العودة للرئيسية",
    supportTitle: "مكتب الدعم الفني والمساعدة",
    supportDesc: "لديك استفسار أو مشكلة؟ أرسل لنا تذكرة وسيقوم فريق الدعم بمساعدتك فوراً.",
    supportFormName: "الاسم الكامل",
    supportFormPhone: "رقم الجوال",
    supportFormSubject: "الموضوع",
    supportFormMsg: "تفاصيل الرسالة",
    supportFormSubmit: "إرسال التذكرة الآن",
    trackMyTickets: "تتبع تذاكر الدعم الخاصة بي",
    ticketId: "رقم التذكرة",
    ticketStatus: "الحالة",
    ticketOpen: "مفتوحة",
    ticketResolved: "تم حلها",
    trackInputPlaceholder: "أدخل رقم الجوال للتتبع...",
    trackBtn: "بحث عن التذاكر",
    online: "متصل حالياً",
    offline: "غير متصل حالياً",
    customReviewsTitle: "التقييمات والمراجعات",
    reviewsCount: "تقييم",
    writeYourOpinion: "شاركنا رأيك بالمنتج",
    yourRating: "تقييمك بالنجوم",
    yourComment: "تعليقك",
    promo: "عرض خاص",
    returnToStore: "العودة إلى المتجر",
    checkoutExpress: "الشراء السريع بضغطة واحدة",
    openPackageBeforePay: "فحص الشحنة متاح قبل الدفع لضمان رضاك التام 100%",
    remove: "حذف",
    finalTotal: "الإجمالي النهائي للدفع عند الاستلام",
    proceedToCheckout: "الذهاب لإتمام الطلب (الدفع عند الاستلام)",
    yourCart: "سلة التسوق الخاصة بك",
    cartEmptyDesc: "تصفح كتالوج المنتجات وتسوق قطعك المفضلة الآن!",
    bestSellers: "الأكثر مبيعاً",
    allProducts: "جميع المنتجات",
    filter: "تصفية",
    selectFilter: "اختر التصنيف",
    informationHours: "المعلومات وأوقات العمل",
    supportWorkingHours: "فريق الدعم الفني متواجد لخدمتكم من الساعة 9:00 صباحاً وحتى 10:00 مساءً، من الاثنين إلى السبت.",
    registeredSuccess: "تم تسجيل حسابك بنجاح! مرحباً بك في متجرنا.",
    loginSuccess: "تم تسجيل الدخول بنجاح! مرحباً بعودتك.",

    welcomeToVirtuprod: "مرحباً بكم في متجر Mavluy Shop",
    mavluyHeroBadge: "متجر مافلوي الرسمي",
    mavluyHeroTitle: "Mavluy Shop",
    mavluyHeroSubtitle: "وجهتك الأولى للتسوق الراقي — منتجات فاخرة، جودة استثنائية، وتجربة تسوق فريدة تليق بك.",
    showFavorites: "عرض المفضلة",
    topBestsellers: "أفضل خيارات المنتجات الأكثر مبيعاً",
    viewAll: "عرض الكل",
    viewAllProducts: "عرض جميع المنتجات",
    verifiedReviews: "تقييمات العملاء الموثقة",
    lovedByThousands: "ثقة حازت رضا الآلاف",
    lovedByThousandsDesc: "استمع مباشرة لآراء عملائنا الكرام حول تجربتهم الشرائية وجودة منتجاتنا الفاخرة.",
    returnToCollection: "العودة إلى المجموعة",
    saudiFreeShipping: "توصيل سريع ومضمون لجميع المدن والمناطق",
    howHelpYou: "كيف يمكننا مساعدتك اليوم؟",
    supportCenter: "مركز الدعم الفني",
    supportCenterDesc: "أرسل تذكرتك أدناه أو تتبع تذكرة سابقة في الوقت الفعلي. سيتواصل معك فريق الدعم الفني مباشرة.",
    supportDesk: "مكتب الدعم",
    supportReplyTime: "نجيب عادةً خلال ساعة واحدة",
    supportBusinessHours: "أوقات العمل:",
    supportFormHelpText: "لديك سؤال حول طلبك، الشحن، أو المنتجات؟ أرسل لنا تذكرة وسيتواصل معك ممثلنا مباشرة على جوالك.",
    ticketSubmitted: "تم إرسال التذكرة بنجاح!",
    ticketSubmittedDesc: "شكراً لك! تم تسجيل تذكرتك بنجاح. سنراجع استفسارك ونتصل بك قريباً جداً. يمكنك تتبع حالة التذكرة على اليسار.",
    yourNameLabel: "اسمك الكريم *",
    saudiPhoneLabel: "رقم الهاتف / الجوال *",
    subjectLabel: "الموضوع *",
    messageLabel: "الرسالة *",
    messagePlaceholder: "اشرح استفسارك بالتفصيل هنا...",
    sendSupportTicket: "إرسال تذكرة الدعم",
    trackYourTickets: "تتبع تذاكر الدعم الخاصة بك",
    trackTicketsDesc: "تأكد مما إذا كان الدعم الفني قد قرأ تذكرتك",
    searchPhonePlaceholder: "البحث برقم الجوال (مثال: 6xxxxxxxx)",
    clearBtn: "مسح",
    noTickets: "لا توجد تذاكر لعرضها",
    noTicketsDesc: "لم نتمكن من العثور على أي تذاكر بهذا الرقم.",
    noTicketsDescDefault: "التذاكر المرسلة من هذا الجهاز ستظهر هنا تلقائياً. يمكنك أيضاً البحث برقم جوالك.",
    read: "تمت القراءة",
    unread: "لم تقرأ بعد",
    inQueue: "في الانتظار",
    liveTicketTracker: "تتبع التذاكر المباشر",
    ticketSentSuccessStep: "تم إرسال التذكرة بنجاح",
    ticketReadStepSuccess: "تم فتح وقراءة التذكرة من الدعم الفني",
    ticketReadStepWaiting: "في طابور انتظار المراجعة",
    ticketResolvedStepSuccess: "تواصل ممثل الدعم مع العميل وتم حل الطلب",
    ticketResolvedStepWaiting: "سيتصل بك ممثل الدعم الفني على رقم جوالك قريباً",
    wantLiveChat: "هل تفضل الدردشة المباشرة؟",
    chatOnWhatsApp: "تواصل عبر الواتساب",
    totalPrice: "السعر الإجمالي:",
    buyNowCod: "اطلب الآن (الدفع عند الاستلام)",
    homeTitle: "الرئيسية",
    productsTitle: "المنتجات",
    supportTabTitle: "الدعم",
    cartTitle: "السلة",
    accountTitle: "حسابي",
    viewProduct: "عرض المنتج",
    promoLabel: "عرض",
    buyNow: "شراء الآن",
    noProductsFound: "لم يتم العثور على منتجات",
    noProductsFoundDesc: "عذراً، لم تتطابق أي منتجات مع معايير البحث. يرجى تجربة كلمات بحث أخرى أو إزالة الفلاتر.",
    resetFilters: "إعادة ضبط الفلاتر",
    descriptionBenefits: "الوصف والمميزات",
    howToUseTab: "طريقة الاستخدام",
    faq: "الأسئلة الشائعة",
    customerReviews: "تقييمات العملاء",
    howToGetBestResults: "كيفية الحصول على أفضل النتائج من منتجك؟",
    faqQ1: "متى سأستلم طلبي؟",
    faqA1: "بمجرد إتمام طلبك، سيتصل بك فريقنا لتأكيد الشحن، وسيصلك الطلب خلال 24 إلى 48 ساعة حتى باب منزلك.",
    faqQ2: "هل يمكنني معاينة المنتج وفحصه قبل الدفع؟",
    faqA2: "نعم بالتأكيد! يمكنك فتح الطرد وفحص محتوياته أمام مندوب التوصيل قبل دفع المبلغ نقداً.",
    faqQ3: "كيف تتم عملية الدفع؟",
    faqA3: "الدفع يتم نقداً بالكامل عند الاستلام (COD) بمجرد تسليمك الطلب في منزلك أو مقر عملك. لا حاجة لأي بطاقة بنكية.",
    outOfFiveStars: "من أصل 5 نجوم",
    leaveReviewTitle: "أضف تقييمك لهذا المنتج",
    yourFullName: "اسمك الكامل *",
    yourCity: "مدينتك",
    yourRatingLabel: "تقييمك :",
    yourReviewLabel: "تقييمك وملاحظاتك *",
    reviewPlaceholder: "شاركنا تجربتك مع المنتج (سرعة التوصيل، الجودة، الخدمة...)",
    publishReviewBtn: "نشر تقييمي",
    verifiedPurchase: "مشتري موثق",
    stars: "نجوم",
    fiveStars: "5 نجوم",
    fourStars: "4 نجوم",
    back: "رجوع",
    confirmOrderBtn: "تأكيد الطلب",
    orderReceived: "تم استلام طلبك!",
    thankYouOrder: "شكراً لطلبك! رقم طلبك هو:",
    orderSummary: "ملخص الطلب",
    totalToPayCod: "إجمالي الدفع عند الاستلام:",
    continueShopping: "مواصلة التسوق",
    contactUs: "اتصل بنا",
    allRightsReserved: "جميع الحقوق محفوظة",
    morocco: "المغرب",
    saudiArabia: "المملكة العربية السعودية",
    libya: "ليبيا",
    unitedArabEmirates: "الإمارات العربية المتحدة",
    kuwait: "الكويت",
    qatar: "قطر",
    bahrain: "البحرين",
    oman: "سلطنة عمان",
    egypt: "مصر"
  },
  en: {
    home: "Home",
    products: "Products",
    support: "Support",
    cart: "Cart",
    login: "Login",
    myAccount: "My Account",
    welcome: "Welcome to Luxury Store",
    exclusive: "Exclusive Excellence",
    everyday: "Everyday Refinement",
    discover: "Discover our premier collection of masterfully tailored ready-to-wear apparel and certified organic, plant-powered skincare rituals. Sourced ethically, crafted with luxury standards, and delivered with absolute trust.",
    shopNow: "Shop Collection",
    all: "All",
    clothing: "Clothing",
    skincare: "Skincare",
    homeDecor: "Home Decor",
    popularOnly: "Popular Only",
    addToCart: "Add to Cart",
    outOfStock: "Out of Stock",
    originalPrice: "Original Price",
    orderNow: "Order Now (Cash on Delivery)",
    searchPlaceholder: "Search products...",
    filterTitle: "Filter & Sort",
    cartEmpty: "Your cart is empty",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    checkout: "Checkout",
    shippingInfo: "Shipping & Delivery Information",
    confirmPhoneCall: "Important: We will call you on this number to confirm shipping and details.",
    phone: "Phone Number",
    address: "Detailed Delivery Address",
    city: "City",
    name: "Full Name",
    notes: "Special Notes (Optional)",
    placeOrder: "Confirm Order Now",
    orderSuccessTitle: "Order Placed Successfully!",
    orderSuccessDesc: "We received your order! Our team will contact you shortly to confirm the express shipping. Pay on delivery.",
    expressCheckoutTitle: "Direct Express Order",
    expressCheckoutDesc: "Fill in your details below to place your order instantly. An advisor will call you to confirm shipping.",
    quantity: "Quantity",
    codSaudi: "Cash on Delivery",
    feedback: "Customer Feedback",
    writeReview: "Write a Review",
    submitReview: "Submit Review",
    addReviewSuccess: "Thank you! Your review has been added.",
    customerLogin: "Login",
    enterPhone: "Enter your phone number to proceed",
    loginBtn: "Login",
    enterName: "Please enter your name to complete registration",
    namePlaceholder: "Your full name",
    completeRegister: "Complete Registration & Sign In",
    myOrders: "My Orders",
    myFavorites: "Favorite Products",
    noFavorites: "You have no favorited products yet.",
    noOrders: "No previous orders recorded for this phone number.",
    logout: "Log Out",
    backToHome: "Return to Store",
    supportTitle: "Technical Support Desk",
    supportDesc: "Have questions or issues? Send us a ticket and our support team will assist you immediately.",
    supportFormName: "Full Name",
    supportFormPhone: "Phone Number",
    supportFormSubject: "Subject",
    supportFormMsg: "Message Details",
    supportFormSubmit: "Submit Support Ticket",
    trackMyTickets: "Track My Support Tickets",
    ticketId: "Ticket ID",
    ticketStatus: "Status",
    ticketOpen: "Open",
    ticketResolved: "Resolved",
    trackInputPlaceholder: "Enter phone number to track...",
    trackBtn: "Search Tickets",
    online: "Online Now",
    offline: "Offline Now",
    customReviewsTitle: "Reviews & Ratings",
    reviewsCount: "reviews",
    writeYourOpinion: "Share your thoughts about this product",
    yourRating: "Your Star Rating",
    yourComment: "Your Comment",
    promo: "Special Offer",
    returnToStore: "Return to Store",
    checkoutExpress: "One-Click Quick Purchase",
    openPackageBeforePay: "Inspecting packages is available before paying to guarantee your 100% satisfaction",
    remove: "Remove",
    finalTotal: "Final Total to Pay on Delivery",
    proceedToCheckout: "Proceed to Checkout (COD)",
    yourCart: "Your Shopping Cart",
    cartEmptyDesc: "Browse our catalog and shop your favorite items directly!",
    bestSellers: "Best Sellers",
    allProducts: "All Products",
    filter: "Filter",
    selectFilter: "Select Category",
    informationHours: "INFORMATION & HOURS",
    supportWorkingHours: "Our customer support team is active from 9:00 AM to 10:00 PM, Monday to Saturday.",
    registeredSuccess: "Your account has been registered successfully! Welcome.",
    loginSuccess: "Logged in successfully! Welcome back.",
    welcomeToVirtuprod: "Welcome to Mavluy Shop",
    mavluyHeroBadge: "Official Mavluy Store",
    mavluyHeroTitle: "Mavluy Shop",
    mavluyHeroSubtitle: "Your Ultimate Destination for Refined Shopping — Premium Quality, Exclusive Collections & Unmatched Style.",
    showFavorites: "Show Favorites",
    topBestsellers: "Top Best-Seller Selections",
    viewAll: "View All",
    viewAllProducts: "View All Products",
    verifiedReviews: "Verified Customer Reviews",
    lovedByThousands: "Loved by Thousands",
    lovedByThousandsDesc: "Hear directly from verified buyers about their shopping experience and our product standards.",
    returnToCollection: "Return to Collection",
    saudiFreeShipping: "FAST DELIVERY & GUARANTEED SATISFACTION",
    howHelpYou: "How can we help you?",
    supportCenter: "Support Center",
    supportCenterDesc: "Submit your ticket below or track an existing ticket in real-time. Our customer care team will review your inquiry and contact you directly.",
    supportDesk: "Support Desk",
    supportReplyTime: "We typically reply within 1 hour",
    supportBusinessHours: "Business Hours:",
    supportFormHelpText: "Have a question about your order, shipping, or products? Send us a ticket and our support team will contact you directly via phone.",
    ticketSubmitted: "Ticket Submitted!",
    ticketSubmittedDesc: "Thank you! Your ticket has been recorded. Our team will review your inquiry and call you shortly. You can track this ticket's status on the right.",
    yourNameLabel: "Your Name *",
    saudiPhoneLabel: "Phone Number *",
    subjectLabel: "Subject *",
    messageLabel: "Message *",
    messagePlaceholder: "Explain your inquiry here...",
    sendSupportTicket: "Send Support Ticket",
    trackYourTickets: "Track Your Tickets",
    trackTicketsDesc: "Check if support read your ticket",
    searchPhonePlaceholder: "Search by phone (e.g. 6xxxxxxxx)",
    clearBtn: "Clear",
    noTickets: "No tickets to display",
    noTicketsDesc: "We couldn't find any tickets with this phone number.",
    noTicketsDescDefault: "Tickets submitted from this device will appear here automatically. You can also search by your phone number.",
    read: "Read",
    unread: "Unread",
    inQueue: "In Queue",
    liveTicketTracker: "Live Ticket Tracker",
    ticketSentSuccessStep: "Ticket sent successfully",
    ticketReadStepSuccess: "Opened and read by support agent",
    ticketReadStepWaiting: "Waiting in support queue",
    ticketResolvedStepSuccess: "Support representative contacted customer",
    ticketResolvedStepWaiting: "Agent will contact you via phone shortly",
    wantLiveChat: "Want live text chat?",
    chatOnWhatsApp: "Chat on WhatsApp",
    totalPrice: "Total Price:",
    buyNowCod: "Buy Now (Cash on Delivery)",
    homeTitle: "Home",
    productsTitle: "Products",
    supportTabTitle: "Support",
    cartTitle: "Cart",
    accountTitle: "Account",
    viewProduct: "View Product",
    promoLabel: "Promo",
    buyNow: "Buy Now",
    noProductsFound: "No products found",
    noProductsFoundDesc: "Sorry, no products matched your search criteria. Please try different keywords or filters.",
    resetFilters: "Reset Filters",
    descriptionBenefits: "Description & Benefits",
    howToUseTab: "How to Use",
    faq: "FAQ",
    customerReviews: "Customer Reviews",
    howToGetBestResults: "How to get the best results from your product?",
    faqQ1: "When will I receive my order?",
    faqA1: "Once you place your order, our agent will call you within 2 hours to confirm. Your package will then be delivered to your doorstep within 24 to 48 hours.",
    faqQ2: "Can I inspect the product before paying?",
    faqA2: "Absolutely! We encourage you to open your package and check the items in front of the delivery agent before making any cash payment.",
    faqQ3: "How does payment work?",
    faqA3: "Payment is completed entirely in cash (Cash on Delivery) once the delivery agent hands over the package at your home or office. No credit card required.",
    outOfFiveStars: "out of 5 stars",
    leaveReviewTitle: "Leave a review for this product",
    yourFullName: "Your Full Name *",
    yourCity: "Your City",
    yourRatingLabel: "Your Rating :",
    yourReviewLabel: "Your Review *",
    reviewPlaceholder: "Share your experience with the product (delivery, quality, service...)",
    publishReviewBtn: "Publish My Review",
    verifiedPurchase: "Verified Purchase",
    stars: "stars",
    fiveStars: "5 stars",
    fourStars: "4 stars",
    back: "Back",
    confirmOrderBtn: "Confirm Order",
    orderReceived: "Order Received!",
    thankYouOrder: "Thank you for your order! Your order number is:",
    orderSummary: "Order Summary",
    totalToPayCod: "Total to pay on delivery:",
    continueShopping: "Continue Shopping",
    contactUs: "Contact Us",
    allRightsReserved: "All rights reserved",
    morocco: "Morocco",
    saudiArabia: "Saudi Arabia",
    libya: "Libya",
    unitedArabEmirates: "United Arab Emirates",
    kuwait: "Kuwait",
    qatar: "Qatar",
    bahrain: "Bahrain",
    oman: "Oman",
    egypt: "Egypt"
  },
  fr: {
    home: "Accueil",
    products: "Produits",
    support: "Support",
    cart: "Panier",
    login: "Connexion",
    myAccount: "Mon Compte",
    welcome: "Bienvenue chez Mavluy Shop",
    exclusive: "Excellence Exclusive",
    everyday: "Élégance Au Quotidien",
    discover: "Découvrez notre collection raffinée chez Mavluy Shop. Tous vos produits préférés livrés chez vous avec une qualité irréprochable et un service de confiance.",
    shopNow: "Acheter maintenant",
    showFavorites: "Voir les favoris",
    mavluyHeroBadge: "Boutique Officielle Mavluy",
    mavluyHeroTitle: "Mavluy Shop",
    mavluyHeroSubtitle: "Votre Destination Privilégiée de Shopping — Qualité Premium, Collections Exclusives et Style Inégalé.",
    all: "Tous",
    clothing: "Vêtements",
    skincare: "Soins de la peau",
    homeDecor: "Décoration",
    popularOnly: "Populaires uniquement",
    addToCart: "Ajouter au panier",
    outOfStock: "Rupture de stock",
    originalPrice: "Prix d'origine",
    orderNow: "Commander maintenant (Paiement à la livraison)",
    searchPlaceholder: "Rechercher des produits...",
    filterTitle: "Filtrer & Trier",
    cartEmpty: "Votre panier est vide",
    subtotal: "Sous-total",
    shipping: "Livraison",
    free: "Gratuite",
    total: "Total",
    checkout: "Commander",
    shippingInfo: "Informations de livraison",
    confirmPhoneCall: "Important : Nous vous appellerons sur ce numéro pour confirmer l'expédition.",
    phone: "Numéro de téléphone",
    address: "Adresse complète de livraison",
    city: "Ville",
    name: "Nom complet",
    notes: "Notes spéciales (Optionnel)",
    placeOrder: "Confirmer la commande maintenant",
    orderSuccessTitle: "Commande passée avec succès !",
    orderSuccessDesc: "Nous avons bien reçu votre commande ! Notre équipe vous contactera sous peu pour confirmer l'expédition express.",
    expressCheckoutTitle: "Commande Express Directe",
    expressCheckoutDesc: "Remplissez vos coordonnées ci-dessous pour commander directement. Un conseiller vous contactera pour valider l'envoi.",
    quantity: "Quantité",
    codSaudi: "Paiement à la livraison",
    feedback: "Avis clients",
    writeReview: "Écrire un avis",
    submitReview: "Soumettre l'avis",
    addReviewSuccess: "Merci ! Votre avis a été ajouté avec succès.",
    customerLogin: "Connexion",
    enterPhone: "Entrez votre numéro de téléphone pour continuer",
    loginBtn: "Connexion",
    enterName: "Veuillez entrer votre nom pour compléter l'inscription",
    namePlaceholder: "Votre nom complet",
    completeRegister: "Compléter l'inscription et se connecter",
    myOrders: "Historique de mes commandes",
    myFavorites: "Produits Favoris",
    noFavorites: "Vous n'avez aucun produit favori pour le moment.",
    noOrders: "Aucune commande enregistrée pour ce numéro de téléphone.",
    logout: "Déconnexion",
    backToHome: "Retour à la boutique",
    supportTitle: "Bureau de Support Technique",
    supportDesc: "Vous avez une question ou un souci ? Envoyez-nous un ticket et notre équipe vous assistera immédiatement.",
    supportFormName: "Nom complet",
    supportFormPhone: "Numéro de téléphone",
    supportFormSubject: "Sujet",
    supportFormMsg: "Détails du message",
    supportFormSubmit: "Envoyer le ticket de support",
    trackMyTickets: "Suivre mes tickets de support",
    ticketId: "ID du ticket",
    ticketStatus: "Statut",
    ticketOpen: "Ouvert",
    ticketResolved: "Résolu",
    trackInputPlaceholder: "Entrez le numéro pour rechercher...",
    trackBtn: "Rechercher",
    online: "En ligne",
    offline: "Hors ligne",
    customReviewsTitle: "Avis et Évaluations",
    reviewsCount: "avis",
    writeYourOpinion: "Partagez votre avis sur ce produit",
    yourRating: "Votre note en étoiles",
    yourComment: "Votre commentaire",
    promo: "Offre spéciale",
    returnToStore: "Retour à la boutique",
    checkoutExpress: "Achat Rapide en 1 Clic",
    openPackageBeforePay: "Inspection du colis autorisée avant paiement pour garantir votre entière satisfaction",
    remove: "Supprimer",
    finalTotal: "Total final à payer à la livraison",
    proceedToCheckout: "Procéder au paiement (Paiement à la livraison)",
    yourCart: "Votre Panier d'achat",
    cartEmptyDesc: "Parcourez notre catalogue et achetez vos articles préférés !",
    bestSellers: "Meilleures Ventes",
    allProducts: "Tous les produits",
    filter: "Filtrer",
    selectFilter: "Sélectionner la catégorie",
    informationHours: "INFORMATIONS ET HORAIRES",
    supportWorkingHours: "Notre équipe de support est disponible de 9h00 à 22h00, du lundi au samedi.",
    registeredSuccess: "Votre compte a été créé avec succès ! Bienvenue.",
    loginSuccess: "Connexion réussie ! Heureux de vous revoir.",
    welcomeToVirtuprod: "Bienvenue chez Mavluy Shop",
    topBestsellers: "Sélection des meilleures ventes",
    viewAll: "Voir tout",
    viewAllProducts: "Voir tous les produits",
    verifiedReviews: "Avis clients vérifiés",
    lovedByThousands: "Apprécié par des milliers de clients",
    lovedByThousandsDesc: "Découvrez les retours de nos clients vérifiés sur leur expérience d'achat et la qualité de nos produits.",
    returnToCollection: "Retour aux collections",
    saudiFreeShipping: "LIVRAISON RAPIDE & SATISFACTION GARANTIE",
    howHelpYou: "Comment pouvons-nous vous aider ?",
    supportCenter: "Centre de support",
    supportCenterDesc: "Soumettez votre ticket ci-dessous ou suivez un ticket existant en temps réel. Notre équipe vous contactera directement.",
    supportDesk: "Bureau de support",
    supportReplyTime: "Réponse habituelle sous 1 heure",
    supportBusinessHours: "Heures d'ouverture :",
    supportFormHelpText: "Une question sur votre commande, la livraison ou un article ? Envoyez un ticket et notre support vous appellera.",
    ticketSubmitted: "Ticket envoyé avec succès !",
    ticketSubmittedDesc: "Merci ! Votre ticket a été enregistré. Notre équipe examinera votre demande et vous appellera sous peu.",
    yourNameLabel: "Votre Nom *",
    saudiPhoneLabel: "Numéro de téléphone *",
    subjectLabel: "Sujet *",
    messageLabel: "Message *",
    messagePlaceholder: "Expliquez votre demande en détail ici...",
    sendSupportTicket: "Envoyer le ticket",
    trackYourTickets: "Suivre vos tickets",
    trackTicketsDesc: "Vérifiez si le support a lu votre ticket",
    searchPhonePlaceholder: "Rechercher par téléphone (ex : 6xxxxxxxx)",
    clearBtn: "Effacer",
    noTickets: "Aucun ticket à afficher",
    noTicketsDesc: "Aucun ticket trouvé pour ce numéro.",
    noTicketsDescDefault: "Les tickets envoyés depuis cet appareil s'afficheront ici. Vous pouvez aussi rechercher avec votre numéro.",
    read: "Lu",
    unread: "Non lu",
    inQueue: "En attente",
    liveTicketTracker: "Suivi du ticket en direct",
    ticketSentSuccessStep: "Ticket envoyé avec succès",
    ticketReadStepSuccess: "Ouvert et lu par le support",
    ticketReadStepWaiting: "En attente de traitement",
    ticketResolvedStepSuccess: "Un conseiller a contacté le client et résolu la demande",
    ticketResolvedStepWaiting: "Un conseiller vous contactera par téléphone très prochainement",
    wantLiveChat: "Vous préférez chatter en direct ?",
    chatOnWhatsApp: "Discuter sur WhatsApp",
    totalPrice: "Prix Total :",
    buyNowCod: "Commander (Paiement à la livraison)",
    homeTitle: "Accueil",
    productsTitle: "Produits",
    supportTabTitle: "Support",
    cartTitle: "Panier",
    accountTitle: "Compte",
    viewProduct: "Voir le produit",
    promoLabel: "Promo",
    buyNow: "Acheter maintenant",
    noProductsFound: "Aucun produit trouvé",
    noProductsFoundDesc: "Désolé, aucun produit ne correspond à vos critères de recherche. Essayez d'autres mots-clés ou filtres.",
    resetFilters: "Réinitialiser les filtres",
    descriptionBenefits: "Description & Avantages",
    howToUseTab: "Mode d'emploi",
    faq: "FAQ",
    customerReviews: "Avis Clients",
    howToGetBestResults: "Comment obtenir les meilleurs résultats avec votre produit ?",
    faqQ1: "Quand vais-je recevoir ma commande ?",
    faqA1: "Dès que vous passez votre commande, un conseiller vous appelle pour la valider. Votre colis vous sera livré à domicile sous 24 à 48 heures.",
    faqQ2: "Puis-je inspecter le produit avant de payer ?",
    faqA2: "Absolument ! Vous pouvez ouvrir votre colis et vérifier son contenu devant le livreur avant de régler en espèces.",
    faqQ3: "Comment fonctionne le paiement ?",
    faqA3: "Le paiement se fait intégralement en espèces à la livraison (Cash on Delivery) dès réception de votre colis. Aucune carte bancaire requise.",
    outOfFiveStars: "sur 5 étoiles",
    leaveReviewTitle: "Laisser un avis sur ce produit",
    yourFullName: "Votre Nom Complet *",
    yourCity: "Votre Ville",
    yourRatingLabel: "Votre Note :",
    yourReviewLabel: "Votre Avis *",
    reviewPlaceholder: "Partagez votre expérience (livraison, qualité, service...)",
    publishReviewBtn: "Publier mon avis",
    verifiedPurchase: "Achat Vérifié",
    stars: "étoiles",
    fiveStars: "5 étoiles",
    fourStars: "4 étoiles",
    back: "Retour",
    confirmOrderBtn: "Confirmer la commande",
    orderReceived: "Commande reçue !",
    thankYouOrder: "Merci pour votre commande ! Votre numéro de commande est :",
    orderSummary: "Récapitulatif de la commande",
    totalToPayCod: "Total à payer à la livraison :",
    continueShopping: "Continuer mes achats",
    contactUs: "Contactez-nous",
    allRightsReserved: "Tous droits réservés",
    morocco: "Maroc",
    saudiArabia: "Arabie Saoudite",
    libya: "Libye",
    unitedArabEmirates: "Émirats Arabes Unis",
    kuwait: "Koweït",
    qatar: "Qatar",
    bahrain: "Bahreïn",
    oman: "Oman",
    egypt: "Égypte"
  }
};

const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    'All': 'الكل',
    'Clothing': 'الملابس',
    'Skincare': 'العناية بالبشرة',
    'Home decor': 'ديكور المنزل'
  },
  en: {
    'All': 'All',
    'Clothing': 'Clothing',
    'Skincare': 'Skincare',
    'Home decor': 'Home Decor'
  },
  fr: {
    'All': 'Tous',
    'Clothing': 'Vêtements',
    'Skincare': 'Soins de la peau',
    'Home decor': 'Décoration'
  }
};

interface OnlineStoreProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  storeConfig: StoreConfig;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  theme: any;
  onViewAdmin: () => void;
  countries?: CountryStore[];
  activeCountrySlug?: string;
  onSwitchCountry?: (slug: string) => void;
  categories?: Category[];
  coupons?: Coupon[];
  shippingMethods?: ShippingMethod[];
  reviews?: Review[];
  setReviews?: React.Dispatch<React.SetStateAction<Review[]>>;
}

const getProductLandingData = (product: Product, allReviews: Review[] = [], lang: 'ar' | 'en' | 'fr' = 'ar') => {
  const tagline = (product.tagline || '').trim();

  let features: { title: string; desc: string; icon: string }[] = [];
  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    features = product.features
      .filter(f => f && f.title && f.title.trim().length > 0)
      .map(f => ({
        title: f.title.trim(),
        desc: (f.desc || '').trim(),
        icon: f.icon || 'Award'
      }));
  }

  let howToUse: string[] = [];
  if (product.howToUse && Array.isArray(product.howToUse) && product.howToUse.length > 0) {
    howToUse = product.howToUse
      .filter(s => typeof s === 'string' && s.trim().length > 0)
      .map(s => s.trim());
  }

  let faqs: { q: string; a: string }[] = [];
  if (product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0) {
    faqs = product.faqs
      .filter(f => f && f.q && f.q.trim().length > 0)
      .map(f => ({
        q: f.q.trim(),
        a: (f.a || '').trim()
      }));
  }

  const productReviews = (allReviews || []).filter(
    r => r && r.productId === product.id && (r.status === 'approved' || !r.status)
  );

  return { tagline, features, howToUse, faqs, reviews: productReviews };
};

const renderFeatureIcon = (iconName: string) => {
  return renderFeatureVectorIcon(iconName, "w-5 h-5 text-[#2563eb]");
};

export default function OnlineStore({
  products,
  setProducts,
  storeConfig,
  orders,
  setOrders,
  tickets,
  setTickets,
  theme,
  onViewAdmin,
  countries = [],
  activeCountrySlug = 'ma',
  onSwitchCountry,
  categories: storeCategories = [],
  coupons = [],
  shippingMethods = [],
  reviews = [],
  setReviews
}: OnlineStoreProps) {
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('ecom_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const [currentView, setCurrentView] = useState<'home' | 'all-products' | 'support' | 'profile' | 'favorites'>('home');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const t = (key: keyof typeof translations['ar'] | string) => {
    if (storeConfig.customTexts && storeConfig.customTexts[lang] && (storeConfig.customTexts[lang] as any)[key]) {
      return (storeConfig.customTexts[lang] as any)[key];
    }
    if (key === 'mavluyHeroSubtitle') {
      const bannerSub = lang === 'ar' ? storeConfig.bannerSubtitle : (storeConfig.bannerSubtitleEn || storeConfig.bannerSubtitle);
      if (bannerSub) return bannerSub;
    }
    if (key === 'mavluyHeroTitle') {
      const bannerTit = lang === 'ar' ? storeConfig.bannerTitle : (storeConfig.bannerTitleEn || storeConfig.bannerTitle);
      if (bannerTit) return bannerTit;
    }
    return (translations[lang] && (translations[lang] as any)[key]) || (translations['ar'] as any)[key] || String(key);
  };

  const getProdName = (product: Product) => {
    if (!product) return '';
    if (lang === 'ar' && product.nameAr) return product.nameAr;
    return product.name;
  };

  const getProdDesc = (product: Product) => {
    if (!product) return '';
    if (lang === 'ar' && product.descriptionAr) return product.descriptionAr;
    return product.description;
  };

  const getProductCover = (product: Product): { url: string; isVideo: boolean } => {
    if (!product) return { url: '', isVideo: false };
    if (product.videoUrl && (product.videoPosition === 'first' || product.videoAsPrimary)) {
      const thumb = product.videoThumbnail || (extractYouTubeId(product.videoUrl) ? getYouTubeThumbnail(product.videoUrl) : '');
      if (thumb) return { url: thumb, isVideo: true };
    }
    return { url: product.image, isVideo: false };
  };

  const getProductImageStyle = (product: Product, isVideo = false) => {
    if (isVideo) return { objectFit: 'cover' as const, objectPosition: 'center' };
    const pos = product.imagePosition || (product.imageOffsetY !== undefined ? `center ${product.imageOffsetY}%` : 'center');
    const fit = product.imageFit || 'cover';
    return {
      objectPosition: pos,
      objectFit: fit as any
    };
  };

  const getProdCat = (catName: string) => {
    if (!catName) return '';
    return CATEGORY_TRANSLATIONS[lang]?.[catName] || catName;
  };

  const getCurrency = (customCurrency?: string) => {
    const currentStore = countries.find(
      c => c.slug === activeCountrySlug || c.code.toLowerCase() === activeCountrySlug.toLowerCase()
    );

    if (lang === 'en') {
      if (currentStore?.currency) return currentStore.currency;
      const raw = (customCurrency || storeConfig.currency || 'MAD').trim();
      const clean = raw.replace(/[\.\s_\-]/g, '').toLowerCase();
      if (clean === 'mad' || clean === 'dh' || clean === 'دم' || clean === 'درهم' || clean === 'درهممغربي' || raw === 'د.م.' || raw === 'د.م' || raw === 'DH' || raw === 'MAD' || activeCountrySlug === 'ma') return 'MAD';
      if (clean === 'sar' || clean === 'رس' || clean === 'ريال' || raw === 'ر.س.' || raw === 'ر.س' || raw === 'SAR' || activeCountrySlug === 'sa') return 'SAR';
      if (clean === 'lyd' || clean === 'دل' || raw === 'د.ل.' || raw === 'د.ل' || raw === 'LYD' || activeCountrySlug === 'ly') return 'LYD';
      if (clean === 'aed' || clean === 'دا' || clean === 'دإ' || raw === 'د.إ.' || raw === 'د.إ' || raw === 'AED') return 'AED';
      if (clean === 'tnd' || clean === 'دت' || raw === 'د.ت.' || raw === 'د.ت' || raw === 'TND') return 'TND';
      if (clean === 'dzd' || clean === 'دج' || raw === 'د.ج.' || raw === 'د.ج' || raw === 'DZD') return 'DZD';
      if (clean === 'egp' || clean === 'جم' || raw === 'ج.م.' || raw === 'ج.م' || raw === 'EGP') return 'EGP';
      if (raw === '€' || clean === 'eur') return 'EUR';
      if (raw === '$' || clean === 'usd') return 'USD';
      return raw;
    } else {
      if (currentStore?.currencySymbol) return currentStore.currencySymbol.replace(/\.+$/, '').trim();
      const raw = (customCurrency || storeConfig.currency || 'د.م').trim();
      const clean = raw.replace(/[\.\s_\-]/g, '').toLowerCase();
      if (clean === 'mad' || clean === 'dh' || clean === 'دم' || clean === 'درهم' || clean === 'درهممغربي' || raw === 'MAD' || raw === 'DH' || raw === 'د.م.' || raw === 'د.م' || activeCountrySlug === 'ma') return 'د.م';
      if (clean === 'sar' || clean === 'رس' || clean === 'ريال' || raw === 'SAR' || raw === 'ر.س.' || raw === 'ر.س' || activeCountrySlug === 'sa') return 'ر.س';
      if (clean === 'lyd' || clean === 'دل' || raw === 'LYD' || raw === 'د.ل.' || raw === 'د.ل' || activeCountrySlug === 'ly') return 'د.ل';
      if (clean === 'aed' || clean === 'دا' || clean === 'دإ' || raw === 'AED' || raw === 'د.إ.' || raw === 'د.إ') return 'د.إ';
      if (clean === 'tnd' || clean === 'دت' || raw === 'TND' || raw === 'د.ت.' || raw === 'د.ت') return 'د.ت';
      if (clean === 'dzd' || clean === 'دج' || raw === 'DZD' || raw === 'د.ج.' || raw === 'د.ج') return 'د.ج';
      if (clean === 'egp' || clean === 'جم' || raw === 'EGP' || raw === 'ج.م.' || raw === 'ج.م') return 'ج.م';
      return raw.replace(/\.+$/, '').trim();
    }
  };

  const getStoreName = () => {
    if (lang === 'en') {
      if (storeConfig.storeNameEn) return storeConfig.storeNameEn;
      if (!storeConfig.storeName || storeConfig.storeName === 'المتجر المغربي الفاخر' || /[\u0600-\u06FF]/.test(storeConfig.storeName)) {
        return 'Mavluy';
      }
      return storeConfig.storeName;
    }
    if (!storeConfig.storeName || storeConfig.storeName === 'المتجر المغربي الفاخر') {
      return 'متجر مافلوي | Mavluy';
    }
    return storeConfig.storeName;
  };

  const [loggedInCustomer, setLoggedInCustomer] = useState<any>(() => {
    const saved = localStorage.getItem('ecom_logged_in_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ecom_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoriteToDelete, setFavoriteToDelete] = useState<Product | null>(null);
  const [isClearAllFavoritesOpen, setIsClearAllFavoritesOpen] = useState(false);

  const confirmDeleteFavorite = () => {
    if (!favoriteToDelete) return;
    const prod = favoriteToDelete;
    setFavorites(prev => prev.filter(id => id !== prod.id));
    showNotification(
      lang === 'ar'
        ? `تم حذف "${getProdName(prod)}" من المفضلة`
        : `Removed "${getProdName(prod)}" from favorites`,
      'success'
    );
    setFavoriteToDelete(null);
  };

  const confirmClearAllFavorites = () => {
    setFavorites([]);
    showNotification(
      lang === 'ar'
        ? 'تم تفريغ قائمة المفضلة بالكامل'
        : 'All favorites cleared',
      'success'
    );
    setIsClearAllFavoritesOpen(false);
  };

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPasswordInput, setCustomerPasswordInput] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    if (activeCountrySlug === 'ma') return 'MA';
    if (activeCountrySlug === 'ly') return 'LY';
    if (activeCountrySlug === 'sa') return 'SA';
    return (activeCountrySlug || 'MA').toUpperCase();
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCheckoutCountryDropdownOpen, setIsCheckoutCountryDropdownOpen] = useState(false);
  const [isSupportCountryDropdownOpen, setIsSupportCountryDropdownOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'name' | 'profile'>('phone');
  const [customerModalError, setCustomerModalError] = useState('');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerTickets, setCustomerTickets] = useState<SupportTicket[]>([]);
  const [ticketToClose, setTicketToClose] = useState<string | null>(null);
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [profileActiveTab, setProfileActiveTab] = useState<'orders' | 'profile' | 'favorites' | 'tickets'>('orders');
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfilePassword, setEditProfilePassword] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateMsg, setProfileUpdateMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const [hasCustomerUnreadActivity, setHasCustomerUnreadActivity] = useState<boolean>(false);

  const computeCustomerActivitySignature = useCallback((ordersList: Order[], ticketsList: SupportTicket[]) => {
    if (!ordersList || (!ordersList.length && !ticketsList.length)) return '';
    const ordersPart = (ordersList || [])
      .map(o => `${o.id}_${o.status}_${o.updatedAt || o.date || ''}_${o.trackingNumber || ''}`)
      .sort()
      .join(';');
    const ticketsPart = (ticketsList || [])
      .map(t => `${t.id}_${t.status}_${t.messages?.length || 0}_${t.updatedAt || ''}`)
      .sort()
      .join(';');
    return `${ordersPart}__${ticketsPart}`;
  }, []);

  const markCustomerActivityAsSeen = useCallback(() => {
    if (loggedInCustomer && loggedInCustomer.phone) {
      const sanitizedPhone = loggedInCustomer.phone.trim().replace(/\s+/g, '');
      const currentSig = computeCustomerActivitySignature(customerOrders, customerTickets);
      if (currentSig) {
        try {
          localStorage.setItem(`ecom_customer_seen_sig_${sanitizedPhone}`, currentSig);
        } catch {
        }
      }
      setHasCustomerUnreadActivity(false);
    }
  }, [loggedInCustomer, customerOrders, customerTickets, computeCustomerActivitySignature]);

  useEffect(() => {
    if (!loggedInCustomer || !loggedInCustomer.phone) {
      setHasCustomerUnreadActivity(false);
      return;
    }
    const sanitizedPhone = loggedInCustomer.phone.trim().replace(/\s+/g, '');
    const currentSig = computeCustomerActivitySignature(customerOrders, customerTickets);

    if (!currentSig) {
      setHasCustomerUnreadActivity(false);
      return;
    }

    const lastSeenSig = localStorage.getItem(`ecom_customer_seen_sig_${sanitizedPhone}`);

    if (currentView === 'profile') {
      try {
        localStorage.setItem(`ecom_customer_seen_sig_${sanitizedPhone}`, currentSig);
      } catch {}
      setHasCustomerUnreadActivity(false);
    } else {
      if (!lastSeenSig || lastSeenSig !== currentSig) {
        setHasCustomerUnreadActivity(true);
      } else {
        setHasCustomerUnreadActivity(false);
      }
    }
  }, [customerOrders, customerTickets, loggedInCustomer, currentView, computeCustomerActivitySignature]);

  useEffect(() => {
    if (!loggedInCustomer || !loggedInCustomer.phone) return;
    const interval = setInterval(() => {
      loadCustomerData(loggedInCustomer.phone);
    }, 6000);
    return () => clearInterval(interval);
  }, [loggedInCustomer?.phone]);

  useEffect(() => {
    if (loggedInCustomer) {
      setEditProfileName(loggedInCustomer.name || '');
      setEditProfilePhone(loggedInCustomer.phone || '');
      setEditProfileAvatar(loggedInCustomer.avatar || '');
      setEditProfilePassword('');
      setProfileUpdateMsg(null);
    }
  }, [loggedInCustomer]);

  const applyAvatarChange = async (newAvatarUrl: string) => {
    setEditProfileAvatar(newAvatarUrl);
    if (loggedInCustomer) {
      const updatedCustomer = {
        ...loggedInCustomer,
        avatar: newAvatarUrl
      };
      setLoggedInCustomer(updatedCustomer);
      try {
        localStorage.setItem('ecom_logged_in_customer', JSON.stringify(updatedCustomer));
      } catch {}

      try {
        await fetch('/api/customers/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPhone: loggedInCustomer.phone,
            avatar: newAvatarUrl,
            name: loggedInCustomer.name
          })
        });
        showNotification(
          lang === 'ar' ? 'تم تحديث الصورة الشخصية بنجاح' : 'Avatar updated successfully',
          'success'
        );
      } catch (err) {
        console.error('Error saving avatar to server:', err);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInCustomer) return;
    setIsUpdatingProfile(true);
    setProfileUpdateMsg(null);

    try {
      const res = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhone: loggedInCustomer.phone,
          newPhone: editProfilePhone.trim() || loggedInCustomer.phone,
          name: editProfileName.trim() || loggedInCustomer.name,
          avatar: editProfileAvatar,
          password: editProfilePassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success && data.customer) {
        setLoggedInCustomer(data.customer);
        localStorage.setItem('ecom_logged_in_customer', JSON.stringify(data.customer));
        setProfileUpdateMsg({
          text: lang === 'ar' ? 'تم حفظ وتحديث بيانات حسابك بنجاح!' : 'Your profile has been updated successfully!',
          type: 'success'
        });
        showNotification(
          lang === 'ar' ? 'تم تحديث بيانات الحساب بنجاح' : 'Account updated successfully',
          'success'
        );
        loadCustomerData(data.customer.phone);
      } else {
        setProfileUpdateMsg({
          text: data.message || (lang === 'ar' ? 'حدث خطأ أثناء تحديث البيانات.' : 'Failed to update profile.'),
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileUpdateMsg({
        text: lang === 'ar' ? 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.' : 'Connection error, please try again.',
        type: 'error'
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const cloudUrl = await uploadImageToCloud(file, 400, 400, 0.85);
      await applyAvatarChange(cloudUrl);
    } catch (err) {
      console.error('Error processing avatar image:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء معالجة الصورة، يرجى اختيار ملف صورة صالح.' : 'Error processing image. Please choose a valid image file.');
    }
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ecom_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ecom_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const store = countries.find(
      c => c.slug === activeCountrySlug || c.code.toLowerCase() === activeCountrySlug.toLowerCase()
    );
    if (store) {
      if (store.code) {
        setSelectedCountryCode(store.code.toUpperCase());
      }
      if (store.language) {
        setLang(store.language === 'en' ? 'en' : 'ar');
      }
    } else {
      if (activeCountrySlug === 'ma') setSelectedCountryCode('MA');
      else if (activeCountrySlug === 'ly') setSelectedCountryCode('LY');
      else if (activeCountrySlug === 'sa') setSelectedCountryCode('SA');
    }
  }, [activeCountrySlug, countries]);

  const [showBackToTop, setShowBackToTop] = useState(false);
  const showBackToTopRef = useRef(false);
  const scrollProgressBarRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem('ecom_favorites', JSON.stringify(favorites));
    } catch {
    }

    if (loggedInCustomer && loggedInCustomer.phone) {
      fetch('/api/customers/sync-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loggedInCustomer.phone, favorites })
      })
        .then(async res => {
          if (!res.ok) {
            if (res.status === 404) {
              setLoggedInCustomer(null);
              localStorage.removeItem('ecom_logged_in_customer');
            }
          }
        })
        .catch(() => {
        });
    }
  }, [favorites, loggedInCustomer]);

  const loadCustomerData = (phone: string) => {
    if (!phone) return;
    fetch(`/api/customers/data/${encodeURIComponent(phone.trim().replace(/\s+/g, ''))}`)
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          if (data.customer) {
            setLoggedInCustomer(data.customer);
            localStorage.setItem('ecom_logged_in_customer', JSON.stringify(data.customer));
            if (Array.isArray(data.customer.favorites)) {
              setFavorites(data.customer.favorites);
            }
          } else {
            setLoggedInCustomer(null);
            localStorage.removeItem('ecom_logged_in_customer');
          }
          if (Array.isArray(data.orders)) {
            setCustomerOrders(data.orders);
          }
          if (Array.isArray(data.tickets)) {
            setCustomerTickets(data.tickets);
          }
        }
      })
      .catch(() => {
      });
  };

  useEffect(() => {
    if (loggedInCustomer && loggedInCustomer.phone) {
      loadCustomerData(loggedInCustomer.phone);
    }
  }, [orders, tickets]);

  useEffect(() => {
    if (loggedInCustomer && loggedInCustomer.phone) {
      loadCustomerData(loggedInCustomer.phone);
    }
  }, []);

  const handleCustomerLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerModalError('');

    if (authMode === 'register' && !customerNameInput.trim()) {
      setCustomerModalError(lang === 'ar' ? 'الرجاء إدخال الاسم أو اسم المستخدم.' : 'Please enter your name or username.');
      return;
    }

    if (!customerPhoneInput.trim()) {
      setCustomerModalError(lang === 'ar' ? 'الرجاء إدخال رقم الجوال.' : 'Please enter your phone number.');
      return;
    }

    if (!customerPasswordInput.trim()) {
      setCustomerModalError(lang === 'ar' ? 'الرجاء إدخال كلمة السر.' : 'Please enter your password.');
      return;
    }

    const country = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
    let cleanPhone = customerPhoneInput.replace(/\D/g, '');

    const prefixDigits = country.prefix.replace('+', '');
    if (cleanPhone.startsWith(prefixDigits)) {
      cleanPhone = cleanPhone.slice(prefixDigits.length);
    } else if (cleanPhone.startsWith('00' + prefixDigits)) {
      cleanPhone = cleanPhone.slice(('00' + prefixDigits).length);
    }

    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    const normalizedPhone = country.prefix + cleanPhone;

    if (cleanPhone.length < 7 || cleanPhone.length > 12) {
      setCustomerModalError(lang === 'ar'
        ? `يرجى إدخال رقم جوال صحيح (مثال: ${country.placeholder}).`
        : `Please enter a valid phone number (e.g., ${country.placeholder}).`);
      return;
    }

    try {
      const res = await fetch('/api/customers/login-or-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: authMode === 'register' ? customerNameInput.trim() : undefined,
          password: customerPasswordInput.trim(),
          mode: authMode,
          storeId: activeCountrySlug
        })
      });

      const data = await res.json();
      if (data.success && data.customer) {
        setLoggedInCustomer(data.customer);
        localStorage.setItem('ecom_logged_in_customer', JSON.stringify(data.customer));
        if (data.customer.favorites) {
          setFavorites(data.customer.favorites);
        }

        setCheckoutForm(prev => ({
          ...prev,
          name: data.customer.name,
          phone: data.customer.phone
        }));

        loadCustomerData(data.customer.phone);

        setIsCustomerModalOpen(false);
        setLoginStep('profile');
        setCurrentView('profile');
        setSelectedProduct(null);

        showNotification(
          authMode === 'register'
            ? (lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account registered successfully!')
            : (lang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!'),
          'success'
        );
      } else {
        setCustomerModalError(data.error || (lang === 'ar' ? 'حدث خطأ أثناء الدخول' : 'Something went wrong.'));
      }
    } catch (err) {
      setCustomerModalError(lang === 'ar' ? 'خطأ في الاتصال. حاول مرة أخرى.' : 'Connection error. Please try again.');
    }
  };

  const handleCustomerLogout = () => {
    setLoggedInCustomer(null);
    localStorage.removeItem('ecom_logged_in_customer');
    setFavorites([]);
    localStorage.removeItem('ecom_favorites');
    setCustomerOrders([]);
    setCustomerTickets([]);
    setCustomerPhoneInput('');
    setCustomerNameInput('');
    setCustomerPasswordInput('');
    setLoginStep('phone');
  };

  const handleToggleFavorite = (productId: string) => {
    if (!loggedInCustomer || !loggedInCustomer.phone) {
      showNotification(
        lang === 'ar'
          ? 'يرجى تسجيل الدخول أو إنشاء حساب برقم هاتفك لحفظ المنتجات في المفضلة'
          : 'Please log in or register with your phone number to save favorites',
        'error'
      );
      setAuthMode('login');
      setLoginStep('phone');
      setCustomerModalError(
        lang === 'ar'
          ? 'يرجى تسجيل الدخول أو إنشاء حساب برقم هاتفك لتتمكن من إضافة المنتجات إلى المفضلة والرجوع إليها دائماً'
          : 'Please log in with your phone number to access and manage your favorites list.'
      );
      setCurrentView('profile');
      setSelectedProduct(null);
      return;
    }

    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      showNotification(
        isFav
          ? (lang === 'ar' ? 'تمت إزالة المنتج من المفضلة' : 'Removed from favorites')
          : (lang === 'ar' ? 'تمت إضافة المنتج إلى المفضلة بنجاح' : 'Added to favorites'),
        'success'
      );
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterPopular, setFilterPopular] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isPageNavigating, setIsPageNavigating] = useState(false);

  const logPixelEvent = useCallback((
    eventType: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead',
    eventData?: {
      productId?: string;
      productName?: string;
      value?: number;
      currency?: string;
      orderId?: string;
      customerName?: string;
      customerPhone?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    try {
      fetch('/api/pixel/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          storeId: activeCountrySlug || 'ma',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          ...eventData,
          currency: eventData?.currency || getCurrency(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        })
      }).catch(() => {});

      if (typeof window !== 'undefined' && (window as any).fbq) {
        try {
          (window as any).fbq('track', eventType, {
            content_name: eventData?.productName,
            content_ids: eventData?.productId ? [eventData.productId] : undefined,
            value: eventData?.value,
            currency: eventData?.currency || getCurrency()
          });
        } catch (e) {}
      }

      if (typeof window !== 'undefined' && (window as any).ttq) {
        try {
          (window as any).ttq.track(eventType === 'Purchase' ? 'CompletePayment' : eventType, {
            content_name: eventData?.productName,
            content_id: eventData?.productId,
            value: eventData?.value,
            currency: eventData?.currency || getCurrency()
          });
        } catch (e) {}
      }
    } catch (e) {}
  }, [activeCountrySlug, getCurrency]);

  useEffect(() => {
    logPixelEvent('PageView', {
      metadata: { view: currentView, country: activeCountrySlug }
    });
  }, [currentView, activeCountrySlug, logPixelEvent]);

  useEffect(() => {
    if (selectedProduct) {
      logPixelEvent('ViewContent', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        value: selectedProduct.price,
        currency: getCurrency()
      });
    }
  }, [selectedProduct, getCurrency, logPixelEvent]);

  const [customReviews, setCustomReviews] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('ecom_custom_reviews');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetch('/api/custom-reviews', { signal: controller.signal })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (!isMounted || !data || typeof data !== 'object') return;
        setCustomReviews(data);
        try {
          localStorage.setItem('ecom_custom_reviews', JSON.stringify(data));
        } catch (_) {}
      })
      .catch(() => {
        // Fallback safely to cached reviews without logging console error
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const [activeLandingImage, setActiveLandingImage] = useState<string>('');
  const [isPlayingProductVideo, setIsPlayingProductVideo] = useState<boolean>(false);

  const [activeLandingTab, setActiveLandingTab] = useState<'description' | 'instructions' | 'faq' | 'reviews'>('description');

  const updateScrollMetrics = useCallback(() => {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    const winHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const totalHeight = docHeight - winHeight;

    if (scrollProgressBarRef.current) {
      const ratio = totalHeight > 5 ? Math.min(1, Math.max(0, scrollY / totalHeight)) : 0;
      scrollProgressBarRef.current.style.transform = `scaleX(${ratio})`;
    }

    const shouldShowBackToTop = scrollY > 250;
    if (shouldShowBackToTop !== showBackToTopRef.current) {
      showBackToTopRef.current = shouldShowBackToTop;
      setShowBackToTop(shouldShowBackToTop);
    }

    const shouldBeScrolled = scrollY > 40;
    if (shouldBeScrolled !== isScrolledRef.current) {
      isScrolledRef.current = shouldBeScrolled;
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollMetrics();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    updateScrollMetrics();
    const timeoutId = setTimeout(updateScrollMetrics, 150);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [updateScrollMetrics, currentView, selectedProduct, activeLandingTab, filterPopular, selectedCategory, activeCountrySlug]);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportSubject, setSupportSubject] = useState('Product Inquiries');
  const [supportOrderId, setSupportOrderId] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isTicketSubmitted, setIsTicketSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');
  const [supportActiveTab, setSupportActiveTab] = useState<'ticket' | 'track'>('ticket');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [activeTicketConversationId, setActiveTicketConversationId] = useState<string | null>(null);
  const [ticketReplyInput, setTicketReplyInput] = useState('');
  const [isSendingTicketReply, setIsSendingTicketReply] = useState(false);

  const [ticketPhoneSearch, setTicketPhoneSearch] = useState('');
  const [localSubmittedIds, setLocalSubmittedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ecom_user_submitted_ticket_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const activeOpenTicket = useMemo(() => {
    const clientPhone = (loggedInCustomer?.phone || supportPhone).trim().replace(/\s+/g, '');
    return tickets.find(t => {
      if (t.status === 'resolved') return false;
      if (localSubmittedIds.includes(t.id)) return true;
      if (clientPhone && t.customerPhone.trim().replace(/\s+/g, '') === clientPhone) return true;
      return false;
    });
  }, [tickets, loggedInCustomer?.phone, supportPhone, localSubmittedIds]);

  const getStoreUrl = useCallback((path: string = '', params?: Record<string, string | number | boolean | undefined | null>) => {
    const countryPrefix = activeCountrySlug ? `/${activeCountrySlug}` : '';
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    let url = `${countryPrefix}${cleanPath}` || '/';
    if (params) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      });
      const queryString = qs.toString();
      if (queryString) url += (url.includes('?') ? '&' : '?') + queryString;
    }
    return url;
  }, [activeCountrySlug]);

  const getHomeUrl = useCallback(() => getStoreUrl(''), [getStoreUrl]);
  const getProductsUrl = useCallback((category?: string, query?: string) => {
    const slug = (storeConfig?.customProductsSlug || 'products').trim().replace(/^\/+|\/+$/g, '') || 'products';
    return getStoreUrl(`/${slug}`, {
      category: category && category !== 'All' ? category : undefined,
      q: query || undefined
    });
  }, [getStoreUrl, storeConfig?.customProductsSlug]);
  const getProductUrl = useCallback((prod: Product | string) => {
    const id = typeof prod === 'string' ? prod : prod.id;
    return getStoreUrl(`/product/${encodeURIComponent(id)}`);
  }, [getStoreUrl]);
  const getSupportUrl = useCallback((params?: { phone?: string; id?: string; tab?: string; order?: string }) => {
    const slug = (storeConfig?.customSupportSlug || 'support').trim().replace(/^\/+|\/+$/g, '') || 'support';
    return getStoreUrl(`/${slug}`, params);
  }, [getStoreUrl, storeConfig?.customSupportSlug]);
  const getTicketsUrl = getSupportUrl;
  const getProfileUrl = useCallback((params?: { phone?: string }) => {
    const slug = (storeConfig?.customProfileSlug || 'profile').trim().replace(/^\/+|\/+$/g, '') || 'profile';
    return getStoreUrl(`/${slug}`, params);
  }, [getStoreUrl, storeConfig?.customProfileSlug]);
  const getFavoritesUrl = useCallback(() => {
    const slug = (storeConfig?.customFavoritesSlug || 'favorites').trim().replace(/^\/+|\/+$/g, '') || 'favorites';
    return getStoreUrl(`/${slug}`);
  }, [getStoreUrl, storeConfig?.customFavoritesSlug]);
  const getCartUrl = useCallback(() => {
    const slug = (storeConfig?.customCartSlug || 'cart').trim().replace(/^\/+|\/+$/g, '') || 'cart';
    return getStoreUrl(`/${slug}`);
  }, [getStoreUrl, storeConfig?.customCartSlug]);
  const getCheckoutUrl = useCallback(() => {
    const slug = (storeConfig?.customCheckoutSlug || 'checkout').trim().replace(/^\/+|\/+$/g, '') || 'checkout';
    return getStoreUrl(`/${slug}`);
  }, [getStoreUrl, storeConfig?.customCheckoutSlug]);

  const pendingProductIdRef = useRef<string | null>(null);

  const syncStateFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const pathname = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      const segments = pathname.split('/').filter(Boolean);
      const searchParams = new URLSearchParams(window.location.search);

      const customSupport = (storeConfig?.customSupportSlug || 'support').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const customProducts = (storeConfig?.customProductsSlug || 'products').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const customProfile = (storeConfig?.customProfileSlug || 'profile').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const customFavorites = (storeConfig?.customFavoritesSlug || 'favorites').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const customCart = (storeConfig?.customCartSlug || 'cart').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const customCheckout = (storeConfig?.customCheckoutSlug || 'checkout').trim().toLowerCase().replace(/^\/+|\/+$/g, '');

      const reservedPrefixes = [
        'products', 'product', 'p', 'item', 'support', 'tickets', 'ticket',
        'profile', 'account', 'orders', 'order', 'track', 'tracking',
        'favorites', 'wishlist', 'saved', 'cart', 'checkout', 'category', 'categories',
        'admin', 'dashboard', 'login', 'register',
        customSupport, customProducts, customProfile, customFavorites, customCart, customCheckout
      ].filter(Boolean);

      let routeSegments = [...segments];
      if (routeSegments.length > 0) {
        const first = routeSegments[0];
        const isCountryPrefix = (countries && countries.some(c => c.slug === first || c.code.toLowerCase() === first)) ||
          (!reservedPrefixes.includes(first) && first.length >= 2 && first.length <= 4 && /^[a-z]+$/.test(first));
        if (isCountryPrefix) {
          routeSegments.shift();
        }
      }

      const primary = routeSegments[0] || '';
      const secondary = routeSegments[1] || '';

      if (primary === 'product' || primary === 'p' || primary === 'item') {
        const targetId = decodeURIComponent(secondary || searchParams.get('id') || '');
        if (targetId) {
          const match = products.find(p =>
            p.id === targetId ||
            p.id.toLowerCase() === targetId.toLowerCase() ||
            (p.name && p.name.toLowerCase().replace(/\s+/g, '-') === targetId.toLowerCase())
          );
          if (match) {
            setSelectedProduct(match);
            pendingProductIdRef.current = null;
            if (match.videoUrl && (match.videoPosition === 'first' || match.videoAsPrimary)) {
              setActiveLandingImage('__VIDEO__');
            } else {
              setActiveLandingImage(match.image);
            }
          } else {
            pendingProductIdRef.current = targetId;
          }
          return;
        }
      }

      setSelectedProduct(null);

      if (primary === customProducts || primary === 'products' || primary === 'shop' || primary === 'catalog' || primary === 'all-products') {
        setCurrentView('all-products');
        const cat = searchParams.get('category');
        if (cat) setSelectedCategory(decodeURIComponent(cat));
        const q = searchParams.get('q');
        if (q) setSearchQuery(decodeURIComponent(q));
        if (searchParams.get('popular') === 'true') setFilterPopular(true);
        return;
      }

      if (primary === 'category' || primary === 'categories') {
        setCurrentView('all-products');
        const cat = secondary ? decodeURIComponent(secondary) : searchParams.get('name');
        if (cat) setSelectedCategory(cat);
        return;
      }

      if (primary === customSupport || primary === 'support' || primary === 'tickets' || primary === 'ticket' || primary === 'help' || primary === 'contact') {
        setCurrentView('support');
        const phone = searchParams.get('phone');
        if (phone) {
          setTicketPhoneSearch(phone);
          setSupportActiveTab('track');
        }
        const ticketId = searchParams.get('id');
        if (ticketId) {
          setSubmittedTicketId(ticketId);
          setActiveTicketConversationId(ticketId);
          setSupportActiveTab('track');
        }
        const orderId = searchParams.get('order');
        if (orderId) {
          setSupportOrderId(orderId);
          setSupportSubject('Order Tracking / Delivery');
        }
        if (searchParams.get('tab') === 'track' || searchParams.get('tab') === 'lookup') {
          setSupportActiveTab('track');
        }
        return;
      }

      if (primary === customProfile || primary === 'profile' || primary === 'account' || primary === 'orders' || primary === 'my-orders' || primary === 'track' || primary === 'tracking') {
        setCurrentView('profile');
        const phone = searchParams.get('phone');
        if (phone && !loggedInCustomer) {
          const foundCountry = COUNTRIES.find(c => phone.startsWith(c.prefix));
          if (foundCountry) {
            setSelectedCountryCode(foundCountry.code);
            setCustomerPhoneInput(phone.slice(foundCountry.prefix.length));
          } else {
            setCustomerPhoneInput(phone);
          }
        }
        return;
      }

      if (primary === customFavorites || primary === 'favorites' || primary === 'wishlist' || primary === 'saved') {
        setCurrentView('favorites');
        return;
      }

      if (primary === customCart || primary === 'cart') {
        setIsCartOpen(true);
        return;
      }
      if (primary === customCheckout || primary === 'checkout') {
        setIsCheckoutOpen(true);
        return;
      }

      setCurrentView('home');
    } catch (e) {
      console.warn('URL sync error:', e);
    }
  }, [countries, products, loggedInCustomer, storeConfig?.customSupportSlug, storeConfig?.customProductsSlug, storeConfig?.customProfileSlug, storeConfig?.customFavoritesSlug, storeConfig?.customCartSlug, storeConfig?.customCheckoutSlug]);

  const navigateTo = useCallback((targetUrl: string, replace = false) => {
    if (typeof window === 'undefined') return;
    setIsPageNavigating(true);
    if (replace) {
      window.history.replaceState({}, '', targetUrl);
    } else {
      window.history.pushState({}, '', targetUrl);
    }
    syncStateFromUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsPageNavigating(false), 200);
  }, [syncStateFromUrl]);

  const handleOpenProduct = useCallback((product: Product) => {
    const targetUrl = getProductUrl(product);
    navigateTo(targetUrl);
  }, [getProductUrl, navigateTo]);

  const handleCloseProduct = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo(getProductsUrl());
    }
  }, [navigateTo, getProductsUrl]);

  useEffect(() => {
    syncStateFromUrl();
    const handlePop = () => {
      syncStateFromUrl();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [syncStateFromUrl]);

  useEffect(() => {
    if (pendingProductIdRef.current && products.length > 0) {
      const targetId = pendingProductIdRef.current;
      const match = products.find(p =>
        p.id === targetId ||
        p.id.toLowerCase() === targetId.toLowerCase() ||
        (p.name && p.name.toLowerCase().replace(/\s+/g, '-') === targetId.toLowerCase())
      );
      if (match) {
        setSelectedProduct(match);
        pendingProductIdRef.current = null;
        if (match.videoUrl && (match.videoPosition === 'first' || match.videoAsPrimary)) {
          setActiveLandingImage('__VIDEO__');
        } else {
          setActiveLandingImage(match.image);
        }
      }
    }
  }, [products]);

  useEffect(() => {
    if (selectedProduct) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedProduct]);

  // 🚀 Dynamic SEO: Updates Page Title, Meta Description, Open Graph & Google Schema
  useEffect(() => {
    try {
      const storeName = getStoreName();
      let pageTitle = `${storeName} | متجر مافلوي للتسوق الفاخر والمنتجات الحصرية`;
      let pageDesc = storeConfig.description || 'Mavluy - متجر مافلوي الرسمي للتسوق الإلكتروني الراقي والموثوق مع الدفع عند الاستلام والتوصيل السريع.';
      let pageImage = storeConfig.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop';
      let productSchemaJson: string | null = null;

      if (selectedProduct) {
        pageTitle = `${selectedProduct.name} | Mavluy - متجر مافلوي`;
        if (selectedProduct.description) {
          pageDesc = selectedProduct.description.slice(0, 160);
        }
        if (selectedProduct.image) {
          pageImage = selectedProduct.image;
        }

        const productSchema = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': selectedProduct.name,
          'image': [selectedProduct.image, ...(selectedProduct.additionalImages || [])].filter(Boolean),
          'description': selectedProduct.description || selectedProduct.name,
          'sku': selectedProduct.id,
          'brand': {
            '@type': 'Brand',
            'name': 'Mavluy'
          },
          'offers': {
            '@type': 'Offer',
            'url': typeof window !== 'undefined' ? window.location.href : '',
            'priceCurrency': getCurrency(),
            'price': selectedProduct.price,
            'priceValidUntil': '2027-12-31',
            'itemCondition': 'https://schema.org/NewCondition',
            'availability': (selectedProduct.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            'seller': {
              '@type': 'Organization',
              'name': 'Mavluy'
            }
          }
        };
        productSchemaJson = JSON.stringify(productSchema);
      } else if (currentView === 'all-products' || (selectedCategory && selectedCategory !== 'All')) {
        const catLabel = selectedCategory !== 'All' ? selectedCategory : (lang === 'ar' ? 'جميع المنتجات' : 'All Products');
        pageTitle = `${catLabel} | Mavluy - متجر مافلوي`;
        pageDesc = `${lang === 'ar' ? 'تصفح تشكيلة' : 'Browse'} ${catLabel} ${lang === 'ar' ? 'في متجر مافلوي الرسمي بأفضل الأسعار مع التوصيل السريع والدفع عند الاستلام.' : 'at Mavluy Store with cash on delivery.'}`;
      } else if (currentView === 'support') {
        pageTitle = `${lang === 'ar' ? 'مركز المساعدة وخدمة العملاء' : 'Customer Support & Help'} | Mavluy`;
      } else if (currentView === 'favorites') {
        pageTitle = `${lang === 'ar' ? 'قائمة المفضلة' : 'My Wishlist'} | Mavluy`;
      } else if (currentView === 'profile') {
        pageTitle = `${lang === 'ar' ? 'حسابي' : 'My Account'} | Mavluy`;
      }

      // 1. Update Document Title
      document.title = pageTitle;

      // 2. Update Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', pageDesc);

      // 3. Update Open Graph Tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', pageTitle);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', pageDesc);
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute('content', pageImage);

      // 4. Update Twitter Card Tags
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', pageTitle);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', pageDesc);
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute('content', pageImage);

      // 5. Update Canonical Tag
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', window.location.href);

      // 6. Inject or update Product JSON-LD
      let scriptTag = document.getElementById('schema-product-jsonld');
      if (productSchemaJson) {
        if (!scriptTag) {
          scriptTag = document.createElement('script');
          scriptTag.id = 'schema-product-jsonld';
          scriptTag.setAttribute('type', 'application/ld+json');
          document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = productSchemaJson;
      } else if (scriptTag) {
        scriptTag.remove();
      }
    } catch {
      // Ignore DOM errors safely
    }
  }, [selectedProduct, currentView, selectedCategory, storeConfig, lang]);

  const handleSendSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportPhone.trim() || !supportMessage.trim()) return;

    if (activeOpenTicket) {
      showNotification(
        lang === 'ar'
          ? 'لديك تذكرة دعم فني نشطة قيد المتابعة بالفعل. يمكنك إكمال المحادثة فيها أدناه.'
          : 'You already have an active open ticket. Please continue your conversation below.',
        'error'
      );
      return;
    }

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: activeCountrySlug,
      customerName: supportName.trim(),
      customerPhone: supportPhone.trim(),
      subject: supportSubject || 'General Inquiry',
      message: supportMessage.trim(),
      status: 'open',
      seen: false,
      date: new Date().toISOString(),
      messages: []
    };

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(prev => [newTicket, ...prev]);
        const updatedSubmitted = [newTicket.id, ...localSubmittedIds];
        setLocalSubmittedIds(updatedSubmitted);
        localStorage.setItem('ecom_user_submitted_ticket_ids', JSON.stringify(updatedSubmitted));

        setSubmittedTicketId(newTicket.id);
        setIsTicketSubmitted(true);
        setSupportMessage('');

        logPixelEvent('Lead', {
          customerName: newTicket.customerName,
          customerPhone: newTicket.customerPhone,
          metadata: {
            subject: newTicket.subject,
            ticketId: newTicket.id
          }
        });
      } else {
        showNotification(data.error || (lang === 'ar' ? 'تعذر إرسال التذكرة' : 'Could not submit ticket'), 'error');
      }
    } catch (err) {
      console.error('Error submitting support ticket:', err);
    }
  };

  const handleSendTicketReply = async (ticketId: string) => {
    if (!ticketReplyInput.trim()) return;
    setIsSendingTicketReply(true);

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderName: loggedInCustomer?.name || 'Customer',
      text: ticketReplyInput.trim(),
      date: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'open',
          messages: [...(t.messages || []), newMessage]
        };
      }
      return t;
    }));

    try {
      await fetch(`/api/tickets/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          sender: 'customer',
          senderName: loggedInCustomer?.name || 'Customer',
          text: newMessage.text
        })
      });
    } catch (err) {
      console.error('Error replying to ticket:', err);
    } finally {
      setTicketReplyInput('');
      setIsSendingTicketReply(false);
    }
  };

  const handleCloseTicketByClient = (ticketId: string) => {
    setTicketToClose(ticketId);
  };

  const confirmCloseTicket = async () => {
    if (!ticketToClose) return;
    const ticketId = ticketToClose;
    setIsClosingTicket(true);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
    try {
      await fetch(`/api/tickets/${ticketId}/close-by-client`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      showNotification(
        lang === 'ar'
          ? 'تم إغلاق تذكرة الدعم بنجاح. يمكنك دائماً فتح تذكرة جديدة عند الحاجة.'
          : 'Support ticket closed successfully.',
        'success'
      );
    } catch (err) {
      console.error('Error closing ticket:', err);
    } finally {
      setIsClosingTicket(false);
      setTicketToClose(null);
    }
  };

  const supportStatus = useMemo(() => {
    let isOnline = true;
    const startTimeStr = storeConfig.supportStartTime || '09:00';
    const endTimeStr = storeConfig.supportEndTime || '22:00';
    const workDays = storeConfig.supportWorkDays || (lang === 'ar' ? 'طيلة أيام الأسبوع' : 'Daily 7/7');

    if (storeConfig.supportStatusMode === 'manual') {
      isOnline = storeConfig.supportIsOnline ?? true;
    } else {
      try {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = startTimeStr.split(':').map(Number);
        const [endH, endM] = endTimeStr.split(':').map(Number);
        const startTotal = (startH || 9) * 60 + (startM || 0);
        const endTotal = (endH || 22) * 60 + (endM || 0);
        if (startTotal <= endTotal) {
          isOnline = currentMinutes >= startTotal && currentMinutes <= endTotal;
        } else {
          isOnline = currentMinutes >= startTotal || currentMinutes <= endTotal;
        }
      } catch (e) {
        isOnline = true;
      }
    }

    return {
      isOnline,
      startTime: startTimeStr,
      endTime: endTimeStr,
      workDays,
      hoursText: `${startTimeStr} - ${endTimeStr}`,
      statusLabel: isOnline
        ? (lang === 'ar' ? 'متصل الآن' : lang === 'fr' ? 'En ligne' : 'Online Now')
        : (lang === 'ar' ? 'غير متصل حالياً' : lang === 'fr' ? 'Hors ligne' : 'Offline'),
      detailText: isOnline
        ? (lang === 'ar' ? 'فريق الدعم الفني جاهز للرد على استفساراتكم فوراً' : 'Support team is active and ready to assist')
        : (lang === 'ar' ? `أوقات العمل: من ${startTimeStr} إلى ${endTimeStr} (${workDays})` : `Working hours: ${startTimeStr} to ${endTimeStr} (${workDays})`)
    };
  }, [storeConfig.supportStatusMode, storeConfig.supportIsOnline, storeConfig.supportStartTime, storeConfig.supportEndTime, storeConfig.supportWorkDays, lang]);

  const trackedTickets = useMemo(() => {
    const cleanSearch = ticketPhoneSearch.replace(/\s+/g, '');
    const cleanCustomerPhone = loggedInCustomer?.phone ? loggedInCustomer.phone.replace(/\s+/g, '') : '';
    return tickets.filter(t => {
      const ticketPhoneClean = (t.customerPhone || '').replace(/\s+/g, '');
      const matchesSearch = Boolean(cleanSearch && ticketPhoneClean.includes(cleanSearch));
      const isFromThisDevice = localSubmittedIds.includes(t.id);
      const matchesLoggedIn = Boolean(cleanCustomerPhone && (ticketPhoneClean === cleanCustomerPhone || (ticketPhoneClean.length >= 8 && cleanCustomerPhone.endsWith(ticketPhoneClean.slice(-8)))));
      return matchesSearch || isFromThisDevice || matchesLoggedIn;
    });
  }, [tickets, ticketPhoneSearch, localSubmittedIds, loggedInCustomer?.phone]);

  // Real-time live polling for tickets so support replies appear instantly
  useEffect(() => {
    let isMounted = true;
    const pollTickets = async () => {
      try {
        const res = await fetch(`/api/tickets?storeId=${activeCountrySlug}`);
        if (!res.ok) return;
        const freshTickets = await res.json();
        if (Array.isArray(freshTickets) && isMounted) {
          setTickets(prev => {
            if (JSON.stringify(prev) === JSON.stringify(freshTickets)) return prev;
            return freshTickets;
          });
        }
      } catch (e) {
        // silent
      }
    };

    const shouldPollFast = currentView === 'support' || (currentView === 'profile' && profileActiveTab === 'tickets') || localSubmittedIds.length > 0;
    const intervalMs = shouldPollFast ? 3500 : 15000;
    const timer = setInterval(pollTickets, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [currentView, profileActiveTab, activeCountrySlug, localSubmittedIds.length, setTickets]);

  const storeCities = useMemo(() => {
    return getCitiesForCountry(activeCountrySlug, lang);
  }, [activeCountrySlug, lang]);

  const [reviewCountryCode, setReviewCountryCode] = useState<string>(() => selectedCountryCode || 'MA');

  useEffect(() => {
    if (selectedCountryCode) {
      setReviewCountryCode(selectedCountryCode);
    }
  }, [selectedCountryCode]);

  const [reviewForm, setReviewForm] = useState(() => ({
    name: loggedInCustomer?.name || '',
    phone: loggedInCustomer?.phone || '',
    city: getCitiesForCountry(activeCountrySlug, lang)[0] || (lang === 'ar' ? 'الدار البيضاء' : 'Casablanca'),
    rating: 5,
    text: ''
  }));
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const cities = getCitiesForCountry(activeCountrySlug, lang);
    if (cities && cities.length > 0) {
      setCheckoutForm(prev => ({
        ...prev,
        city: translateCity(prev.city, lang) || cities[0]
      }));
      setReviewForm(prev => ({
        ...prev,
        city: translateCity(prev.city, lang) || cities[0]
      }));
    }
  }, [activeCountrySlug, lang]);

  useEffect(() => {
    localStorage.setItem('ecom_custom_reviews', JSON.stringify(customReviews));
  }, [customReviews]);

  const landingData = useMemo(() => {
    if (!selectedProduct) return null;
    return getProductLandingData(selectedProduct, reviews, lang);
  }, [selectedProduct, reviews, lang]);

  const hasDescriptionContent = useMemo(() => {
    if (!selectedProduct) return false;
    const desc = getProdDesc(selectedProduct)?.trim();
    const hasTagline = Boolean(landingData?.tagline && landingData.tagline.trim().length > 0);
    const hasFeatures = Boolean(landingData?.features && landingData.features.length > 0);
    return Boolean(desc || hasTagline || hasFeatures);
  }, [selectedProduct, landingData, lang]);

  const hasInstructionsContent = useMemo(() => {
    return Boolean(landingData && landingData.howToUse && landingData.howToUse.length > 0);
  }, [landingData]);

  const hasFaqContent = useMemo(() => {
    return Boolean(landingData && landingData.faqs && landingData.faqs.length > 0);
  }, [landingData]);

  const hasReviewsContent = Boolean(landingData && landingData.reviews);

  const availableLandingTabs = useMemo(() => {
    const tabs: { id: 'description' | 'instructions' | 'faq' | 'reviews'; label: string }[] = [];
    if (hasDescriptionContent) {
      tabs.push({ id: 'description', label: t('descriptionBenefits') });
    }
    if (hasInstructionsContent) {
      tabs.push({ id: 'instructions', label: t('howToUseTab') });
    }
    if (hasFaqContent) {
      tabs.push({ id: 'faq', label: t('faq') });
    }
    if (hasReviewsContent && landingData) {
      tabs.push({ id: 'reviews', label: `${t('customerReviews')} (${landingData.reviews.length})` });
    }
    return tabs;
  }, [hasDescriptionContent, hasInstructionsContent, hasFaqContent, hasReviewsContent, landingData, t]);

  useEffect(() => {
    setIsPlayingProductVideo(false);
    if (selectedProduct) {
      if (selectedProduct.videoUrl && (selectedProduct.videoPosition === 'first' || selectedProduct.videoAsPrimary)) {
        setActiveLandingImage('__VIDEO__');
      } else {
        setActiveLandingImage(selectedProduct.image || '');
      }
      if (availableLandingTabs.length > 0) {
        if (!availableLandingTabs.some(t => t.id === activeLandingTab)) {
          setActiveLandingTab(availableLandingTabs[0].id);
        }
      }
    }
  }, [selectedProduct?.id]);

  const [checkoutForm, setCheckoutForm] = useState(() => ({
    name: loggedInCustomer?.name || '',
    phone: loggedInCustomer?.phone || '',
    city: getCitiesForCountry(activeCountrySlug, lang)[0] || (lang === 'ar' ? 'الدار البيضاء' : 'Casablanca'),
    address: '',
    notes: ''
  }));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const list = new Set<string>();
    if (storeCategories && storeCategories.length > 0) {
      storeCategories.forEach(c => { if (c.name) list.add(c.name); });
    }
    products.forEach(p => { if (p.category) list.add(p.category); });
    return ['All', ...Array.from(list)];
  }, [products, storeCategories]);

  const filteredProducts = useMemo(() => {
    const cleanString = (str: string) =>
      (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const queryClean = cleanString(searchQuery);

    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = !queryClean ||
                            cleanString(p.name).includes(queryClean) ||
                            cleanString(p.description || '').includes(queryClean) ||
                            cleanString(p.category || '').includes(queryClean);
      const matchesPopular = !filterPopular || p.isPopular;
      return matchesCategory && matchesSearch && matchesPopular;
    });
  }, [products, selectedCategory, searchQuery, filterPopular]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const isOut = product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
    if (isOut) {
      showNotification(
        lang === 'ar' ? 'عذراً، هذا المنتج غير متوفر حالياً في المخزون' : 'Sorry, this product is currently out of stock',
        'error'
      );
      return;
    }

    const availableStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 999;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = Math.min(newQty, availableStock);
        return updated;
      }
      return [...prev, { product, quantity: Math.min(quantity, availableStock) }];
    });

    logPixelEvent('AddToCart', {
      productId: product.id,
      productName: product.name,
      value: product.price * quantity,
      currency: getCurrency()
    });

    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const availableStock = typeof item.product.stock === 'number' && item.product.stock > 0 ? item.product.stock : 999;
          return { ...item, quantity: Math.min(newQty, availableStock) };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveOutOfStockCartItems = () => {
    setCart(prev => prev.filter(item => {
      const isOut = item.product.inStock === false || (typeof item.product.stock === 'number' && item.product.stock <= 0);
      return !isOut;
    }));
    showNotification(
      lang === 'ar' ? 'تمت إزالة المنتجات غير المتوفرة من السلة بنجاح' : 'Removed out-of-stock items from cart',
      'info'
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const [cartCouponInput, setCartCouponInput] = useState('');
  const [appliedCartCoupon, setAppliedCartCoupon] = useState<Coupon | null>(null);
  const [cartCouponError, setCartCouponError] = useState('');
  const [cartCouponSuccess, setCartCouponSuccess] = useState('');
  const [isValidatingCartCoupon, setIsValidatingCartCoupon] = useState(false);

  const [directCouponInput, setDirectCouponInput] = useState('');
  const [appliedDirectCoupon, setAppliedDirectCoupon] = useState<Coupon | null>(null);
  const [directCouponError, setDirectCouponError] = useState('');
  const [directCouponSuccess, setDirectCouponSuccess] = useState('');
  const [isValidatingDirectCoupon, setIsValidatingDirectCoupon] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const actualShippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 100 ? 0 : storeConfig.shippingFee;
  }, [subtotal, storeConfig.shippingFee]);

  const cartDiscountAmount = useMemo(() => {
    if (!appliedCartCoupon || cart.length === 0) return 0;
    const type = appliedCartCoupon.discountType || appliedCartCoupon.type || 'percentage';
    const val = Number(appliedCartCoupon.discountValue || appliedCartCoupon.value || 0);

    let targetAmt = subtotal;
    if (appliedCartCoupon.productId && appliedCartCoupon.productId !== 'all') {
      const match = cart.find(item => item.product.id === appliedCartCoupon.productId);
      if (!match) return 0;
      targetAmt = match.product.price * match.quantity;
    }

    if (type === 'percentage') {
      return Math.round(((targetAmt * val) / 100) * 100) / 100;
    } else {
      return Math.min(val, targetAmt);
    }
  }, [appliedCartCoupon, subtotal, cart]);

  const isCouponAllowedInCart = useMemo(() => {
    if (cart.length === 0) return true;
    return cart.some(item => item.product?.showCouponField !== false);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - cartDiscountAmount) + actualShippingFee;
  }, [subtotal, cartDiscountAmount, actualShippingFee]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    if (isCheckoutOpen) {
      logPixelEvent('InitiateCheckout', {
        value: total,
        currency: getCurrency(),
        metadata: { itemsCount: cart.length }
      });
    }
  }, [isCheckoutOpen, total, cart.length, getCurrency, logPixelEvent]);

  const handleApplyCartCoupon = async (codeToApply?: string) => {
    const rawCode = (codeToApply || cartCouponInput).trim().toUpperCase();
    setCartCouponError('');
    setCartCouponSuccess('');

    if (!rawCode) {
      setCartCouponError(lang === 'ar' ? 'يرجى كتابة رمز الكوبون' : 'Please enter a coupon code');
      return;
    }

    if (cart.length === 0) {
      setCartCouponError(lang === 'ar' ? 'السلة فارغة' : 'Cart is empty');
      return;
    }

    setIsValidatingCartCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: rawCode,
          storeId: activeCountrySlug,
          subtotal: subtotal,
          items: cart.map(item => ({
            productId: item.product.id,
            price: item.product.price,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCartCoupon(data.coupon);
        setCartCouponSuccess(
          lang === 'ar'
            ? `تم تطبيق الكوبون بنجاح! (خصم: ${data.discountAmount} ${getCurrency()})`
            : `Coupon applied successfully! (Saved: ${data.discountAmount} ${getCurrency()})`
        );
        setCartCouponInput('');
      } else {
        setCartCouponError(data.error || (lang === 'ar' ? 'كود الخصم غير صالح أو منتهي' : 'Invalid or expired coupon code'));
      }
    } catch (e) {
      setCartCouponError(lang === 'ar' ? 'حدث خطأ أثناء التحقق من الكوبون' : 'Error validating coupon');
    } finally {
      setIsValidatingCartCoupon(false);
    }
  };

  const handleRemoveCartCoupon = () => {
    setAppliedCartCoupon(null);
    setCartCouponSuccess('');
    setCartCouponError('');
  };

  const handleInstantCheckout = (product: Product) => {
    const inCart = cart.find(item => item.product.id === product.id);
    if (!inCart) {
      handleAddToCart(product, 1);
    }
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!checkoutForm.name.trim()) {
      errors.name = lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    const phoneClean = checkoutForm.phone.replace(/\D/g, '');
    if (!checkoutForm.phone) {
      errors.phone = lang === 'ar' ? 'رقم الجوال مطلوب' : 'Phone number is required';
    } else if (phoneClean.length < 7 || phoneClean.length > 15) {
      errors.phone = lang === 'ar' ? 'رقم الجوال غير صالح' : 'Invalid phone format';
    }

    if (!checkoutForm.address.trim()) {
      errors.address = lang === 'ar' ? 'العنوان الكامل مطلوب' : 'Delivery address is required';
    }

    if (!checkoutForm.city || !checkoutForm.city.trim()) {
      errors.city = lang === 'ar' ? 'الرجاء تحديد أو كتابة المدينة' : 'City is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
      lineTotal: item.product.price * item.quantity
    }));

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerCity: checkoutForm.city,
      customerAddress: checkoutForm.address,
      items: orderItems,
      subtotal: subtotal,
      shippingFee: actualShippingFee,
      discountAmount: cartDiscountAmount > 0 ? cartDiscountAmount : undefined,
      couponCode: appliedCartCoupon ? appliedCartCoupon.code : undefined,
      total: total,
      sku: orderItems.map(i => i.sku).filter(Boolean).join(', ') || undefined,
      status: 'pending',
      date: new Date().toISOString(),
      notes: checkoutForm.notes || undefined,
      storeId: activeCountrySlug || 'ma'
    };

    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    setOrders(prev => [newOrder, ...prev]);
    if (loggedInCustomer && loggedInCustomer.phone) {
      setCustomerOrders(prev => [newOrder, ...prev]);
    }

    // Submit order to backend API so it reaches Admin Dashboard and Firestore immediately
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => {
      console.warn('Background order submit notice:', err);
    });

    setLastCreatedOrder(newOrder);
    setCart([]);
    setAppliedCartCoupon(null);
    setCartCouponSuccess('');
    setIsCheckoutOpen(false);

    logPixelEvent('Purchase', {
      orderId: newOrder.id,
      value: newOrder.total,
      currency: getCurrency(),
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      metadata: {
        itemsCount: newOrder.items.length,
        city: newOrder.customerCity,
        products: newOrder.items.map(i => i.productName).join(', ')
      }
    });
  };

  const [directQty, setDirectQty] = useState(1);

  const getProductSubtotal = (prod: Product, qty: number): number => {
    if (!prod) return 0;
    if (prod.pricingTiers && Array.isArray(prod.pricingTiers) && prod.pricingTiers.length > 0) {
      const exactTier = prod.pricingTiers.find(t => t.quantity === qty);
      if (exactTier && exactTier.price > 0) {
        return exactTier.price;
      }
      const sortedTiers = [...prod.pricingTiers].sort((a, b) => b.quantity - a.quantity);
      const largestMatchingTier = sortedTiers.find(t => t.quantity <= qty);
      if (largestMatchingTier && largestMatchingTier.quantity > 0) {
        const tierPrice = largestMatchingTier.price;
        const remainder = qty - largestMatchingTier.quantity;
        return tierPrice + (remainder * prod.price);
      }
    }
    return prod.price * qty;
  };

  React.useEffect(() => {
    if (selectedProduct && selectedProduct.pricingTiers && selectedProduct.pricingTiers.length > 0) {
      const singleTier = selectedProduct.pricingTiers.find(t => t.quantity === 1);
      if (singleTier) {
        setDirectQty(1);
      } else {
        setDirectQty(selectedProduct.pricingTiers[0].quantity || 1);
      }
    } else {
      setDirectQty(1);
    }
    setFormErrors({});
    setDirectCouponInput('');
    setAppliedDirectCoupon(null);
    setDirectCouponError('');
    setDirectCouponSuccess('');
  }, [selectedProduct]);

  const directDiscountAmount = useMemo(() => {
    if (!appliedDirectCoupon || !selectedProduct) return 0;
    const type = appliedDirectCoupon.discountType || appliedDirectCoupon.type || 'percentage';
    const val = Number(appliedDirectCoupon.discountValue || appliedDirectCoupon.value || 0);
    const prodSubtotal = getProductSubtotal(selectedProduct, directQty);

    if (appliedDirectCoupon.productId && appliedDirectCoupon.productId !== 'all' && appliedDirectCoupon.productId !== selectedProduct.id) {
      return 0;
    }

    if (type === 'percentage') {
      return Math.round(((prodSubtotal * val) / 100) * 100) / 100;
    } else {
      return Math.min(val, prodSubtotal);
    }
  }, [appliedDirectCoupon, selectedProduct, directQty]);

  const availableProductCoupons = useMemo(() => {
    if (!selectedProduct || !coupons || !Array.isArray(coupons)) return [];
    return coupons.filter(c =>
      c.status === 'active' &&
      c.showOnProductPage !== false &&
      (!c.storeId || c.storeId === 'all' || c.storeId === activeCountrySlug) &&
      (!c.productId || c.productId === 'all' || c.productId === selectedProduct.id)
    );
  }, [selectedProduct, coupons, activeCountrySlug]);

  const handleApplyDirectCoupon = async (codeToApply?: string) => {
    if (!selectedProduct) return;
    const rawCode = (codeToApply || directCouponInput).trim().toUpperCase();
    setDirectCouponError('');
    setDirectCouponSuccess('');

    if (!rawCode) {
      setDirectCouponError(lang === 'ar' ? 'يرجى كتابة رمز الكوبون' : 'Please enter a coupon code');
      return;
    }

    setIsValidatingDirectCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: rawCode,
          storeId: activeCountrySlug,
          subtotal: selectedProduct.price * directQty,
          productId: selectedProduct.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedDirectCoupon(data.coupon);
        setDirectCouponSuccess(
          lang === 'ar'
            ? `تم تفعيل الخصم! (وفرت: ${data.discountAmount} ${getCurrency()})`
            : `Coupon applied! (Saved: ${data.discountAmount} ${getCurrency()})`
        );
        setDirectCouponInput('');
      } else {
        setDirectCouponError(data.error || (lang === 'ar' ? 'كود الخصم غير صالح أو مخصص لمنتج آخر' : 'Invalid or inapplicable coupon'));
      }
    } catch (e) {
      setDirectCouponError(lang === 'ar' ? 'حدث خطأ أثناء فحص الكوبون' : 'Error validating coupon');
    } finally {
      setIsValidatingDirectCoupon(false);
    }
  };

  const handleRemoveDirectCoupon = () => {
    setAppliedDirectCoupon(null);
    setDirectCouponSuccess('');
    setDirectCouponError('');
  };

  const handlePlaceDirectOrder = (e: React.FormEvent, product: Product) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!checkoutForm.name.trim()) {
      errors.name = lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    const phoneClean = checkoutForm.phone.replace(/\D/g, '');
    if (!checkoutForm.phone) {
      errors.phone = lang === 'ar' ? 'رقم الجوال مطلوب' : 'Phone number is required';
    } else if (phoneClean.length < 7 || phoneClean.length > 15) {
      errors.phone = lang === 'ar' ? 'رقم الجوال غير صالح' : 'Invalid phone format';
    }

    if (!checkoutForm.address.trim()) {
      errors.address = lang === 'ar' ? 'العنوان الكامل مطلوب' : 'Delivery address is required';
    }

    if (!checkoutForm.city || !checkoutForm.city.trim()) {
      errors.city = lang === 'ar' ? 'الرجاء تحديد أو كتابة المدينة' : 'City is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const prodSubtotal = getProductSubtotal(product, directQty);
    const directShipping = prodSubtotal >= 100 ? 0 : storeConfig.shippingFee;
    const directTotal = Math.max(0, prodSubtotal - directDiscountAmount + directShipping);

    // If a pricing tier bundle was used, calculate the actual unit price and attach tier details
    const matchingTier = (product.pricingTiers || []).find(t => t.quantity === directQty);
    const effectiveUnitPrice = directQty > 0 ? Math.round((prodSubtotal / directQty) * 100) / 100 : product.price;
    const tierLabelStr = matchingTier
      ? (lang === 'ar'
          ? (matchingTier.labelAr || matchingTier.label || (matchingTier.quantity === 1 ? 'قطعة واحدة' : matchingTier.quantity === 2 ? 'قطعتين' : `${matchingTier.quantity} قطع`))
          : (matchingTier.label || matchingTier.labelAr || (matchingTier.quantity === 1 ? '1 Piece' : `${matchingTier.quantity} Pieces`)))
      : undefined;

    const orderItems: OrderItem[] = [{
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: effectiveUnitPrice,
      quantity: directQty,
      image: product.image,
      selectedTier: matchingTier,
      tierLabel: tierLabelStr,
      lineTotal: prodSubtotal
    }];

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerCity: checkoutForm.city,
      customerAddress: checkoutForm.address,
      items: orderItems,
      subtotal: prodSubtotal,
      shippingFee: directShipping,
      discountAmount: directDiscountAmount > 0 ? directDiscountAmount : undefined,
      couponCode: appliedDirectCoupon ? appliedDirectCoupon.code : undefined,
      total: directTotal,
      sku: product.sku || undefined,
      status: 'pending',
      date: new Date().toISOString(),
      notes: checkoutForm.notes || undefined,
      storeId: activeCountrySlug || 'ma'
    };

    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        return { ...p, stock: Math.max(0, p.stock - directQty) };
      }
      return p;
    }));

    setOrders(prev => [newOrder, ...prev]);
    if (loggedInCustomer && loggedInCustomer.phone) {
      setCustomerOrders(prev => [newOrder, ...prev]);
    }

    // Submit direct order to backend API so it reaches Admin Dashboard and Firestore immediately
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => {
      console.warn('Background direct order submit notice:', err);
    });

    setLastCreatedOrder(newOrder);
    setAppliedDirectCoupon(null);
    setDirectCouponSuccess('');

    logPixelEvent('Purchase', {
      orderId: newOrder.id,
      value: newOrder.total,
      currency: getCurrency(),
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      productId: product.id,
      productName: product.name,
      metadata: {
        itemsCount: directQty,
        city: newOrder.customerCity,
        directBuy: true
      }
    });
  };

  const primaryBrandColor = storeConfig.themePrimaryColor || storeConfig.logoAccentColor || '#2563eb';
  const siteBackgroundColor = storeConfig.storeBackgroundColor || '#faf8f5';
  const headerBackgroundColor = storeConfig.headerBackgroundColor || '#ffffff';

  const isDarkColor = (color?: string): boolean => {
    if (!color) return false;
    const hex = color.replace('#', '');
    if (hex.length !== 3 && hex.length !== 6) return false;
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  };

  const isHeaderDark = isDarkColor(headerBackgroundColor);
  const headerTextColor = storeConfig.headerTextColor || (isHeaderDark ? '#f4f4f5' : '#1c1917');

  return (
    <div
      id="online-store-root"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ backgroundColor: siteBackgroundColor }}
      className="min-h-screen text-stone-800 flex flex-col font-sans w-full max-w-full overflow-x-clip"
    >
      <style>{`
        :root {
          --brand-primary: ${primaryBrandColor};
          --store-bg: ${siteBackgroundColor};
          --header-bg: ${headerBackgroundColor};
        }
        .text-\\[\\#2563eb\\] { color: ${primaryBrandColor} !important; }
        .bg-\\[\\#2563eb\\] { background-color: ${primaryBrandColor} !important; }
        .border-\\[\\#2563eb\\] { border-color: ${primaryBrandColor} !important; }
        .hover\\:bg-\\[\\#2563eb\\]:hover { background-color: ${primaryBrandColor} !important; }
        .hover\\:text-\\[\\#2563eb\\]:hover { color: ${primaryBrandColor} !important; }
        .hover\\:border-\\[\\#2563eb\\]:hover { border-color: ${primaryBrandColor} !important; }
        .focus\\:border-\\[\\#2563eb\\]:focus { border-color: ${primaryBrandColor} !important; }
        .focus\\:ring-\\[\\#2563eb\\]:focus { --tw-ring-color: ${primaryBrandColor} !important; }
        .bg-blue-600, .bg-blue-500 { background-color: ${primaryBrandColor} !important; }
        .text-blue-600, .text-blue-500 { color: ${primaryBrandColor} !important; }
        .border-blue-600, .border-blue-500 { border-color: ${primaryBrandColor} !important; }
        .hover\\:bg-blue-700:hover, .hover\\:bg-blue-600:hover { filter: brightness(0.92); }
        .shadow-blue-500\\/20, .shadow-blue-600\\/20 { --tw-shadow-color: ${primaryBrandColor}33 !important; }
      `}</style>
      {!(currentView === 'profile' && !loggedInCustomer) && (
      <header
        id="online-store-header"
        style={{
          backgroundColor: headerBackgroundColor,
          borderColor: isHeaderDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(232, 226, 217, 0.8)',
          color: headerTextColor
        }}
        className={`sticky top-0 z-40 border-b py-2 sm:py-3.5 lg:py-4 px-2.5 xs:px-3 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between transition-all rounded-b-2xl sm:rounded-b-[2rem] shadow-lg ${
          isHeaderDark ? 'shadow-black/20 text-stone-100' : 'shadow-stone-900/10 text-stone-900'
        } w-full max-w-full`}
      >
        <div className="flex-1 flex items-center justify-start gap-1.5 xs:gap-2 sm:gap-4 min-w-0">
          <a
            href={getHomeUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getHomeUrl());
              }
            }}
            className="lg:hidden group focus:outline-none cursor-pointer select-none shrink-0 max-w-[105px] xs:max-w-[130px] sm:max-w-none overflow-hidden"
          >
            <StoreLogo config={storeConfig} variant={isHeaderDark ? "dark" : "light"} size="sm" />
          </a>

          <nav className={`hidden lg:flex items-center gap-3 xl:gap-6 font-sans text-[10px] xl:text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${
            isHeaderDark ? 'text-stone-300' : 'text-stone-600'
          }`}>
            <a
              href={getHomeUrl()}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  navigateTo(getHomeUrl());
                }
              }}
              className={`hover:text-[#2563eb] transition-colors cursor-pointer ${currentView === 'home' && !selectedProduct ? 'text-[#2563eb] border-b border-[#2563eb] pb-1' : ''}`}
            >
              {t('home')}
            </a>
            <a
              href={getProductsUrl()}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  setSelectedCategory('All');
                  setFilterPopular(false);
                  navigateTo(getProductsUrl());
                }
              }}
              className={`hover:text-[#2563eb] transition-colors cursor-pointer ${currentView === 'all-products' && !selectedProduct && selectedCategory === 'All' && !filterPopular ? 'text-[#2563eb] border-b border-[#2563eb] pb-1' : ''}`}
            >
              {t('products')}
            </a>
            <a
              href={getTicketsUrl()}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  navigateTo(getTicketsUrl());
                }
              }}
              className={`hover:text-[#2563eb] transition-colors cursor-pointer ${currentView === 'support' && !selectedProduct ? 'text-[#2563eb] border-b border-[#2563eb] pb-1 font-bold' : ''}`}
            >
              {t('support')}
            </a>
          </nav>

        </div>

        <div className="hidden lg:block flex-initial text-center px-2 sm:px-4 shrink-0">
          <a
            href={getHomeUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getHomeUrl());
              }
            }}
            className="group focus:outline-none cursor-pointer select-none inline-block"
          >
            <StoreLogo config={storeConfig} variant={isHeaderDark ? "dark" : "light"} size="md" />
          </a>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1 xs:gap-1.5 sm:gap-2.5 md:gap-3 min-w-0 font-sans text-xs font-bold uppercase tracking-wider text-stone-800">
          {countries && countries.filter(c => c.status !== 'disabled').length > 1 && (
            <div className="relative">
              <button
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className={`hover:text-[#2563eb] transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer px-1.5 xs:px-2.5 sm:px-3 py-1.5 rounded-full border shadow-xs shrink-0 whitespace-nowrap text-[10px] sm:text-xs hover:border-blue-300 ${
                  isHeaderDark ? 'bg-white/10 hover:bg-white/15 text-stone-200 border-white/15' : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
                title={lang === 'ar' ? 'اختر الدولة / المتجر' : 'Select Country Store'}
              >
                <CountryFlag code={countries.find(c => c.slug === activeCountrySlug)?.code || activeCountrySlug} size="xs" />
                <span className={`text-[10px] sm:text-xs font-extrabold ${isHeaderDark ? 'text-stone-100' : 'text-stone-800'}`}>
                  {countries.find(c => c.slug === activeCountrySlug)?.code || activeCountrySlug.toUpperCase()}
                </span>
                <ChevronDown className={`w-3 h-3 ${isHeaderDark ? 'text-stone-300' : 'text-stone-500'} transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCountryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)} />
                  <div
                    className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] bg-white border border-stone-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-fadeIn text-stone-700"
                    style={{ minWidth: '160px' }}
                  >
                    <div className="px-3.5 py-1.5 border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'المتاجر المتاحة' : 'Available Stores'}
                    </div>
                    {countries.filter(c => c.status !== 'disabled').map(c => (
                      <button
                        key={c.id || c.slug}
                        onClick={() => {
                          if (onSwitchCountry) onSwitchCountry(c.slug);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors hover:bg-stone-50 ${
                          c.slug === activeCountrySlug ? 'text-[#2563eb] bg-blue-50/50 font-black' : 'font-semibold text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CountryFlag code={c.code || c.slug} size="sm" />
                          <span>{lang === 'ar' ? (c.nameAr || c.name) : c.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-400 font-bold uppercase">{c.currency}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className={`hover:text-[#2563eb] transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer px-2 max-[350px]:px-1.5 sm:px-3 py-1.5 rounded-full border shadow-xs shrink-0 whitespace-nowrap text-[10px] sm:text-xs hover:border-blue-300 ${
                isHeaderDark ? 'bg-white/10 hover:bg-white/15 text-stone-200 border-white/15' : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title={lang === 'ar' ? 'اختر اللغة / Select Language' : 'Select Language / اختر اللغة'}
            >
              <Globe className="w-3.5 h-3.5 text-[#2563eb]" />
              <span className={`text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 font-bold ${isHeaderDark ? 'text-stone-100' : 'text-stone-800'}`}>
                <span className="max-[350px]:hidden">{lang === 'ar' ? 'العربية' : 'EN'}</span>
                <span className="hidden max-[350px]:inline">{lang === 'ar' ? 'ع' : 'EN'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {isLangDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div
                  className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-44 max-w-[calc(100vw-1.5rem)] bg-white border border-stone-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-fadeIn text-stone-700"
                  style={{ minWidth: '150px' }}
                >
                  <button
                    onClick={() => {
                      setLang('ar');
                      localStorage.setItem('ecom_lang', 'ar');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left cursor-pointer transition-colors hover:bg-stone-50 ${
                      lang === 'ar' ? 'text-[#2563eb] bg-blue-50/50 font-extrabold' : 'font-semibold'
                    }`}
                  >
                    <CountryFlag code="SA" size="sm" />
                    <span>العربية (Arabic)</span>
                  </button>
                  <button
                    onClick={() => {
                      setLang('en');
                      localStorage.setItem('ecom_lang', 'en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left cursor-pointer transition-colors hover:bg-stone-50 ${
                      lang === 'en' ? 'text-[#2563eb] bg-blue-50/50 font-extrabold' : 'font-semibold'
                    }`}
                  >
                    <CountryFlag code="GB" size="sm" />
                    <span>English (UK)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <a
            id="btn-header-favorites"
            href={getFavoritesUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getFavoritesUrl());
              }
            }}
            className={`relative rounded-full border transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-center shrink-0 w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 hover:scale-105 active:scale-95 group ${
              currentView === 'favorites' && !selectedProduct
                ? 'bg-rose-50 border-rose-400 text-rose-600'
                : (isHeaderDark
                    ? 'bg-white/10 text-stone-200 hover:text-rose-400 hover:bg-white/15 border-white/15'
                    : 'bg-white text-stone-700 hover:text-rose-500 hover:bg-rose-50/40 border-stone-200 hover:border-rose-200')
            }`}
            title={lang === 'ar' ? 'المفضلة' : 'Favorites'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 ${
              currentView === 'favorites' && !selectedProduct
                ? 'text-rose-500 fill-rose-500'
                : (favorites.length > 0 ? 'text-rose-500 fill-rose-500/30' : (isHeaderDark ? 'text-stone-300' : 'text-stone-600'))
            }`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 font-mono text-[9px] bg-rose-500 text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-md">
                {favorites.length}
              </span>
            )}
          </a>

          <a
            href={getProfileUrl()}
            onClick={(e) => {
              markCustomerActivityAsSeen();
              setLoginStep(loggedInCustomer ? 'profile' : 'phone');
              if (loggedInCustomer) {
                const foundCountry = COUNTRIES.find(c => loggedInCustomer.phone.startsWith(c.prefix));
                if (foundCountry) {
                  setSelectedCountryCode(foundCountry.code);
                  setCustomerPhoneInput(loggedInCustomer.phone.slice(foundCountry.prefix.length));
                } else {
                  setCustomerPhoneInput(loggedInCustomer.phone);
                }
                setCustomerNameInput(loggedInCustomer.name);
              } else {
                setCustomerPhoneInput('');
                setCustomerNameInput('');
              }
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getProfileUrl());
              }
            }}
            className={`relative rounded-full border transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-center shrink-0 w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 hover:scale-105 active:scale-95 group ${
              currentView === 'profile' && !selectedProduct
                ? 'bg-blue-50/80 border-[#2563eb] text-[#2563eb] ring-2 ring-[#2563eb]/20'
                : (isHeaderDark
                    ? 'bg-white/10 text-stone-200 hover:text-[#2563eb] hover:bg-white/15 border-white/15'
                    : 'bg-white text-stone-700 hover:text-[#2563eb] hover:bg-blue-50/40 border-stone-200 hover:border-[#2563eb]/30')
            }`}
            title={loggedInCustomer ? loggedInCustomer.name : t('login')}
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {loggedInCustomer ? (
                loggedInCustomer.avatar ? (
                  <img
                    src={loggedInCustomer.avatar}
                    alt={loggedInCustomer.name || 'Avatar'}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-[10px] sm:text-xs select-none"
                    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                  >
                    <span>{getCustomerInitials(loggedInCustomer.name, loggedInCustomer.phone)}</span>
                  </div>
                )
              ) : (
                <User className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-transform duration-300 group-hover:scale-110 ${currentView === 'profile' && !selectedProduct ? 'text-[#2563eb]' : (isHeaderDark ? 'text-stone-300' : 'text-stone-600')}`} />
              )}
            </div>

            {hasCustomerUnreadActivity && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5 z-20 pointer-events-none"
                title={lang === 'ar' ? 'تحديث جديد في طلباتك أو حسابك' : 'New update in your orders or profile'}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
              </span>
            )}
          </a>

          <button
            id="btn-cart-toggle"
            onClick={() => setIsCartOpen(true)}
            className={`relative rounded-full transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-center shrink-0 w-8 h-8 xs:w-8.5 xs:h-8.5 sm:w-10 sm:h-10 hover:scale-105 active:scale-95 group border ${
              isHeaderDark
                ? 'bg-white/10 hover:bg-white/15 text-stone-200 hover:text-[#2563eb] border-white/15'
                : 'bg-white hover:bg-blue-50/50 text-stone-700 hover:text-[#2563eb] border-stone-200 hover:border-[#2563eb]/40'
            }`}
            title={t('cart')}
            aria-label={t('cart')}
          >
            <ShoppingCart className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 group-hover:text-[#2563eb] transition-colors ${
              isHeaderDark ? 'text-stone-200' : 'text-stone-700'
            }`} strokeWidth={2.2} />
            {cartItemsCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 font-mono text-[9px] bg-red-500 text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                {cartItemsCount}
              </span>
            ) : (
              <span className={`absolute -top-1.5 -right-1.5 font-mono text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold border ${
                isHeaderDark
                  ? 'text-stone-300 bg-stone-900 border-stone-700'
                  : 'text-stone-500 bg-stone-100 border-stone-200'
              }`}>
                0
              </span>
            )}
          </button>
        </div>

        <TopLoadingBar isLoading={isPageNavigating} position="under-header" color="primary" customColor={primaryBrandColor} />
      </header>
      )}

      <div
        ref={scrollProgressBarRef}
        className={`fixed top-0 left-0 right-0 h-[3.5px] z-[99] pointer-events-none will-change-transform transform-gpu ${lang === 'ar' ? 'origin-right' : 'origin-left'}`}
        style={{
          transform: 'scaleX(0)',
          background: `linear-gradient(90deg, ${primaryBrandColor} 0%, ${primaryBrandColor}cc 50%, ${primaryBrandColor}88 100%)`,
          boxShadow: `0 0 10px ${primaryBrandColor}cc, 0 0 20px ${primaryBrandColor}66`
        }}
      />

      {isPageNavigating && (currentView === 'profile' && !loggedInCustomer) && (
        <TopLoadingBar isLoading={isPageNavigating} position="fixed-top" color="primary" customColor={primaryBrandColor} />
      )}

      {!selectedProduct ? (
        <>
                    {currentView === 'home' && (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: siteBackgroundColor }}>
              <div className="px-2 sm:px-4 pt-2 sm:pt-3">
                <section
                  className="relative w-full min-h-[78vh] sm:min-h-[88vh] flex items-center justify-center overflow-hidden bg-stone-950 text-white shadow-xl shadow-stone-900/10 rounded-2xl sm:rounded-3xl border border-stone-800/40 mb-8 sm:mb-10 select-none touch-pan-y"
                  style={{ overscrollBehavior: 'auto' }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600"
                    alt="Mavluy Shop Showcase"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.82] select-none pointer-events-none"
                  />

                  <div className="absolute inset-0 bg-stone-950/40 pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/60 to-stone-950/40 pointer-events-none z-10" />

                  <div
                    className="absolute inset-0 pointer-events-none z-10 opacity-90"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0.12) 35%, rgba(15, 23, 42, 0) 70%)'
                    }}
                  />

                  <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-8 py-16 text-center space-y-6 sm:space-y-8">
                    <div className="select-none drop-shadow-2xl flex justify-center items-center">
                      <StoreLogo config={storeConfig} variant="hero" size="hero" />
                    </div>

                    <p className="text-base sm:text-xl md:text-2xl text-stone-200 font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                      {t('mavluyHeroSubtitle')}
                    </p>

                    <div className="pt-4 sm:pt-6 flex items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
                      <button
                        onClick={() => {
                          const el = document.getElementById('products-section');
                          if ((window as any).__lenis && el) {
                            (window as any).__lenis.scrollTo(el, { offset: -70, duration: 1.2 });
                          } else if (el) {
                            const yOffset = -70;
                            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          } else {
                            setCurrentView('all-products');
                            setSelectedCategory('All');
                            setFilterPopular(false);
                          }
                        }}
                        className="bg-white/10 hover:bg-[#2563eb] border border-white/30 hover:border-[#2563eb] text-white font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer group hover:scale-105 active:scale-95"
                      >
                        <span>{t('shopNow')}</span>
                        <ArrowRight className={`${lang === 'ar' ? 'rotate-180' : ''} w-4.5 h-4.5 group-hover:translate-x-1 transition-transform`} />
                      </button>

                      <button
                        onClick={() => {
                          if (!loggedInCustomer || !loggedInCustomer.phone) {
                            showNotification(
                              lang === 'ar'
                                ? 'يرجى تسجيل الدخول برقم هاتفك لعرض قائمتك المفضلة'
                                : 'Please log in with your phone number to access your favorites',
                              'error'
                            );
                            setAuthMode('login');
                            setLoginStep('phone');
                            setCustomerModalError(
                              lang === 'ar'
                                ? 'يرجى تسجيل الدخول أو إنشاء حساب برقم هاتفك لتتمكن من الوصول لقائمة المفضلة'
                                : 'Please log in with your phone number to view your saved favorite products.'
                            );
                            setCurrentView('profile');
                            setSelectedProduct(null);
                            return;
                          }
                          setSelectedProduct(null);
                          setCurrentView('favorites');
                        }}
                        title={t('showFavorites')}
                        className="p-3.5 bg-white/10 hover:bg-rose-600/90 border border-white/30 hover:border-rose-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer group hover:scale-105 active:scale-95 relative"
                      >
                        <Heart className="w-5 h-5 text-rose-400 fill-rose-500/30 group-hover:text-white group-hover:fill-white transition-colors" />
                        {favorites.length > 0 && loggedInCustomer && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[10px] w-4.5 h-4.5 rounded-full font-bold shadow-md flex items-center justify-center">
                            {favorites.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('products-section');
                      if ((window as any).__lenis) {
                        if (el) {
                          (window as any).__lenis.scrollTo(el, { offset: -70, duration: 1.2 });
                        } else {
                          (window as any).__lenis.scrollTo(window.innerHeight * 0.85, { duration: 1.2 });
                        }
                      } else if (el) {
                        const yOffset = -70;
                        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
                      }
                    }}
                    className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center cursor-pointer group select-none p-2"
                    title={lang === 'ar' ? 'التمرير للأسفل' : 'Scroll down'}
                    aria-label="Scroll down"
                  >
                    <div className="relative flex flex-col items-center gap-1 pointer-events-none">
                      <div className="w-5 h-8 sm:w-5.5 sm:h-8.5 rounded-full border-2 border-white/40 group-hover:border-[#2563eb] bg-black/30 flex items-start justify-center p-1 shadow-lg group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300">
                        <div
                          className="w-1 h-1.5 rounded-full bg-white group-hover:bg-[#2563eb] animate-bounce"
                        />
                      </div>

                      <div
                        className="text-white/60 group-hover:text-[#2563eb] transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </button>
                </section>
              </div>

                <motion.div
                  initial={{ opacity: 0, x: lang === 'ar' ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="w-full flex flex-col gap-4 sm:gap-6 relative overflow-hidden max-w-full touch-pan-y select-none"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-12 sm:w-48 z-10 pointer-events-none"
                    style={{ background: `linear-gradient(to right, ${siteBackgroundColor}, transparent)` }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-12 sm:w-48 z-10 pointer-events-none"
                    style={{ background: `linear-gradient(to left, ${siteBackgroundColor}, transparent)` }}
                  />

                  <div className="flex overflow-hidden touch-pan-y">
                    <div className="animate-marquee flex gap-4 sm:gap-6 min-w-max pr-4 sm:pr-6 touch-pan-y">
                      {[...products, ...products].map((product, i) => (
                        <div
                          key={`m1-${product.id}-${i}`}
                          onClick={() => handleOpenProduct(product)}
                          className="w-56 sm:w-72 h-40 sm:h-56 rounded-2xl overflow-hidden shadow-sm shrink-0 cursor-pointer border border-stone-200/60 hover:border-[#2563eb]/40 transition-colors group relative touch-pan-y"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs font-bold uppercase tracking-wider bg-[#2563eb] px-3.5 py-1.5 rounded-full shadow-md">
                              {t('viewProduct')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex overflow-hidden touch-pan-y">
                    <div className="animate-marquee-reverse flex gap-4 sm:gap-6 min-w-max pr-4 sm:pr-6 touch-pan-y">
                      {[...products, ...products].reverse().map((product, i) => (
                        <div
                          key={`m2-${product.id}-${i}`}
                          onClick={() => handleOpenProduct(product)}
                          className="w-56 sm:w-72 h-40 sm:h-56 rounded-2xl overflow-hidden shadow-sm shrink-0 cursor-pointer border border-stone-200/60 hover:border-[#2563eb]/40 transition-colors group relative touch-pan-y"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs font-bold uppercase tracking-wider bg-[#2563eb] px-3.5 py-1.5 rounded-full shadow-md">
                              {t('viewProduct')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

              <section id="products-section" className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: lang === 'ar' ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex items-center justify-between border-b border-stone-200/60 pb-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] "></span>
                    <h2 className="text-sm sm:text-base font-serif font-bold uppercase tracking-[0.15em] text-stone-900">
                      {t('topBestsellers')}
                    </h2>
                  </div>
                  <a
                    href={getProductsUrl()}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        setSelectedCategory('All');
                        setFilterPopular(false);
                        navigateTo(getProductsUrl());
                      }
                    }}
                    className="text-[#2563eb] hover:text-[#1d4ed8] font-bold text-xs flex items-center gap-1.5 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <span>{t('viewAll')} ({products.length})</span>
                    {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </a>
                </motion.div>

                {products.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-stone-900">
                        {lang === 'ar' ? 'لا توجد منتجات معروضة حالياً' : 'No products available yet'}
                      </h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                        {lang === 'ar'
                          ? 'ترقبوا تشكيلتنا الجديدة والمميزة قريباً جداً! يتم تحديث المتجر بأحدث المنتجات باستمرار.'
                          : 'Stay tuned for our exclusive collection coming very soon! Our catalog is updated regularly.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                      {products.slice(0, 4).map((product, pIdx) => {
                        const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                        const initialX = pIdx === 0 ? (lang === 'ar' ? 50 : -50) : pIdx === 2 ? (lang === 'ar' ? -50 : 50) : 0;
                        const initialY = pIdx === 1 || pIdx === 3 ? 50 : 20;

                        return (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: initialX, y: initialY }}
                            whileInView={{ opacity: 1, x: 0, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.6, delay: pIdx * 0.1, ease: "easeOut" }}
                            onClick={() => handleOpenProduct(product)}
                            className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between group cursor-pointer hover:border-[#2563eb]/50 hover:shadow-xl transition-all hover:-translate-y-0.5"
                          >
                            <div className="space-y-2 sm:space-y-3">
                              {(() => {
                                const cover = getProductCover(product);
                                return (
                                  <div className="relative aspect-square overflow-hidden bg-stone-50 rounded-xl sm:rounded-[1.5rem] border border-stone-100">
                                    <img
                                      src={cover.url}
                                      alt={product.name}
                                      style={getProductImageStyle(product, cover.isVideo)}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    {cover.isVideo && (
                                      <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-red-600 text-white text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                                        <span>Video</span>
                                      </span>
                                    )}
                                    {(() => {
                                      const promoCoupon = (coupons || []).find(
                                        c => c.status === 'active' &&
                                             c.showBadgeOnProductCard !== false &&
                                             (!c.storeId || c.storeId === 'all' || c.storeId === activeCountrySlug) &&
                                             (!c.productId || c.productId === 'all' || c.productId === product.id)
                                      );
                                      if (!promoCoupon) return null;
                                      const isPercent = (promoCoupon.discountType || promoCoupon.type) === 'percentage';
                                      const discVal = promoCoupon.discountValue || promoCoupon.value;
                                      return (
                                        <div
                                          style={{ backgroundColor: primaryBrandColor }}
                                          className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-white rounded-lg sm:rounded-xl shadow-md flex items-center overflow-hidden border border-white/20 select-none"
                                        >
                                          <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono font-black text-[7.5px] sm:text-[10px] tracking-wider uppercase">
                                            <Ticket className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90 shrink-0" />
                                            <span>{promoCoupon.code}</span>
                                          </div>
                                          <div className="bg-black/25 px-1.5 py-0.5 sm:px-2 sm:py-1 font-sans font-extrabold text-[7px] sm:text-[9.5px] border-l border-white/15 text-white whitespace-nowrap">
                                            {isPercent ? `-${discVal}%` : `-${discVal} ${getCurrency()}`}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(product.id);
                                      }}
                                      className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10 w-6 h-6 sm:w-8 sm:h-8 bg-white/95 hover:bg-white text-stone-600 hover:text-rose-500 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 border border-stone-100 cursor-pointer"
                                      title={favorites.includes(product.id) ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites')}
                                    >
                                      <Heart
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                          favorites.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''
                                        }`}
                                      />
                                    </button>
                                    {product.stock === 0 && (
                                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-2">
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-stone-900 border border-stone-900 px-2.5 py-1 sm:px-4 sm:py-2 bg-white rounded-full">
                                          {t('outOfStock')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="px-0.5 space-y-1">
                                <span className="text-[9px] sm:text-[11px] uppercase font-bold text-[#2563eb] block tracking-wider">
                                  {getProdCat(product.category)}
                                </span>
                                <h4 className="font-sans font-extrabold text-stone-950 text-xs sm:text-sm lg:text-base tracking-tight group-hover:text-[#2563eb] transition-colors leading-snug line-clamp-1 sm:line-clamp-2">
                                  {getProdName(product)}
                                </h4>
                              </div>
                            </div>

                            <div className="px-0.5 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-stone-100 flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex flex-col shrink-0 min-w-0">
                                <div className="flex items-baseline gap-0.5 sm:gap-1 font-black text-stone-900 font-sans whitespace-nowrap">
                                  <span className="text-xs sm:text-base xl:text-lg leading-none">{product.price}</span>
                                  <span className="text-[8.5px] sm:text-xs font-bold text-stone-700 leading-none">{getCurrency()}</span>
                                </div>
                                {hasDiscount && (
                                  <span className="text-[8px] sm:text-[10px] text-stone-400 line-through whitespace-nowrap mt-0.5">
                                    {product.originalPrice} {getCurrency()}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product, 1);
                                    showNotification(
                                      lang === 'ar'
                                        ? `تمت إضافة "${getProdName(product)}" إلى السلة بنجاح`
                                        : `Added "${getProdName(product)}" to cart`,
                                      'success'
                                    );
                                  }}
                                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-full font-bold text-[9.5px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                  title={t('addToCart')}
                                >
                                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                  <span className="hidden sm:inline">{lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                                  <span className="inline sm:hidden">{lang === 'ar' ? 'أضف' : 'Add'}</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.96 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="pt-6 text-center"
                    >
                      <a
                        href={getProductsUrl()}
                        onClick={(e) => {
                          if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                            e.preventDefault();
                            setSelectedCategory('All');
                            setFilterPopular(false);
                            navigateTo(getProductsUrl());
                          }
                        }}
                        className="bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 hover:border-stone-400 font-bold text-xs px-10 py-4.5 rounded-full transition-all tracking-widest uppercase inline-flex items-center gap-2.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                      >
                        {t('viewAllProducts')} ({products.length})
                        <ArrowRight className={`${lang === 'ar' ? 'rotate-180' : ''} w-4 h-4 text-[#2563eb]`} />
                      </a>
                    </motion.div>
                  </>
                )}
              </section>

              {reviews.filter(r => r.status === 'approved').length > 0 && (
                <section className="bg-stone-50 border-t border-stone-200/60 py-16 overflow-hidden">
                  <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.6 }}
                      className="text-center max-w-xl mx-auto space-y-2"
                    >
                      <span className="text-[#2563eb] font-bold text-[10px] uppercase tracking-[0.25em]">
                        {t('verifiedReviews')}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 uppercase tracking-wider">
                        {t('lovedByThousands')}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                        {t('lovedByThousandsDesc')}
                      </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {reviews.filter(r => r.status === 'approved').slice(0, 3).map((rev, rIdx) => {
                        const rX = rIdx === 0 ? (lang === 'ar' ? 60 : -60) : rIdx === 2 ? (lang === 'ar' ? -60 : 60) : 0;
                        const rY = rIdx === 1 ? 50 : 20;

                        return (
                          <motion.div
                            key={rev.id}
                            initial={{ opacity: 0, x: rX, y: rY }}
                            whileInView={{ opacity: 1, x: 0, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.6, delay: rIdx * 0.15, ease: "easeOut" }}
                            className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 shadow-xs relative hover:border-[#2563eb]/40 hover:shadow-md transition-all"
                          >
                            <div className="flex text-amber-500 gap-0.5">
                              {[...Array(rev.rating || 5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />)}
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed italic">
                              "{rev.comment}"
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700 border border-stone-200">
                                {rev.author.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-xs text-stone-900">{rev.author}</h5>
                                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                                  {lang === 'ar' ? 'مشترٍ موثق' : 'Verified Buyer'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              <section id="about-info-section" style={{ backgroundColor: siteBackgroundColor }} className="py-16 border-t border-stone-200/80 overflow-hidden w-full max-w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12 overflow-hidden w-full max-w-full">
                  <motion.div
                    initial={{ opacity: 0, y: -25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto space-y-4"
                  >
                    <span className="text-[#2563eb] font-bold text-xs uppercase tracking-wider">
                      {lang === 'ar' ? 'الثقة والضمان المتبادل' : 'Confidence & Trust Guaranteed'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-snug">
                      {lang === 'ar' ? `ميثاق الثقة لـ ${getStoreName()}` : `The ${getStoreName()} Trust Blueprint`}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {lang === 'ar'
                        ? 'لقد قمنا بتبسيط التسوق الإلكتروني ليكون آمنًا، سريعًا، وشفافًا بنسبة 100٪. لا تحتاج إلى بطاقات ائتمان—اطلب بثقة تامة وادفع فقط عندما تستلم وتكون راضيًا بالكامل!'
                        : 'We have streamlined online shopping to make it 100% secure, fast, and transparent. No credit cards needed—order with confidence and pay only when you are fully satisfied!'}
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: lang === 'ar' ? 50 : -50, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                      className="bg-white p-8 rounded-[2rem] border border-stone-150 space-y-4 shadow-sm hover:shadow-md transition-shadow hover:border-[#2563eb]/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center">
                        <PackageOpen className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                        {lang === 'ar' ? 'افحص طلبك قبل الدفع' : 'Inspect Before Paying'}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {lang === 'ar'
                          ? 'نحن نثق بعملائنا. افتح وافحص شحنتك أمام مندوب التوصيل للتأكد من رضاك التام قبل دفع أي مبلغ!'
                          : 'We trust our clients. Open and inspect your package in front of the delivery agent before paying!'}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                      className="bg-white p-8 rounded-[2rem] border border-stone-150 space-y-4 shadow-sm hover:shadow-md transition-shadow hover:border-[#2563eb]/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Truck className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                        {lang === 'ar' ? 'توصيل سريع مجاني' : 'Free Express Delivery'}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {lang === 'ar'
                          ? `توصيل آمن لباب منزلك. الشحن السريع مجاني بالكامل لجميع طلباتك فوق 100 ${getCurrency()}!`
                          : `Secure door-to-door delivery. Express shipping is 100% free for orders above 100 ${getCurrency()}!`}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                      className="bg-white p-8 rounded-[2rem] border border-stone-150 space-y-4 shadow-sm hover:shadow-md transition-shadow hover:border-[#2563eb]/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <BadgeCheck className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                        {lang === 'ar' ? 'جودة فاخرة مضمونة' : 'Premium Quality Guaranteed'}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {lang === 'ar'
                          ? 'نحن ننتقي ونفحص كل قطعة بعناية فائقة لضمان مطابقتها لأعلى معايير الجودة والخياطة الرفيعة قبل شحنها إليك.'
                          : 'We hand-pick and thoroughly inspect each item to ensure it meets our strict luxury standards for materials and craftsmanship before shipping.'}
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: lang === 'ar' ? -50 : 50, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                      className="bg-white p-8 rounded-[2rem] border border-stone-150 space-y-4 shadow-sm hover:shadow-md transition-shadow hover:border-[#2563eb]/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                        <WhatsAppIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                        {lang === 'ar' ? 'دعم متواصل على الواتساب' : 'WhatsApp Support'}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        {lang === 'ar'
                          ? 'خدمة عملاء مباشرة وشخصية على مدار الأسبوع. تواصل معنا لمتابعة طلبك أو تعديل المقاسات والخيارات بسهولة!'
                          : 'Direct and personal customer care. Message our support team to track packages or update sizes anytime!'}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </section>

            </div>
          )}

          {currentView === 'all-products' && (
            <div className=" flex-1 flex flex-col">
              <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 flex-1 space-y-10 w-full">

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-200/60 pb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#2563eb] text-sm">●</span>
                    <h2 className="text-sm sm:text-base font-serif font-bold uppercase tracking-[0.15em] text-stone-900">
                      {filterPopular
                        ? t('bestSellers').toUpperCase()
                        : selectedCategory === 'All'
                          ? t('allProducts').toUpperCase()
                          : (CATEGORY_TRANSLATIONS[lang][selectedCategory] || selectedCategory).toUpperCase()
                      }
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex items-center bg-white border border-stone-200 hover:border-stone-400 focus-within:border-[#2563eb] py-2 px-3.5 transition-all max-w-[180px] sm:max-w-xs w-full rounded-full shadow-xs">
                      <Search className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-xs outline-none w-full placeholder-stone-400 font-semibold text-stone-800 animate-none"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-800 p-0.5 rounded-full hover:bg-stone-100 ml-1 shrink-0 cursor-pointer" aria-label="Clear search">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="relative shrink-0 select-none">
                      <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          isFilterOpen || selectedCategory !== 'All' || filterPopular
                            ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-[#2563eb]/15'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>
                          {filterPopular
                            ? t('bestSellers')
                            : selectedCategory === 'All'
                              ? t('filter')
                              : (CATEGORY_TRANSLATIONS[lang][selectedCategory] || selectedCategory)
                          }
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isFilterOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsFilterOpen(false)}
                          />

                          <div className="absolute right-0 mt-2 w-52 bg-white border border-stone-150 rounded-2xl shadow-xl z-50 p-1.5 animate-fadeIn py-1.5">
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-3 py-1 text-left select-none">{t('selectFilter')}</p>

                            {categories.map((cat) => {
                               const isActive = selectedCategory === cat && !filterPopular;
                               return (
                                 <a
                                   key={cat}
                                   href={cat === 'All' ? getProductsUrl() : getProductsUrl(cat)}
                                   onClick={(e) => {
                                     if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                                       e.preventDefault();
                                       setSelectedCategory(cat);
                                       setFilterPopular(false);
                                       setIsFilterOpen(false);
                                       navigateTo(cat === 'All' ? getProductsUrl() : getProductsUrl(cat));
                                     }
                                   }}
                                   className={`w-full text-left transition-all text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer flex items-center justify-between ${
                                     isActive
                                       ? 'bg-blue-50 text-[#2563eb]'
                                       : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                   }`}
                                 >
                                   <span>{cat === 'All' ? t('allProducts') : (CATEGORY_TRANSLATIONS[lang]?.[cat] || cat)}</span>
                                   {isActive && <span className="text-[#2563eb] text-xs">●</span>}
                                 </a>
                               );
                            })}

                            <div className="border-t border-stone-100 my-1" />

                            <a
                              href={getStoreUrl('/products', { popular: true })}
                              onClick={(e) => {
                                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                                  e.preventDefault();
                                  setFilterPopular(true);
                                  setIsFilterOpen(false);
                                  navigateTo(getStoreUrl('/products', { popular: true }));
                                }
                              }}
                              className={`w-full text-left transition-all text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer flex items-center justify-between ${
                                filterPopular
                                  ? 'bg-blue-50 text-[#2563eb]'
                                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                              }`}
                            >
                              <span>{t('bestSellers')}</span>
                              {filterPopular && <span className="text-[#2563eb] text-xs">●</span>}
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-24 text-center max-w-md mx-auto space-y-4 bg-white rounded-[2.5rem] p-12 border border-stone-150 shadow-xs">
                    <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                    <h4 className="font-bold text-stone-900 text-xs uppercase tracking-widest">No products found</h4>
                    <p className="text-xs text-stone-500">
                      Sorry, no products matched your search criteria. Please try different keywords or filters.
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setFilterPopular(false); }}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] font-bold px-6 py-2.5 rounded-full uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                    {filteredProducts.map((product) => {
                      const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: false, amount: 0.1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between group cursor-pointer hover:border-[#2563eb]/50 hover:shadow-xl transition-all hover:-translate-y-0.5"
                          onClick={() => handleOpenProduct(product)}
                        >
                          <div className="space-y-2 sm:space-y-3">
                            {(() => {
                              const cover = getProductCover(product);
                              return (
                                <div className="relative aspect-square overflow-hidden bg-stone-50 rounded-xl sm:rounded-[1.5rem] border border-stone-100">
                                  <img
                                    src={cover.url}
                                    alt={product.name}
                                    style={getProductImageStyle(product, cover.isVideo)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  {cover.isVideo && (
                                    <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-red-600 text-white text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                                      <span>Video</span>
                                    </span>
                                  )}
                                  {(() => {
                                    const promoCoupon = (coupons || []).find(
                                      c => c.status === 'active' &&
                                           c.showBadgeOnProductCard !== false &&
                                           (!c.storeId || c.storeId === 'all' || c.storeId === activeCountrySlug) &&
                                           (!c.productId || c.productId === 'all' || c.productId === product.id)
                                    );
                                    if (!promoCoupon) return null;
                                    const isPercent = (promoCoupon.discountType || promoCoupon.type) === 'percentage';
                                    const discVal = promoCoupon.discountValue || promoCoupon.value;
                                    return (
                                      <div
                                        style={{ backgroundColor: primaryBrandColor }}
                                        className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-white rounded-lg sm:rounded-xl shadow-md flex items-center overflow-hidden border border-white/20 select-none"
                                      >
                                        <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono font-black text-[7.5px] sm:text-[10px] tracking-wider uppercase">
                                          <Ticket className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90 shrink-0" />
                                          <span>{promoCoupon.code}</span>
                                        </div>
                                        <div className="bg-black/25 px-1.5 py-0.5 sm:px-2 sm:py-1 font-sans font-extrabold text-[7px] sm:text-[9.5px] border-l border-white/15 text-white whitespace-nowrap">
                                          {isPercent ? `-${discVal}%` : `-${discVal} ${getCurrency()}`}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(product.id);
                                    }}
                                    className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10 w-6 h-6 sm:w-8 sm:h-8 bg-white/95 hover:bg-white text-stone-600 hover:text-rose-500 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 border border-stone-100 cursor-pointer"
                                    title={favorites.includes(product.id) ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites')}
                                  >
                                    <Heart
                                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                        favorites.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''
                                      }`}
                                    />
                                  </button>
                                  {product.stock === 0 && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-2">
                                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-stone-900 border border-stone-900 px-2.5 py-1 sm:px-4 sm:py-2 bg-white rounded-full">
                                        {t('outOfStock')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="px-0.5 space-y-1">
                              <span className="text-[9px] sm:text-[11px] uppercase font-bold text-[#2563eb] block tracking-wider">
                                {getProdCat(product.category)}
                              </span>
                              <h4 className="font-sans font-extrabold text-stone-950 text-xs sm:text-sm lg:text-base tracking-tight group-hover:text-[#2563eb] transition-colors leading-snug line-clamp-1 sm:line-clamp-2">
                                {getProdName(product)}
                              </h4>
                              <p className="text-stone-400 text-[10px] sm:text-xs line-clamp-1 hidden sm:line-clamp-2">
                                {getProdDesc(product)}
                              </p>
                            </div>
                          </div>

                          <div className="px-0.5 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-stone-100 flex items-center justify-between gap-1 sm:gap-2">
                            <div className="flex flex-col shrink-0 min-w-0">
                              <div className="flex items-baseline gap-0.5 sm:gap-1 font-black text-stone-900 font-sans whitespace-nowrap">
                                <span className="text-xs sm:text-base xl:text-lg leading-none">{product.price}</span>
                                <span className="text-[8.5px] sm:text-xs font-bold text-stone-700 leading-none">{getCurrency()}</span>
                              </div>
                              {hasDiscount && (
                                <span className="text-[8px] sm:text-[10px] text-stone-400 line-through whitespace-nowrap mt-0.5">
                                  {product.originalPrice} {getCurrency()}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product, 1);
                                  showNotification(
                                    lang === 'ar'
                                      ? `تمت إضافة "${getProdName(product)}" إلى السلة بنجاح`
                                      : `Added "${getProdName(product)}" to cart`,
                                    'success'
                                  );
                                }}
                                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-full font-bold text-[9.5px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                title={t('addToCart')}
                              >
                                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="hidden sm:inline">{lang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
                                <span className="inline sm:hidden">{lang === 'ar' ? 'أضف' : 'Add'}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </main>

            </div>
          )}

          {currentView === 'support' && (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: siteBackgroundColor }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <section className="w-full pt-10 pb-8 bg-white border-b border-stone-200/70">
                <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-3">

                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border">
                    {supportStatus.isOnline ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{lang === 'ar' ? 'الدعم الفني: متصل الآن' : lang === 'fr' ? 'Support : En ligne' : 'Support: Online Now'}</span>
                        <span className="text-emerald-500 font-normal">|</span>
                        <span className="text-[11px] font-medium text-emerald-600">
                          {lang === 'ar' ? 'الرد سريع خلال دقائق' : 'Fast response within minutes'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>{lang === 'ar' ? 'الدعم الفني: غير متصل حالياً' : lang === 'fr' ? 'Support : Hors ligne' : 'Support: Offline'}</span>
                        <span className="text-stone-400 font-normal">|</span>
                        <span className="text-[11px] font-medium text-stone-500">
                          {lang === 'ar' ? `أوقات العمل: ${supportStatus.hoursText} (${supportStatus.workDays})` : `Working Hours: ${supportStatus.hoursText} (${supportStatus.workDays})`}
                        </span>
                      </div>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-tight text-stone-900">
                    {lang === 'ar' ? 'الدعم الفني' : lang === 'fr' ? 'Support Client' : 'Customer Support'}
                  </h1>

                  <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-normal">
                    {lang === 'ar'
                      ? 'نحن متواجدون لمساعدتكم والإجابة على استفساراتكم ومتابعة طلباتكم مباشرة.'
                      : lang === 'fr'
                      ? 'Notre équipe est à votre disposition pour répondre à vos questions et suivre vos commandes.'
                      : 'We are here to assist you, answer your inquiries, and track your orders directly.'}
                  </p>
                </div>
              </section>

              <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                  <div className="lg:col-span-6 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                          {lang === 'ar' ? 'إرسال استفسار أو سؤال جديد' : lang === 'fr' ? 'Poser une question' : 'Submit a Question or Inquiry'}
                        </h2>
                        <p className="text-xs text-stone-500">
                          {lang === 'ar' ? 'اكتب سؤالك وسيقوم فريق الدعم بالرد عليك ومتابعة حالتك مباشرة' : 'Write your question and our support team will reply directly'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeOpenTicket && !isTicketSubmitted && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                            <span>{lang === 'ar' ? 'لديك استفسار مفتوح قيد المتابعة حالياً' : 'You have an active open inquiry'}</span>
                            <span className="font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[11px]">
                              #{activeOpenTicket.id}
                            </span>
                          </h4>
                          <p className="text-xs text-amber-800 font-medium mt-0.5">
                            {lang === 'ar'
                              ? 'يمكنك متابعة المحادثة والرد مباشرة في قسم المحادثات أدناه. لا يمكن فتح تذكرة جديدة حتى يتم حل وإغلاق تذكرتك الحالية.'
                              : 'You can follow and reply directly below. A new inquiry can be opened once the current one is resolved.'}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`#ticket-${activeOpenTicket.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(`ticket-${activeOpenTicket.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                      >
                        {lang === 'ar' ? 'الانتقال إلى المحادثة الحالية' : 'Go to Conversation'}
                      </a>
                    </div>
                  )}

                  {isTicketSubmitted && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                            {lang === 'ar' ? 'تم استلام استفساركم بنجاح!' : 'Inquiry Submitted Successfully!'}
                          </h4>
                          <p className="text-xs text-emerald-700 font-medium">
                            {lang === 'ar'
                              ? `رقم التذكرة: (${submittedTicketId}) - تظهر المحادثة أدناه مباشرة في قسم المحادثات.`
                              : `Ticket ID: (${submittedTicketId}) - Your conversation is displayed directly below.`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsTicketSubmitted(false);
                          setSubmittedTicketId('');
                        }}
                        className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all cursor-pointer shrink-0"
                      >
                        {lang === 'ar' ? 'إغلاق الإشعار' : 'Close Notification'}
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendSupportTicket} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700 block">
                          {lang === 'ar' ? 'الاسم الكامل *' : lang === 'fr' ? 'Nom complet *' : 'Full Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          disabled={Boolean(activeOpenTicket)}
                          placeholder={lang === 'ar' ? 'مثال: محمد العمري' : 'e.g. Alex Morgan'}
                          value={supportName}
                          onChange={e => setSupportName(e.target.value)}
                          className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#2563eb] focus:bg-white text-stone-900 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className={activeOpenTicket ? 'opacity-60 pointer-events-none' : ''}>
                        <PhoneInput
                          label={lang === 'ar' ? 'رقم الجوال *' : 'Phone Number *'}
                          required
                          selectedCountryCode={selectedCountryCode}
                          onSelectCountry={setSelectedCountryCode}
                          value={supportPhone}
                          onChange={setSupportPhone}
                          lang={lang}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700 block">
                          {lang === 'ar' ? 'موضوع الاستفسار *' : lang === 'fr' ? 'Sujet *' : 'Subject *'}
                        </label>
                        <CustomSelect
                          value={supportSubject}
                          onChange={val => setSupportSubject(val)}
                          theme="light"
                          size="md"
                          options={[
                            { value: 'Product Inquiries', label: lang === 'ar' ? 'استفسار حول منتج' : 'Product Inquiry' },
                            { value: 'Delivery Question', label: lang === 'ar' ? 'تتبع ومتابعة الطلب' : 'Track Order' },
                            { value: 'Change Order Details', label: lang === 'ar' ? 'تعديل معلومات الطلب أو العنوان' : 'Update Order Info' },
                            { value: 'Other Assistance', label: lang === 'ar' ? 'استفسار عام' : 'General Inquiry' }
                          ]}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700 block">
                          {lang === 'ar' ? 'رقم الطلب (اختياري)' : lang === 'fr' ? 'Numéro de commande (Optionnel)' : 'Order ID (Optional)'}
                        </label>
                        <input
                          type="text"
                          disabled={Boolean(activeOpenTicket)}
                          placeholder={lang === 'ar' ? 'مثال: ORD-4892' : 'e.g. ORD-4892'}
                          value={supportOrderId}
                          onChange={e => setSupportOrderId(e.target.value)}
                          className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#2563eb] focus:bg-white text-stone-900 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 block">
                        {lang === 'ar' ? 'تفاصيل الاستفسار أو الرسالة *' : 'Message or Question *'}
                      </label>
                      <textarea
                        required
                        disabled={Boolean(activeOpenTicket)}
                        rows={3}
                        placeholder={
                          activeOpenTicket
                            ? (lang === 'ar' ? 'لديك استفسار مفتوح حالياً. يمكنك متابعة الردود في الأسفل.' : 'You have an active inquiry. Follow up in the conversation below.')
                            : (lang === 'ar' ? 'يرجى كتابة استفسارك أو سؤالك هنا...' : 'Type your inquiry or question here...')
                        }
                        value={supportMessage}
                        onChange={e => setSupportMessage(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#2563eb] focus:bg-white text-stone-900 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={Boolean(activeOpenTicket)}
                      className="w-full sm:w-auto px-8 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/15 cursor-pointer active:scale-99 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {activeOpenTicket
                          ? (lang === 'ar' ? 'لديك تذكرة مفتوحة بالفعل' : 'Active Ticket In Progress')
                          : (lang === 'ar' ? 'إرسال الاستفسار' : 'Submit Inquiry')}
                      </span>
                    </button>
                  </form>
                  </div>

                  <div className="lg:col-span-6 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="border-b border-stone-100 pb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                            <span>{lang === 'ar' ? 'المحادثات المباشرة وتتبع الاستفسارات' : 'Live Conversations & Tracking'}</span>
                            {trackedTickets.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold">
                                {trackedTickets.length}
                              </span>
                            )}
                          </h2>
                          <p className="text-xs text-stone-500">
                            {lang === 'ar' ? 'جميع استفساراتك وردود فريق الدعم تظهر هنا بشكل تفاعلي ومباشر' : 'All your inquiries and team responses appear here interactively'}
                          </p>
                        </div>
                      </div>
                    </div>

                  <div className="space-y-4">
                    {trackedTickets.length === 0 ? (
                      <div className="text-center py-10 space-y-3 bg-stone-50/70 border border-stone-150 rounded-2xl p-6">
                        <FileText className="w-10 h-10 text-stone-300 mx-auto" />
                        <h4 className="text-sm font-bold text-stone-700">
                          {lang === 'ar' ? 'لا توجد استفسارات سابقة بعد' : 'No Previous Inquiries Yet'}
                        </h4>
                        <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                          {ticketPhoneSearch
                            ? (lang === 'ar' ? 'لم نتمكن من العثور على أي محادثة مطابقة لمعايير البحث.' : 'No conversations matched this search.')
                            : (lang === 'ar' ? 'أي استفسار ترسله من النموذج أعلاه سيظهر هنا فوراً مع إمكانية متابعة رد الدعم الفني والتحدث مباشرة.' : 'Inquiries you submit will appear here immediately with real-time replies.')}
                        </p>
                      </div>
                    ) : (
                      trackedTickets.map(ticket => {
                        const isSeen = ticket.seen === true;
                        const isResolved = ticket.status === 'resolved';

                        return (
                          <div key={ticket.id} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                  {ticket.id}
                                </span>
                                <span className="text-xs text-stone-400 font-medium">
                                  {formatDateOnly(ticket.date, lang, false)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {!isResolved && (
                                  <button
                                    type="button"
                                    onClick={() => handleCloseTicketByClient(ticket.id)}
                                    className="text-[10px] font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-full border border-stone-200 transition-all cursor-pointer flex items-center gap-1"
                                    title={lang === 'ar' ? 'إغلاق وحل التذكرة' : 'Close and resolve this ticket'}
                                  >
                                    <Check className="w-3 h-3 text-stone-500" />
                                    <span>{lang === 'ar' ? 'إغلاق التذكرة' : 'Close Ticket'}</span>
                                  </button>
                                )}
                                {isResolved ? (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {lang === 'ar' ? 'تم الحل والإغلاق' : 'Resolved & Closed'}
                                  </span>
                                ) : isSeen ? (
                                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    {lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    {lang === 'ar' ? 'في الانتظار' : 'In Queue'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-stone-900">
                                {ticket.subject === 'Delivery Question' ? (lang === 'ar' ? 'تتبع ومتابعة الطلب' : 'Track Order') :
                                 ticket.subject === 'Change Order Details' ? (lang === 'ar' ? 'تعديل معلومات الطلب أو العنوان' : 'Update Order Info') :
                                 ticket.subject === 'Product Inquiries' ? (lang === 'ar' ? 'استفسار حول منتج' : 'Product Inquiry') :
                                 ticket.subject}
                              </h4>
                            </div>

                            <div className="bg-stone-50/80 rounded-xl p-3.5 border border-stone-150 space-y-3">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                {lang === 'ar' ? 'المحادثة والردود المباشرة' : 'Conversation Thread'}
                              </span>

                              <div className="flex flex-col gap-1 items-start">
                                <div className="bg-white border border-stone-200 rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs text-stone-800 shadow-xs max-w-[85%]">
                                  <span className="text-[10px] font-bold text-stone-400 block mb-0.5">{ticket.customerName || (lang === 'ar' ? 'أنت' : 'You')}</span>
                                  <p className="whitespace-pre-line leading-relaxed">{ticket.message}</p>
                                </div>
                                <span className="text-[9px] text-stone-400 px-1 font-mono">{formatTimeOnly(ticket.date)}</span>
                              </div>

                              {ticket.messages && ticket.messages.length > 0 && (
                                ticket.messages
                                  .filter((msg, idx) => !(idx === 0 && msg.sender === 'customer' && msg.text.trim() === ticket.message.trim()))
                                  .map(msg => (
                                    <div
                                      key={msg.id}
                                      className={`flex flex-col gap-1 ${msg.sender === 'customer' ? 'items-start' : 'items-end'}`}
                                    >
                                      <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] shadow-xs ${
                                        msg.sender === 'support'
                                          ? 'bg-[#2563eb] text-white rounded-tl-xs'
                                          : 'bg-white border border-stone-200 text-stone-800 rounded-tr-xs'
                                      }`}>
                                        <span className={`text-[10px] font-bold block mb-0.5 ${msg.sender === 'support' ? 'text-blue-100' : 'text-stone-400'}`}>
                                          {msg.sender === 'support' ? (lang === 'ar' ? 'الدعم الفني' : 'Support Team') : (msg.senderName || (lang === 'ar' ? 'أنت' : 'You'))}
                                        </span>
                                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                                      </div>
                                      <span className="text-[9px] text-stone-400 px-1 font-mono">
                                        {formatTimeOnly(msg.date)}
                                      </span>
                                    </div>
                                  ))
                              )}

                              <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={lang === 'ar' ? 'اكتب رداً أو استفساراً إضافياً...' : 'Type a reply or question...'}
                                  value={activeTicketConversationId === ticket.id ? ticketReplyInput : ''}
                                  onFocus={() => setActiveTicketConversationId(ticket.id)}
                                  onChange={e => {
                                    setActiveTicketConversationId(ticket.id);
                                    setTicketReplyInput(e.target.value);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSendTicketReply(ticket.id);
                                    }
                                  }}
                                  className="flex-1 text-xs bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#2563eb] text-stone-900 placeholder-stone-400 font-medium shadow-2xs"
                                />
                                <button
                                  type="button"
                                  disabled={isSendingTicketReply || !(activeTicketConversationId === ticket.id && ticketReplyInput.trim())}
                                  onClick={() => handleSendTicketReply(ticket.id)}
                                  className="px-3.5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{lang === 'ar' ? 'إرسال' : 'Send'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-5">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#2563eb]" />
                      <span>{lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {((storeConfig?.supportFaqs && storeConfig.supportFaqs.length > 0)
                      ? storeConfig.supportFaqs
                      : DEFAULT_SUPPORT_FAQS
                    ).map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      const qText = (lang !== 'ar' && item.qEn) ? item.qEn : item.q;
                      const aText = (lang !== 'ar' && item.aEn) ? item.aEn : item.a;

                      return (
                        <div
                          key={item.id || idx}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isOpen ? 'bg-blue-50/40 border-blue-200 shadow-xs' : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <button
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full p-4 flex items-center justify-between text-left cursor-pointer gap-3"
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                          >
                            <span className="text-xs sm:text-sm font-bold text-stone-900">
                              {qText}
                            </span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isOpen ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4 text-xs text-stone-600 leading-relaxed font-normal border-t border-blue-100/60 pt-2.5 whitespace-pre-line" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                              {aText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </main>
            </div>
          )}

          {currentView === 'profile' && (
            <div
              className={`flex-1 overflow-x-hidden ${
                !loggedInCustomer
                  ? 'relative min-h-[100dvh] py-6 sm:py-10 px-3 sm:px-6 flex flex-col justify-center items-center overflow-y-auto w-full'
                  : 'text-stone-900 min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full'
              }`}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              style={!loggedInCustomer ? {
                background: `radial-gradient(circle at 50% 0%, ${primaryBrandColor}28 0%, transparent 60%), radial-gradient(circle at 100% 100%, ${primaryBrandColor}20 0%, transparent 50%), radial-gradient(circle at 0% 100%, ${primaryBrandColor}18 0%, transparent 40%), linear-gradient(180deg, #09152e 0%, #0d224d 50%, #060e20 100%)`
              } : { backgroundColor: siteBackgroundColor }}
            >

              {!loggedInCustomer ? (
                <div className="w-full max-w-[420px] mx-auto space-y-3.5 sm:space-y-4 relative z-10 animate-fadeIn my-auto px-1 sm:px-0">

                  <div className="flex items-center justify-between gap-2 px-1 pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        navigateTo(getHomeUrl());
                      }}
                      className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 text-white transition-all duration-300 text-xs sm:text-sm font-bold border border-white/20 hover:border-white/40 shadow-lg hover:shadow-[0_0_22px_rgba(255,255,255,0.22)] cursor-pointer hover:scale-105 active:scale-95 overflow-hidden shrink-0"
                      title={lang === 'ar' ? 'الرجوع للمتجر' : 'Back to Store'}
                    >
                      {/* Shimmer sweep light effect on hover */}
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                      {/* Interactive animated arrow with smooth hover glide */}
                      <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-white/15 group-hover:bg-white/25 transition-colors duration-300">
                        <ArrowRight className={`w-3.5 h-3.5 transform transition-transform duration-300 ease-out ${
                          lang === 'ar' 
                            ? 'rotate-0 group-hover:translate-x-0.5' 
                            : 'rotate-180 group-hover:-translate-x-0.5'
                        }`} />
                      </span>
                      <span className="relative font-bold tracking-tight">{lang === 'ar' ? 'الرجوع للمتجر' : 'Back to Store'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        navigateTo(getHomeUrl());
                      }}
                      className="group focus:outline-none cursor-pointer select-none inline-flex items-center transition-transform duration-300 hover:scale-105 active:scale-95 shrink-0"
                      title={lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
                    >
                      <StoreLogo config={storeConfig} variant="dark" size="sm" />
                    </button>
                  </div>

                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.2)] p-4 sm:p-7 text-stone-900 relative">
                    <div className="text-center space-y-1.5 mb-4 pt-1">
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${primaryBrandColor}18 0%, ${primaryBrandColor}08 100%)`,
                          borderColor: `${primaryBrandColor}30`,
                          color: primaryBrandColor
                        }}
                        className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto shadow-xs transition-transform duration-300 hover:scale-105"
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-950 tracking-tight">
                        {authMode === 'login'
                          ? (lang === 'ar' ? 'تسجيل الدخول' : 'Login')
                          : (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Customer Account')}
                      </h2>
                      <p className="text-[11px] sm:text-xs text-stone-500 font-medium max-w-xs mx-auto leading-relaxed">
                        {authMode === 'login'
                          ? (lang === 'ar' ? 'سجل دخولك لمتابعة شحناتك وتتبع طلباتك بكل سهولة' : 'Log in to track your orders and view purchase history')
                          : (lang === 'ar' ? 'أنشئ حسابك خلال ثوانٍ للتمتع بتجربة تسوق أسرع وتتبع فوري' : 'Create an account in seconds for fast checkout and live order tracking')}
                      </p>
                    </div>

                    <div className="bg-stone-100/90 p-1 sm:p-1.5 rounded-2xl flex items-center mb-4 border border-stone-200/80 shadow-inner gap-1">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setCustomerModalError(''); }}
                        style={authMode === 'login' ? { backgroundColor: primaryBrandColor } : undefined}
                        className={`flex-1 py-2 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${
                          authMode === 'login'
                            ? 'text-white shadow-md'
                            : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
                        }`}
                      >
                        {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setCustomerModalError(''); }}
                        style={authMode === 'register' ? { backgroundColor: primaryBrandColor } : undefined}
                        className={`flex-1 py-2 sm:py-2.5 min-h-[40px] rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer text-center flex items-center justify-center ${
                          authMode === 'register'
                            ? 'text-white shadow-md'
                            : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
                        }`}
                      >
                        {lang === 'ar' ? 'حساب جديد' : 'New Account'}
                      </button>
                    </div>

                    {authMode === 'login' ? (
                      <form onSubmit={handleCustomerLoginOrRegister} className="space-y-3.5 animate-fadeIn">
                        <div className="relative z-40">
                          <PhoneInput
                            label={lang === 'ar' ? 'رقم الهاتف / الجوال' : 'Phone Number'}
                            required
                            selectedCountryCode={selectedCountryCode}
                            onSelectCountry={setSelectedCountryCode}
                            value={customerPhoneInput}
                            onChange={setCustomerPhoneInput}
                            lang={lang}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-stone-700 text-[11px] uppercase tracking-wider block">
                            {lang === 'ar' ? 'كلمة السر' : 'Password'} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showCustomerPassword ? 'text' : 'password'}
                              required
                              placeholder={lang === 'ar' ? 'أدخل كلمة السر' : 'Enter password'}
                              value={customerPasswordInput}
                              onChange={e => setCustomerPasswordInput(e.target.value)}
                              className="w-full border border-stone-200 bg-stone-50/80 hover:bg-white focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 ltr:pr-11 rtl:pl-11 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 font-semibold text-stone-900 placeholder-stone-400 text-sm transition-all shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                              className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer select-none"
                              aria-label="Toggle password visibility"
                            >
                              {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {customerModalError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold text-center animate-fadeIn">
                            {customerModalError}
                          </div>
                        )}

                        <button
                          type="submit"
                          style={{
                            backgroundColor: primaryBrandColor,
                            boxShadow: `0 10px 25px -5px ${primaryBrandColor}45`
                          }}
                          className="group relative overflow-hidden w-full text-white font-bold py-3.5 min-h-[46px] rounded-xl sm:rounded-2xl hover:brightness-105 cursor-pointer transition-all duration-300 uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.99] mt-3"
                        >
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                          <span className="relative font-extrabold">{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                          <ArrowRight className={`w-4 h-4 relative transform transition-transform duration-300 ${
                            lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'rotate-0 group-hover:translate-x-1'
                          }`} />
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleCustomerLoginOrRegister} className="space-y-3.5 animate-fadeIn">
                        <div className="space-y-1">
                          <label className="font-bold text-stone-700 text-[11px] uppercase tracking-wider block">
                            {lang === 'ar' ? 'الاسم الكامل (الاسم والنسب)' : 'Full Name'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'ar' ? 'مثال: يوسف العلمي' : (lang === 'fr' ? 'ex: Youssef Alami' : 'e.g. Youssef Alami')}
                            value={customerNameInput}
                            onChange={e => setCustomerNameInput(e.target.value)}
                            className="w-full border border-stone-200 bg-stone-50/80 hover:bg-white focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 font-semibold text-stone-900 placeholder-stone-400 text-sm transition-all shadow-xs"
                          />
                        </div>

                        <div className="relative z-40">
                          <PhoneInput
                            label={lang === 'ar' ? 'رقم الهاتف / الجوال' : 'Phone Number'}
                            required
                            selectedCountryCode={selectedCountryCode}
                            onSelectCountry={setSelectedCountryCode}
                            value={customerPhoneInput}
                            onChange={setCustomerPhoneInput}
                            lang={lang}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-stone-700 text-[11px] uppercase tracking-wider block">
                            {lang === 'ar' ? 'كلمة السر للحساب' : 'Password'} <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showCustomerPassword ? 'text' : 'password'}
                              required
                              placeholder={lang === 'ar' ? 'اختر كلمة سر لحسابك' : 'Create a password'}
                              value={customerPasswordInput}
                              onChange={e => setCustomerPasswordInput(e.target.value)}
                              className="w-full border border-stone-200 bg-stone-50/80 hover:bg-white focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 ltr:pr-11 rtl:pl-11 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 font-semibold text-stone-900 placeholder-stone-400 text-sm transition-all shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                              className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer select-none"
                              aria-label="Toggle password visibility"
                            >
                              {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {customerModalError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold text-center animate-fadeIn">
                            {customerModalError}
                          </div>
                        )}

                        <button
                          type="submit"
                          style={{
                            backgroundColor: primaryBrandColor,
                            boxShadow: `0 10px 25px -5px ${primaryBrandColor}45`
                          }}
                          className="group relative overflow-hidden w-full text-white font-bold py-3.5 min-h-[46px] rounded-xl sm:rounded-2xl hover:brightness-105 cursor-pointer transition-all duration-300 uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.99] mt-3"
                        >
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                          <span className="relative font-extrabold">{lang === 'ar' ? 'إنشاء الحساب والمتابعة' : 'Create Account'}</span>
                          <ArrowRight className={`w-4 h-4 relative transform transition-transform duration-300 ${
                            lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'rotate-0 group-hover:translate-x-1'
                          }`} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6 animate-fadeIn">

                  <div className="flex items-center justify-between text-xs text-stone-500 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          navigateTo(getHomeUrl());
                        }}
                        className="hover:text-stone-900 transition-colors cursor-pointer"
                      >
                        {t('home')}
                      </button>
                      <ChevronRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                      <span className="text-stone-900 font-bold">{t('myAccount')}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        navigateTo(getProductsUrl());
                      }}
                      className="inline-flex items-center gap-1.5 text-[#2563eb] hover:text-blue-700 font-bold cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تصفح المتجر' : 'Browse Catalog'}</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3.5 sm:gap-5 w-full sm:w-auto">
                      <div className="relative group shrink-0">
                        <CustomerAvatar
                          avatar={loggedInCustomer.avatar}
                          name={loggedInCustomer.name}
                          phone={loggedInCustomer.phone}
                          size="lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProfileActiveTab('profile');
                            profileFileInputRef.current?.click();
                          }}
                          className="absolute -bottom-1 -right-1 bg-[#2563eb] text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-all cursor-pointer hover:scale-105 active:scale-95"
                          title={lang === 'ar' ? 'تغيير الصورة الشخصية' : 'Change Avatar'}
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="font-serif font-bold text-stone-900 text-lg sm:text-2xl md:text-3xl leading-tight truncate">
                            {loggedInCustomer.name}
                          </h1>
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'ar' ? 'زبون معتمد' : 'Verified Customer'}</span>
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 font-mono font-bold flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{loggedInCustomer.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-200">
                      <button
                        type="button"
                        onClick={handleCustomerLogout}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-stone-700 text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[40px]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                    <div
                      onClick={() => setProfileActiveTab('orders')}
                      className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-stone-400 group-hover:text-[#2563eb] transition-colors">
                        <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">{lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</span>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1.5 sm:mt-2">{customerOrders.length}</p>
                    </div>

                    <div
                      onClick={() => setProfileActiveTab('orders')}
                      className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-blue-500">
                        <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">{lang === 'ar' ? 'قيد التوصيل' : 'In Transit'}</span>
                        <Truck className="w-4 h-4" />
                      </div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1.5 sm:mt-2">
                        {customerOrders.filter(o => o.status === 'shipped' || o.status === 'pending').length}
                      </p>
                    </div>

                    <div
                      onClick={() => setProfileActiveTab('favorites')}
                      className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-rose-500">
                        <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">{lang === 'ar' ? 'المفضلة' : 'Wishlist'}</span>
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1.5 sm:mt-2">{favorites.length}</p>
                    </div>

                    <div
                      onClick={() => setProfileActiveTab('tickets')}
                      className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">{lang === 'ar' ? 'الدعم والمحادثات' : 'Support Tickets'}</span>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1.5 sm:mt-2">{customerTickets.length}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-stone-200 p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none shadow-xs max-w-full touch-pan-x">
                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('orders')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px] whitespace-nowrap ${
                        profileActiveTab === 'orders'
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'طلباتي وتتبع الشحنات' : 'My Orders & Tracking'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        profileActiveTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {customerOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('profile')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px] whitespace-nowrap ${
                        profileActiveTab === 'profile'
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إعدادات الحساب والصورة' : 'Account & Photo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('favorites')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px] whitespace-nowrap ${
                        profileActiveTab === 'favorites'
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${profileActiveTab === 'favorites' ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
                      <span>{lang === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        profileActiveTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {favorites.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('tickets')}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px] whitespace-nowrap ${
                        profileActiveTab === 'tickets'
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تذاكر ومحادثات الدعم' : 'Support Tickets'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        profileActiveTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {customerTickets.length}
                      </span>
                    </button>
                  </div>

                  {profileActiveTab === 'orders' && (
                    <div className="space-y-4 animate-fadeIn">
                      {customerOrders.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center space-y-4 shadow-xs">
                          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto border border-blue-100">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                              {lang === 'ar' ? 'لا توجد أي طلبات سابقة حتى الآن' : 'No Orders Placed Yet'}
                            </h3>
                            <p className="text-xs text-stone-500 max-w-md mx-auto">
                              {lang === 'ar'
                                ? 'استكشف تشكيلتنا الفاخرة واختر ما يناسبك مع إمكانية الدفع عند الاستلام والتوصيل السريع لجميع المدن.'
                                : 'Explore our collection and order with fast delivery and cash on delivery guarantee.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCurrentView('all-products'); setSelectedCategory('All'); }}
                            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <span>{t('shopNow')}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {customerOrders.map(o => {
                            const isDelivered = o.status === 'delivered' || o.status === 'completed';
                            const isShipped = o.status === 'shipped';
                            const isProcessing = o.status === 'processing';
                            const isCancelled = o.status === 'cancelled';
                            const stepIndex = isDelivered ? 4 : isShipped ? 3 : isProcessing ? 2 : 1;

                            return (
                              <div key={o.id} className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 space-y-5 shadow-xs transition-all">

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-150">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-mono text-stone-900 font-bold text-sm bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                                      #{o.id}
                                    </span>
                                    <span className="text-stone-300">•</span>
                                    <span className="text-stone-500 text-xs font-medium">
                                      {formatDateTime(o.date, lang, { includeTime: true, includeYear: true })}
                                    </span>
                                    {o.trackingNumber && (
                                      <>
                                        <span className="text-stone-300">•</span>
                                        <span className="font-mono text-xs bg-blue-50 text-[#2563eb] px-2 py-0.5 rounded font-bold border border-blue-100">
                                          {lang === 'ar' ? `رقم التتبع: ${o.trackingNumber}` : `Tracking: ${o.trackingNumber}`}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                                      isDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      isShipped ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      isProcessing ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                      isCancelled ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                      {isShipped && <Truck className="w-3.5 h-3.5 text-blue-600" />}
                                      {isProcessing && <Package className="w-3.5 h-3.5 text-purple-600" />}
                                      {isCancelled && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                                      {!isDelivered && !isShipped && !isProcessing && !isCancelled && <Clock className="w-3.5 h-3.5 text-amber-600" />}

                                      <span>
                                        {isDelivered ? (lang === 'ar' ? 'تم التسليم بنجاح' : 'Delivered') :
                                         isShipped ? (lang === 'ar' ? 'قيد الشحن والتوصيل' : 'In Transit / Shipped') :
                                         isProcessing ? (lang === 'ar' ? 'قيد التجهيز والتغليف' : 'Packaging & Processing') :
                                         isCancelled ? (lang === 'ar' ? 'تم إلغاء الطلب' : 'Cancelled') :
                                         (lang === 'ar' ? 'قيد المراجعة والتأكيد' : 'Pending Confirmation')}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {!isCancelled && (
                                  <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
                                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                      <Truck className="w-3.5 h-3.5 text-stone-400" />
                                      <span>{lang === 'ar' ? 'مراحل تتبع الشحنة' : 'Shipment Milestones'}</span>
                                    </p>

                                    <div className="grid grid-cols-4 gap-2 relative">
                                      {[
                                        { step: 1, titleAr: 'تسجيل الطلب', titleEn: 'Placed' },
                                        { step: 2, titleAr: 'تجهيز وتغليف', titleEn: 'Packaging' },
                                        { step: 3, titleAr: 'في الطريق', titleEn: 'In Delivery' },
                                        { step: 4, titleAr: 'تم الاستلام', titleEn: 'Delivered' },
                                      ].map(s => {
                                        const isDone = stepIndex >= s.step;
                                        const isCurrent = stepIndex === s.step;

                                        return (
                                          <div key={s.step} className="text-center space-y-1.5 relative z-10">
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                                              isDone
                                                ? 'bg-[#2563eb] text-white shadow-xs'
                                                : 'bg-stone-200 text-stone-500'
                                            }`}>
                                              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                                            </div>
                                            <p className={`text-[10px] sm:text-xs font-bold truncate ${
                                              isCurrent ? 'text-[#2563eb]' : isDone ? 'text-stone-800' : 'text-stone-400'
                                            }`}>
                                              {lang === 'ar' ? s.titleAr : s.titleEn}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2.5">
                                  {o.items.map((item, idx) => {
                                    const matchedProd = products.find(p => p.id === item.productId || p.name === item.productName || (p.nameAr && p.nameAr === item.productName));
                                    const itemImg = item.image || matchedProd?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';

                                    return (
                                      <div key={idx} className="bg-stone-50/70 p-3 sm:p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <img
                                            src={itemImg}
                                            alt={item.productName}
                                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="min-w-0">
                                            <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">{item.productName}</h4>
                                            <p className="text-stone-500 text-[11px] font-semibold mt-0.5">
                                              <span>{lang === 'ar' ? 'الكمية:' : 'Qty:'}</span> <span className="font-bold text-stone-800">{item.quantity}</span>
                                              {matchedProd && <span className="text-stone-400"> • {matchedProd.category}</span>}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">
                                            {item.price * item.quantity} {getCurrency(item.currency || o.currency)}
                                          </span>
                                          {item.quantity > 1 && (
                                            <span className="block text-[10px] text-stone-400 font-mono">
                                              ({item.price} {getCurrency(item.currency || o.currency)} / {lang === 'ar' ? 'قطعة' : 'pc'})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-150">
                                  <div className="text-xs text-stone-500 space-y-1">
                                    <p className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                      <span><strong className="text-stone-700">{lang === 'ar' ? 'عنوان التوصيل:' : 'Address:'}</strong> {o.city} {o.address ? `(${o.address})` : ''}</span>
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span><strong className="text-stone-700">{lang === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</strong> {lang === 'ar' ? 'الدفع نقدًا عند الاستلام (COD)' : 'Cash on Delivery (COD)'}</span>
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setCurrentView('support')}
                                      className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#2563eb] font-bold transition-colors cursor-pointer"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      <span>{lang === 'ar' ? 'مساعدة في هذا الطلب' : 'Help with Order'}</span>
                                    </button>

                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-stone-400 block uppercase">{lang === 'ar' ? 'المجموع الكلي' : 'Total Amount'}</span>
                                      <span className="text-stone-900 text-base sm:text-lg font-mono font-bold">{o.total} {getCurrency(o.currency)}</span>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {profileActiveTab === 'profile' && (
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs animate-fadeIn">

                      <input
                        type="file"
                        ref={profileFileInputRef}
                        onChange={handleAvatarFileUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      <div className="space-y-4 pb-6 border-b border-stone-150">
                        <div>
                          <h3 className="font-serif font-bold text-stone-900 text-lg">
                            {lang === 'ar' ? 'الصورة الشخصية والرمز التعريفي' : 'Profile Picture & Avatar'}
                          </h3>
                          <p className="text-xs text-stone-500">
                            {lang === 'ar'
                              ? 'يمكنك رفع صورتك الخاصة، اختيار رمز جاهز، أو تركها فارغة ليظهر الحرفان الأولان من اسمك ونسبك بشكل أنيق.'
                              : 'Upload a custom photo, pick a preset, or leave it empty to show your initials badge.'}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="shrink-0">
                            <CustomerAvatar
                              avatar={editProfileAvatar}
                              name={editProfileName || loggedInCustomer.name}
                              phone={editProfilePhone || loggedInCustomer.phone}
                              size="xl"
                            />
                          </div>

                          <div className="space-y-3 text-center sm:text-left rtl:sm:text-right flex-1">
                            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                              <button
                                type="button"
                                onClick={() => profileFileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload Image'}</span>
                              </button>

                              {editProfileAvatar && (
                                <button
                                  type="button"
                                  onClick={() => applyAvatarChange('')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-700 font-bold text-xs cursor-pointer transition-all border border-stone-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'إزالة الصورة (استخدام الحروف)' : 'Remove & Use Initials'}</span>
                                </button>
                              )}
                            </div>

                            <p className="text-[11px] font-bold text-stone-500">
                              {lang === 'ar' ? 'أو اختر إحدى الصور الرمزية الجاهزة:' : 'Or choose a preset avatar:'}
                            </p>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-center sm:justify-start">
                              {AVATAR_PRESETS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => applyAvatarChange(preset)}
                                  className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                    editProfileAvatar === preset ? 'border-[#2563eb] scale-105 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                                  }`}
                                >
                                  <img src={preset} alt="Preset" className="w-10 h-10 object-cover" referrerPolicy="no-referrer" />
                                  {editProfileAvatar === preset && (
                                    <div className="absolute inset-0 bg-[#2563eb]/30 flex items-center justify-center text-white">
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-stone-700 text-xs block">
                            {lang === 'ar' ? 'الاسم الكامل (الاسم والنسب)' : 'Full Name'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editProfileName}
                            onChange={e => setEditProfileName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: يوسف العلمي' : (lang === 'fr' ? 'ex: Youssef Alami' : 'e.g. Youssef Alami')}
                            className="w-full border border-stone-200 bg-stone-50/70 rounded-xl p-3 focus:outline-none focus:border-[#2563eb] focus:bg-white font-semibold text-stone-900 text-xs sm:text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-stone-700 text-xs block">
                            {lang === 'ar' ? 'رقم الهاتف / الجوال' : 'Phone Number'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={editProfilePhone}
                            onChange={e => setEditProfilePhone(e.target.value)}
                            placeholder="6xxxxxxxx"
                            className="w-full border border-stone-200 bg-stone-50/70 rounded-xl p-3 focus:outline-none focus:border-[#2563eb] focus:bg-white font-mono font-semibold text-stone-900 text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-stone-700 text-xs block">
                            {lang === 'ar' ? 'كلمة السر الجديدة (اختياري)' : 'New Password (Optional)'}
                          </label>
                          <span className="text-[10px] text-stone-400">
                            {lang === 'ar' ? 'اتركها فارغة إذا كنت لا ترغب بتغييرها' : 'Leave empty to keep current'}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            value={editProfilePassword}
                            onChange={e => setEditProfilePassword(e.target.value)}
                            placeholder={lang === 'ar' ? 'أدخل كلمة سر جديدة إذا رغبت...' : 'Enter new password...'}
                            className="w-full border border-stone-200 bg-stone-50/70 rounded-xl p-3 ltr:pr-10 rtl:pl-10 focus:outline-none focus:border-[#2563eb] focus:bg-white font-semibold text-stone-900 text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                          >
                            {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {profileUpdateMsg && (
                        <div className={`p-3.5 rounded-xl text-xs font-bold text-center ${
                          profileUpdateMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {profileUpdateMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-xs cursor-pointer transition-all text-xs uppercase tracking-wider active:scale-[0.99]"
                      >
                        {isUpdatingProfile ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{lang === 'ar' ? 'حفظ وتحديث بيانات الحساب' : 'Save Changes'}</span>
                      </button>
                    </form>
                  )}

                  {profileActiveTab === 'favorites' && (
                    <div className="space-y-4 animate-fadeIn">
                      {favorites.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center space-y-4 shadow-xs">
                          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
                            <Heart className="w-8 h-8 fill-rose-500" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                              {lang === 'ar' ? 'قائمة المفضلة فارغة حالياً' : 'Your Wishlist is Empty'}
                            </h3>
                            <p className="text-xs text-stone-500 max-w-md mx-auto">
                              {lang === 'ar'
                                ? 'اضغط على زر القلب في أي منتج لإضافته إلى قائمتك المفضلة والرجوع إليه لاحقاً.'
                                : 'Click the heart icon on any product to save it to your wishlist.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCurrentView('all-products'); setSelectedCategory('All'); }}
                            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <span>{t('shopNow')}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {products.filter(p => favorites.includes(p.id)).map(p => (
                            <div
                              key={p.id}
                              className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                            >
                              <div
                                onClick={() => setSelectedProduct(p)}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate group-hover:text-[#2563eb] transition-colors">{getProdName(p)}</h4>
                                  <p className="text-[11px] text-stone-400 font-medium">{p.category}</p>
                                  <p className="font-mono font-bold text-[#2563eb] text-sm mt-1">{p.price} {getCurrency(p.currency)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-stone-150">
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(p)}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>{t('addToCart')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFavoriteToDelete(p)}
                                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-stone-200"
                                  title={lang === 'ar' ? 'حذف من المفضلة' : 'Remove'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileActiveTab === 'tickets' && (
                    <div className="space-y-4 animate-fadeIn">
                      {customerTickets.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center space-y-4 shadow-xs">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                            <MessageSquare className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                              {lang === 'ar' ? 'لا توجد أي تذاكر دعم فني' : 'No Support Tickets Yet'}
                            </h3>
                            <p className="text-xs text-stone-500 max-w-md mx-auto">
                              {lang === 'ar'
                                ? 'إذا واجهت أي استفسار حول شحنتك أو منتجاتنا، يمكنك فتح تذكرة دعم وسيجيبك فريقنا فوراً.'
                                : 'Need assistance? Open a support ticket and our dedicated team will respond promptly.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentView('support')}
                            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <span>{lang === 'ar' ? 'فتح تذكرة دعم جديدة' : 'Open Support Ticket'}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2">
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'ar' ? 'سجل المحادثات والتذاكر' : 'Support Inquiries'}</p>
                            <button
                              type="button"
                              onClick={() => setCurrentView('support')}
                              className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                            >
                              {lang === 'ar' ? '+ فتح تذكرة جديدة' : '+ New Ticket'}
                            </button>
                          </div>

                          {customerTickets.map(t => (
                            <div key={t.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-2.5 shadow-xs">
                              <div className="flex justify-between items-center font-bold">
                                <span className="font-mono text-stone-900 font-bold text-xs bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                                  #{t.id}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  t.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {t.status === 'resolved' ? (lang === 'ar' ? 'تم الحل' : 'Resolved') : (lang === 'ar' ? 'قيد المتابعة' : 'In Progress')}
                                </span>
                              </div>
                              <h4 className="font-bold text-stone-900 text-sm">{t.subject}</h4>
                              <p className="text-stone-600 text-xs leading-relaxed">{t.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {currentView === 'favorites' && (
            <div className="flex-1 py-10 px-4 sm:px-8 max-w-7xl mx-auto w-full animate-fadeIn" style={{ backgroundColor: siteBackgroundColor }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                    <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                    <span>{t('myFavorites')}</span>
                    <span className="bg-rose-100 text-rose-600 font-mono text-sm px-3 py-0.5 rounded-full font-bold">
                      {favorites.length}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500">
                    {lang === 'ar'
                      ? 'المنتجات التي قمت بحفظها للمراجعة والشراء لاحقاً'
                      : lang === 'fr'
                      ? 'Vos articles sauvegardés pour achat ultérieur'
                      : 'Your saved items for easy access and later purchase'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {favorites.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearAllFavoritesOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'مسح كل المفضلة' : 'Clear All'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { navigateTo(getHomeUrl()); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200 shadow-sm cursor-pointer w-fit transition-colors"
                  >
                    <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    <span>{t('backToHome')}</span>
                  </button>
                </div>
              </div>

              {favorites.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12 space-y-4">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-850">{t('noFavorites')}</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    {lang === 'ar'
                      ? 'تصفح منتجاتنا واضغط على رمز القلب لإضافة أي منتج إلى قائمة المفضلة الخاصة بك.'
                      : lang === 'fr'
                      ? 'Parcourez nos produits et cliquez sur le cœur pour les ajouter à vos favoris.'
                      : 'Explore our collection and click the heart icon to save products to your favorites.'}
                  </p>
                  <button
                    onClick={() => { setCurrentView('all-products'); setSelectedCategory('All'); }}
                    className="mt-4 inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md cursor-pointer transition-colors"
                  >
                    <span>{t('shopNow')}</span>
                    <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                  {products.filter(p => favorites.includes(p.id)).map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl sm:rounded-[2rem] border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all group relative flex flex-col justify-between p-2.5 sm:p-4"
                    >
                      <div>
                        <div
                          onClick={() => handleOpenProduct(product)}
                          className="relative aspect-square overflow-hidden bg-stone-50 rounded-xl sm:rounded-2xl border border-stone-100 cursor-pointer"
                        >
                          <img
                            src={product.image}
                            alt={getProdName(product)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavoriteToDelete(product);
                            }}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                            title={lang === 'ar' ? 'حذف من المفضلة' : 'Remove from favorites'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="pt-2.5 sm:pt-3 space-y-1 sm:space-y-1.5 px-0.5">
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#2563eb] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                            {getProdCat(product.category)}
                          </span>
                          <h4
                            onClick={() => handleOpenProduct(product)}
                            className="font-bold text-stone-900 text-xs sm:text-sm hover:text-[#2563eb] cursor-pointer line-clamp-1 transition-colors"
                          >
                            {getProdName(product)}
                          </h4>
                          <div className="flex items-baseline gap-1 sm:gap-2 pt-0.5">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-base">
                              {product.price} {getCurrency()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[9px] sm:text-xs text-stone-400 line-through font-medium">
                                {product.originalPrice} {getCurrency()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-stone-100 grid grid-cols-2 gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, 1);
                            showNotification(
                              lang === 'ar'
                                ? `تمت إضافة "${getProdName(product)}" إلى السلة بنجاح`
                                : `Added "${getProdName(product)}" to cart`,
                              'success'
                            );
                          }}
                          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[9.5px] sm:text-xs py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="truncate">{lang === 'ar' ? 'أضف' : 'Add'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenProduct(product)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[9.5px] sm:text-xs py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 truncate"
                        >
                          <span className="truncate">{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {favoriteToDelete && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl space-y-5 text-stone-900 text-center relative overflow-hidden"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <button
                    type="button"
                    onClick={() => setFavoriteToDelete(null)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto shadow-inner">
                    <Trash2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-serif font-black text-stone-900">
                      {lang === 'ar' ? 'حذف المنتج من المفضلة؟' : 'Remove from Favorites?'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                      {lang === 'ar'
                        ? 'هل أنت متأكد من رغبتك في إزالة هذا المنتج من قائمة المفضلة الخاصة بك؟'
                        : 'Are you sure you want to remove this item from your saved favorites list?'}
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-start">
                    <img
                      src={favoriteToDelete.image}
                      alt={getProdName(favoriteToDelete)}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[9.5px] font-bold text-[#2563eb] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                        {getProdCat(favoriteToDelete.category)}
                      </span>
                      <h4 className="font-bold text-xs text-stone-900 truncate">
                        {getProdName(favoriteToDelete)}
                      </h4>
                      <span className="font-mono font-extrabold text-xs text-stone-800 block">
                        {favoriteToDelete.price} {getCurrency()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setFavoriteToDelete(null)}
                      className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteFavorite}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'نعم، حذف' : 'Yes, Remove'}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isClearAllFavoritesOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl space-y-5 text-stone-900 text-center relative overflow-hidden"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <button
                    type="button"
                    onClick={() => setIsClearAllFavoritesOpen(false)}
                    className="absolute top-4 ltr:right-4 rtl:left-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto shadow-inner">
                    <Trash2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-serif font-black text-stone-900">
                      {lang === 'ar' ? 'مسح قائمة المفضلة بالكامل؟' : 'Clear All Favorites?'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                      {lang === 'ar'
                        ? `هل أنت متأكد من رغبتك في إزالة جميع المنتجات (${favorites.length}) من قائمة المفضلة؟`
                        : `Are you sure you want to remove all (${favorites.length}) items from your favorites list?`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsClearAllFavoritesOpen(false)}
                      className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={confirmClearAllFavorites}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'نعم، مسح الكل' : 'Yes, Clear All'}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="flex-1 bg-white pb-16 text-xs text-stone-600">

          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseProduct}
                className="flex items-center gap-2 text-stone-800 hover:text-[#2563eb] transition-colors font-sans text-xs font-bold uppercase tracking-wider cursor-pointer bg-stone-50 hover:bg-stone-100 px-4 py-2 rounded-full border border-stone-200 shadow-xs"
              >
                <ArrowLeft className={`${lang === 'ar' ? 'rotate-180' : ''} w-3.5 h-3.5 text-[#2563eb]`} />
                {t('returnToCollection')}
              </button>

              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                <a
                  href={getHomeUrl()}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      navigateTo(getHomeUrl());
                    }
                  }}
                  className="hover:text-[#2563eb] transition-colors"
                >
                  {t('homeTitle')}
                </a>
                <span>/</span>
                <a
                  href={getProductsUrl()}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      setSelectedCategory('All');
                      setFilterPopular(false);
                      navigateTo(getProductsUrl());
                    }
                  }}
                  className="hover:text-[#2563eb] transition-colors"
                >
                  {t('productsTitle')}
                </a>
                {selectedProduct.category && (
                  <>
                    <span>/</span>
                    <a
                      href={getProductsUrl(selectedProduct.category)}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          e.preventDefault();
                          setSelectedCategory(selectedProduct.category);
                          setFilterPopular(false);
                          navigateTo(getProductsUrl(selectedProduct.category));
                        }
                      }}
                      className="hover:text-[#2563eb] transition-colors"
                    >
                      {getProdCat(selectedProduct.category)}
                    </a>
                  </>
                )}
                <span>/</span>
                <span className="text-stone-800 font-bold truncate max-w-[180px] lg:max-w-xs">{getProdName(selectedProduct)}</span>
              </nav>
            </div>

            <span className="text-[10px] font-bold text-[#2563eb] bg-[#2563eb]/10 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {t('saudiFreeShipping')}
            </span>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-stone-100 p-3 space-y-4 rounded-[2rem] shadow-xs">
                  {(() => {
                    const allMediaList: string[] = [
                      selectedProduct.image,
                      ...(selectedProduct.additionalImages || [])
                    ].filter(Boolean);

                    const hasVideo = !!selectedProduct.videoUrl;
                    const videoFirst = selectedProduct.videoPosition === 'first' || selectedProduct.videoAsPrimary;

                    if (hasVideo) {
                      if (videoFirst) {
                        allMediaList.unshift('__VIDEO__');
                      } else {
                        allMediaList.push('__VIDEO__');
                      }
                    }

                    const defaultMedia = (hasVideo && videoFirst) ? '__VIDEO__' : (selectedProduct.image || allMediaList[0] || '');
                    const currentActiveMedia = activeLandingImage || defaultMedia;
                    const currentIndex = allMediaList.indexOf(currentActiveMedia);
                    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

                    const isRTL = lang === 'ar';

                    const handleGoPrevious = () => {
                      const prevIdx = (safeIndex - 1 + allMediaList.length) % allMediaList.length;
                      setActiveLandingImage(allMediaList[prevIdx]);
                      setIsPlayingProductVideo(false);
                    };

                    const handleGoNext = () => {
                      const nextIdx = (safeIndex + 1) % allMediaList.length;
                      setActiveLandingImage(allMediaList[nextIdx]);
                      setIsPlayingProductVideo(false);
                    };

                    const handleLeftArrowClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isRTL) {
                        handleGoNext();
                      } else {
                        handleGoPrevious();
                      }
                    };

                    const handleRightArrowClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isRTL) {
                        handleGoPrevious();
                      } else {
                        handleGoNext();
                      }
                    };

                    return (
                      <div
                        className="relative aspect-square overflow-hidden bg-stone-50 rounded-[1.5rem] border border-stone-100 group select-none touch-pan-y"
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          (e.currentTarget as any)._touchStartX = touch.clientX;
                          (e.currentTarget as any)._touchStartY = touch.clientY;
                        }}
                        onTouchEnd={(e) => {
                          const startX = (e.currentTarget as any)._touchStartX;
                          const startY = (e.currentTarget as any)._touchStartY;
                          if (startX === undefined || startY === undefined) return;

                          const touch = e.changedTouches[0];
                          const deltaX = touch.clientX - startX;
                          const deltaY = touch.clientY - startY;

                          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                            if (deltaX < 0) {
                              if (isRTL) {
                                handleGoPrevious();
                              } else {
                                handleGoNext();
                              }
                            } else {
                              if (isRTL) {
                                handleGoNext();
                              } else {
                                handleGoPrevious();
                              }
                            }
                          }
                        }}
                      >
                        {currentActiveMedia === '__VIDEO__' && selectedProduct.videoUrl ? (
                          isPlayingProductVideo ? (
                            <div className="relative w-full h-full bg-black rounded-[1.5rem] overflow-hidden">
                              <iframe
                                key="video-player"
                                src={getYouTubeEmbedUrl(selectedProduct.videoUrl, true)}
                                title={getProdName(selectedProduct)}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full bg-black rounded-[1.5rem]"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsPlayingProductVideo(false);
                                }}
                                className="absolute top-3.5 right-3.5 bg-black/80 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-lg cursor-pointer z-30"
                                title={lang === 'ar' ? 'إغلاق مشغل الفيديو والعودة للغلاف' : 'Close video & return to preview'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'إغلاق الفيديو' : (lang === 'fr' ? 'Fermer la vidéo' : 'Close Video')}</span>
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => setIsPlayingProductVideo(true)}
                              className="relative w-full h-full bg-black rounded-[1.5rem] overflow-hidden cursor-pointer select-none"
                              title={lang === 'ar' ? 'انقر لتشغيل الفيديو' : 'Click to play video'}
                            >
                              <img
                                key="video-preview-thumb"
                                src={selectedProduct.videoThumbnail || (extractYouTubeId(selectedProduct.videoUrl) ? getYouTubeThumbnail(selectedProduct.videoUrl) : '') || selectedProduct.image}
                                alt={getProdName(selectedProduct)}
                                className="w-full h-full object-cover opacity-90 block"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = selectedProduct.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 transition-colors" />

                              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/65 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300">
                                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white translate-x-0.5" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-white bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg tracking-wide transition-all">
                                  {lang === 'ar' ? 'تشغيل الفيديو' : (lang === 'fr' ? 'Lire la vidéo' : 'Play Video')}
                                </span>
                              </div>
                            </div>
                          )
                        ) : (
                          <img
                            key={currentActiveMedia || selectedProduct.image}
                            src={currentActiveMedia || selectedProduct.image}
                            alt={getProdName(selectedProduct)}
                            style={(!activeLandingImage || activeLandingImage === selectedProduct.image) ? getProductImageStyle(selectedProduct) : undefined}
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                            }}
                          />
                        )}

                        {allMediaList.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={handleLeftArrowClick}
                              aria-label={isRTL ? "الصورة التالية" : "Previous image"}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-stone-800 hover:text-[#2563eb] shadow-xl flex items-center justify-center transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:transform sm:-translate-x-3 sm:group-hover:translate-x-0 hover:scale-110 active:scale-90 cursor-pointer z-20 border border-stone-200"
                              title={isRTL ? 'الصورة التالية' : (lang === 'fr' ? 'Image précédente' : 'Previous image')}
                            >
                              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                            </button>

                            <button
                              type="button"
                              onClick={handleRightArrowClick}
                              aria-label={isRTL ? "الصورة السابقة" : "Next image"}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-stone-800 hover:text-[#2563eb] shadow-xl flex items-center justify-center transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:transform sm:translate-x-3 sm:group-hover:translate-x-0 hover:scale-110 active:scale-90 cursor-pointer z-20 border border-stone-200"
                              title={isRTL ? 'الصورة السابقة' : (lang === 'fr' ? 'Image suivante' : 'Next image')}
                            >
                              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                            </button>

                            <div className={`absolute bottom-3 ${isRTL ? 'left-3' : 'right-3'} bg-black/80 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md border border-white/10`}>
                              {safeIndex + 1} / {allMediaList.length}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {(() => {
                      const hasVideo = !!selectedProduct.videoUrl;
                      const videoFirst = selectedProduct.videoPosition === 'first' || selectedProduct.videoAsPrimary;
                      const thumbUrl = selectedProduct.videoThumbnail || (hasVideo ? getYouTubeThumbnail(selectedProduct.videoUrl!) : '');
                      const activeMedia = activeLandingImage || ((hasVideo && videoFirst) ? '__VIDEO__' : selectedProduct.image);

                      const photoItems = [selectedProduct.image, ...(selectedProduct.additionalImages || [])]
                        .filter(Boolean)
                        .map((imgUrl, i) => {
                          const isActive = activeMedia === imgUrl;
                          return (
                            <button
                              key={`photo-${i}`}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveLandingImage(imgUrl);
                                setIsPlayingProductVideo(false);
                              }}
                              className={`relative w-16 sm:w-20 h-16 sm:h-20 rounded-2xl overflow-hidden border-2 transition-colors shrink-0 cursor-pointer p-0.5 bg-white ${
                                isActive
                                  ? "border-[#2563eb] ring-2 ring-[#2563eb]/30 shadow-xs"
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                              aria-label={`Select product image ${i + 1}`}
                            >
                              <img
                                src={imgUrl}
                                className="w-full h-full object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                                alt={`Product thumbnail ${i + 1}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';
                                }}
                              />
                            </button>
                          );
                        });

                      const videoItem = hasVideo ? (
                        <button
                          key="video-thumb"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveLandingImage('__VIDEO__');
                            setIsPlayingProductVideo(false);
                          }}
                          className={`relative w-16 sm:w-20 h-16 sm:h-20 rounded-2xl overflow-hidden border-2 transition-colors shrink-0 cursor-pointer bg-black p-0.5 ${
                            activeMedia === '__VIDEO__'
                              ? "border-red-600 ring-2 ring-red-500/30 shadow-xs"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                          title={lang === 'ar' ? 'فيديو توضيحي للمنتج' : 'Product Video'}
                        >
                          <img src={thumbUrl} className="w-full h-full object-cover rounded-xl opacity-90" referrerPolicy="no-referrer" alt="Video cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </div>
                          </div>
                        </button>
                      ) : null;

                      if (videoFirst) {
                        return (
                          <>
                            {videoItem}
                            {photoItems}
                          </>
                        );
                      }
                      return (
                        <>
                          {photoItems}
                          {videoItem}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-8 ">

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#2563eb] block">
                      {getProdCat(selectedProduct.category)}
                    </span>
                    {selectedProduct.sku && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold bg-stone-100 hover:bg-stone-200/80 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors shadow-2xs">
                        <span className="text-stone-400 font-sans font-semibold text-[10px]">{lang === 'ar' ? 'رمز المنتج (SKU):' : 'SKU:'}</span>
                        <span className="tracking-wider text-stone-950 font-black">{selectedProduct.sku}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-wide leading-tight uppercase">
                      {getProdName(selectedProduct)}
                    </h1>
                    <button
                      onClick={() => handleToggleFavorite(selectedProduct.id)}
                      className="w-10 h-10 bg-white hover:bg-stone-50 text-stone-600 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm border border-stone-150 shrink-0 cursor-pointer active:scale-95 transition-all"
                      title={favorites.includes(selectedProduct.id) ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from Favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Favorites')}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          favorites.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-4 pt-2 border-t border-stone-100">
                    <span className="text-xl sm:text-2xl font-black text-stone-900">
                      {selectedProduct.price} {getCurrency()}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-sm text-stone-400 line-through">
                        {selectedProduct.originalPrice} {getCurrency()}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const availableCoupon = (coupons || []).find(
                      c => c.status === 'active' &&
                           c.showOnProductPage !== false &&
                           (!c.storeId || c.storeId === 'all' || c.storeId === activeCountrySlug) &&
                           (!c.productId || c.productId === 'all' || c.productId === selectedProduct.id)
                    );
                    if (!availableCoupon) return null;
                    const isApplied = appliedDirectCoupon?.code === availableCoupon.code;
                    const isPercent = (availableCoupon.discountType || availableCoupon.type) === 'percentage';
                    const discVal = availableCoupon.discountValue || availableCoupon.value;
                    return (
                      <div
                        style={{
                          backgroundColor: `${primaryBrandColor}08`,
                          borderColor: `${primaryBrandColor}2e`,
                        }}
                        className="relative overflow-hidden rounded-2xl border flex flex-col sm:flex-row items-stretch justify-between gap-3 text-xs shadow-xs transition-all"
                      >
                        <div
                          style={{ backgroundColor: primaryBrandColor }}
                          className="text-white px-4 py-3 sm:py-3.5 flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 sm:min-w-[95px] relative"
                        >
                          <div className="flex items-center gap-1.5 font-mono font-black text-sm sm:text-base tracking-tight">
                            <Ticket className="w-4 h-4 text-white/90 shrink-0" />
                            <span>{isPercent ? `-${discVal}%` : `-${discVal}`}</span>
                          </div>
                          <span className="text-[10px] font-sans font-bold text-white/90 tracking-normal uppercase bg-black/20 px-2 py-0.5 rounded-md">
                            {isPercent ? (lang === 'ar' ? 'تخفيض' : 'OFF') : getCurrency()}
                          </span>
                        </div>

                        <div className="p-3 sm:py-3.5 sm:px-2 flex-grow min-w-0 space-y-1.5 flex flex-col justify-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-stone-900 text-xs">
                              {lang === 'ar' ? 'كوبون خصم متاح لهذا المنتج:' : 'Exclusive Coupon Available:'}
                            </span>
                            <div
                              style={{
                                color: primaryBrandColor,
                                borderColor: `${primaryBrandColor}44`,
                                backgroundColor: 'white'
                              }}
                              className="font-mono font-black border border-dashed px-2.5 py-0.5 rounded-lg text-xs tracking-wider shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <Tag className="w-3 h-3 opacity-70" />
                              <span>{availableCoupon.code}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-1 font-medium">
                            {lang === 'ar'
                              ? `استخدم الكود عند الطلب لخصم ${isPercent ? `${discVal}%` : `${discVal} ${getCurrency()}`} فوراً`
                              : `Use code during checkout to save ${isPercent ? `${discVal}%` : `${discVal} ${getCurrency()}`} instantly`}
                          </p>
                        </div>

                        <div className="p-3 sm:p-3 sm:ps-0 flex items-center justify-end shrink-0">
                          {!isApplied ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDirectCouponInput(availableCoupon.code);
                                handleApplyDirectCoupon(availableCoupon.code);
                                document.getElementById('express-checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              style={{ backgroundColor: primaryBrandColor }}
                              className="w-full sm:w-auto hover:opacity-90 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{lang === 'ar' ? 'تطبيق الكود' : 'Apply Code'}</span>
                            </button>
                          ) : (
                            <span className="w-full sm:w-auto text-emerald-800 bg-emerald-100 border border-emerald-300 text-xs font-black px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{lang === 'ar' ? 'تم التفعيل' : 'Applied'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed pt-2">
                    {getProdDesc(selectedProduct)}
                  </p>

                  <div className="pt-3 pb-1">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1.5 text-stone-700">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'الكمية المتبقية في المخزن:' : 'Remaining stock in inventory:'}</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono shadow-2xs ${
                        selectedProduct.stock <= 5
                          ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                          : selectedProduct.stock <= 15
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {lang === 'ar' ? `بقي فقط ${selectedProduct.stock} قطع` : `Only ${selectedProduct.stock} left in stock`}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedProduct.stock <= 5 ? 'bg-rose-500' : selectedProduct.stock <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(12, (selectedProduct.stock / 50) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div id="express-checkout-form" className="bg-stone-50 border border-stone-200 p-6 sm:p-8 space-y-6 relative rounded-[2.5rem] shadow-xs text-stone-900">
                  <div className="absolute top-0 right-0 bg-[#1c1917] text-white text-[9px] font-sans font-bold uppercase py-1 px-4 tracking-wider rounded-tr-[2.5rem] rounded-bl-[1.5rem]">
                    {t('codSaudi')}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#2563eb]" /> {t('expressCheckoutTitle')}
                    </h4>
                    <p className="text-[11px] text-stone-500 leading-relaxed mt-1 font-medium">
                      {t('expressCheckoutDesc')}
                    </p>
                  </div>

                  <form onSubmit={(e) => handlePlaceDirectOrder(e, selectedProduct)} className="space-y-4 text-xs text-stone-700">

                    {(() => {
                      const hasPricingTiers = Boolean(
                        selectedProduct.pricingTiers &&
                        Array.isArray(selectedProduct.pricingTiers) &&
                        selectedProduct.pricingTiers.length > 0 &&
                        selectedProduct.pricingTiers.some(t => t && Number(t.quantity) > 0 && Number(t.price) > 0)
                      );

                      if (!hasPricingTiers) return null;

                      return (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            <label className="text-[11px] font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Tag style={{ color: primaryBrandColor }} className="w-3.5 h-3.5 shrink-0" />
                              <span>{lang === 'ar' ? 'اختر باقة العرض والكمية المناسبة' : 'Select Quantity Bundle Offer'}</span>
                            </label>
                            <span style={{ color: primaryBrandColor }} className="text-[10px] font-bold">
                              {lang === 'ar' ? 'توفير إضافي عند طلب أكثر من قطعة' : 'Save more with bundles'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {(selectedProduct.pricingTiers || []).map((tier, idx) => {
                              const isSelected = directQty === tier.quantity;
                              const singleItemRegularTotal = selectedProduct.price * tier.quantity;
                              const savings = singleItemRegularTotal > tier.price ? singleItemRegularTotal - tier.price : 0;
                              const savingsPercent = singleItemRegularTotal > tier.price
                                ? Math.round(((singleItemRegularTotal - tier.price) / singleItemRegularTotal) * 100)
                                : 0;

                              const tierBadge = lang === 'ar'
                                ? (!tier.badge || tier.badge.toLowerCase().includes('popular') || tier.badge === 'الأكثر طلباً' || tier.badge === 'الأكثر طلباً للزبناء'
                                    ? 'الأكثر طلباً للزبناء'
                                    : tier.badge)
                                : (tier.badge || 'Most Popular Choice');

                              return (
                                <div
                                  key={tier.id || idx}
                                  onClick={() => setDirectQty(tier.quantity)}
                                  style={{
                                    borderColor: isSelected ? primaryBrandColor : undefined,
                                    backgroundColor: isSelected ? `${primaryBrandColor}0d` : undefined
                                  }}
                                  className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'shadow-sm'
                                      : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      style={{
                                        borderColor: isSelected ? primaryBrandColor : undefined,
                                        backgroundColor: isSelected ? primaryBrandColor : 'white',
                                      }}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        isSelected ? 'text-white shadow-xs' : 'border-stone-300'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>

                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-xs sm:text-sm text-stone-950">
                                          {lang === 'ar'
                                            ? (tier.quantity === 1 ? '1 قطعة واحدة' : tier.quantity === 2 ? '2 قطعتين' : `${tier.quantity} قطع`)
                                            : (tier.quantity === 1 ? '1 Piece' : `${tier.quantity} Pieces`)}
                                        </span>

                                        {(() => {
                                          const rawLabel = lang === 'ar' ? (tier.labelAr || tier.label) : (tier.label || tier.labelAr);
                                          if (!rawLabel) return null;
                                          const cleanLabel = rawLabel.trim();
                                          if (
                                            cleanLabel === `${tier.quantity} قطع` ||
                                            cleanLabel === `${tier.quantity} ${tier.quantity} قطع` ||
                                            cleanLabel === `${tier.quantity} Pieces` ||
                                            cleanLabel === `${tier.quantity} ${tier.quantity} Pieces` ||
                                            cleanLabel === 'قطعة واحدة' ||
                                            cleanLabel === '1 قطعة واحدة' ||
                                            cleanLabel === 'قطعتين' ||
                                            cleanLabel === '2 قطعتين' ||
                                            cleanLabel === '1 Piece' ||
                                            cleanLabel === '2 Pieces'
                                          ) {
                                            return null;
                                          }
                                          return (
                                            <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                                              {cleanLabel}
                                            </span>
                                          );
                                        })()}

                                        {tier.isPopular && (
                                          <span className="text-[10px] font-black text-amber-950 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400 flex items-center gap-1 shadow-2xs">
                                            <Star className="w-3 h-3 fill-amber-950 text-amber-950" />
                                            <span>{tierBadge}</span>
                                          </span>
                                        )}

                                        {tier.badge && !tier.isPopular && (
                                          <span
                                            style={{
                                              color: primaryBrandColor,
                                              backgroundColor: `${primaryBrandColor}1a`,
                                              borderColor: `${primaryBrandColor}33`,
                                            }}
                                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                                          >
                                            <Tag className="w-2.5 h-2.5" />
                                            <span>{tier.badge}</span>
                                          </span>
                                        )}
                                      </div>

                                      {savings > 0 && (
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1.5">
                                            {lang === 'ar' ? (
                                              <>
                                                <span>وفر {savings} {getCurrency(selectedProduct.currency)}</span>
                                                <span className="opacity-40">•</span>
                                                <span dir="rtl">خصم {savingsPercent}%</span>
                                              </>
                                            ) : (
                                              `Save ${savings} ${getCurrency(selectedProduct.currency)} (${savingsPercent}% OFF)`
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-left rtl:text-left ltr:text-right shrink-0">
                                    <span style={{ color: primaryBrandColor }} className="font-mono font-black text-base sm:text-lg block">
                                      {tier.price} <span className="font-sans text-xs font-bold">{getCurrency(selectedProduct.currency)}</span>
                                    </span>
                                    {singleItemRegularTotal > tier.price && (
                                      <span className="text-[11px] text-stone-400 line-through font-mono block">
                                        {singleItemRegularTotal} <span className="font-sans text-[10px]">{getCurrency(selectedProduct.currency)}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Single Product Quantity Selector (Photo 2) - ONLY visible when NO pricing tiers exist */}
                    {(!selectedProduct.pricingTiers ||
                      !Array.isArray(selectedProduct.pricingTiers) ||
                      selectedProduct.pricingTiers.length === 0 ||
                      !selectedProduct.pricingTiers.some(t => t && Number(t.quantity) > 0 && Number(t.price) > 0)) && (
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              className="w-12 h-12 object-cover rounded-xl border border-stone-150 shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-stone-900 text-xs truncate">
                                {getProdName(selectedProduct)}
                              </h5>
                              <p className="text-[11px] font-black text-[#2563eb]">
                                {(selectedProduct.price * directQty)} {getCurrency(selectedProduct.currency)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDirectQty(prev => Math.max(1, prev - 1))}
                              className="w-7 h-7 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-900 text-sm border border-stone-200 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-black text-stone-950 w-5 text-center text-xs">{directQty}</span>
                            <button
                              type="button"
                              onClick={() => setDirectQty(prev => Math.min(selectedProduct.stock, prev + 1))}
                              className="w-7 h-7 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-900 text-sm border border-stone-200 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddToCart(selectedProduct, directQty);
                          showNotification(
                            lang === 'ar'
                              ? `تمت إضافة (${directQty}) من "${getProdName(selectedProduct)}" إلى السلة`
                              : `Added (${directQty}) "${getProdName(selectedProduct)}" to cart`,
                            'success'
                          );
                        }}
                        className="w-full bg-blue-50 hover:bg-blue-100 text-[#2563eb] border border-blue-200 font-bold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-2xs"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{lang === 'ar' ? `إضافة إلى السلة (${directQty}) ومواصلة التسوق` : `Add (${directQty}) to Cart & Continue Shopping`}</span>
                      </button>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-stone-200"></div>
                      <span className="flex-shrink mx-3 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                        {lang === 'ar' ? 'أو اطلب هذا المنتج مباشرة بالدفع عند الاستلام' : 'Or Order Directly with Cash on Delivery'}
                      </span>
                      <div className="flex-grow border-t border-stone-200"></div>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block px-1">
                        {lang === 'ar' ? 'معلومات التوصيل والاستلام' : 'Delivery & Recipient Information'}
                      </span>
                    </div>

                    <div className="space-y-1 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs focus-within:border-[#2563eb] transition-colors">
                      <label className="font-bold text-stone-400 text-[10px] px-1 block uppercase tracking-widest">{t('name')} *</label>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'مثال: أحمد الحربي' : 'e.g. Ahmed Al-Harbi'}
                        value={checkoutForm.name}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full border-0 bg-transparent px-1 py-1.5 text-xs focus:outline-none text-stone-900 font-semibold ${formErrors.name ? 'placeholder-rose-400' : 'placeholder-stone-400'}`}
                      />
                      {formErrors.name && <p className="text-rose-600 text-[10px] font-bold px-1">{formErrors.name}</p>}
                    </div>

                     <PhoneInput
                       label={t('phone')}
                       required
                       selectedCountryCode={selectedCountryCode}
                       onSelectCountry={setSelectedCountryCode}
                       value={checkoutForm.phone}
                       onChange={val => setCheckoutForm(prev => ({ ...prev, phone: val }))}
                       error={formErrors.phone}
                       lang={lang}
                     />

                     <CitySelector
                        value={checkoutForm.city}
                        onChange={val => setCheckoutForm(prev => ({ ...prev, city: val }))}
                        label={t('city')}
                        required
                        error={formErrors.city}
                        lang={lang}
                        theme="light"
                        options={storeCities.length > 0 ? storeCities : GLOBAL_CITIES}
                      />

                    <div className="space-y-1 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs focus-within:border-[#2563eb] transition-colors">
                      <label className="font-bold text-stone-400 text-[10px] px-1 block uppercase tracking-widest">{t('address')} *</label>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'مثال: حي الياسمين، شارع الملقا، عمارة 15' : 'e.g. Alyasmin, Al Malqa St, Bldg 15'}
                        value={checkoutForm.address}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                        className={`w-full border-0 bg-transparent px-1 py-1.5 text-xs focus:outline-none text-stone-900 font-semibold ${formErrors.address ? 'placeholder-rose-400' : 'placeholder-stone-400'}`}
                      />
                      {formErrors.address && <p className="text-rose-600 text-[10px] font-bold px-1">{formErrors.address}</p>}
                    </div>

                    {Boolean(selectedProduct?.enableNotesField) && (
                      <div className="space-y-1 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs focus-within:border-[#2563eb] transition-colors">
                        <label className="font-bold text-stone-400 text-[10px] px-1 block uppercase tracking-widest">
                          {selectedProduct?.notesFieldLabel || t('notes')}
                        </label>
                        <input
                          type="text"
                          placeholder={selectedProduct?.notesFieldPlaceholder || (lang === 'ar' ? 'مقاس XL / يرجى الاتصال قبل التوصيل' : 'e.g. Size XL please / Call before delivering...')}
                          value={checkoutForm.notes}
                          onChange={e => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full border-0 bg-transparent px-1 py-1.5 text-xs focus:outline-none text-stone-900 font-semibold placeholder-stone-400"
                        />
                      </div>
                    )}

                    {selectedProduct.showCouponField !== false && (
                      <div className="bg-white p-4 rounded-2xl border border-stone-250/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-stone-900 text-xs flex items-center gap-2">
                            <Ticket style={{ color: primaryBrandColor }} className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'كود الخصم (Coupon Code)' : 'Have a Promo Coupon?'}</span>
                          </label>
                        {appliedDirectCoupon && (
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            {appliedDirectCoupon.code}
                          </span>
                        )}
                      </div>

                      {!appliedDirectCoupon ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                              <input
                                type="text"
                                value={directCouponInput}
                                onChange={e => {
                                  setDirectCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                                  setDirectCouponError('');
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleApplyDirectCoupon();
                                  }
                                }}
                                placeholder={lang === 'ar' ? 'أدخل كود الخصم (مثال: MAV10)' : 'Enter coupon code (e.g. MAV10)'}
                                className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-950 placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:bg-white transition-all shadow-2xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyDirectCoupon()}
                              disabled={isValidatingDirectCoupon || !directCouponInput.trim()}
                              style={{ backgroundColor: primaryBrandColor }}
                              className="hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 shadow-xs"
                            >
                              {isValidatingDirectCoupon ? (
                                <SleekSpinner size="xs" variant="white" />
                              ) : (
                                <span>{lang === 'ar' ? 'تطبيق' : 'Apply'}</span>
                              )}
                            </button>
                          </div>

                          {availableProductCoupons.length > 0 && (
                            <div className="pt-0.5 space-y-2">
                              <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                                <BadgePercent style={{ color: primaryBrandColor }} className="w-3.5 h-3.5" />
                                {lang === 'ar' ? 'كوبونات متوفرة (اضغط للتطبيق المباشر):' : 'Available coupons (click to apply):'}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {availableProductCoupons.map((c) => {
                                  const isPercent = (c.discountType || c.type) === 'percentage';
                                  const discVal = c.discountValue || c.value;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        setDirectCouponInput(c.code);
                                        handleApplyDirectCoupon(c.code);
                                      }}
                                      style={{
                                        backgroundColor: `${primaryBrandColor}0d`,
                                        borderColor: `${primaryBrandColor}33`,
                                      }}
                                      className="inline-flex items-center gap-2 border border-dashed text-stone-900 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 group"
                                      title={lang === 'ar' ? `تطبيق كود ${c.code}` : `Apply ${c.code}`}
                                    >
                                      <Ticket style={{ color: primaryBrandColor }} className="w-3.5 h-3.5 shrink-0 group-hover:rotate-12 transition-transform" />
                                      <span className="tracking-wide">{c.code}</span>
                                      <span
                                        style={{ backgroundColor: primaryBrandColor }}
                                        className="text-[10px] font-sans font-black text-white px-1.5 py-0.5 rounded-md"
                                      >
                                        {isPercent ? `-${discVal}%` : `-${discVal} ${getCurrency()}`}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs">
                                  {lang === 'ar' ? 'تم تفعيل الكوبون:' : 'Coupon Applied:'}
                                </span>
                                <span className="font-mono font-black text-emerald-900 bg-emerald-200/70 px-1.5 py-0.2 rounded text-[11px]">
                                  {appliedDirectCoupon.code}
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-800 font-bold block">
                                {lang === 'ar'
                                  ? `تم خصم ${directDiscountAmount} ${getCurrency()} من إجمالي الطلب`
                                  : `Saved ${directDiscountAmount} ${getCurrency()} on total order`}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveDirectCoupon}
                            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                            title={lang === 'ar' ? 'إلغاء الكود' : 'Remove coupon'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {directCouponError && (
                        <p className="text-rose-600 text-[11px] font-bold px-1 flex items-center gap-1.5 pt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{directCouponError}</span>
                        </p>
                      )}
                    </div>
                  )}

                    <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2 font-bold text-stone-700 text-xs shadow-xs">
                      {(() => {
                        const directSubtotal = getProductSubtotal(selectedProduct, directQty);
                        const regularSubtotal = selectedProduct.price * directQty;
                        const hasTierDiscount = selectedProduct.pricingTiers && selectedProduct.pricingTiers.length > 0 && regularSubtotal > directSubtotal;

                        return (
                          <div className="flex justify-between items-center">
                            <span className="text-stone-500 font-medium">
                              {getProdName(selectedProduct)} ({directQty} {lang === 'ar' ? 'قطع' : 'items'}):
                            </span>
                            <div className="text-right">
                              {hasTierDiscount && (
                                <span className="text-[11px] text-stone-400 line-through font-mono mr-2">
                                  {regularSubtotal} {getCurrency()}
                                </span>
                              )}
                              <span className="text-stone-800 font-mono font-bold">{directSubtotal} {getCurrency()}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {directDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? `كود الخصم (${appliedDirectCoupon?.code || ''}):` : `Promo Discount (${appliedDirectCoupon?.code || ''}):`}</span>
                          </span>
                          <span className="font-mono font-bold">-{directDiscountAmount} {getCurrency()}</span>
                        </div>
                      )}

                      {(() => {
                        const directSubtotal = getProductSubtotal(selectedProduct, directQty);
                        const directShipping = directSubtotal >= 100 ? 0 : storeConfig.shippingFee;
                        const directTotal = Math.max(0, directSubtotal - directDiscountAmount) + directShipping;

                        return (
                          <>
                            <div className="flex justify-between pt-1 border-t border-stone-100">
                              <span className="text-stone-400 font-medium">{t('shipping')}:</span>
                              <span>
                                {directShipping === 0 ? (
                                  <span style={{ color: primaryBrandColor }} className="font-bold">{t('free')}</span>
                                ) : (
                                  <span className="font-mono">{storeConfig.shippingFee} {getCurrency()}</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-stone-950 border-t border-stone-150 pt-2.5 text-xs sm:text-sm font-black">
                              <span className="uppercase tracking-widest">{t('total')}:</span>
                              <div className="text-right">
                                {directDiscountAmount > 0 && (
                                  <span className="text-xs text-stone-400 line-through font-mono block">
                                    {directSubtotal + directShipping} {getCurrency()}
                                  </span>
                                )}
                                <span style={{ color: primaryBrandColor }} className="font-black text-xl font-mono">{directTotal} {getCurrency()}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <button
                      type="submit"
                      style={{ backgroundColor: primaryBrandColor }}
                      className="w-full text-white text-xs sm:text-sm font-bold py-4 rounded-full hover:opacity-90 transition-all shadow-md uppercase tracking-widest flex flex-col items-center justify-center gap-0.5 cursor-pointer font-sans active:scale-98"
                    >
                      <span className="flex items-center gap-1.5 text-sm sm:text-base font-black">
                        <CheckCircle2 className="w-5 h-5" />
                        {t('placeOrder')} {directQty > 1 ? `(${directQty} ${lang === 'ar' ? 'قطع' : 'items'})` : ''}
                      </span>
                      <span className="text-[10px] text-white/80 font-medium tracking-normal normal-case">{t('openPackageBeforePay')}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {landingData && availableLandingTabs.length > 0 && (
              <div className="bg-white rounded-lg border border-zinc-200 p-6 sm:p-8 space-y-6">

                {availableLandingTabs.length > 1 && (
                  <div className="flex border-b border-zinc-200 overflow-x-auto gap-4 pb-0.5 text-xs sm:text-sm font-black">
                    {availableLandingTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveLandingTab(tab.id)}
                        className={`pb-3 border-b-2 transition-colors shrink-0 px-2 cursor-pointer uppercase tracking-widest ${activeLandingTab === tab.id ? 'border-black text-zinc-950' : 'border-transparent text-zinc-400 hover:text-zinc-800'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {activeLandingTab === 'description' && hasDescriptionContent && (
                  <div className="space-y-6 text-xs sm:text-sm text-zinc-600 leading-relaxed ">
                    {landingData.tagline && landingData.tagline.trim().length > 0 && (
                      <p className="italic text-zinc-800 text-sm sm:text-base border-l-4 rtl:border-l-0 rtl:border-r-4 border-black pl-4 rtl:pl-0 rtl:pr-4 font-semibold py-1">
                        "{landingData.tagline}"
                      </p>
                    )}
                    {getProdDesc(selectedProduct) && getProdDesc(selectedProduct).trim().length > 0 && (
                      <div className="text-zinc-700 font-medium whitespace-pre-line leading-relaxed text-sm">
                        {getProdDesc(selectedProduct)}
                      </div>
                    )}

                    {landingData.features && landingData.features.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        {landingData.features.map((feat, i) => (
                          <div
                            key={i}
                            className="bg-stone-50/70 hover:bg-stone-50 p-5 rounded-2xl border border-stone-200/90 hover:border-blue-300 space-y-3 transition-all shadow-2xs hover:shadow-xs group"
                          >
                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-stone-200/80 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                              {renderFeatureIcon(feat.icon)}
                            </div>
                            <h5 className="font-extrabold text-stone-900 uppercase tracking-wider text-xs sm:text-sm">
                              {feat.title}
                            </h5>
                            {feat.desc && (
                              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                                {feat.desc}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeLandingTab === 'instructions' && hasInstructionsContent && (
                  <div className="space-y-4 text-xs sm:text-sm text-zinc-600 leading-relaxed ">
                    <h4 className="font-extrabold text-zinc-950 text-base">{t('howToGetBestResults')}</h4>
                    <div className="space-y-3 pt-2">
                      {landingData.howToUse.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                          <span className="w-6 h-6 rounded-full bg-black text-white font-extrabold flex items-center justify-center shrink-0 text-xs font-mono">{idx + 1}</span>
                          <p className="text-zinc-800 font-semibold mt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeLandingTab === 'faq' && hasFaqContent && (
                  <div className="space-y-4 text-xs sm:text-sm text-zinc-600 ">
                    <h4 className="font-extrabold text-zinc-950 text-base mb-4">{t('faq')}</h4>
                    <div className="divide-y divide-zinc-200">
                      {landingData.faqs.map((faqItem, idx) => (
                        <div key={idx} className="py-4 space-y-1">
                          <h5 className="font-black text-zinc-950">{faqItem.q}</h5>
                          <p className="text-zinc-500 leading-relaxed pt-1 font-medium">{faqItem.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeLandingTab === 'reviews' && (() => {
                const prodReviews = landingData.reviews || [];
                const revCount = prodReviews.length;
                const avgRating = revCount > 0
                  ? (prodReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / revCount).toFixed(1)
                  : '5.0';
                const fiveStarCount = prodReviews.filter((r: any) => (r.rating || 5) === 5).length;
                const fourStarCount = prodReviews.filter((r: any) => r.rating === 4).length;
                const threeStarCount = prodReviews.filter((r: any) => r.rating === 3).length;
                const fiveStarPct = revCount > 0 ? Math.round((fiveStarCount / revCount) * 100) : 100;
                const fourStarPct = revCount > 0 ? Math.round((fourStarCount / revCount) * 100) : 0;
                const threeStarPct = revCount > 0 ? Math.round((threeStarCount / revCount) * 100) : 0;

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                      <div className="text-center space-y-1 sm:border-r rtl:sm:border-r-0 rtl:sm:border-l sm:border-zinc-200 sm:pr-8 rtl:sm:pr-0 rtl:sm:pl-8">
                        <span className="text-4xl font-mono font-black text-zinc-950">{avgRating}</span>
                        <div className="flex items-center justify-center gap-0.5 text-amber-500 my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
                          ))}
                        </div>
                        <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          {revCount} {lang === 'ar' ? (revCount === 1 ? 'تقييم موثق' : 'تقييمات موثقة') : 'verified reviews'}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 text-xs w-full">
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-zinc-600 font-bold">{t('fiveStars')}</span>
                          <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="bg-zinc-900 h-2 transition-all duration-500" style={{ width: `${fiveStarPct}%` }}></div>
                          </div>
                          <span className="w-10 text-right rtl:text-left text-zinc-500 font-mono font-bold">{fiveStarPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-zinc-600 font-bold">{t('fourStars')}</span>
                          <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="bg-zinc-900 h-2 transition-all duration-500" style={{ width: `${fourStarPct}%` }}></div>
                          </div>
                          <span className="w-10 text-right rtl:text-left text-zinc-500 font-mono font-bold">{fourStarPct}%</span>
                        </div>
                        {threeStarPct > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-zinc-600 font-bold">3 نجوم</span>
                            <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                              <div className="bg-zinc-900 h-2 transition-all duration-500" style={{ width: `${threeStarPct}%` }}></div>
                            </div>
                            <span className="w-10 text-right rtl:text-left text-zinc-500 font-mono font-bold">{threeStarPct}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-4 sm:p-6 rounded-2xl border border-zinc-200 space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 pb-3">
                        <h5 className="font-extrabold text-zinc-950 text-sm flex items-center gap-2 uppercase tracking-wider">
                          <MessageSquare className="w-4 h-4 text-black" />
                          {t('leaveReviewTitle')}
                        </h5>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          {lang === 'ar' ? 'مخصص للمشترين الحقيقيين' : 'Verified Buyers Only'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-zinc-700">{t('yourFullName')} *</label>
                          <input
                            type="text"
                            placeholder={lang === 'ar' ? 'فاطمة الزهراء' : 'Fatima Zahra'}
                            value={reviewForm.name}
                            onChange={e => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-zinc-200 bg-white p-2.5 rounded-xl text-xs focus:outline-none focus:border-black text-zinc-900 font-semibold shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <PhoneInput
                            label={lang === 'ar' ? 'رقم الهاتف (للتحقق من الطلب)' : 'Phone (Purchase Verification)'}
                            required
                            selectedCountryCode={reviewCountryCode}
                            onSelectCountry={setReviewCountryCode}
                            value={reviewForm.phone}
                            onChange={val => setReviewForm(prev => ({ ...prev, phone: val }))}
                            lang={lang}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="font-bold text-zinc-700 block text-xs">{t('yourRatingLabel')}</label>
                        <div className="flex items-center gap-1.5 bg-white border border-zinc-200 p-2 rounded-xl w-fit">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: idx + 1 }))}
                              className="focus:outline-none cursor-pointer p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star className={`w-6 h-6 ${idx < reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />
                            </button>
                          ))}
                          <span className="text-xs font-bold font-mono text-zinc-700 ml-2 rtl:mr-2">
                            {reviewForm.rating} / 5
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-700 text-xs font-semibold">{t('yourReviewLabel')} *</label>
                        <textarea
                          rows={3}
                          placeholder={lang === 'ar' ? 'شاركنا رأيك في جودة المنتج وتجربة التوصيل...' : 'Share your thoughts about product quality and delivery...'}
                          value={reviewForm.text}
                          onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                          className="w-full border border-zinc-200 bg-white p-2.5 rounded-xl text-xs focus:outline-none focus:border-black text-zinc-900 font-medium shadow-2xs leading-relaxed"
                        />
                      </div>

                      {reviewFormError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{reviewFormError}</span>
                        </div>
                      )}

                      {reviewSuccessMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{reviewSuccessMsg}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={reviewSubmitting}
                        onClick={async () => {
                          setReviewFormError('');
                          setReviewSuccessMsg('');

                          if (!reviewForm.name.trim()) {
                            setReviewFormError(lang === 'ar' ? 'يرجى إدخال اسمك الكامل.' : 'Please enter your full name.');
                            return;
                          }
                          if (!reviewForm.phone.trim()) {
                            setReviewFormError(lang === 'ar' ? 'يرجى إدخال رقم الهاتف الذي قمت بالطلب به للتأكد من أنك مشترٍ حقيقي.' : 'Please enter the phone number you used for your order to verify purchase.');
                            return;
                          }
                          if (!reviewForm.text.trim()) {
                            setReviewFormError(lang === 'ar' ? 'يرجى كتابة تقييمك ورأيك في المنتج.' : 'Please write your review comment.');
                            return;
                          }

                          setReviewSubmitting(true);
                          try {
                            const reviewCountryObj = COUNTRIES.find(c => c.code === reviewCountryCode) || COUNTRIES[0];
                            let formattedAuthorPhone = reviewForm.phone.trim();
                            if (formattedAuthorPhone && !formattedAuthorPhone.startsWith('+')) {
                              const cleanDigits = formattedAuthorPhone.replace(/^0+/, '');
                              formattedAuthorPhone = `${reviewCountryObj.prefix}${cleanDigits}`;
                            }

                            const res = await fetch('/api/reviews', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                productId: selectedProduct.id,
                                storeId: activeCountrySlug,
                                author: reviewForm.name.trim(),
                                authorPhone: formattedAuthorPhone,
                                city: '',
                                rating: reviewForm.rating,
                                comment: reviewForm.text.trim()
                              })
                            });

                            const data = await res.json();

                            if (res.ok && data.success && data.review) {
                              if (setReviews) {
                                setReviews(prev => [data.review, ...prev.filter(r => r.id !== data.review.id)]);
                              }
                              setReviewSuccessMsg(
                                lang === 'ar'
                                  ? 'تم التحقق من طلبك بنجاح ونشر تقييمك كـ (مشتري موثوق Verified Purchase)! شكراً لمشاركتنا تجربتك.'
                                  : 'Your order was verified successfully and your review has been published as a Verified Purchase! Thank you.'
                              );
                              showNotification(
                                lang === 'ar' ? 'تم نشر تقييمك بنجاح!' : 'Review published successfully!',
                                'success'
                              );
                              setReviewForm(prev => ({
                                ...prev,
                                text: '',
                                rating: 5
                              }));
                            } else {
                              setReviewFormError(
                                data.error || (lang === 'ar'
                                  ? 'عذراً، كتابة التقييمات مقتصرة حصرياً على الزبناء الذين اشتروا هذا المنتج من قبل.'
                                  : 'Only verified customers who previously ordered this product can write a review.')
                              );
                            }
                          } catch (err) {
                            console.error('Error submitting review:', err);
                            setReviewFormError(lang === 'ar' ? 'حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً.' : 'Connection error, please try again.');
                          } finally {
                            setReviewSubmitting(false);
                          }
                        }}
                        className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-900 text-white font-black text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {reviewSubmitting ? (
                          <SleekSpinner size="xs" variant="white" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{t('publishReviewBtn')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {prodReviews.length === 0 ? (
                      <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-zinc-200/80 p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200">
                          <Star className="w-6 h-6" />
                        </div>
                        <h6 className="font-bold text-zinc-900 text-sm">
                          {lang === 'ar' ? 'لا توجد تقييمات لهذا المنتج بعد' : 'No customer reviews yet'}
                        </h6>
                        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                          {lang === 'ar'
                            ? 'هل قمت بطلب واستلام هذا المنتج؟ شاركنا رأيك وتجربتك ليتعرف عليها الزبناء الآخرون عبر النموذج أعلاه!'
                            : 'Have you purchased and received this product? Share your verified feedback with other customers using the form above!'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-200">
                        {prodReviews.map((rev: any, index: number) => (
                          <div key={rev.id || index} className="py-5 space-y-2 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center border border-zinc-300 shrink-0 text-sm uppercase">
                              {(rev.author || rev.customerName || 'A').charAt(0)}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-zinc-950 text-xs sm:text-sm">{rev.author || rev.customerName || 'زبون المتجر'}</span>
                                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 shrink-0 border border-emerald-200">
                                    <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                                    {t('verifiedPurchase')}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-medium font-mono">
                                  {rev.date ? formatDateOnly(rev.date, lang, true) : (lang === 'ar' ? 'مؤخراً' : 'Recently')}
                                </span>
                              </div>

                              <div className="flex text-amber-500 gap-0.5">
                                {Array.from({ length: 5 }).map((_, s) => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />
                                ))}
                              </div>

                              <p className="text-zinc-700 text-xs sm:text-sm leading-relaxed pt-1 font-medium">
                                "{rev.comment || rev.text}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          </div>
        </div>
      )}

      {currentView === 'home' && !selectedProduct && (
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-[#eff6ff] text-stone-600 py-16 border-t border-blue-200/55 w-full mt-auto z-10 overflow-hidden max-w-full"
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 overflow-hidden w-full max-w-full">
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex justify-start items-center">
              <StoreLogo config={storeConfig} variant="light" size="sm" />
            </div>
            <p className="text-xs text-stone-500 max-w-sm leading-relaxed font-medium">
              {lang === 'ar'
                ? (storeConfig.description ? storeConfig.description.slice(0, 95) + '...' : 'متجركم الموثوق للتسوق الشامل بأفضل جودة وسعر.')
                : (storeConfig.descriptionEn ? storeConfig.descriptionEn.slice(0, 95) + '...' : 'Your trusted destination for all-in-one shopping with top quality.')}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-blue-150 text-[11px] font-bold text-stone-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />
                {lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-blue-150 text-[11px] font-bold text-stone-700 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'فحص الطلب قبل الدفع' : 'Inspect before Pay'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-blue-150 text-[11px] font-bold text-stone-700 shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-[#2563eb]" />
                {lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="font-sans font-extrabold text-[#1e3a8a] text-xs uppercase tracking-widest border-b border-blue-200/60 pb-2">
              {lang === 'ar' ? 'اتصل بنا' : 'CONTACT US'}
            </h4>
            <ul className="space-y-3 text-xs text-stone-600 font-medium">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 text-[#2563eb] shadow-xs">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>{lang === 'ar' ? 'الجوال: ' : 'Phone: '} {storeConfig.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 text-[#2563eb] shadow-xs">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="break-all">{lang === 'ar' ? 'البريد الإلكتروني: ' : 'Email: '} {storeConfig.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 text-[#2563eb] shadow-xs">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>{storeConfig.location || (activeCountrySlug === 'ma' ? (lang === 'ar' ? 'المغرب' : 'Morocco') : activeCountrySlug === 'ly' ? (lang === 'ar' ? 'ليبيا' : 'Libya') : (lang === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia'))}</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-sans font-extrabold text-[#1e3a8a] text-xs uppercase tracking-widest border-b border-blue-200/60 pb-2">
              {t('informationHours')}
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs text-stone-600 font-medium">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0 text-[#2563eb] mt-0.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  {t('supportWorkingHours')}
                </p>
              </div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-1">
                {lang === 'ar'
                  ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} Mavluy.`
                  : `All rights reserved © ${new Date().getFullYear()} Mavluy.`}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.footer>
      )}

      {isCartOpen && (
        <div
          id="cart-drawer-overlay"
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/60 z-50 flex justify-end transition-opacity duration-200 animate-fadeIn"
        >
          <div
            id="cart-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl p-6 relative text-xs text-slate-600 rounded-l-3xl sm:rounded-l-[2.5rem] rtl:rounded-r-3xl rtl:sm:rounded-r-[2.5rem] rtl:rounded-l-none border-l rtl:border-r rtl:border-l-0 border-stone-200"
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-black" />
                <h3 className="font-bold text-zinc-950 text-base">{t('yourCart')} ({cartItemsCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700">{t('cartEmpty')}</h4>
                  <p className="text-slate-400 max-w-xs mx-auto">{t('cartEmptyDesc')}</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-4 flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{getProdName(item.product)}</h4>
                      <p className="text-[10px] text-slate-400">{item.product.price} {getCurrency()}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateCartQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right space-y-1.5 shrink-0">
                      <span className="font-bold text-slate-900 block">{item.product.price * item.quantity} {getCurrency()}</span>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-zinc-400 hover:text-black font-semibold text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-5 space-y-4">
                {isCouponAllowedInCart && (
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        <Ticket style={{ color: primaryBrandColor }} className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'كود الخصم (Coupon)' : 'Promo Coupon'}</span>
                      </span>
                      {appliedCartCoupon && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {appliedCartCoupon.code}
                        </span>
                      )}
                    </div>

                    {!appliedCartCoupon ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cartCouponInput}
                          onChange={e => {
                            setCartCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                            setCartCouponError('');
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCartCoupon();
                            }
                          }}
                          placeholder={lang === 'ar' ? 'أدخل الكود (مثال: MAV10)' : 'Coupon code...'}
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCartCoupon()}
                          disabled={isValidatingCartCoupon || !cartCouponInput.trim()}
                          style={{ backgroundColor: primaryBrandColor }}
                          className="hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center min-w-[54px] shadow-xs"
                        >
                          {isValidatingCartCoupon ? <SleekSpinner size="xs" variant="white" /> : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-emerald-900 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-[11px] truncate">
                            {appliedCartCoupon.code} (-{cartDiscountAmount} {getCurrency()})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCartCoupon}
                          className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {cartCouponError && (
                      <p className="text-rose-600 text-[10px] font-bold px-1">{cartCouponError}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('subtotal')}:</span>
                    <span className="text-slate-800">{subtotal} {getCurrency()}</span>
                  </div>
                  {cartDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span>{lang === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                      </span>
                      <span>-{cartDiscountAmount} {getCurrency()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('shipping')}:</span>
                    <span className="text-slate-800">
                      {actualShippingFee === 0 ? (
                        <span style={{ color: primaryBrandColor }} className="font-bold">{t('free')}</span>
                      ) : (
                        `${actualShippingFee} ${getCurrency()}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-950 font-black border-t border-slate-100 pt-3 text-sm">
                    <span>{t('finalTotal')}:</span>
                    <div className="text-right">
                      {cartDiscountAmount > 0 && (
                        <span className="text-xs text-stone-400 line-through font-mono block">
                          {subtotal + actualShippingFee} {getCurrency()}
                        </span>
                      )}
                      <span style={{ color: primaryBrandColor }} className="font-mono">{total} {getCurrency()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  style={{ backgroundColor: primaryBrandColor }}
                  className="w-full flex items-center justify-center gap-2 text-white text-xs font-bold py-4 rounded-full hover:opacity-90 cursor-pointer shadow-md transition-all uppercase tracking-widest active:scale-98"
                >
                  {t('proceedToCheckout')}
                  {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto scrollbar-none no-scrollbar">
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border border-stone-150 max-h-[90vh] overflow-y-auto scrollbar-none no-scrollbar space-y-6 text-stone-900"
          >
            <div className="flex items-center justify-between border-b border-stone-150 pb-4">
              <div className="flex items-center gap-2 text-stone-900">
                <MapPin className="w-5 h-5 text-[#2563eb]" />
                <h3 className="font-serif font-bold uppercase tracking-wider text-stone-900 text-sm sm:text-base">{t('shippingInfo')}</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs text-stone-600">
              <div className="bg-[#f5ece3]/50 p-4 rounded-2xl border border-[#f5ece3] flex gap-3 items-start">
                <Truck className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-stone-700 font-medium">
                  {t('expressCheckoutDesc')}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">{t('name')} *</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: أحمد الحربي' : 'e.g. Ahmed Al-Harbi'}
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full border rounded-2xl p-3 focus:outline-none font-semibold text-stone-900 text-xs ${formErrors.name ? 'border-red-500' : 'border-stone-200 focus:border-[#2563eb]'}`}
                />
                {formErrors.name && <p className="text-red-500 text-[10px] font-bold px-1">{formErrors.name}</p>}
              </div>

               <PhoneInput
                 label={t('phone')}
                 required
                 selectedCountryCode={selectedCountryCode}
                 onSelectCountry={setSelectedCountryCode}
                 value={checkoutForm.phone}
                 onChange={val => setCheckoutForm(prev => ({ ...prev, phone: val }))}
                 error={formErrors.phone}
                 helperText={t('confirmPhoneCall')}
                 lang={lang}
               />

              <CitySelector
                value={checkoutForm.city}
                onChange={val => setCheckoutForm(prev => ({ ...prev, city: val }))}
                label={t('city')}
                required
                error={formErrors.city}
                lang={lang}
                theme="light"
                options={storeCities.length > 0 ? storeCities : GLOBAL_CITIES}
              />

              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">{t('address')} *</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'حي الياسمين، شارع الملقا، عمارة 15' : 'e.g. Alyasmin, Al Malqa St, Bldg 15'}
                  value={checkoutForm.address}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full border rounded-2xl p-3 focus:outline-none font-semibold text-stone-900 text-xs ${formErrors.address ? 'border-red-500' : 'border-stone-200 focus:border-[#2563eb]'}`}
                />
                {formErrors.address && <p className="text-red-500 text-[10px] font-bold px-1">{formErrors.address}</p>}
              </div>

              {cart.some(item => Boolean(item.product?.enableNotesField)) && (
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">
                    {cart.find(item => item.product?.enableNotesField)?.product?.notesFieldLabel || t('notes')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={cart.find(item => item.product?.enableNotesField)?.product?.notesFieldPlaceholder || (lang === 'ar' ? 'مقاس XL / يرجى الاتصال قبل التوصيل' : 'e.g. Size XL please / Call before delivering...')}
                    value={checkoutForm.notes}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-stone-200 rounded-2xl p-3 focus:outline-none font-semibold text-stone-900 text-xs focus:border-[#2563eb]"
                  />
                </div>
              )}

              {isCouponAllowedInCart && (
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Ticket style={{ color: primaryBrandColor }} className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'هل لديك كود خصم؟' : 'Have a Promo Coupon?'}</span>
                  </span>
                  {appliedCartCoupon && (
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {appliedCartCoupon.code}
                    </span>
                  )}
                </div>

                {!appliedCartCoupon ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cartCouponInput}
                      onChange={e => {
                        setCartCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setCartCouponError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCartCoupon();
                        }
                      }}
                      placeholder={lang === 'ar' ? 'أدخل كود الخصم (مثال: MAV10)' : 'Enter coupon code...'}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCartCoupon()}
                      disabled={isValidatingCartCoupon || !cartCouponInput.trim()}
                      style={{ backgroundColor: primaryBrandColor }}
                      className="hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center min-w-[58px] shadow-xs"
                    >
                      {isValidatingCartCoupon ? <SleekSpinner size="xs" variant="white" /> : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-xs truncate">
                        {lang === 'ar' ? `كود مفعل: ${appliedCartCoupon.code} (خصم: ${cartDiscountAmount} ${getCurrency()})` : `Active: ${appliedCartCoupon.code} (-${cartDiscountAmount} ${getCurrency()})`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCartCoupon}
                      className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {cartCouponError && (
                  <p className="text-rose-600 text-[10px] font-bold px-1">{cartCouponError}</p>
                )}
              </div>
            )}

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150 space-y-1.5 font-bold text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">{t('subtotal')} ({cartItemsCount}):</span>
                  <span className="text-stone-800">{subtotal} {getCurrency()}</span>
                </div>
                {cartDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? `الخصم (${appliedCartCoupon?.code}):` : `Discount (${appliedCartCoupon?.code}):`}</span>
                    </span>
                    <span className="font-mono">-{cartDiscountAmount} {getCurrency()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">{t('shipping')}:</span>
                  <span className="text-stone-800">
                    {actualShippingFee === 0 ? (
                      <span style={{ color: primaryBrandColor }}>{t('free')}</span>
                    ) : (
                      `${actualShippingFee} ${getCurrency()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-black border-t border-stone-150 pt-2.5 text-xs sm:text-sm">
                  <span className="uppercase tracking-widest text-stone-950">{t('total')}:</span>
                  <div className="text-right">
                    {cartDiscountAmount > 0 && (
                      <span className="text-xs text-stone-400 line-through font-mono block">
                        {subtotal + actualShippingFee} {getCurrency()}
                      </span>
                    )}
                    <span style={{ color: primaryBrandColor }} className="text-lg font-mono">{total} {getCurrency()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-5 py-3 rounded-full uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: primaryBrandColor }}
                  className="flex items-center gap-1.5 text-white font-bold px-6 py-3 rounded-full hover:opacity-90 shadow-md cursor-pointer uppercase tracking-widest text-[11px] active:scale-98"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lastCreatedOrder && (
        <div className="fixed inset-0 bg-black/60  flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-150 text-center space-y-6  max-h-[90vh] overflow-y-auto">

            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-stone-900 text-xl uppercase tracking-wider flex items-center justify-center gap-2">
                {lang === 'ar' ? 'تم استلام طلبك!' : 'Order Received!'}
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {lang === 'ar' ? 'شكراً لطلبك! رقم طلبك هو:' : 'Thank you for your order! Your order number is:'}
              </p>
              <span className="inline-block font-mono font-black bg-stone-100 text-stone-850 px-3.5 py-1 rounded-full text-xs">
                {lastCreatedOrder.id}
              </span>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed px-2">
              {lang === 'ar' ? (
                <>
                  سيتصل بك أحد ممثلي المبيعات من <strong className="text-[#2563eb] font-black">{getStoreName()}</strong> خلال الساعات القليلة القادمة على الرقم <strong className="text-stone-800 font-mono font-bold">{lastCreatedOrder.customerPhone}</strong> لتأكيد التوصيل وشحن طلبك.
                </>
              ) : (
                <>
                  A sales representative from <strong className="text-[#2563eb] font-black">{getStoreName()}</strong> will call you in the next few hours on <strong className="text-stone-800 font-mono font-bold">{lastCreatedOrder.customerPhone}</strong> to confirm your delivery and ship your package.
                </>
              )}
            </p>

            <div className={`bg-[#f5ece3]/30 p-5 rounded-2xl border border-stone-150 text-xs text-stone-600 space-y-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <h4 className="font-serif font-bold text-stone-850 border-b border-stone-150 pb-2 text-[11px] uppercase tracking-widest">
                {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h4>

              <div className="max-h-24 overflow-y-auto space-y-2">
                {lastCreatedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs font-semibold">
                    <span className="line-clamp-1 flex-1 pr-2 text-stone-700">{item.productName} (x{item.quantity})</span>
                    <span className="font-bold text-stone-900 shrink-0">{item.price * item.quantity} {getCurrency()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-150 pt-2.5 space-y-1.5 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-stone-400">{lang === 'ar' ? 'المدينة:' : 'City:'}</span>
                  <span className="text-stone-800">{lastCreatedOrder.customerCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">{lang === 'ar' ? 'الشحن:' : 'Shipping:'}</span>
                  <span>
                    {lastCreatedOrder.shippingFee === 0
                      ? (lang === 'ar' ? 'مجاني' : 'Free')
                      : `${lastCreatedOrder.shippingFee} ${getCurrency()}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-950 font-black pt-1">
                  <span>{lang === 'ar' ? 'إجمالي الدفع عند الاستلام:' : 'Total to pay on delivery:'}</span>
                  <span className="text-[#2563eb] text-sm">{lastCreatedOrder.total} {getCurrency()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => { setLastCreatedOrder(null); setCurrentView('home'); setSelectedProduct(null); }}
                className="w-full text-white text-xs font-bold py-3.5 rounded-full bg-[#2563eb] hover:bg-blue-700 cursor-pointer shadow-md shadow-[#2563eb]/15 transition-all uppercase tracking-widest"
              >
                {lang === 'ar' ? 'مواصلة التسوق' : 'Continue Shopping'}
              </button>
            </div>
          </div>
        </div>
      )}

      {false && isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-150 max-h-[90vh] overflow-y-auto space-y-6 text-stone-900"
          >
            <div className="flex items-center justify-between border-b border-stone-150 pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#2563eb]" />
                <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                  {loggedInCustomer ? t('myAccount') : t('customerLogin')}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginStep === 'phone' && (
              <form onSubmit={handleCustomerLoginOrRegister} className="space-y-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  {t('enterPhone')}
                </p>
                <PhoneInput
                  label={lang === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                  required
                  selectedCountryCode={selectedCountryCode}
                  onSelectCountry={setSelectedCountryCode}
                  value={customerPhoneInput}
                  onChange={setCustomerPhoneInput}
                  lang={lang}
                />
                {customerModalError && (
                  <p className="text-red-500 text-[10px] font-bold">{customerModalError}</p>
                )}
                <button
                  type="submit"
                  className="w-full text-white font-bold py-3.5 rounded-full bg-[#2563eb] hover:bg-blue-700 cursor-pointer shadow-md shadow-[#2563eb]/15 transition-all uppercase tracking-widest text-[11px]"
                >
                  {t('loginBtn')}
                </button>
              </form>
            )}

            {loginStep === 'name' && (
              <form onSubmit={handleCustomerLoginOrRegister} className="space-y-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  {t('enterName')}
                </p>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('namePlaceholder')}
                    value={customerNameInput}
                    onChange={e => setCustomerNameInput(e.target.value)}
                    className="w-full border border-stone-200 rounded-2xl p-3 focus:outline-none focus:border-[#2563eb] font-semibold text-stone-900 text-xs"
                  />
                </div>
                {customerModalError && (
                  <p className="text-red-500 text-[10px] font-bold">{customerModalError}</p>
                )}
                <button
                  type="submit"
                  className="w-full text-white font-bold py-3.5 rounded-full bg-[#2563eb] hover:bg-blue-700 cursor-pointer shadow-md shadow-[#2563eb]/15 transition-all uppercase tracking-widest text-[11px]"
                >
                  {t('completeRegister')}
                </button>
              </form>
            )}

            {loginStep === 'profile' && loggedInCustomer && (
              <div className="space-y-5">
                <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar
                      avatar={loggedInCustomer.avatar}
                      name={loggedInCustomer.name}
                      phone={loggedInCustomer.phone}
                      size="sm"
                    />
                    <div>
                      <h4 className="font-serif font-black text-stone-900 text-sm sm:text-base">{loggedInCustomer.name}</h4>
                      <p className="text-[11px] text-stone-500 font-mono font-bold mt-0.5">{loggedInCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCustomerLogout}
                    className="bg-white hover:bg-red-50 hover:text-red-600 text-stone-600 text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-bold shrink-0 border border-stone-200 hover:border-red-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logout')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab('orders')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      profileActiveTab === 'orders' ? 'bg-[#2563eb] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'
                    }`}
                  >
                    {t('myOrders')} ({customerOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab('profile')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      profileActiveTab === 'profile' ? 'bg-[#2563eb] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'
                    }`}
                  >
                    {lang === 'ar' ? 'تعديل الحساب' : 'Edit Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab('favorites')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      profileActiveTab === 'favorites' ? 'bg-[#2563eb] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-150'
                    }`}
                  >
                    {t('myFavorites')} ({favorites.length})
                  </button>
                </div>

                {profileActiveTab === 'orders' && (
                  <div className="space-y-3">
                    {customerOrders.length === 0 ? (
                      <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                        <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                        <p className="text-xs text-stone-400 italic">{t('noOrders')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {customerOrders.map(o => (
                          <div key={o.id} className="bg-stone-50/90 p-3.5 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span className="font-mono text-stone-900 font-black">{o.id}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                o.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                o.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {o.status}
                              </span>
                            </div>
                            <div className="space-y-2 text-stone-600 font-medium text-[11px]">
                              {o.items.map((item, idx) => {
                                const matchedProd = products.find(p => p.id === item.productId || p.name === item.productName || (p.nameAr && p.nameAr === item.productName));
                                const itemImg = item.image || matchedProd?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80';

                                return (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-stone-150">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img src={itemImg} alt={item.productName} className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0" referrerPolicy="no-referrer" />
                                      <span className="truncate max-w-[170px] text-xs text-stone-900 font-bold">{item.productName} (x{item.quantity})</span>
                                    </div>
                                    <span className="font-bold text-stone-900 font-mono shrink-0">{item.price * item.quantity} {getCurrency(item.currency || o.currency)}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between items-center border-t border-stone-200 pt-2 text-[10px] font-bold text-stone-400">
                              <span>{formatDateOnly(o.date, lang, false)}</span>
                              <span className="text-stone-900 text-xs font-black font-mono">{o.total} {getCurrency(o.currency)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {profileActiveTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px] block">
                        {lang === 'ar' ? 'الصورة الشخصية' : 'Profile Photo'}
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditProfileAvatar(preset)}
                            className={`relative rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                              editProfileAvatar === preset ? 'border-[#2563eb]' : 'border-transparent'
                            }`}
                          >
                            <img src={preset} alt="Avatar" className="w-10 h-10 object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">
                        {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editProfileName}
                        onChange={e => setEditProfileName(e.target.value)}
                        className="w-full border border-stone-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">
                        {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={editProfilePhone}
                        onChange={e => setEditProfilePhone(e.target.value)}
                        className="w-full border border-stone-200 rounded-xl p-2.5 font-mono font-bold text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-stone-700 uppercase tracking-widest text-[9.5px]">
                        {lang === 'ar' ? 'كلمة السر الجديدة (اختياري)' : 'New Password (Optional)'}
                      </label>
                      <input
                        type="password"
                        value={editProfilePassword}
                        onChange={e => setEditProfilePassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border border-stone-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    {profileUpdateMsg && (
                      <p className={`text-xs font-bold ${profileUpdateMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profileUpdateMsg.text}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full text-white font-bold py-3 rounded-xl bg-[#2563eb] hover:bg-blue-700 cursor-pointer shadow-sm text-xs"
                    >
                      {isUpdatingProfile ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                    </button>
                  </form>
                )}

                {profileActiveTab === 'favorites' && (
                  <div className="space-y-3">
                    {favorites.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-2 text-center">{t('noFavorites')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                        {products.filter(p => favorites.includes(p.id)).map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedProduct(p); setIsCustomerModalOpen(false); }}
                            className="bg-white hover:bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center gap-2.5 cursor-pointer transition-all animate-fadeIn"
                          >
                            <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-lg shrink-0 border border-stone-200" referrerPolicy="no-referrer" />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-stone-900 text-xs truncate">{getProdName(p)}</h5>
                              <p className="font-black text-[#2563eb] text-xs mt-0.5">{p.price} {getCurrency(p.currency)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-150 p-4 flex lg:hidden items-center justify-between gap-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
          <div className="text-left shrink-0 pl-1">
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('totalPrice')}</span>
            <span className="text-base font-black text-stone-900">{getProductSubtotal(selectedProduct, directQty)} {getCurrency(selectedProduct.currency)}</span>
          </div>
          <a
            href="#express-checkout-form"
            className="flex-1 flex items-center justify-center gap-2 bg-[#2563eb] active:bg-blue-700 text-white font-black text-xs py-4 px-5 rounded-full uppercase tracking-widest text-center shadow-lg shadow-[#2563eb]/20"
          >
            <ShoppingCart className="w-4 h-4" />
            {t('buyNowCod')}
          </a>
        </div>
      )}

      {!selectedProduct && currentView !== 'profile' && (
        <nav id="online-store-mobile-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-l-2 border-r-2 border-stone-300/80 rounded-t-[1.75rem] p-2 flex justify-around items-center z-40 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] select-none pb-safe">
          <a
            href={getHomeUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getHomeUrl());
              }
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-0.5 rounded-lg transition-all cursor-pointer ${
              currentView === 'home' && !selectedProduct
                ? 'text-[#2563eb] font-bold scale-105'
                : 'text-stone-500 hover:text-stone-850'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider font-extrabold">{t('homeTitle')}</span>
          </a>

          <a
            href={getProductsUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                setSelectedCategory('All');
                setFilterPopular(false);
                navigateTo(getProductsUrl());
              }
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-0.5 rounded-lg transition-all cursor-pointer ${
              currentView === 'all-products' && !selectedProduct
                ? 'text-[#2563eb] font-bold scale-105'
                : 'text-stone-500 hover:text-stone-850'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider font-extrabold">{t('productsTitle')}</span>
          </a>

          <a
            href={getTicketsUrl()}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                navigateTo(getTicketsUrl());
              }
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-0.5 rounded-lg transition-all cursor-pointer ${
              currentView === 'support' && !selectedProduct
                ? 'text-[#2563eb] font-bold scale-105'
                : 'text-stone-500 hover:text-stone-850'
            }`}
          >
            <MessageCircle className="w-4.5 h-4.5" />
            <span className="text-[8px] uppercase tracking-wider font-extrabold">{t('supportTabTitle')}</span>
          </a>
        </nav>
      )}

      {false && (
        <div id="support-modal-overlay" className="fixed inset-0 bg-stone-900/75 z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            id="support-modal-card"
            className="bg-white w-full max-w-4xl rounded-[2.25rem] border border-stone-200 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-slideUp text-stone-900"
          >
            <div className="w-full md:w-1/2 p-5 sm:p-8 border-b md:border-b-0 md:border-r border-stone-100 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-blue-50 text-[#2563eb] rounded-2xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-900">Support Desk</h4>
                      <p className="text-[10px] text-stone-400 font-semibold mt-0.5">We typically reply within 1 hour</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSupportOpen(false)}
                    className="md:hidden p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`border p-3.5 rounded-2xl flex items-center gap-3 transition-colors ${supportStatus.colorClass}`}>
                  <span className="relative flex h-2.5 w-2.5">
                    {supportStatus.isOnline && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${supportStatus.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </span>
                  <div className="text-[11px] font-bold">
                    <span>{supportStatus.text}</span>
                    <span className="opacity-75 font-semibold block text-[10px] mt-0.5">Business Hours: {supportStatus.hoursText}</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                  Have a question about your order, shipping, or products? Send us a ticket and our support team will contact you directly via phone.
                </p>

                {isTicketSubmitted ? (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-6 rounded-2xl text-center space-y-3 animate-fadeIn">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h5 className="text-xs font-bold uppercase tracking-wider">Ticket Submitted!</h5>
                    <p className="text-[11px] text-emerald-600 leading-relaxed font-semibold">
                      Thank you! Your ticket has been recorded. Our team will review your inquiry and call you shortly. You can track this ticket's status on the right.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendSupportTicket} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rachid"
                        value={supportName}
                        onChange={e => setSupportName(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#2563eb] text-stone-900 font-semibold transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Moroccan Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0661234567"
                        value={supportPhone}
                        onChange={e => setSupportPhone(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#2563eb] text-stone-900 font-mono font-bold transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Subject *</label>
                      <CustomSelect
                        value={supportSubject}
                        onChange={val => setSupportSubject(val)}
                        theme="light"
                        size="md"
                        options={[
                          { value: 'Product Inquiries', label: 'Product Inquiries' },
                          { value: 'Change Order Details', label: 'Change Order Details' },
                          { value: 'Delivery Question', label: 'Delivery Question' },
                          { value: 'Other Assistance', label: 'Other Assistance' }
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Message *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Explain your inquiry here..."
                        value={supportMessage}
                        onChange={e => setSupportMessage(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#2563eb] text-stone-900 font-medium transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer hover:shadow-lg active:scale-98"
                    >
                      Send Support Ticket
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2 p-5 sm:p-8 bg-stone-50/60 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-none">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-900">Track Your Tickets</h4>
                    <p className="text-[10px] text-stone-400 font-semibold mt-0.5 font-sans">Check if support read your ticket</p>
                  </div>
                  <button
                    onClick={() => setIsSupportOpen(false)}
                    className="hidden md:block p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by phone (e.g. 0661234567)"
                    value={ticketPhoneSearch}
                    onChange={e => setTicketPhoneSearch(e.target.value)}
                    className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 p-0 text-stone-900 placeholder-stone-400 font-bold"
                  />
                  {ticketPhoneSearch && (
                    <button
                      onClick={() => setTicketPhoneSearch('')}
                      className="text-[10px] text-stone-400 hover:text-stone-600 font-extrabold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[260px] md:max-h-[380px] overflow-y-auto pr-1">
                  {trackedTickets.length === 0 ? (
                    <div className="text-center py-10 space-y-2.5 bg-white border border-stone-150 rounded-2xl p-4">
                      <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">No tickets to display</p>
                      <p className="text-[10px] text-stone-400 leading-relaxed font-semibold">
                        {ticketPhoneSearch
                          ? "We couldn't find any tickets with this phone number."
                          : "Tickets submitted from this device will appear here automatically. You can also search by your phone number."
                        }
                      </p>
                    </div>
                  ) : (
                    trackedTickets.map((ticket) => {
                      const isSeen = ticket.seen === true;
                      const isResolved = ticket.status === 'resolved';

                      return (
                        <div key={ticket.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-xs animate-fadeIn text-stone-900">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] font-black text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                {ticket.id}
                              </span>
                              <span className="text-[8.5px] text-stone-400 font-bold font-mono">
                                {formatDateOnly(ticket.date, lang, false)}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              {isSeen ? (
                                <span className="text-[8px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                  Read
                                </span>
                              ) : (
                                <span className="text-[8px] font-extrabold uppercase tracking-widest text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-stone-400"></span>
                                  Unread
                                </span>
                              )}

                              {isResolved ? (
                                <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                  Resolved
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCloseTicketByClient(ticket.id)}
                                    className="text-[8px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-full border border-stone-200 transition-all cursor-pointer flex items-center gap-0.5"
                                    title="Close ticket"
                                  >
                                    <Check className="w-2.5 h-2.5 text-stone-600" />
                                    <span>Close</span>
                                  </button>
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                                    In Queue
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-[10.5px] font-bold text-stone-800 uppercase tracking-wide">{ticket.subject}</h5>
                            <p className="text-[10px] text-stone-500 font-medium italic">"{ticket.message}"</p>
                          </div>

                          <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 space-y-2 text-left">
                            <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-1">Live Ticket Tracker</span>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check className="w-2 h-2" />
                                </div>
                                <span className="text-[9px] font-bold text-stone-700">Ticket sent successfully</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[10px] ${isSeen ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-450'}`}>
                                  {isSeen ? <Check className="w-2 h-2" /> : <span className="w-1 h-1 rounded-full bg-stone-400" />}
                                </div>
                                <span className={`text-[9px] font-bold ${isSeen ? 'text-stone-700' : 'text-stone-400'}`}>
                                  {isSeen ? 'Opened and read by support agent' : 'Waiting in support queue'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[10px] ${isResolved ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-450'}`}>
                                  {isResolved ? <Check className="w-2 h-2" /> : <span className="w-1 h-1 rounded-full bg-stone-400" />}
                                </div>
                                <span className={`text-[9px] font-bold ${isResolved ? 'text-stone-700 font-bold' : 'text-stone-400'}`}>
                                  {isResolved ? 'Support representative contacted customer' : 'Agent will contact you via Moroccan phone shortly'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-stone-200/50 flex items-center justify-between">
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Want live text chat?</span>
                <button
                  onClick={() => {
                    const cleanPhone = storeConfig.phone.replace(/\D/g, '');
                    let formattedWaPhone = cleanPhone;
                    const countryPrefix = activeCountrySlug === 'ma' ? '212' : activeCountrySlug === 'ly' ? '218' : '966';
                    if (cleanPhone.startsWith('0')) {
                      formattedWaPhone = countryPrefix + cleanPhone.slice(1);
                    } else if (!cleanPhone.startsWith(countryPrefix)) {
                      formattedWaPhone = countryPrefix + cleanPhone;
                    }
                    const textMsg = lang === 'ar'
                      ? `مرحباً ${storeConfig.storeName}، أرغب في الحصول على مزيد من المعلومات.`
                      : `Hello ${storeConfig.storeName}, I would like to get more information.`;
                    const waUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(textMsg)}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'home' && (
        <div className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 z-40">
          <button
            onClick={() => {
              const cleanPhone = storeConfig.phone.replace(/\D/g, '');
              let formattedWaPhone = cleanPhone;
              const countryPrefix = activeCountrySlug === 'ma' ? '212' : activeCountrySlug === 'ly' ? '218' : '966';
              if (cleanPhone.startsWith('0')) {
                formattedWaPhone = countryPrefix + cleanPhone.slice(1);
              } else if (!cleanPhone.startsWith(countryPrefix)) {
                formattedWaPhone = countryPrefix + cleanPhone;
              }
              const textMsg = lang === 'ar'
                ? `مرحباً ${storeConfig.storeName}، أرغب في الحصول على مزيد من المعلومات.`
                : `Hello ${storeConfig.storeName}, I would like to get more information.`;
              const waUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(textMsg)}`;
              window.open(waUrl, '_blank');
            }}
            className="flex items-center justify-center h-12 w-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer relative group"
            title="Contact us on WhatsApp"
          >
            <WhatsAppIcon className="w-6 h-6 text-white" />
            <span className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ping -z-10" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if ((window as any).__lenis) {
                (window as any).__lenis.scrollTo(0, { duration: 1.2 });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`fixed bottom-24 lg:bottom-8 ${currentView === 'home' ? 'left-6 lg:left-8' : 'right-6 lg:right-8'} z-40 flex items-center justify-center h-11 w-11 bg-white hover:bg-[#2563eb] text-stone-700 hover:text-white rounded-full shadow-xl border border-stone-200 hover:border-[#2563eb] transition-all hover:scale-110 active:scale-95 cursor-pointer group`}
            title={lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to top'}
            aria-label="Back to top"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {ticketToClose && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          onClick={() => !isClosingTicket && setTicketToClose(null)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-serif font-black text-stone-900 text-base sm:text-lg">
                {lang === 'ar' ? 'تأكيد إغلاق تذكرة الدعم' : 'Close Support Ticket?'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متأكد من رغبتك في إغلاق هذه التذكرة؟ يمكنك دائماً فتح تذكرة جديدة عند الحاجة لمساعدة إضافية.'
                  : 'Are you sure you want to close and resolve this ticket? You can open a new ticket anytime if needed.'}
              </p>
              <span className="inline-block font-mono text-[11px] font-bold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-md">
                #{ticketToClose}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isClosingTicket}
                onClick={() => setTicketToClose(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isClosingTicket}
                onClick={confirmCloseTicket}
                className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isClosingTicket ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'نعم، إغلاق التذكرة' : 'Yes, Close Ticket'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
