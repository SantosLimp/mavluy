export interface CountryStore {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  currency: string;
  currencySymbol: string;
  language: 'ar' | 'en' | 'fr';
  status: 'active' | 'disabled';
  storeName: string;
  logo?: string;
  slug: string;
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
  quantity: number;
  price: number;
  unitPrice?: number;
  label?: string;
  labelAr?: string;
  labelFr?: string;
  badge?: string;
  isPopular?: boolean;
  discountPercentage?: number;
}

export interface Product {
  id: string;
  storeId?: string;
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
  costPrice?: number;
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
  imageOffsetY?: number;
  videoUrl?: string;
  videoThumbnail?: string;
  videoPosition?: 'first' | 'after_photos';
  videoAsPrimary?: boolean;
  videoAutoplay?: boolean;
  pricingTiers?: PricingTier[];
  enableNotesField?: boolean;
  notesFieldLabel?: string;
  notesFieldPlaceholder?: string;
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
  productId?: string;
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
  accentColor: string;
  themePrimaryColor?: string;
  currency: string;
  shippingFee: number;
  location: string;
  logo?: string;
  logoType?: 'text' | 'image';
  logoTextPrefix?: string;
  logoTextAccent?: string;
  logoTagline?: string;
  logoFontStyle?: 'italic-luxury' | 'serif' | 'modern-sans' | 'display-bold';
  logoAccentColor?: string;
  logoImage?: string;
  logoImageHeight?: number;
  supportStatusMode?: 'manual' | 'schedule';
  supportIsOnline?: boolean;
  supportStartTime?: string;
  supportEndTime?: string;
  supportWorkDays?: string;
  supportFaqs?: SupportFaq[];
  metaPixelId?: string;
  tiktokPixelId?: string;
  pixelTrackingEnabled?: boolean;
  customAdminSlug?: string;
  customAdminLoginSlug?: string;
  customAdminRegisterSlug?: string;
  customSupportSlug?: string;
  customProductsSlug?: string;
  customProfileSlug?: string;
  customFavoritesSlug?: string;
  customCartSlug?: string;
  customCheckoutSlug?: string;
  allowAdminRegistration?: boolean;
  affiliatePlatformName?: string;
  affiliateWebhookUrl?: string;
  affiliateWebhookApiKey?: string;
  affiliateAutoSync?: boolean;
  googleSheetWebhookUrl?: string;
  googleSheetAutoSync?: boolean;
  storeBackgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  storeCardBackgroundColor?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryFolder?: string;
  dashboardTheme?: 'dark' | 'midnight' | 'slate' | 'luxury-black' | 'emerald' | 'royal-indigo' | 'charcoal' | 'light' | 'custom';
  dashboardPrimaryColor?: string;
  dashboardBackgroundColor?: string;
  dashboardSidebarColor?: string;
  dashboardCardColor?: string;
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
  sku?: string;
  variant?: string;
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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
  date: string;
  updatedAt?: string | Date;
  trackingNumber?: string;
  notes?: string;
  sku?: string;
  affiliateOrderId?: string;
  affiliateStatus?: string;
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
  assignedStoreId?: string;
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
  status: 'approved' | 'pending' | 'hidden';
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
  timestamp: string;
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
    viewRate: number;
    cartRate: number;
    checkoutRate: number;
    purchaseRate: number;
    overallConversionRate: number;
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

export type AdPlatformType = 'tiktok' | 'meta' | 'snapchat' | 'google' | 'influencer' | 'other';

export interface AdSpendEntry {
  id: string;
  storeId?: string;
  platform: AdPlatformType;
  amount: number;
  date: string;
  campaignName?: string;
  productId?: string;
  productName?: string;
  notes?: string;
  createdAt?: string;
}

export type ExpenseCategoryType =
  | 'delivery_extra'
  | 'return_fees'
  | 'packaging'
  | 'call_center'
  | 'ad_account_fee'
  | 'salaries'
  | 'software'
  | 'rent'
  | 'product_sampling'
  | 'other';

export interface ExpenseEntry {
  id: string;
  storeId?: string;
  category: ExpenseCategoryType;
  title: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface FinancialSettings {
  storeId?: string;
  defaultDeliveryFeePerOrder: number;
  defaultReturnFeePerOrder: number;
  defaultPackagingCostPerOrder: number;
  defaultCallCenterCostPerOrder: number;
  targetMarginPercent?: number;
  targetRoas?: number;
}

export interface ProductProfitSummary {
  productId: string;
  productName: string;
  productImage: string;
  sku?: string;
  retailPrice: number;
  costPrice: number;
  unitsSold: number;
  unitsDelivered: number;
  totalRevenue: number;
  totalDeliveredRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  status: 'star' | 'profitable' | 'low_margin' | 'loss' | 'no_cost';
}
