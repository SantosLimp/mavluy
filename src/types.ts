export interface CountryStore {
  id: string;
  name: string;
  nameAr: string;
  code: string; // e.g., 'MA', 'LY', 'SA'
  currency: string; // e.g., 'MAD', 'LYD', 'SAR'
  currencySymbol: string; // e.g., 'د.م.', 'د.ل.', 'ر.س.'
  language: 'ar' | 'en' | 'fr';
  status: 'active' | 'disabled';
  storeName: string;
  logo?: string;
  slug: string; // e.g., 'ma', 'ly', 'sa'
  shippingFee: number;
  taxRate?: number;
  flag?: string;
}

export interface ProductFeature {
  title: string;
  desc: string;
  icon?: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface PricingTier {
  id?: string;
  quantity: number; // e.g. 1, 2, 3
  price: number; // Total price for this bundle (e.g. 299 for 1, 499 for 2, 699 for 3)
  unitPrice?: number; // Optional unit price
  label?: string; // Optional custom label e.g. 'الأكثر طلباً', 'Most Popular'
  labelAr?: string;
  labelFr?: string;
  badge?: string; // e.g. 'أفضل توفير', 'الأكثر مبيعاً', 'Best Value'
  isPopular?: boolean; // Highlighted as the one clients choose most (الأكثر اختياراً من الزبناء)
  discountPercentage?: number; // e.g. 25% OFF
}

export interface Product {
  id: string;
  storeId?: string; // Links product to a specific store/country slug
  category: string;
  brand?: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  slug?: string;
  description: string;
  descriptionAr?: string;
  descriptionFr?: string;
  image: string;
  additionalImages?: string[];
  price: number;
  originalPrice?: number;
  salePrice?: number;
  currency?: string;
  stock: number;
  sku?: string;
  barcode?: string;
  status?: 'active' | 'draft' | 'archived';
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  variants?: { name: string; options: string[] }[];
  attributes?: Record<string, string>;
  tags?: string[];
  tagline?: string;
  features?: ProductFeature[];
  howToUse?: string[];
  faqs?: ProductFaq[];
  imagePosition?: string;
  imageFit?: 'cover' | 'contain';
  imageOffsetY?: number; // 0% to 100% vertical focus point
  videoUrl?: string;
  videoThumbnail?: string;
  videoPosition?: 'first' | 'after_photos';
  videoAsPrimary?: boolean;
  pricingTiers?: PricingTier[]; // Bulk / quantity-based tiered pricing e.g. Buy 1 for 299, Buy 2 for 499, Buy 3 for 699
}

export interface Category {
  id: string;
  storeId?: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  slug: string;
  parentId?: string | null;
  image?: string;
}

export interface Coupon {
  id: string;
  storeId?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  type?: 'percentage' | 'fixed';
  value?: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
  expiryDate?: string;
  status: 'active' | 'expired' | 'disabled';
  productId?: string; // 'all' or specific product id
  productName?: string;
  showOnProductPage?: boolean;
  showBadgeOnProductCard?: boolean;
}

export interface ShippingMethod {
  id: string;
  storeId?: string;
  city: string;
  price: number;
  estimatedDays?: string;
  status: 'active' | 'disabled';
}

export interface TaxConfig {
  id: string;
  storeId?: string;
  taxName: string;
  taxPercentage: number;
  status: 'active' | 'disabled';
}

export interface SupportFaq {
  id: string;
  q: string;
  qEn?: string;
  a: string;
  aEn?: string;
}

export interface StoreConfig {
  storeId?: string;
  storeName: string;
  storeNameEn?: string;
  description: string;
  descriptionEn?: string;
  phone: string;
  email: string;
  bannerTitle: string;
  bannerTitleEn?: string;
  bannerSubtitle: string;
  bannerSubtitleEn?: string;
  bannerImage: string;
  accentColor: string; // 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'blue' | 'custom'
  themePrimaryColor?: string; // Custom hex or preset hex e.g. '#2563eb'
  currency: string;
  shippingFee: number;
  location: string;
  logo?: string;
  // Logo Customization
  logoType?: 'text' | 'image';
  logoTextPrefix?: string; // e.g. 'Mav'
  logoTextAccent?: string; // e.g. 'luy'
  logoTagline?: string; // e.g. 'Refined Living & Shopping'
  logoFontStyle?: 'italic-luxury' | 'serif' | 'modern-sans' | 'display-bold';
  logoAccentColor?: string; // e.g. '#2563eb'
  logoImage?: string; // URL or Data URL
  logoImageHeight?: number; // in px e.g. 36
  supportStatusMode?: 'manual' | 'schedule'; // 'manual' (force online/offline) or 'schedule' (auto based on hours)
  supportIsOnline?: boolean; // manual toggle by staff (true = online, false = offline)
  supportStartTime?: string; // e.g. "09:00"
  supportEndTime?: string; // e.g. "22:00"
  supportWorkDays?: string; // e.g. "طيلة أيام الأسبوع" or "Tous les jours"
  supportFaqs?: SupportFaq[]; // Customizable FAQs displayed on Support Page
  metaPixelId?: string; // Meta (Facebook) Pixel ID (e.g. 123456789012345)
  tiktokPixelId?: string; // TikTok Pixel ID (e.g. C123456789ABCDEF)
  pixelTrackingEnabled?: boolean; // Master toggle for ad pixel tracking
  customAdminSlug?: string; // Secret custom URL slug for admin dashboard (e.g. 'mavluy-secure-gate-789' or 'admin/dashboard')
  customAdminLoginSlug?: string; // Secret custom URL slug for admin login (e.g. 'mavluy-login-gate' or 'admin/login')
  customAdminRegisterSlug?: string; // Secret custom URL slug for admin register (e.g. 'mavluy-register-gate' or 'admin/register')
  customSupportSlug?: string; // Custom URL slug for support & tickets (e.g. 'support' or 'contact' or 'help' or 'tickets')
  customProductsSlug?: string; // Custom URL slug for products catalog (e.g. 'products' or 'shop' or 'catalog')
  customProfileSlug?: string; // Custom URL slug for profile & order tracking (e.g. 'profile' or 'orders' or 'track')
  customFavoritesSlug?: string; // Custom URL slug for wishlist/favorites (e.g. 'favorites' or 'wishlist')
  customCartSlug?: string; // Custom URL slug for shopping cart (e.g. 'cart' or 'panier')
  customCheckoutSlug?: string; // Custom URL slug for checkout page (e.g. 'checkout' or 'paiement')
  allowAdminRegistration?: boolean; // Toggle whether registration endpoint is open or blocked
  affiliateWebhookUrl?: string; // Webhook URL to forward orders to affiliate/CRM platform
  affiliateWebhookApiKey?: string; // Webhook Secret / API key for external sync
  affiliateAutoSync?: boolean; // Toggle auto-syncing orders to affiliate network
  storeBackgroundColor?: string; // Custom store background hex e.g. '#ffffff' or '#f8fafc'
  storeCardBackgroundColor?: string; // Custom product card background
  // Cloudinary Cloud Storage Integration
  cloudinaryCloudName?: string; // Cloudinary Cloud Name
  cloudinaryApiKey?: string; // Cloudinary API Key
  cloudinaryApiSecret?: string; // Cloudinary API Secret
  cloudinaryFolder?: string; // Target Cloudinary upload folder (default: 'mavluy_store')
  dashboardTheme?: 'dark' | 'midnight' | 'slate' | 'luxury-black' | 'emerald' | 'royal-indigo' | 'charcoal' | 'light' | 'custom'; // Dashboard color palette
  dashboardPrimaryColor?: string; // Dashboard main accent color (defaults to store theme color)
  dashboardBackgroundColor?: string; // Custom dashboard background color
  dashboardSidebarColor?: string; // Custom dashboard sidebar color
  dashboardCardColor?: string; // Custom dashboard card/panel color
  customTexts?: {
    ar?: Record<string, string>;
    en?: Record<string, string>;
    fr?: Record<string, string>;
  };
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  storeId?: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  total: number;
  currency?: string;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  date: string;
  updatedAt?: string | Date;
  trackingNumber?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'support';
  senderName?: string;
  text: string;
  date: string;
}

export interface SupportTicket {
  id: string;
  storeId?: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  seen?: boolean;
  date: string;
  updatedAt?: string | Date;
  messages?: TicketMessage[];
}

export interface AdminUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'store_admin';
  assignedStoreId?: string; // null / 'all' for super_admin, or e.g. 'ma', 'ly', 'sa' for store_admin
  createdAt?: string;
}

