import React from 'react';
import {
  Award,
  ShieldCheck,
  Leaf,
  Droplets,
  Sprout,
  HeartPulse,
  Truck,
  Zap,
  CheckCircle,
  ThumbsUp,
  Clock,
  RotateCcw,
  RefreshCw,
  Gift,
  Star,
  Flame,
  BadgeCheck,
  Shield,
  Heart,
  Smile,
  Tag,
  Headphones,
  Check,
  Package,
  Layers,
  ShoppingBag,
  LayoutGrid,
  Boxes,
  Crown,
  Gem
} from 'lucide-react';

export interface FeatureIconItem {
  value: string;
  name: string;
  nameAr: string;
  category: 'trust' | 'tech' | 'shipping' | 'beauty' | 'general';
}

export const ALL_FEATURE_ICONS: FeatureIconItem[] = [
  { value: 'Award', name: 'Premium Quality', nameAr: 'جودة متميزة', category: 'trust' },
  { value: 'ShieldCheck', name: 'Guaranteed', nameAr: 'ضمان أصلي', category: 'trust' },
  { value: 'BadgeCheck', name: 'Certified', nameAr: 'معتمد وموثق', category: 'trust' },
  { value: 'Shield', name: 'Safe Purchase', nameAr: 'شراء آمن', category: 'trust' },
  { value: 'Crown', name: 'Exclusive Design', nameAr: 'تصميم أنيق وحصري', category: 'trust' },
  { value: 'Gem', name: 'Luxury Quality', nameAr: 'جودة راقية وفخمة', category: 'trust' },
  { value: 'ThumbsUp', name: 'Customer Satisfaction', nameAr: 'رضا العملاء', category: 'trust' },
  { value: 'Truck', name: 'Fast Delivery', nameAr: 'توصيل سريع مجاني', category: 'shipping' },
  { value: 'Package', name: 'Secure Packaging', nameAr: 'تغليف آمن ومحكم', category: 'shipping' },
  { value: 'Clock', name: 'Fast Processing', nameAr: 'معالجة سريعة', category: 'shipping' },
  { value: 'RotateCcw', name: 'Easy Return', nameAr: 'استرجاع واستبدال سهل', category: 'shipping' },
  { value: 'RefreshCw', name: 'Warranty', nameAr: 'ضمان شامل', category: 'shipping' },
  { value: 'Zap', name: 'High Speed / Power', nameAr: 'أداء فائق وقوة', category: 'tech' },
  { value: 'Leaf', name: '100% Natural', nameAr: 'مكونات طبيعية 100%', category: 'beauty' },
  { value: 'Droplets', name: 'Moisturizing / Purity', nameAr: 'ترطيب ونقاء فائق', category: 'beauty' },
  { value: 'Sprout', name: 'Organic & Healthy', nameAr: 'صحي وعضوي', category: 'beauty' },
  { value: 'HeartPulse', name: 'Health & Wellness', nameAr: 'صحة وعناية فائقة', category: 'beauty' },
  { value: 'LayoutGrid', name: 'General & Diverse', nameAr: 'منتجات متنوعة وشاملة', category: 'general' },
  { value: 'Star', name: 'Top Rated', nameAr: 'الأعلى تقييماً', category: 'general' },
  { value: 'Flame', name: 'Best Seller', nameAr: 'الأكثر مبيعاً', category: 'general' },
  { value: 'Gift', name: 'Special Offer', nameAr: 'عرض وهدايا مجانية', category: 'general' },
  { value: 'Headphones', name: '24/7 Support', nameAr: 'دعم فني متواصل', category: 'general' }
];

export const FEATURE_ICONS_LIST = ALL_FEATURE_ICONS.map(i => ({
  value: i.value,
  label: `${i.value} (${i.name})`
}));

export interface StoreCategoryItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  iconName: string;
}

export const ALL_STORE_CATEGORIES: StoreCategoryItem[] = [
  { id: 'general', name: 'General', nameAr: 'عام / متنوع', nameEn: 'General', iconName: 'LayoutGrid' },
  { id: 'beauty', name: 'Beauty & Care', nameAr: 'العناية والجمال', nameEn: 'Beauty & Care', iconName: 'Droplets' },
  { id: 'electronics', name: 'Electronics', nameAr: 'الأجهزة والإلكترونيات', nameEn: 'Electronics', iconName: 'Zap' },
  { id: 'home', name: 'Home & Kitchen', nameAr: 'المنزل والمطبخ', nameEn: 'Home & Kitchen', iconName: 'Package' },
  { id: 'fashion', name: 'Fashion & Apparel', nameAr: 'الموضة والأزياء', nameEn: 'Fashion & Apparel', iconName: 'Tag' },
  { id: 'health', name: 'Health & Fitness', nameAr: 'الصحة والرشاقة', nameEn: 'Health & Fitness', iconName: 'HeartPulse' },
  { id: 'automotive', name: 'Automotive', nameAr: 'إكسسوارات السيارات', nameEn: 'Automotive', iconName: 'Truck' },
  { id: 'kids', name: 'Kids & Toys', nameAr: 'الأطفال والألعاب', nameEn: 'Kids & Toys', iconName: 'Smile' }
];

export function renderFeatureVectorIcon(iconName: string, className = 'w-5 h-5'): React.ReactNode {
  if (!iconName) return <LayoutGrid className={className} />;

  const cleanName = iconName.trim().toLowerCase();

  switch (cleanName) {
    case 'award':
      return <Award className={className} />;
    case 'shieldcheck':
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'badgecheck':
    case 'badge-check':
      return <BadgeCheck className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'thumbsup':
    case 'thumbs-up':
      return <ThumbsUp className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'rotateccw':
    case 'rotate-ccw':
      return <RotateCcw className={className} />;
    case 'refreshcw':
    case 'refresh-cw':
      return <RefreshCw className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'layoutgrid':
    case 'layout-grid':
    case 'grid':
    case 'boxes':
    case 'sparkles':
    case 'sparkle':
      return <LayoutGrid className={className} />;
    case 'leaf':
      return <Leaf className={className} />;
    case 'droplets':
      return <Droplets className={className} />;
    case 'sprout':
      return <Sprout className={className} />;
    case 'heartpulse':
    case 'heart-pulse':
      return <HeartPulse className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'check':
    case 'checkcircle':
    case 'check-circle':
      return <CheckCircle className={className} />;
    case 'shoppingbag':
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'layers':
      return <Layers className={className} />;
    default:
      return <LayoutGrid className={className} />;
  }
}
