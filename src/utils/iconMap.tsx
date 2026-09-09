import React from 'react';
import {
  Award,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Star,
  Gem,
  Crown,
  ThumbsUp,
  Heart,
  Shield,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Zap,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Camera,
  Volume2,
  Cpu,
  Tv,
  Gamepad2,
  Truck,
  Clock,
  RefreshCw,
  Box,
  Package,
  Leaf,
  Droplets,
  Flame,
  HeartPulse,
  Scissors,
  Home,
  Sun,
  Wind,
  Tag,
  ShoppingBag,
  Gift,
  Percent,
  Compass,
  Palette,
  Shapes
} from 'lucide-react';

export interface FeatureIconItem {
  value: string;
  name: string;
  nameAr: string;
  category: 'trust' | 'tech' | 'shipping' | 'beauty' | 'general';
  component: React.ComponentType<{ className?: string }>;
}

export const ALL_FEATURE_ICONS: FeatureIconItem[] = [
  { value: 'Award', name: 'Award / Premium Quality', nameAr: 'جودة استثنائية معتمدة', category: 'trust', component: Award },
  { value: 'ShieldCheck', name: 'Shield / Guarantee & Security', nameAr: 'ضمان شامل وأمان 100%', category: 'trust', component: ShieldCheck },
  { value: 'BadgeCheck', name: 'Badge / Verified Authentic', nameAr: 'منتج أصلي موثق ومطابق', category: 'trust', component: BadgeCheck },
  { value: 'CheckCircle2', name: 'Check / Tested & Approved', nameAr: 'مفحوص ومجرب مخبرياً', category: 'trust', component: CheckCircle2 },
  { value: 'Star', name: 'Star / 5-Star Top Rated', nameAr: 'تقييم 5 نجوم من العملاء', category: 'trust', component: Star },
  { value: 'Crown', name: 'Crown / Luxury & VIP Edition', nameAr: 'إصدار فاخر حصري VIP', category: 'trust', component: Crown },
  { value: 'Gem', name: 'Diamond / High-End Materials', nameAr: 'خامات راقية وفائقة المتانة', category: 'trust', component: Gem },
  { value: 'ThumbsUp', name: 'Thumbs Up / Highly Recommended', nameAr: 'موصى به بشدة من الخبراء', category: 'trust', component: ThumbsUp },
  { value: 'Heart', name: 'Heart / Customer Favorite', nameAr: 'الأكثر طلباً ومحبة', category: 'trust', component: Heart },
  { value: 'Shield', name: 'Shield / Full Protection', nameAr: 'حماية كاملة ومقاومة', category: 'trust', component: Shield },

  { value: 'Zap', name: 'Lightning / Fast Power & Super Speed', nameAr: 'شحن فائق السرعة وقوة أداء', category: 'tech', component: Zap },
  { value: 'BatteryCharging', name: 'Battery / Long-Lasting Endurance', nameAr: 'بطارية ضخمة تدوم طويلاً', category: 'tech', component: BatteryCharging },
  { value: 'Smartphone', name: 'Smartphone / Smart Connectivity', nameAr: 'اتصال ذكي متوافق مع الهواتف', category: 'tech', component: Smartphone },
  { value: 'Headphones', name: 'Headphones / Crystal Clear Audio & ANC', nameAr: 'صوت محيطي نقي وعزل ضوضاء', category: 'tech', component: Headphones },
  { value: 'Watch', name: 'Smartwatch / Health & Activity Tracking', nameAr: 'تتبع النشاط والصحة الذكي', category: 'tech', component: Watch },
  { value: 'Cpu', name: 'Processor / High-Performance Chip', nameAr: 'معالج متطور وسريع جداً', category: 'tech', component: Cpu },
  { value: 'Bluetooth', name: 'Bluetooth / Wireless 5.3 Tech', nameAr: 'بلوتوث لاسلكي فوري ومستقر', category: 'tech', component: Bluetooth },
  { value: 'Wifi', name: 'Wi-Fi / High-Speed Connection', nameAr: 'ربط لاسلكي سريع ومباشر', category: 'tech', component: Wifi },
  { value: 'Camera', name: 'Camera / HD Clear Optics', nameAr: 'عدسة عالية الوضوح HD', category: 'tech', component: Camera },
  { value: 'Volume2', name: 'Speaker / Hi-Fi Sound & Bass', nameAr: 'مكبر صوت Hi-Fi عالي الدقة', category: 'tech', component: Volume2 },
  { value: 'Gamepad2', name: 'Gamepad / Pro Gaming Response', nameAr: 'استجابة فائقة السرعة للألعاب', category: 'tech', component: Gamepad2 },
  { value: 'Laptop', name: 'Laptop / Modern Workplace', nameAr: 'ملائم للعمل والمكتب العصري', category: 'tech', component: Laptop },
  { value: 'Tv', name: 'Screen / Ultra HD Display', nameAr: 'شاشة سينمائية فائقة الوضوح', category: 'tech', component: Tv },

  { value: 'Truck', name: 'Truck / Express Doorstep Delivery', nameAr: 'توصيل سريع حتى باب المنزل', category: 'shipping', component: Truck },
  { value: 'Clock', name: 'Clock / 24-48h Rapid Dispatch', nameAr: 'شحن فوري خلال 24-48 ساعة', category: 'shipping', component: Clock },
  { value: 'RefreshCw', name: 'Exchange / Hassle-Free Returns', nameAr: 'استبدال واسترجاع سهل وفوري', category: 'shipping', component: RefreshCw },
  { value: 'Package', name: 'Package / Inspect Before You Pay', nameAr: 'افتح الطرد وعاين قبل الدفع', category: 'shipping', component: Package },
  { value: 'Box', name: 'Box / Premium Secure Packaging', nameAr: 'تغليف آمن ومحكم للحماية', category: 'shipping', component: Box },

  { value: 'Leaf', name: 'Leaf / 100% Pure & Organic', nameAr: '100% طبيعي ونقي وعضوي', category: 'beauty', component: Leaf },
  { value: 'Droplets', name: 'Droplets / Deep Moisture & Hydration', nameAr: 'ترطيب عميق ونضارة دائمة', category: 'beauty', component: Droplets },
  { value: 'Palette', name: 'Palette / Vibrant Colors & Style', nameAr: 'ألوان جذابة وتنسيق عصري', category: 'beauty', component: Palette },
  { value: 'Shapes', name: 'Shapes / Modern Pro Aesthetic', nameAr: 'تصميم هندسي متقن وعصري', category: 'beauty', component: Shapes },
  { value: 'HeartPulse', name: 'Health / Dermatologist Tested', nameAr: 'مختبر ومعتمد من أطباء الجلد', category: 'beauty', component: HeartPulse },
  { value: 'Flame', name: 'Flame / Fast Thermal Action', nameAr: 'تسخين فوري وحرارة متوازنة', category: 'beauty', component: Flame },
  { value: 'Scissors', name: 'Scissors / Tailored Ergonomic Fit', nameAr: 'تفصيل وحياكة دقيقة ومريحة', category: 'beauty', component: Scissors },
  { value: 'Sun', name: 'Sun / UV Protection & Care', nameAr: 'حماية وعناية متكاملة', category: 'beauty', component: Sun },
  { value: 'Wind', name: 'Wind / Breathable & Lightweight', nameAr: 'أقمشة مسامية وخفيفة جداً', category: 'beauty', component: Wind },

  { value: 'Home', name: 'Home / Living & Modern Comfort', nameAr: 'راحة وأناقة للمنزل العصري', category: 'general', component: Home },
  { value: 'Tag', name: 'Tag / Best Price Guaranteed', nameAr: 'أفضل قيمة وسعر تنافسي', category: 'general', component: Tag },
  { value: 'Gift', name: 'Gift / Perfect Luxury Gift', nameAr: 'هدية راقية ومميزة للأحباء', category: 'general', component: Gift },
  { value: 'ShoppingBag', name: 'Bag / Essential Daily Choice', nameAr: 'خيار أساسي للاستخدام اليومي', category: 'general', component: ShoppingBag },
  { value: 'Percent', name: 'Percent / Special Discount Offer', nameAr: 'عرض خاص وتخفيض حصري', category: 'general', component: Percent },
  { value: 'Compass', name: 'Compass / Outdoor & Versatile', nameAr: 'متعدد الاستخدامات والتنقل', category: 'general', component: Compass }
];

