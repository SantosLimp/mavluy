export interface ProductFeature {
  id?: string;
  title: string;
  titleEn?: string;
  desc: string;
  descEn?: string;
  iconName?: string;
  icon?: string;
  imageUrl?: string;
}

export interface ProductFaq {
  id?: string;
  q: string;
  qEn?: string;
  a: string;
  aEn?: string;
}

export interface PricingTier {
  id: string;
  quantity: number;
  price?: number;
  pricePerUnit?: number;
  totalPrice?: number;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  label?: string;
  labelAr?: string;
  labelEn?: string;
  badge?: string;
  badgeEn?: string;
  isPopular?: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  tags?: string[];
  price: number;
  originalPrice?: number;
  costPrice?: number;
  currency?: string;
  image: string;
  additionalImages?: string[];
  category: string;
  categoryEn?: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  tagline?: string;
  howToUse?: string | string[];
  imagePosition?: string;
  imageOffsetY?: number;
  imageFit?: string;
  stock?: number;
  inStock?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  rating?: number;
  reviewsCount?: number;
  videoUrl?: string;
  videoThumbnail?: string;
  videoPosition?: 'first' | 'after_photos' | 'hidden';
  videoAsPrimary?: boolean;
  videoAutoplay?: boolean;
  features?: ProductFeature[];
  faqs?: ProductFaq[];
  pricingTiers?: PricingTier[];
  landingTemplate?: string;
  landingHeadline?: string;
  landingHeadlineEn?: string;
  landingSubheadline?: string;
  landingSubheadlineEn?: string;
  landingBenefits?: string[];
  landingBenefitsEn?: string[];
  landingShowReviews?: boolean;
  landingShowFaqs?: boolean;
  landingShowOrderForm?: boolean;
  showCouponField?: boolean;
  enableNotesField?: boolean;
  notesFieldLabel?: string;
  notesFieldPlaceholder?: string;
  storeId?: string;
  countryCode?: string;
  badge?: string;
  badgeEn?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  bannerTitle?: string;
  bannerTitleEn?: string;
  bannerSubtitle?: string;
  bannerSubtitleEn?: string;
  bannerImage?: string;
  accentColor?: string;
  themePrimaryColor?: string;
  currency: string;
  shippingFee: number;
  location?: string;
  logo?: string;
  logoType?: 'text' | 'image';
  logoTextPrefix?: string;
  logoTextAccent?: string;
  logoTagline?: string;
  logoFontStyle?: string;
  logoAccentColor?: string;
  logoImage?: string;
  logoImageHeight?: number;
  supportStatusMode?: 'schedule' | 'manual';
  supportIsOnline?: boolean;
  supportStartTime?: string;
  supportEndTime?: string;
  supportWorkDays?: string;
  supportFaqs?: SupportFaq[];
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
  storeBackgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  dashboardTheme?: string;
  dashboardBackgroundColor?: string;
  dashboardSidebarColor?: string;
  dashboardCardColor?: string;
  dashboardPrimaryColor?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryFolder?: string;
  googleSheetWebhookUrl?: string;
  googleSheetAutoSync?: boolean;
  googleSheetId?: string;
  googleSheetApiKey?: string;
  affiliateWebhookApiKey?: string;
  affiliateAutoSync?: boolean;
  affiliatePlatformName?: string;
  affiliateWebhookUrl?: string;
  customTexts?: Record<string, Record<string, string>>;
  facebookPixelId?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  snapchatPixelId?: string;
  googleAnalyticsId?: string;
  pixelTrackingEnabled?: boolean;
  customCss?: string;
  customHeaderScripts?: string;
  customFooterScripts?: string;
}

export interface CountryStore {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  currency: string;
  currencySymbol: string;
  language: 'ar' | 'en' | 'fr';
  status: 'active' | 'inactive' | 'disabled' | string;
  storeName: string;
  slug: string;
  shippingFee: number;
  flag: string;
  logo?: string;
}

