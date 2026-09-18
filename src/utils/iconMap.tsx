import React from 'react';
import {
  Award,
  ShieldCheck,
  Leaf,
  Sparkles,
  Heart,
  Zap,
  Truck,
  CheckCircle2,
  Star,
  ThumbsUp,
  Package,
  Clock,
  RefreshCw,
  BatteryCharging,
  Flame,
  Gem,
  Smile,
  Check,
  Percent,
  Tag,
  Shield,
  Gift,
  HelpCircle,
  TrendingUp,
  Sliders,
  Feather,
  Sun,
  Crown,
  Coffee,
  Globe,
  Headphones,
  Footprints,
  Droplet,
  Smartphone,
  Eye,
  Camera,
  Scissors
} from 'lucide-react';

export interface FeatureIconItem {
  value: string;
  name: string;
  nameAr: string;
  category: 'trust' | 'tech' | 'shipping' | 'beauty' | 'general';
}

export const ALL_FEATURE_ICONS: FeatureIconItem[] = [
  { value: 'Award', name: 'Premium Quality', nameAr: 'جودة ممتازة', category: 'trust' },
  { value: 'ShieldCheck', name: 'Guaranteed Authentic', nameAr: 'ضمان أصلي 100%', category: 'trust' },
  { value: 'Leaf', name: '100% Natural / Eco', nameAr: 'طبيعي 100%', category: 'beauty' },
  { value: 'Truck', name: 'Fast Delivery', nameAr: 'توصيل سريع', category: 'shipping' },
  { value: 'Package', name: 'Safe Packaging', nameAr: 'تغليف آمن ومحكم', category: 'shipping' },
  { value: 'Zap', name: 'Instant Fast Results', nameAr: 'نتائج سريعة ومبهرة', category: 'tech' },
  { value: 'Sparkles', name: 'Glowing & Radiance', nameAr: 'إشراقة ولمعان', category: 'beauty' },
  { value: 'Heart', name: 'Loved by Customers', nameAr: 'محبوب من الزبائن', category: 'general' },
  { value: 'CheckCircle2', name: 'Tested & Approved', nameAr: 'مختبر وموثوق', category: 'trust' },
  { value: 'Star', name: '5-Star Rated', nameAr: 'تقييم ممتاز', category: 'trust' },
  { value: 'ThumbsUp', name: 'Recommended', nameAr: 'موصى به', category: 'general' },
  { value: 'Clock', name: 'Long Lasting', nameAr: 'يدوم طويلاً', category: 'general' },
  { value: 'RefreshCw', name: 'Easy Return / Exchange', nameAr: 'استرجاع واستبدال سهل', category: 'trust' },
  { value: 'BatteryCharging', name: 'Long Battery Life', nameAr: 'بطارية تدوم طويلاً', category: 'tech' },
  { value: 'Flame', name: 'Hot Seller', nameAr: 'الأكثر مبيعاً', category: 'general' },
  { value: 'Gem', name: 'Luxury Craftsmanship', nameAr: 'تصميم فاخر', category: 'beauty' },
  { value: 'Droplet', name: 'Moisturizing & Pure', nameAr: 'ترطيب عميق', category: 'beauty' },
  { value: 'Smartphone', name: 'Smart & Connected', nameAr: 'ذكي ومتطور', category: 'tech' },
  { value: 'Crown', name: 'VIP Excellence', nameAr: 'اختيار النخبة', category: 'trust' },
  { value: 'Sun', name: 'Daily Protection', nameAr: 'حماية يومية', category: 'beauty' },
  { value: 'Gift', name: 'Perfect Gift', nameAr: 'هدية مثالية', category: 'general' },
  { value: 'Headphones', name: '24/7 Support', nameAr: 'دعم فني متواصل', category: 'trust' }
];

export const FEATURE_ICONS_LIST = ALL_FEATURE_ICONS;

export const ALL_STORE_CATEGORIES = [
  { id: 'General', name: 'General', nameAr: 'عام', nameEn: 'General', iconName: 'Package' },
  { id: 'Cosmetics', name: 'Cosmetics', nameAr: 'مستحضرات وتجميل', nameEn: 'Cosmetics & Beauty', iconName: 'Sparkles' },
  { id: 'Health', name: 'Health', nameAr: 'صحة وعناية', nameEn: 'Health & Care', iconName: 'Heart' },
  { id: 'Electronics', name: 'Electronics', nameAr: 'إلكترونيات وأجهزة', nameEn: 'Electronics', iconName: 'Smartphone' },
  { id: 'Fashion', name: 'Fashion', nameAr: 'أزياء وملابس', nameEn: 'Fashion & Apparel', iconName: 'Crown' },
  { id: 'Home', name: 'Home', nameAr: 'المنزل والديكور', nameEn: 'Home & Kitchen', iconName: 'Coffee' },
  { id: 'Perfumes', name: 'Perfumes', nameAr: 'عطور وبخور', nameEn: 'Perfumes & Scents', iconName: 'Droplet' },
  { id: 'Accessories', name: 'Accessories', nameAr: 'إكسسوارات وهدايا', nameEn: 'Accessories', iconName: 'Gem' }
];

export function renderFeatureVectorIcon(iconName: string | undefined | null, className = 'w-5 h-5'): React.ReactNode {
  const norm = (iconName || '').trim().toLowerCase();

  switch (norm) {
    case 'award':
      return <Award className={className} />;
    case 'shieldcheck':
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'leaf':
      return <Leaf className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'checkcircle2':
    case 'check-circle-2':
    case 'checkcircle':
      return <CheckCircle2 className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'thumbsup':
    case 'thumbs-up':
      return <ThumbsUp className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'refreshcw':
    case 'refresh-cw':
      return <RefreshCw className={className} />;
    case 'batterycharging':
    case 'battery-charging':
      return <BatteryCharging className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'smile':
      return <Smile className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'droplet':
      return <Droplet className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'footprints':
      return <Footprints className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'camera':
      return <Camera className={className} />;
    case 'scissors':
      return <Scissors className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'trendingup':
    case 'trending-up':
      return <TrendingUp className={className} />;
    case 'feather':
      return <Feather className={className} />;
    default:
      return <Award className={className} />;
  }
}