export const FEATURE_ICONS_LIST = ALL_FEATURE_ICONS.map(i => ({
  value: i.value,
  label: `${i.name} (${i.nameAr})`
}));

export const renderFeatureVectorIcon = (iconName: string, className = "w-5 h-5") => {
  const item = ALL_FEATURE_ICONS.find(i => i.value.toLowerCase() === (iconName || '').toLowerCase());
  if (item) {
    const Component = item.component;
    return <Component className={className} />;
  }

  switch (iconName) {
    case 'Award': return <Award className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'BadgeCheck': return <BadgeCheck className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Gem': return <Gem className={className} />;
    case 'ThumbsUp': return <ThumbsUp className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'BatteryCharging': return <BatteryCharging className={className} />;
    case 'Smartphone': return <Smartphone className={className} />;
    case 'Headphones': return <Headphones className={className} />;
    case 'Watch': return <Watch className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Bluetooth': return <Bluetooth className={className} />;
    case 'Wifi': return <Wifi className={className} />;
    case 'Camera': return <Camera className={className} />;
    case 'Volume2': return <Volume2 className={className} />;
    case 'Gamepad2': return <Gamepad2 className={className} />;
    case 'Laptop': return <Laptop className={className} />;
    case 'Tv': return <Tv className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'Package': return <Package className={className} />;
    case 'Box': return <Box className={className} />;
    case 'Leaf': return <Leaf className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Palette': return <Palette className={className} />;
    case 'Shapes': return <Shapes className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Tag': return <Tag className={className} />;
    case 'Gift': return <Gift className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'Percent': return <Percent className={className} />;
    default: return <Award className={className} />;
  }
};