export interface Customer {
  id?: string;
  storeId?: string;
  name: string;
  phone: string;
  password?: string;
  email?: string;
  avatar?: string;
  favorites: string[];
}

export interface Review {
  id: string;
  storeId?: string;
  productId: string;
  productName?: string;
  author: string;
  authorPhone?: string;
  city?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  rating: number;
  comment: string;
  date: string;
  status: 'approved' | 'pending';
  featuredOnHome?: boolean;
  verifiedPurchase?: boolean;
}

export type PixelEventType = 
  | 'PageView' 
  | 'ViewContent' 
  | 'AddToCart' 
  | 'InitiateCheckout' 
  | 'Purchase' 
  | 'Lead';

export interface PixelEventRecord {
  id: string;
  storeId?: string;
  eventType: PixelEventType;
  timestamp: string; // ISO string
  pageUrl?: string;
  productId?: string;
  productName?: string;
  value?: number;
  currency?: string;
  orderId?: string;
  customerPhone?: string;
  customerName?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface PixelStatsSummary {
  period: 'today' | '7d' | '30d' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
  pageViews?: number;
  viewContents?: number;
  addToCarts?: number;
  initiateCheckouts?: number;
  purchases?: number;
  leads?: number;
  totalPurchaseValue?: number;
  currency: string;
  totals?: {
    pageViews: number;
    viewContents: number;
    addToCarts: number;
    initiateCheckouts: number;
    purchases: number;
    leads: number;
    purchaseValue: number;
  };
  conversionRates?: {
    viewToCartRate: number;
    cartToPurchaseRate: number;
    overallConversionRate: number;
  };
  funnel: {
    pageViews: number;
    viewContents: number;
    addToCarts: number;
    initiateCheckouts: number;
    purchases: number;
    viewRate: number; // % of pageViews that viewed content
    cartRate: number; // % of viewContent that added to cart
    checkoutRate: number; // % of addToCart that initiated checkout
    purchaseRate: number; // % of initiateCheckout that completed purchase
    overallConversionRate: number; // % of pageViews that purchased
  };
  dailyTrend: Array<{
    date: string;
    label: string;
    pageViews: number;
    viewContents: number;
    addToCarts: number;
    initiateCheckouts: number;
    purchases: number;
    leads: number;
    revenue: number;
  }>;
  topProductsViewed: Array<{ productId: string; productName: string; views: number; adds: number; purchases: number }>;
  events?: PixelEventRecord[];
  recentEvents: PixelEventRecord[];
}