export interface OrderItem {
  productId: string;
  productName?: string;
  productTitle?: string;
  quantity: number;
  price: any;
  sku?: string;
  image?: string;
  selectedTier?: PricingTier;
  selectedVariant?: any;
  currency?: string;
  tierLabel?: string;
  lineTotal?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedTier?: PricingTier;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerAddress?: string;
  city?: string;
  address?: string;
  note?: string;
  notes?: string;
  sku?: string;
  items: OrderItem[];
  totalAmount?: any;
  total?: any;
  totalPrice?: any;
  subtotal?: any;
  shippingFee?: number;
  discountAmount?: number;
  couponCode?: string;
  currency?: string;
  affiliateOrderId?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'processing' | string;
  createdAt?: string;
  date?: string;
  updatedAt?: string;
  storeId?: string;
  trackingNumber?: string;
  countryCode?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'admin' | 'support';
  senderName?: string;
  text: string;
  createdAt?: string;
  date?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerPhone: string;
  subject?: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  seen?: boolean;
  createdAt?: string;
  date?: string;
  updatedAt?: string;
  messages?: TicketMessage[];
  orderId?: string;
  storeId?: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  iconName?: string;
  image?: string;
  slug?: string;
  order?: number;
  storeId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  type?: 'percentage' | 'fixed' | string;
  value?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  expiryDate?: string;
  usageLimit?: number;
  usedCount?: number;
  maxUses?: number;
  isActive?: boolean;
  status?: string;
  showOnProductPage?: boolean;
  showBadgeOnProductCard?: boolean;
  productId?: string;
  productName?: string;
  storeId?: string;
}

export interface ShippingMethod {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  city?: string;
  cost?: number;
  price?: number;
  estimatedDelivery?: string;
  estimatedDays?: string;
  isActive?: boolean;
  status?: string;
  storeId?: string;
}

export interface TaxConfig {
  isEnabled: boolean;
  ratePercent: number;
  taxName?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  customerName: string;
  author?: string;
  customerPhone?: string;
  authorPhone?: string;
  city?: string;
  customerCity?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  date?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'hidden' | string;
  avatar?: string;
  verifiedPurchase?: boolean;
  featuredOnHome?: boolean;
  images?: string[];
  storeId?: string;
}

export interface AdminUser {
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'store_admin';
  assignedStoreId?: string;
  createdAt?: string;
}

export interface Customer {
  phone: string;
  name: string;
  password?: string;
  email?: string;
  avatar?: string;
  favorites?: string[];
  createdAt?: string;
  storeId?: string;
}

export type PixelEventType =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'Contact'
  | 'Search'
  | string;

export interface PixelEventRecord {
  id: string;
  eventName?: PixelEventType;
  eventType?: string;
  pageUrl?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: string;
  platform?: 'facebook' | 'tiktok' | 'snapchat' | 'google' | string;
  data?: Record<string, any>;
  productId?: string;
  productName?: string;
  orderId?: string;
  value?: number;
  currency?: string;
  customerPhone?: string;
  customerName?: string;
  storeId?: string;
}

export interface PixelStatsSummary {
  totalEvents?: number;
  pageViews?: number;
  viewContents?: number;
  addToCarts?: number;
  initiateCheckouts?: number;
  purchases?: number;
  leads?: number;
  revenue?: number;
  totals?: any;
  funnel?: any;
  conversionRates?: any;
  totalPurchaseValue?: number;
  events?: any[];
  recentEvents?: any[];
  currency?: string;
  topProductsViewed?: any[];
  [key: string]: any;
}

export type AdPlatformType = 'facebook' | 'tiktok' | 'snapchat' | 'google' | 'other' | string;

export interface AdSpendEntry {
  id: string;
  date: string;
  platform: AdPlatformType;
  campaignName?: string;
  productId?: string;
  spend?: number;
  amount?: number;
  currency?: string;
  storeId?: string;
  notes?: string;
  createdAt?: string;
}

export type ExpenseCategoryType = 'shipping' | 'packaging' | 'marketing' | 'salaries' | 'tools' | 'other' | string;

export interface ExpenseEntry {
  id: string;
  date: string;
  category: ExpenseCategoryType;
  title?: string;
  amount: number;
  currency?: string;
  storeId?: string;
  notes?: string;
  createdAt?: string;
}

export interface ProductProfitSummary {
  productId: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  sku?: string;
  retailPrice?: number;
  costPrice?: number;
  revenue?: number;
  totalRevenue?: number;
  unitsSold: number;
  unitsDelivered?: number;
  totalDeliveredRevenue?: number;
  totalCost?: number;
  costOfGoods?: number;
  grossProfit: number;
  grossMarginPercent?: number;
  netProfit?: number;
  marginPercent?: number;
  status?: string;
  adSpend?: number;
  shippingCost?: number;
}

export interface FinancialSettings {
  defaultDeliveryFeePerOrder: number;
  defaultReturnFeePerOrder: number;
  defaultPackagingCostPerOrder: number;
  defaultCallCenterCostPerOrder: number;
  targetMarginPercent: number;
  targetRoas: number;
}