export interface StoreCategoryItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  iconName: string;
  descriptionAr: string;
}

export const ALL_STORE_CATEGORIES: StoreCategoryItem[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    nameAr: 'إلكترونيات وأجهزة ذكية',
    nameEn: 'Electronics & Smart Tech',
    nameFr: 'Électronique & High-Tech',
    iconName: 'Zap',
    descriptionAr: 'شواحن، سماعات لاسلكية، باور بانك، وأحدث الأجهزة الذكية'
  },
  {
    id: 'phones',
    name: 'Phones',
    nameAr: 'هواتف وملحقاتها',
    nameEn: 'Phones & Accessories',
    nameFr: 'Téléphones & Accessoires',
    iconName: 'Smartphone',
    descriptionAr: 'أغطية حماية، حوامل سيارة، كابلات شحن سريعة ووصلات'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    nameAr: 'ألعاب وجيمينج',
    nameEn: 'Gaming & Gadgets',
    nameFr: 'Jeux & Gadgets',
    iconName: 'Gamepad2',
    descriptionAr: 'يد تحكم، إضاءات RGB، ملحقات البلايستيشن والكمبيوتر'
  },
  {
    id: 'watches',
    name: 'Watches',
    nameAr: 'ساعات وإكسسوارات',
    nameEn: 'Watches & Accessories',
    nameFr: 'Montres & Accessoires',
    iconName: 'Watch',
    descriptionAr: 'ساعات ذكية، ساعات كلاسيكية فاخرة، وأساور عصرية'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    nameAr: 'أجهزة المطبخ والمنزل',
    nameEn: 'Kitchen & Home Appliances',
    nameFr: 'Électroménager & Cuisine',
    iconName: 'Flame',
    descriptionAr: 'أدوات طهي عصرية، خلاطات محمولة، وأجهزة كهرومنزلية مبتكرة'
  },
  {
    id: 'skincare',
    name: 'Skincare',
    nameAr: 'عناية وجمال',
    nameEn: 'Beauty & Skincare',
    nameFr: 'Soins & Beauté',
    iconName: 'Droplets',
    descriptionAr: 'منتجات العناية بالبشرة، زيوت طبيعية، وأدوات التجميل'
  },
  {
    id: 'perfumes',
    name: 'Perfumes',
    nameAr: 'عطور وبخور',
    nameEn: 'Perfumes & Fragrances',
    nameFr: 'Parfums & Senteurs',
    iconName: 'Flame',
    descriptionAr: 'عطور فاخرة، بخور أصيل، ومبخرات إلكترونية ذكية'
  },
  {
    id: 'clothing',
    name: 'Clothing',
    nameAr: 'أزياء وملابس',
    nameEn: 'Fashion & Clothing',
    nameFr: 'Mode & Vêtements',
    iconName: 'Scissors',
    descriptionAr: 'أحدث صيحات الموضة، ملابس مريحة، وأزياء رجالية ونسائية'
  },
  {
    id: 'shoes',
    name: 'Shoes',
    nameAr: 'أحذية وحقائب',
    nameEn: 'Shoes & Bags',
    nameFr: 'Chaussures & Sacs',
    iconName: 'ShoppingBag',
    descriptionAr: 'أحذية رياضية، حقائب سفر، وحقائب يد عصرية'
  },
  {
    id: 'home-decor',
    name: 'Home decor',
    nameAr: 'ديكور ومنزل',
    nameEn: 'Home Decor & Living',
    nameFr: 'Maison & Décoration',
    iconName: 'Home',
    descriptionAr: 'إضاءات ديكورية، لمسات منزلية مريحة، وترتيب الغرف'
  },
  {
    id: 'sports',
    name: 'Sports',
    nameAr: 'رياضة ولياقة',
    nameEn: 'Sports & Fitness',
    nameFr: 'Sport & Fitness',
    iconName: 'HeartPulse',
    descriptionAr: 'أدوات تمرين منزلية، أحزمة رياضية، ومعدات اللياقة'
  },
  {
    id: 'baby',
    name: 'Baby',
    nameAr: 'أطفال وألعاب',
    nameEn: 'Baby & Kids',
    nameFr: 'Bébés & Enfants',
    iconName: 'Gift',
    descriptionAr: 'ألعاب تعليمية، مستلزمات الأطفال، وهدايا الصغار'
  },
  {
    id: 'automotive',
    name: 'Automotive',
    nameAr: 'سيارات ولوازمها',
    nameEn: 'Car Accessories',
    nameFr: 'Accessoires Auto',
    iconName: 'Compass',
    descriptionAr: 'منظفات سيارات، حوامل هواتف، وأجهزة فحص ومنفاخ ذكي'
  },
  {
    id: 'general',
    name: 'General',
    nameAr: 'منتجات عامة ومختارة',
    nameEn: 'General Store',
    nameFr: 'Boutique Générale',
    iconName: 'Tag',
    descriptionAr: 'مختارات مميزة ومتنوعة من أفضل العروض الحصرية'
  }
];

export const getCategoryDisplayName = (categoryName: string, lang: 'ar' | 'en' | 'fr' = 'ar'): string => {
  if (!categoryName) return '';
  if (categoryName === 'All') {
    return lang === 'ar' ? 'الكل' : lang === 'fr' ? 'Tous' : 'All';
  }
  const clean = categoryName.trim().toLowerCase();
  const match = ALL_STORE_CATEGORIES.find(c =>
    c.name.toLowerCase() === clean ||
    c.nameAr.toLowerCase() === clean ||
    c.nameEn.toLowerCase() === clean ||
    c.nameFr.toLowerCase() === clean ||
    c.id.toLowerCase() === clean
  );
  if (match) {
    if (lang === 'ar') return match.nameAr;
    if (lang === 'fr') return match.nameFr;
    return match.nameEn;
  }
  return categoryName;
};
