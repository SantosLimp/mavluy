import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity,
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  Coins, 
  Users, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Phone, 
  MapPin, 
  Save, 
  Eye, 
  EyeOff,
  Package, 
  AlertCircle, 
  LogOut, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageCircle, 
  MessageSquare, 
  Check, 
  Tag,
  Star,
  Percent,
  Search,
  HelpCircle,
  Info,
  Image as ImageIcon,
  ListPlus,
  Layers,
  Globe,
  Flag,
  ShieldAlert,
  ExternalLink,
  X,
  ArrowLeft,
  ArrowRight,
  Upload,
  Database,
  RefreshCw,
  Server,
  Cloud,
  Download,
  FileSpreadsheet,
  FileUp,
  FileDown,
  Send,
  Calendar,
  Filter,
  FileText,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  Palette,
  BarChart3,
  MoreHorizontal,
  Home,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Heart,
  Copy,
  LogIn,
  UserPlus,
  User,
  CreditCard,
  Lock
} from 'lucide-react';
import { Product, StoreConfig, Order, SupportTicket, CountryStore, Category, Coupon, ShippingMethod, Review, ProductFeature, ProductFaq, SupportFaq } from '../types';
import { GLOBAL_CITIES, DEFAULT_SUPPORT_FAQS } from '../data';
import { CountryFlag } from './CountryFlag';
import { ProductForm } from './ProductForm';
import { CustomSelect, SelectOption } from './CustomSelect';
import { ConfirmModal } from './ConfirmModal';
import SleekSpinner, { SleekLoadingBlock } from './SleekSpinner';
import TopLoadingBar from './TopLoadingBar';
import { readFileAsDataUrl } from '../utils/mediaUtils';
import { ADMIN_TRANSLATIONS, AdminTranslations, getDisplayCurrency } from '../utils/adminTranslations';
import { PixelDashboard } from './PixelDashboard';
import { BrandAndContentEditor } from './BrandAndContentEditor';
import { useOrderLiveNotifications } from '../utils/useOrderLiveNotifications';
import { OrderNotificationBanner } from './OrderNotificationBanner';

const FEATURE_ICONS_LIST = [
  { value: 'Award', label: 'Award / تميز وجودة' },
  { value: 'ShieldCheck', label: 'Shield / ضمان وحماية' },
  { value: 'Leaf', label: 'Leaf / طبيعي وعضوي' },
  { value: 'Droplets', label: 'Droplets / ترطيب ونقاء' },
  { value: 'Sprout', label: 'Sprout / أصالة ونمو' },
  { value: 'HeartPulse', label: 'Heart / صحة وحيوية' },
  { value: 'Scissors', label: 'Scissors / تفصيل وخياطة' },
  { value: 'Crown', label: 'Crown / فخامة وتميز' },
  { value: 'BadgeCheck', label: 'BadgeCheck / جودة معتمدة' },
  { value: 'Palette', label: 'Palette / ألوان وصباغة' },
  { value: 'Sparkles', label: 'Sparkles / إشراقة ولمعان' }
];

export const COUNTRY_PRESETS = [
  { name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', code: 'AE', slug: 'ae', currency: 'AED', currencySymbol: 'د.إ.', flag: '', shippingFee: 25 },
  { name: 'Kuwait', nameAr: 'دولة الكويت', code: 'KW', slug: 'kw', currency: 'KWD', currencySymbol: 'د.ك.', flag: '', shippingFee: 3 },
  { name: 'Qatar', nameAr: 'دولة قطر', code: 'QA', slug: 'qa', currency: 'QAR', currencySymbol: 'ر.ق.', flag: '', shippingFee: 20 },
  { name: 'Oman', nameAr: 'سلطنة عُمان', code: 'OM', slug: 'om', currency: 'OMR', currencySymbol: 'ر.ع.', flag: '', shippingFee: 3 },
  { name: 'Bahrain', nameAr: 'مملكة البحرين', code: 'BH', slug: 'bh', currency: 'BHD', currencySymbol: 'د.ب.', flag: '', shippingFee: 3 },
  { name: 'Algeria', nameAr: 'الجزائر', code: 'DZ', slug: 'dz', currency: 'DZD', currencySymbol: 'د.ج.', flag: '', shippingFee: 600 },
  { name: 'Tunisia', nameAr: 'تونس', code: 'TN', slug: 'tn', currency: 'TND', currencySymbol: 'د.ت.', flag: '', shippingFee: 8 },
  { name: 'Egypt', nameAr: 'جمهورية مصر العربية', code: 'EG', slug: 'eg', currency: 'EGP', currencySymbol: 'ج.م.', flag: '', shippingFee: 65 },
  { name: 'Jordan', nameAr: 'المملكة الأردنية الهاشمية', code: 'JO', slug: 'jo', currency: 'JOD', currencySymbol: 'د.أ.', flag: '', shippingFee: 4 },
  { name: 'Lebanon', nameAr: 'لبنان', code: 'LB', slug: 'lb', currency: 'USD', currencySymbol: '$', flag: '', shippingFee: 5 },
  { name: 'France', nameAr: 'فرنسا', code: 'FR', slug: 'fr', currency: 'EUR', currencySymbol: '€', flag: '', shippingFee: 6 },
  { name: 'Spain', nameAr: 'إسبانيا', code: 'ES', slug: 'es', currency: 'EUR', currencySymbol: '€', flag: '', shippingFee: 5 },
  { name: 'Germany', nameAr: 'ألمانيا', code: 'DE', slug: 'de', currency: 'EUR', currencySymbol: '€', flag: '', shippingFee: 6 },
  { name: 'United Kingdom', nameAr: 'المملكة المتحدة', code: 'GB', slug: 'gb', currency: 'GBP', currencySymbol: '£', flag: '', shippingFee: 5 },
  { name: 'United States', nameAr: 'الولايات المتحدة الأمريكية', code: 'US', slug: 'us', currency: 'USD', currencySymbol: '$', flag: '', shippingFee: 7 },
  { name: 'Canada', nameAr: 'كندا', code: 'CA', slug: 'ca', currency: 'CAD', currencySymbol: 'C$', flag: '', shippingFee: 9 }
];

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  categories?: Category[];
  setCategories?: React.Dispatch<React.SetStateAction<Category[]>>;
  coupons?: Coupon[];
  setCoupons?: React.Dispatch<React.SetStateAction<Coupon[]>>;
  shippingMethods?: ShippingMethod[];
  setShippingMethods?: React.Dispatch<React.SetStateAction<ShippingMethod[]>>;
  reviews?: Review[];
  setReviews?: React.Dispatch<React.SetStateAction<Review[]>>;
  countries?: CountryStore[];
  setCountries?: React.Dispatch<React.SetStateAction<CountryStore[]>>;
  activeCountrySlug?: string;
  onSwitchCountry?: (slug: string) => void;
  onReloadCountries?: () => void;
  onReloadStoreData?: () => void;
  theme: any;
  onViewStore: () => void;
  loggedInAdminEmail?: string | null;
  onLogout?: () => void;
}

export default function AdminPanel({
  products,
  setProducts,
  storeConfig,
  setStoreConfig,
  orders,
  setOrders,
  tickets,
  setTickets,
  categories = [],
  setCategories,
  coupons = [],
  setCoupons,
  shippingMethods = [],
  setShippingMethods,
  reviews = [],
  setReviews,
  countries = [],
  setCountries,
  activeCountrySlug = 'ma',
  onSwitchCountry,
  onReloadCountries,
  onReloadStoreData,
  theme,
  onViewStore,
  loggedInAdminEmail,
  onLogout
}: AdminPanelProps) {
  // Dashboard language state - default is English ('en'), toggleable to Arabic ('ar') independently for dashboard only
  const [dashboardLang, setDashboardLang] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem('virtuprod_admin_dashboard_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const handleSetDashboardLang = (lang: 'en' | 'ar') => {
    setDashboardLang(lang);
    localStorage.setItem('virtuprod_admin_dashboard_lang', lang);
  };

  const t = ADMIN_TRANSLATIONS[dashboardLang];
  const isAr = dashboardLang === 'ar';
  const displayCurrency = getDisplayCurrency(storeConfig.currency, dashboardLang);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'coupons' | 'reviews' | 'settings' | 'tickets' | 'stores' | 'pixel' | 'brand' | 'favorites'>('dashboard');
  
  // Favorites & Wishlists Analytics State
  const [favoritesAnalytics, setFavoritesAnalytics] = useState<any[]>([]);
  const [favoritesCustomers, setFavoritesCustomers] = useState<any[]>([]);
  const [favoritesViewMode, setFavoritesViewMode] = useState<'customers' | 'products'>('customers');
  const [favoritesSearch, setFavoritesSearch] = useState('');
  const [loadingFavoritesAnalytics, setLoadingFavoritesAnalytics] = useState(false);

  const fetchFavoritesAnalytics = async () => {
    setLoadingFavoritesAnalytics(true);
    try {
      const res = await fetch('/api/admin/favorites-analytics');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.popularProducts)) {
          setFavoritesAnalytics(data.popularProducts);
        } else if (Array.isArray(data.analytics)) {
          setFavoritesAnalytics(data.analytics);
        }
        if (Array.isArray(data.customers)) {
          setFavoritesCustomers(data.customers);
        }
      }
    } catch (err) {
      console.error('Error fetching favorites analytics:', err);
    } finally {
      setLoadingFavoritesAnalytics(false);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const isAr = dashboardLang === 'ar';
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'حذف الطلب نهائياً / Delete Order' : 'Delete Order Permanently',
      message: isAr 
        ? 'هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من قاعدة البيانات وسجل المبيعات؟ لا يمكن التراجع عن هذا الإجراء.' 
        : 'Are you sure you want to permanently delete this order from the database and sales records? This action cannot be undone.',
      confirmText: isAr ? 'حذف الطلب' : 'Delete Order',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.success) {
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (onReloadStoreData) await onReloadStoreData();
          } else {
            console.error('Failed to delete order:', data.error);
          }
        } catch (err) {
          console.error('Delete order error:', err);
        }
      }
    });
  };
  
  // Real-Time Live Order Notifications Hook (SSE + Push Notifications + Audio Chimes)
  const [isNotificationsPopoverOpen, setIsNotificationsPopoverOpen] = useState(false);
  const {
    activeBannerOrder,
    isTestBanner,
    closeBanner,
    pushEnabled,
    soundEnabled,
    pushPermission,
    togglePushEnabled,
    toggleSoundEnabled,
    requestPushPermission,
    triggerTestNotification
  } = useOrderLiveNotifications({
    isAdminLoggedIn: true,
    adminEmail: loggedInAdminEmail,
    onNewOrderReceived: (newOrd) => {
      setOrders(prev => {
        if (prev.some(o => o.id === newOrd.id)) return prev;
        return [newOrd, ...prev];
      });
    },
    lang: dashboardLang
  });

  // States for Multi-Country Store Management
  const [isStoreHeaderDropdownOpen, setIsStoreHeaderDropdownOpen] = useState(false);
  const [isAdminLangDropdownOpen, setIsAdminLangDropdownOpen] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<CountryStore | null>(null);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeActionError, setStoreActionError] = useState('');
  const [storeActionSuccess, setStoreActionSuccess] = useState('');
  const [newStoreForm, setNewStoreForm] = useState<Partial<CountryStore>>({
    name: '',
    nameAr: '',
    code: '',
    slug: '',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🌐',
    shippingFee: 20,
    storeName: 'Mavluy Global',
    language: 'ar',
    status: 'active'
  });

  // States for Product CRUD
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'basic' | 'landing' | 'media'>('basic');
  const [newExtraImage, setNewExtraImage] = useState('');
  const [editExtraImage, setEditExtraImage] = useState('');

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    image: '',
    imagePosition: 'center',
    imageFit: 'cover',
    imageOffsetY: 50,
    category: 'General',
    stock: 20,
    rating: 4.8,
    reviewsCount: 15,
    tagline: '',
    features: [
      { title: '', desc: '', icon: 'Award' },
      { title: '', desc: '', icon: 'ShieldCheck' },
      { title: '', desc: '', icon: 'Leaf' }
    ],
    howToUse: ['', '', ''],
    faqs: [
      { q: '', a: '' },
      { q: '', a: '' }
    ],
    additionalImages: []
  });

  // State for Settings Form
  const [settingsForm, setSettingsForm] = useState<StoreConfig>({ ...storeConfig });
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // States for Support FAQs Management
  const [supportSubTab, setSupportSubTab] = useState<'tickets' | 'faqs'>('tickets');
  const [supportFaqsList, setSupportFaqsList] = useState<SupportFaq[]>(() => {
    return (storeConfig.supportFaqs && storeConfig.supportFaqs.length > 0)
      ? storeConfig.supportFaqs
      : DEFAULT_SUPPORT_FAQS;
  });
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState<{ q: string; qEn: string; a: string; aEn: string }>({
    q: '',
    qEn: '',
    a: '',
    aEn: ''
  });
  const [isSavingFaqs, setIsSavingFaqs] = useState(false);
  const [faqToast, setFaqToast] = useState<string | null>(null);

  // Sync supportFaqs when storeConfig changes
  useEffect(() => {
    if (storeConfig.supportFaqs && storeConfig.supportFaqs.length > 0) {
      setSupportFaqsList(storeConfig.supportFaqs);
    }
  }, [storeConfig.supportFaqs]);

  // Reusable custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'حذف الآن / Confirm Delete',
    cancelText: 'إلغاء / Cancel',
    type: 'danger',
    onConfirm: () => {},
  });

  // States for Manage Administrators
  const [admins, setAdmins] = useState<{ name: string; email: string }[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [copiedSecretUrl, setCopiedSecretUrl] = useState(false);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  const handleCopyLink = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkKey(key);
    setTimeout(() => setCopiedLinkKey(null), 2500);
  };

  // States for MongoDB Atlas Connection & Sync
  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    connecting: boolean;
    uriSet: boolean;
    maskedUri?: string;
    localCounts?: { products: number; orders: number; admins: number; categories: number; countries: number };
    remoteCounts?: { products: number; orders: number; admins: number; categories: number; countries: number } | null;
  } | null>(null);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);
  const [mongoError, setMongoError] = useState('');
  const [mongoSuccess, setMongoSuccess] = useState('');
  const [isAdminNavigating, setIsAdminNavigating] = useState(false);

  // --- ORDERS DATE FILTER & EXPORT / IMPORT STATES ---
  const [orderDateRange, setOrderDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [orderCustomStartDate, setOrderCustomStartDate] = useState('');
  const [orderCustomEndDate, setOrderCustomEndDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importOrdersFile, setImportOrdersFile] = useState<File | null>(null);
  const [parsedImportOrders, setParsedImportOrders] = useState<any[]>([]);
  const [isImportingOrders, setIsImportingOrders] = useState(false);
  const [importOrdersError, setImportOrdersError] = useState('');
  const [importOrdersSuccess, setImportOrdersSuccess] = useState('');

  // --- SUPPORT TICKETS DASHBOARD STATES ---
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [isSubmittingTicketReply, setIsSubmittingTicketReply] = useState<Record<string, boolean>>({});
  const [ticketSuccessMsgs, setTicketSuccessMsgs] = useState<Record<string, string>>({});
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  // --- TICKET CUSTOMER & ORDER MANAGEMENT MODAL STATES ---
  const [editingCustomerAccount, setEditingCustomerAccount] = useState<{
    phone: string;
    name: string;
    password?: string;
  } | null>(null);
  const [isSavingCustomerAccount, setIsSavingCustomerAccount] = useState(false);
  const [customerAccountError, setCustomerAccountError] = useState('');
  const [customerAccountSuccess, setCustomerAccountSuccess] = useState('');

  const [editingTicketOrder, setEditingTicketOrder] = useState<Order | null>(null);
  const [isSavingTicketOrder, setIsSavingTicketOrder] = useState(false);
  const [ticketOrderError, setTicketOrderError] = useState('');
  const [ticketOrderSuccess, setTicketOrderSuccess] = useState('');
  const [selectedTicketForOrders, setSelectedTicketForOrders] = useState<SupportTicket | null>(null);

  const handleSwitchTab = (tab: 'dashboard' | 'products' | 'orders' | 'coupons' | 'reviews' | 'tickets' | 'stores' | 'settings' | 'pixel' | 'brand' | 'favorites') => {
    setIsAdminNavigating(true);
    setActiveTab(tab);
    if (tab === 'settings') {
      setSettingsForm({ ...storeConfig });
    }
    if (tab === 'favorites') {
      fetchFavoritesAnalytics();
    }
    setTimeout(() => {
      setIsAdminNavigating(false);
    }, 280);
  };

  const fetchMongoStatus = useCallback(() => {
    fetch('/api/mongodb/status')
      .then(res => res.json())
      .then(data => {
        setMongoStatus(data);
      })
      .catch(err => {
        console.error('Error fetching MongoDB status:', err);
      });
  }, []);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMongoError('');
    setMongoSuccess('');

    if (!mongoUriInput.trim()) {
      setMongoError('Please enter your MongoDB connection string.');
      return;
    }

    setIsConnectingMongo(true);
    try {
      const res = await fetch('/api/mongodb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: mongoUriInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect to MongoDB.');
      }
      setMongoSuccess('Successfully connected to MongoDB Atlas! All local products, orders, and stores are now backed up to the cloud.');
      setMongoUriInput('');
      fetchMongoStatus();
      if (onReloadStoreData) onReloadStoreData();
      if (onReloadCountries) onReloadCountries();
    } catch (err: any) {
      setMongoError(err.message || 'Connection failed.');
    } finally {
      setIsConnectingMongo(false);
    }
  };

  const handleSyncToMongo = async () => {
    setMongoError('');
    setMongoSuccess('');
    setIsSyncingMongo(true);
    try {
      const res = await fetch('/api/mongodb/sync-push', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync data.');
      }
      setMongoSuccess('Successfully pushed all products, orders, categories, and settings to MongoDB Atlas.');
      fetchMongoStatus();
    } catch (err: any) {
      setMongoError(err.message || 'Sync failed.');
    } finally {
      setIsSyncingMongo(false);
    }
  };

  const fetchAdmins = () => {
    setAdminsLoading(true);
    fetch('/api/admins')
      .then(res => res.json())
      .then(data => {
        setAdmins(data || []);
        setAdminsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching admins:', err);
        setAdminsLoading(false);
      });
  };

  useEffect(() => {
    fetchMongoStatus();
    const interval = setInterval(fetchMongoStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchMongoStatus]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchAdmins();
      fetchMongoStatus();
    }
  }, [activeTab, fetchMongoStatus]);

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminError('All fields are required.');
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminError('Password must be at least 6 characters.');
      return;
    }

    setAdminSaving(true);

    fetch('/api/admins/create-by-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('virtuprod_admin_token') || ''}`,
        'x-admin-requestor': loggedInAdminEmail || ''
      },
      body: JSON.stringify({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create admin profile.');
        }
        return data;
      })
      .then(() => {
        setAdminSuccess('New administrator added successfully!');
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        fetchAdmins();
        setAdminSaving(false);
      })
      .catch(err => {
        setAdminError(err.message || 'Error occurred.');
        setAdminSaving(false);
      });
  };

  // Store Management Handlers
  const handleCreateCountryStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreActionError('');
    setStoreActionSuccess('');

    if (!newStoreForm.name || !newStoreForm.nameAr || !newStoreForm.code || !newStoreForm.currency) {
      setStoreActionError('Please fill in all required country details.');
      return;
    }

    const cleanCode = (newStoreForm.code || '').trim().toUpperCase();
    const cleanSlug = (newStoreForm.slug || cleanCode.toLowerCase()).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check if code or slug exists
    if (countries.some(c => c.code.toUpperCase() === cleanCode || c.slug.toLowerCase() === cleanSlug)) {
      setStoreActionError(`A store with code "${cleanCode}" or slug "${cleanSlug}" already exists.`);
      return;
    }

    setStoreSaving(true);
    try {
      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStoreForm,
          code: cleanCode,
          slug: cleanSlug,
          name: newStoreForm.name.trim(),
          nameAr: newStoreForm.nameAr.trim(),
          currency: (newStoreForm.currency || 'USD').trim().toUpperCase(),
          currencySymbol: (newStoreForm.currencySymbol || newStoreForm.currency || '$').trim(),
          flag: newStoreForm.flag?.trim() || '🌐',
          shippingFee: Number(newStoreForm.shippingFee) || 0,
          storeName: newStoreForm.storeName?.trim() || `Mavluy ${newStoreForm.name}`,
          status: 'active'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create new country store.');
      }

      setStoreActionSuccess(`Successfully created store for ${newStoreForm.nameAr || newStoreForm.name}!`);
      setShowAddStoreModal(false);
      setNewStoreForm({
        name: '',
        nameAr: '',
        code: '',
        slug: '',
        currency: 'USD',
        currencySymbol: '$',
        flag: '🌐',
        shippingFee: 20,
        storeName: 'Mavluy Global',
        language: 'ar',
        status: 'active'
      });

      if (onReloadCountries) {
        await onReloadCountries();
      }
    } catch (err: any) {
      setStoreActionError(err.message || 'Error creating country store.');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleUpdateCountryStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setStoreActionError('');
    setStoreActionSuccess('');

    setStoreSaving(true);
    try {
      const storeId = editingStore.id || editingStore.slug;
      const res = await fetch(`/api/countries/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStore.name,
          nameAr: editingStore.nameAr,
          code: editingStore.code?.toUpperCase(),
          currency: editingStore.currency?.toUpperCase(),
          currencySymbol: editingStore.currencySymbol,
          flag: editingStore.flag,
          shippingFee: Number(editingStore.shippingFee) || 0,
          storeName: editingStore.storeName,
          status: editingStore.status || 'active'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store settings.');
      }

      setStoreActionSuccess(`Store ${editingStore.nameAr || editingStore.name} updated successfully!`);
      setEditingStore(null);
      if (onReloadCountries) {
        await onReloadCountries();
      }
      if (onReloadStoreData && editingStore.slug === activeCountrySlug) {
        await onReloadStoreData();
      }
    } catch (err: any) {
      setStoreActionError(err.message || 'Error updating store.');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleToggleCountryStatus = async (country: CountryStore) => {
    setStoreActionError('');
    setStoreActionSuccess('');

    const newStatus = country.status === 'disabled' ? 'active' : 'disabled';
    const storeId = country.id || country.slug;

    try {
      const res = await fetch(`/api/countries/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store visibility.');
      }

      setStoreActionSuccess(
        newStatus === 'disabled'
          ? `Store for ${country.nameAr || country.name} is now HIDDEN from customer store switcher.`
          : `Store for ${country.nameAr || country.name} is now ACTIVE and visible to customers.`
      );

      if (onReloadCountries) {
        await onReloadCountries();
      }
    } catch (err: any) {
      setStoreActionError(err.message || 'Error updating store status.');
    }
  };

  const handleDeleteCountryStore = (country: CountryStore) => {
    if (countries.length <= 1) {
      setStoreActionError('You cannot delete the only remaining country store.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'حذف متجر الدولة / Delete Store',
      message: `هل أنت متأكد من حذف متجر "${country.nameAr || country.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف المتجر',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: async () => {
        setStoreActionError('');
        setStoreActionSuccess('');

        try {
          const storeId = country.id || country.slug;
          const res = await fetch(`/api/countries/${storeId}`, {
            method: 'DELETE'
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to delete country store.');
          }

          setStoreActionSuccess(`Store for ${country.nameAr || country.name} deleted.`);
          if (onReloadCountries) {
            await onReloadCountries();
          }
        } catch (err: any) {
          setStoreActionError(err.message || 'Error deleting store.');
        }
      }
    });
  };

  // Auto-mark tickets as seen when on tickets tab
  React.useEffect(() => {
    if (activeTab === 'tickets') {
      const hasUnseen = tickets.some(t => !t.seen);
      if (hasUnseen) {
        setTickets(prev => prev.map(t => t.seen ? t : { ...t, seen: true }));
      }
    }
  }, [activeTab, tickets, setTickets]);

  // Quick stats calculations
  const totalSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingSales = orders
    .filter(o => o.status === 'pending' || o.status === 'shipped')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'shipped').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'cancelled').length;

  const averageOrderValue = totalOrdersCount > 0 
    ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / totalOrdersCount) 
    : 0;

  // Top Selling Products Calculation
  const topSellingProducts = React.useMemo(() => {
    const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number; image: string } } = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = {
              name: item.productName,
              qty: 0,
              revenue: 0,
              image: item.image
            };
          }
          productSalesMap[item.productId].qty += item.quantity;
          productSalesMap[item.productId].revenue += item.price * item.quantity;
        });
      }
    });
    return Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [orders]);

  // Sales by City Calculation
  const salesByCity = React.useMemo(() => {
    const citySalesMap: { [key: string]: { total: number; count: number } } = {};
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const city = order.customerCity || 'Other';
        if (!citySalesMap[city]) {
          citySalesMap[city] = { total: 0, count: 0 };
        }
        citySalesMap[city].total += order.total;
        citySalesMap[city].count += 1;
      }
    });
    return Object.entries(citySalesMap)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders]);

  // Low Stock Alert (stock <= 5)
  const lowStockProducts = React.useMemo(() => {
    return products.filter(p => p.stock <= 5);
  }, [products]);

  // Weekly Performance Calculation
  const weeklyPerformance = React.useMemo(() => {
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const performanceMap: { [key: string]: { sales: number; count: number } } = {
      'Mon': { sales: 0, count: 0 },
      'Tue': { sales: 0, count: 0 },
      'Wed': { sales: 0, count: 0 },
      'Thu': { sales: 0, count: 0 },
      'Fri': { sales: 0, count: 0 },
      'Sat': { sales: 0, count: 0 },
      'Sun': { sales: 0, count: 0 },
    };

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        try {
          const date = new Date(order.date);
          const dayName = daysName[date.getDay()];
          if (performanceMap[dayName]) {
            performanceMap[dayName].sales += order.total;
            performanceMap[dayName].count += 1;
          }
        } catch (e) {
          console.error('Error parsing order date:', e);
        }
      }
    });

    return [
      { day: 'Mon', ...performanceMap['Mon'] },
      { day: 'Tue', ...performanceMap['Tue'] },
      { day: 'Wed', ...performanceMap['Wed'] },
      { day: 'Thu', ...performanceMap['Thu'] },
      { day: 'Fri', ...performanceMap['Fri'] },
      { day: 'Sat', ...performanceMap['Sat'] },
      { day: 'Sun', ...performanceMap['Sun'] },
    ];
  }, [orders]);

  const maxWeeklySales = React.useMemo(() => {
    return Math.max(...weeklyPerformance.map(item => item.sales), 100);
  }, [weeklyPerformance]);

  // Support Tickets Stats
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'resolved').length;

  // --- COUPON MANAGEMENT STATE & HANDLERS ---
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number | ''>(10);
  const [newCouponApplyType, setNewCouponApplyType] = useState<'all' | 'specific'>('all');
  const [newCouponProductId, setNewCouponProductId] = useState<string>('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number | ''>('');
  const [newCouponShowOnProductPage, setNewCouponShowOnProductPage] = useState<boolean>(true);
  const [newCouponShowBadge, setNewCouponShowBadge] = useState<boolean>(true);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleToggleCouponField = async (couponId: string, field: 'showOnProductPage' | 'showBadgeOnProductCard', currentVal: boolean) => {
    const newVal = !currentVal;
    if (setCoupons) {
      setCoupons(prev => (prev || []).map(c => c.id === couponId ? { ...c, [field]: newVal } : c));
    }
    try {
      await fetch(`/api/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newVal })
      });
    } catch (err) {
      console.error('Failed to toggle coupon field:', err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const cleanCode = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    if (cleanCode.length < 2) {
      setCouponError('رمز الكوبون يجب أن يتكون من حرفين أو رقمين على الأقل (مثال: M1, VIP, 10, MAV10) / Coupon code must be at least 2 characters.');
      return;
    }

    if (!newCouponValue || Number(newCouponValue) <= 0) {
      setCouponError('يرجى إدخال قيمة خصم صالحة / Please specify a valid discount amount.');
      return;
    }

    if (newCouponApplyType === 'specific' && !newCouponProductId) {
      setCouponError('يرجى اختيار المنتج الذي تريد تطبيق الخصم عليه / Please select the specific product.');
      return;
    }

    setCouponLoading(true);
    try {
      const selectedProd = products.find(p => p.id === newCouponProductId);
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          storeId: activeCountrySlug || 'all',
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          type: newCouponType,
          value: Number(newCouponValue),
          productId: newCouponApplyType === 'specific' ? newCouponProductId : 'all',
          productName: newCouponApplyType === 'specific' ? (selectedProd?.name || 'منتج محدد') : 'جميع المنتجات (All Products)',
          minOrderAmount: newCouponMinOrder ? Number(newCouponMinOrder) : 0,
          showOnProductPage: newCouponShowOnProductPage,
          showBadgeOnProductCard: newCouponShowBadge,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (setCoupons) {
          if (data.coupons && Array.isArray(data.coupons)) {
            setCoupons(data.coupons);
          } else if (data.coupon) {
            setCoupons(prev => [data.coupon, ...(prev || []).filter(c => c.id !== data.coupon.id)]);
          }
        }
        setCouponSuccess(`تم إنشاء وتفعيل الكوبون بنجاح: ${cleanCode}`);
        setNewCouponCode('');
        setNewCouponValue(10);
        setNewCouponMinOrder('');
        setNewCouponProductId('');
        setNewCouponApplyType('all');
        setNewCouponShowOnProductPage(true);
        setNewCouponShowBadge(true);
      } else {
        setCouponError(data.error || 'Failed to create coupon.');
      }
    } catch (err) {
      setCouponError('Network error creating coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف كود الخصم / Delete Coupon',
      message: 'هل أنت متأكد من حذف هذا الكوبون نهائياً؟',
      confirmText: 'حذف الكوبون',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            if (setCoupons) {
              if (data.coupons && Array.isArray(data.coupons)) {
                setCoupons(data.coupons);
              } else {
                setCoupons(prev => prev.filter(c => c.id !== couponId));
              }
            }
          }
        } catch (err) {
          console.error('Error deleting coupon:', err);
        }
      }
    });
  };

  // --- REVIEWS MANAGEMENT STATE & HANDLERS ---
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilterProduct, setReviewFilterProduct] = useState('all');

  const handleToggleReviewFeature = async (reviewId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/feature`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredOnHome: !currentFeatured })
      });
      if (res.ok) {
        if (setReviews) {
          setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, featuredOnHome: !currentFeatured } : r));
        }
      }
    } catch (err) {
      console.error('Error featuring review:', err);
    }
  };

  const handleToggleReviewStatus = async (reviewId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await fetch(`/api/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        if (setReviews) {
          setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: nextStatus as any } : r));
        }
      }
    } catch (err) {
      console.error('Error updating review status:', err);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف التقييم / Delete Review',
      message: 'هل أنت متأكد من حذف تقييم العميل هذا نهائياً من المتجر؟',
      confirmText: 'حذف التقييم',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
          if (res.ok) {
            if (setReviews) {
              setReviews(prev => prev.filter(r => r.id !== reviewId));
            }
          }
        } catch (err) {
          console.error('Error deleting review:', err);
        }
      }
    });
  };

  // Filtered reviews
  const filteredReviews = reviews.filter(rev => {
    const name = rev.author || rev.customerName || '';
    const phone = rev.authorPhone || rev.customerPhone || '';
    const matchesProd = reviewFilterProduct === 'all' || rev.productId === reviewFilterProduct;
    const matchesSearch = !reviewSearch.trim() || 
      name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      rev.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (phone && phone.includes(reviewSearch));
    return matchesProd && matchesSearch;
  });

  // Handles changing order status
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  // Computed Filtered Orders with Date Range & Status & Search
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
        return false;
      }
      
      // 2. Search Query (Name, Phone, City, Address, ID, Product)
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchesName = order.customerName?.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone?.includes(q);
        const matchesCity = order.customerCity?.toLowerCase().includes(q);
        const matchesAddress = order.customerAddress?.toLowerCase().includes(q);
        const matchesId = order.id?.toLowerCase().includes(q);
        const matchesProduct = order.items?.some(it => it.productName?.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesCity && !matchesAddress && !matchesId && !matchesProduct) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (orderDateRange === 'all') return true;

      const orderDate = new Date(order.date);
      if (isNaN(orderDate.getTime())) return true;
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (orderDateRange === 'today') {
        return orderDate >= todayStart;
      } else if (orderDateRange === 'yesterday') {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        return orderDate >= yesterdayStart && orderDate < todayStart;
      } else if (orderDateRange === 'week') {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        return orderDate >= weekStart;
      } else if (orderDateRange === 'month') {
        const monthStart = new Date(todayStart);
        monthStart.setDate(monthStart.getDate() - 30);
        return orderDate >= monthStart;
      } else if (orderDateRange === 'custom') {
        if (orderCustomStartDate) {
          const start = new Date(orderCustomStartDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (orderCustomEndDate) {
          const end = new Date(orderCustomEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery, orderDateRange, orderCustomStartDate, orderCustomEndDate]);

  // Export orders to UTF-8 CSV (compatible with Google Sheets & Excel)
  const handleExportOrdersToCSV = (targetOrders: Order[] = filteredOrders) => {
    if (targetOrders.length === 0) {
      alert('لا توجد طلبات لتصديرها وفق الفلتر المحدد / No orders to export.');
      return;
    }

    const headers = [
      'Order ID (رقم الطلب)',
      'Date (التاريخ)',
      'Time (الوقت)',
      'Customer Name (اسم العميل)',
      'Customer Phone (رقم الهاتف)',
      'City (المدينة)',
      'Delivery Address (العنوان)',
      'Products (المنتجات المطلوبة)',
      'Items Count (عدد القطع)',
      'Subtotal (المجموع الفرعي)',
      'Discount (الخصم)',
      'Coupon Code (كوبون الخصم)',
      'Shipping Fee (مصاريف الشحن)',
      'Total Payment (المجموع النهائي)',
      'Currency (العملة)',
      'Status (حالة الطلب)',
      'Customer Notes (ملاحظات العميل)',
      'Store Country (المتجر)'
    ];

    const rows = targetOrders.map(order => {
      const d = new Date(order.date);
      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-CA') : order.date;
      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-US', { hour12: false }) : '';
      const productsSummary = (order.items || [])
        .map(it => `${it.productName} (x${it.quantity} @ ${it.price})`)
        .join(' + ');
      const itemsCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

      return [
        `"${order.id || ''}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(order.customerName || '').replace(/"/g, '""')}"`,
        `"\t${(order.customerPhone || '').replace(/"/g, '""')}"`,
        `"${(order.customerCity || '').replace(/"/g, '""')}"`,
        `"${(order.customerAddress || '').replace(/"/g, '""')}"`,
        `"${productsSummary.replace(/"/g, '""')}"`,
        itemsCount,
        order.subtotal || 0,
        order.discountAmount || 0,
        `"${order.couponCode || ''}"`,
        order.shippingFee || 0,
        order.total || 0,
        `"${order.currency || storeConfig.currency || 'MAD'}"`,
        `"${order.status || 'pending'}"`,
        `"${(order.notes || '').replace(/"/g, '""')}"`,
        `"${order.storeId || activeCountrySlug || 'ma'}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateLabel = orderDateRange === 'all' ? 'All_Orders' : `Orders_${orderDateRange}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `Mavluy_${dateLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download pre-formatted Template CSV for Google Sheets / Excel import
  const handleDownloadOrderTemplate = () => {
    const headers = [
      'Customer Name / اسم العميل',
      'Customer Phone / رقم الهاتف',
      'City / المدينة',
      'Address / العنوان',
      'Product Name / اسم المنتج',
      'Quantity / الكمية',
      'Price / السعر',
      'Total / المجموع',
      'Customer Notes / ملاحظات'
    ];

    const sampleRows = [
      ['محمد بنعلي', '0612345678', 'الدار البيضاء', 'شارع القدس، عمارة 12 شقة 4', 'سيروم الوجه الطبيعي', '1', '199', '199', 'طلب عبر واتساب - التوصيل مساءً'],
      ['سارة العلمي', '0698765432', 'مراكش', 'حي جيليز قرب المحطة', 'كريم الترطيب الفاخر', '2', '150', '300', 'طلب عبر فيسبوك - تأكيد هاتفي']
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Google_Sheets_Orders_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse uploaded CSV file from Google Sheets / Excel
  const handleParseImportCSV = (file: File) => {
    setImportOrdersFile(file);
    setImportOrdersError('');
    setImportOrdersSuccess('');
    setParsedImportOrders([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setImportOrdersError('الملف فارغ أو غير صالح / File is empty.');
          return;
        }

        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportOrdersError('يجب أن يحتوي الملف على رأس الأعمدة وصف واحد من البيانات على الأقل.');
          return;
        }

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if ((char === ',' || char === ';') && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headerLine = parseLine(lines[0]);
        const headerLower = headerLine.map(h => h.toLowerCase().replace(/[\t\r\n"]/g, '').trim());

        const findCol = (terms: string[]) => {
          return headerLower.findIndex(h => terms.some(t => h.includes(t)));
        };

        const nameIdx = findCol(['name', 'nom', 'الاسم', 'عميل', 'client', 'customer']);
        const phoneIdx = findCol(['phone', 'tel', 'هاتف', 'téléphone', 'mobile', 'whatsapp']);
        const cityIdx = findCol(['city', 'ville', 'مدينة', 'gouvernorat']);
        const addrIdx = findCol(['address', 'adresse', 'عنوان', 'livraison', 'quartier']);
        const prodIdx = findCol(['product', 'produit', 'منتج', 'article', 'item']);
        const qtyIdx = findCol(['qty', 'quantité', 'كمية', 'count', 'quantity']);
        const priceIdx = findCol(['price', 'prix', 'سعر', 'tarif', 'unit']);
        const totalIdx = findCol(['total', 'مجموع', 'montant', 'somme']);
        const notesIdx = findCol(['note', 'ملاحظات', 'remarque', 'comment']);

        const parsedOrders: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cells = parseLine(lines[i]);
          if (cells.length === 0 || !cells.some(c => c.length > 0)) continue;

          const rawName = nameIdx >= 0 ? cells[nameIdx] : cells[0] || '';
          const rawPhone = phoneIdx >= 0 ? cells[phoneIdx] : cells[1] || '';
          const rawCity = cityIdx >= 0 ? cells[cityIdx] : cells[2] || 'الدار البيضاء';
          const rawAddr = addrIdx >= 0 ? cells[addrIdx] : cells[3] || 'عنوان الزبون';
          const rawProd = prodIdx >= 0 ? cells[prodIdx] : cells[4] || 'طلب مخصص من واتساب/فيسبوك';
          const rawQty = Number(qtyIdx >= 0 ? cells[qtyIdx] : 1) || 1;
          const rawPrice = Number(priceIdx >= 0 ? cells[priceIdx] : 0) || 0;
          const rawTotal = Number(totalIdx >= 0 ? cells[totalIdx] : (rawPrice * rawQty)) || (rawPrice * rawQty);
          const rawNotes = notesIdx >= 0 ? cells[notesIdx] : '';

          const cleanPhone = rawPhone.replace(/[\t\s]/g, '').trim();

          if (rawName.trim() && cleanPhone) {
            parsedOrders.push({
              id: `ORD-IMP-${Math.floor(100000 + Math.random() * 900000)}`,
              customerName: rawName.replace(/^["']|["']$/g, '').trim(),
              customerPhone: cleanPhone,
              customerCity: rawCity.replace(/^["']|["']$/g, '').trim() || 'الدار البيضاء',
              customerAddress: rawAddr.replace(/^["']|["']$/g, '').trim() || 'عنوان الزبون',
              productName: rawProd.replace(/^["']|["']$/g, '').trim(),
              quantity: rawQty,
              price: rawPrice,
              total: rawTotal > 0 ? rawTotal : (rawPrice * rawQty),
              notes: rawNotes ? rawNotes.replace(/^["']|["']$/g, '').trim() : undefined,
              status: 'pending',
              date: new Date().toISOString()
            });
          }
        }

        if (parsedOrders.length === 0) {
          setImportOrdersError('لم يتم العثور على بيانات صالحة. يرجى التأكد من ملء عمود الاسم ورقم الهاتف.');
        } else {
          setParsedImportOrders(parsedOrders);
        }
      } catch (err: any) {
        setImportOrdersError(`خطأ في قراءة الملف: ${err.message || 'CSV parse error'}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Submit parsed orders to backend and MongoDB
  const handleConfirmImportOrders = async () => {
    if (parsedImportOrders.length === 0) return;
    setIsImportingOrders(true);
    setImportOrdersError('');
    setImportOrdersSuccess('');

    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: parsedImportOrders,
          storeId: activeCountrySlug
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
        setImportOrdersSuccess(`تم بنجاح استيراد ${data.count} طلب وإضافتها إلى المتجر وقاعدة البيانات!`);
        setTimeout(() => {
          setShowImportModal(false);
          setParsedImportOrders([]);
          setImportOrdersFile(null);
          setImportOrdersSuccess('');
        }, 1800);
      } else {
        setImportOrdersError(data.error || 'حدث خطأ أثناء حفظ الطلبات.');
      }
    } catch (e: any) {
      setImportOrdersError(e.message || 'Failed to import orders.');
    } finally {
      setIsImportingOrders(false);
    }
  };

  // Admin In-Dashboard Ticket Reply Handler
  const handleSendAdminTicketReply = async (ticketId: string) => {
    const draft = (ticketReplyDrafts[ticketId] || '').trim();
    if (!draft) return;

    setIsSubmittingTicketReply(prev => ({ ...prev, [ticketId]: true }));
    setTicketSuccessMsgs(prev => ({ ...prev, [ticketId]: '' }));

    try {
      const res = await fetch('/api/tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          sender: 'support',
          senderName: 'الدعم الفني / Support Staff',
          text: draft
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              seen: true,
              messages: [...(t.messages || []), data.message]
            };
          }
          return t;
        }));

        setTicketReplyDrafts(prev => ({ ...prev, [ticketId]: '' }));
        setTicketSuccessMsgs(prev => ({ ...prev, [ticketId]: 'تم إرسال الرد للعميل بنجاح!' }));
        setTimeout(() => {
          setTicketSuccessMsgs(prev => ({ ...prev, [ticketId]: '' }));
        }, 3500);
      } else {
        alert(data.error || 'Failed to send reply');
      }
    } catch (e) {
      console.error(e);
      alert('Error sending ticket reply');
    } finally {
      setIsSubmittingTicketReply(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Toggle ticket status (Open <-> Resolved) with backend sync
  const handleToggleTicketStatus = async (ticketId: string, nextStatus: 'open' | 'resolved') => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t));
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (e) {
      console.error('Error syncing ticket status:', e);
    }
  };

  // Delete ticket (Hard delete from database and cache)
  const handleDeleteTicket = (ticketId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف تذكرة الدعم / Delete Ticket',
      message: 'هل أنت متأكد من حذف تذكرة الدعم الفني هذه نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف التذكرة نهائياً',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: async () => {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        try {
          await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
        } catch (e) {
          console.error('Error deleting ticket:', e);
        }
      }
    });
  };

  // Delete customer account completely by phone
  const handleDeleteCustomerAccount = (phone: string, customerName?: string) => {
    const isAr = dashboardLang === 'ar';
    setConfirmModal({
      isOpen: true,
      title: isAr ? 'حذف حساب العميل نهائياً / Delete Customer' : 'Delete Customer Account Permanently',
      message: isAr
        ? `هل أنت متأكد من رغبتك في حذف حساب العميل (${customerName || phone}) نهائياً من قاعدة البيانات؟`
        : `Are you sure you want to permanently delete customer account (${customerName || phone}) from the database?`,
      confirmText: isAr ? 'حذف الحساب نهائياً' : 'Delete Account',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.success) {
            setFaqToast(isAr ? 'تم حذف حساب العميل بنجاح!' : 'Customer account deleted successfully!');
            setTimeout(() => setFaqToast(null), 3500);
          } else {
            alert(data.error || 'Failed to delete customer account');
          }
        } catch (e) {
          console.error('Error deleting customer account:', e);
          alert('Error deleting customer account');
        }
      }
    });
  };

  // Update customer account information (name, new phone number, password)
  const handleSaveCustomerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerAccount) return;
    setIsSavingCustomerAccount(true);
    setCustomerAccountError('');
    setCustomerAccountSuccess('');

    try {
      const res = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhone: editingCustomerAccount.phone,
          newPhone: editingCustomerAccount.phone,
          name: editingCustomerAccount.name,
          password: editingCustomerAccount.password || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerAccountSuccess(dashboardLang === 'ar' ? 'تم تحديث معلومات الحساب بنجاح!' : 'Customer profile updated successfully!');
        
        // Update customer name in tickets state
        setTickets(prev => prev.map(t => {
          if (t.customerPhone === editingCustomerAccount.phone) {
            return { ...t, customerName: editingCustomerAccount.name };
          }
          return t;
        }));

        // Update customer name in orders state
        setOrders(prev => prev.map(o => {
          if (o.customerPhone === editingCustomerAccount.phone) {
            return { ...o, customerName: editingCustomerAccount.name };
          }
          return o;
        }));

        setTimeout(() => {
          setEditingCustomerAccount(null);
          setCustomerAccountSuccess('');
        }, 1200);
      } else {
        setCustomerAccountError(data.error || 'Failed to update customer account');
      }
    } catch (err: any) {
      console.error(err);
      setCustomerAccountError(err.message || 'Error updating customer account');
    } finally {
      setIsSavingCustomerAccount(false);
    }
  };

  // Save changes to an order (e.g. customer name, phone, address, city, status, items)
  const handleSaveTicketOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicketOrder) return;
    setIsSavingTicketOrder(true);
    setTicketOrderError('');
    setTicketOrderSuccess('');

    try {
      const res = await fetch(`/api/orders/${editingTicketOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTicketOrder)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicketOrderSuccess(dashboardLang === 'ar' ? 'تم تعديل معلومات الطلب بنجاح!' : 'Order details updated successfully!');
        
        // Update in global orders list
        setOrders(prev => prev.map(o => o.id === editingTicketOrder.id ? { ...o, ...editingTicketOrder } : o));

        // If customer changed phone or name in order, keep ticket sync if relevant
        setTickets(prev => prev.map(t => {
          if (t.customerPhone === editingTicketOrder.customerPhone) {
            return { ...t, customerName: editingTicketOrder.customerName };
          }
          return t;
        }));

        if (onReloadStoreData) await onReloadStoreData();

        setTimeout(() => {
          setEditingTicketOrder(null);
          setTicketOrderSuccess('');
        }, 1200);
      } else {
        setTicketOrderError(data.error || 'Failed to update order');
      }
    } catch (err: any) {
      console.error(err);
      setTicketOrderError(err.message || 'Error updating order details');
    } finally {
      setIsSavingTicketOrder(false);
    }
  };

  // --- SUPPORT TICKETS FILTER & EXPORT STATE & HANDLERS ---
  // Computed Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. Status Filter
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      // 2. Search Query
      if (ticketSearchQuery.trim()) {
        const q = ticketSearchQuery.toLowerCase();
        const matchesName = t.customerName?.toLowerCase().includes(q);
        const matchesPhone = t.customerPhone?.includes(q);
        const matchesSubject = t.subject?.toLowerCase().includes(q);
        const matchesMessage = t.message?.toLowerCase().includes(q);
        const matchesId = t.id?.toLowerCase().includes(q);
        const matchesReplies = t.messages?.some(m => m.text?.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesSubject && !matchesMessage && !matchesId && !matchesReplies) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, ticketStatusFilter, ticketSearchQuery]);

  // Export Tickets to CSV for Excel / Google Sheets
  const handleExportTicketsCsv = (onlyResolved: boolean = false) => {
    const listToExport = onlyResolved 
      ? tickets.filter(t => t.status === 'resolved')
      : filteredTickets;

    if (listToExport.length === 0) {
      alert('لا توجد تذاكر متوفرة للتصدير.');
      return;
    }

    const headers = [
      'رقم التذكرة (Ticket ID)',
      'الحالة (Status)',
      'المتجر / الدولة (Store)',
      'تاريخ الإنشاء (Created Date)',
      'اسم العميل (Customer Name)',
      'رقم الهاتف (Customer Phone)',
      'موضوع الاستفسار (Subject)',
      'الرسالة الأساسية (Initial Inquiry)',
      'عدد الردود (Message Count)',
      'سجل المحادثة الكامل (Full Conversation Transcript)'
    ];

    const escapeCsv = (str: string) => {
      if (!str) return '""';
      const clean = str.replace(/"/g, '""').replace(/\r?\n/g, ' -- ');
      return `"${clean}"`;
    };

    const rows = listToExport.map(t => {
      const formattedDate = new Date(t.date).toLocaleString('ar-MA');
      const statusLabel = t.status === 'resolved' ? 'مكتملة / مغلقة (Resolved)' : 'مفتوحة / قيد المتابعة (Open)';
      const transcript = (t.messages || []).map((m, idx) => {
        const sender = m.sender === 'support' ? 'فريق الدعم الفني' : (m.senderName || t.customerName);
        const time = new Date(m.date).toLocaleString('ar-MA');
        return `[#${idx + 1} | ${time}] ${sender}: ${m.text}`;
      }).join(' || ');

      return [
        escapeCsv(t.id),
        escapeCsv(statusLabel),
        escapeCsv(t.storeId || 'ma'),
        escapeCsv(formattedDate),
        escapeCsv(t.customerName),
        escapeCsv(t.customerPhone),
        escapeCsv(t.subject || 'General Inquiry'),
        escapeCsv(t.message),
        t.messages ? t.messages.length : 1,
        escapeCsv(transcript || t.message)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support_tickets_analysis_${onlyResolved ? 'resolved_' : 'all_'}${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Tickets to JSON
  const handleExportTicketsJson = (onlyResolved: boolean = false) => {
    const listToExport = onlyResolved 
      ? tickets.filter(t => t.status === 'resolved')
      : filteredTickets;

    if (listToExport.length === 0) {
      alert('لا توجد تذاكر متوفرة للتصدير.');
      return;
    }

    const blob = new Blob([JSON.stringify(listToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `support_tickets_archive_${onlyResolved ? 'resolved_' : 'all_'}${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export single ticket conversation transcript
  const handleExportSingleTicketTranscript = (ticket: SupportTicket) => {
    const lines = [
      `=============================================================`,
      `SUPPORT TICKET TRANSCRIPT / سجل تذكرة الدعم الفني`,
      `=============================================================`,
      `Ticket ID: ${ticket.id}`,
      `Status: ${ticket.status === 'resolved' ? 'RESOLVED (مغلقة ومكتملة)' : 'OPEN (قيد المتابعة)'}`,
      `Date Created: ${new Date(ticket.date).toLocaleString()}`,
      `Customer Name: ${ticket.customerName}`,
      `Customer Phone: ${ticket.customerPhone}`,
      `Store / Country: ${ticket.storeId || 'All'}`,
      `Subject / Category: ${ticket.subject || 'General Inquiry'}`,
      `-------------------------------------------------------------`,
      `INITIAL CUSTOMER INQUIRY:`,
      `"${ticket.message}"`,
      `-------------------------------------------------------------`,
      `CONVERSATION DIALOGUE & REPLIES:`,
    ];

    if (ticket.messages && ticket.messages.length > 0) {
      ticket.messages.forEach((m, idx) => {
        const sender = m.sender === 'support' ? 'SUPPORT AGENT (الدعم الفني)' : `CUSTOMER (${m.senderName || ticket.customerName})`;
        lines.push(`[#${idx + 1}] [${new Date(m.date).toLocaleString()}] ${sender}:`);
        lines.push(`    ${m.text}`);
        lines.push('');
      });
    } else {
      lines.push('No additional messages.');
    }

    lines.push(`=============================================================`);
    lines.push(`Generated on: ${new Date().toLocaleString()}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket_${ticket.id}_transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- SUPPORT FAQS HANDLERS ---
  const handleOpenNewFaqModal = () => {
    setEditingFaqId(null);
    setFaqForm({ q: '', qEn: '', a: '', aEn: '' });
    setFaqModalOpen(true);
  };

  const handleOpenEditFaqModal = (faq: SupportFaq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      q: faq.q || '',
      qEn: faq.qEn || '',
      a: faq.a || '',
      aEn: faq.aEn || ''
    });
    setFaqModalOpen(true);
  };

  const handleSaveFaqModal = () => {
    if (!faqForm.q.trim() || !faqForm.a.trim()) {
      return;
    }

    if (editingFaqId) {
      // Edit existing
      setSupportFaqsList(prev => prev.map(f => f.id === editingFaqId ? {
        ...f,
        q: faqForm.q.trim(),
        qEn: faqForm.qEn.trim() || undefined,
        a: faqForm.a.trim(),
        aEn: faqForm.aEn.trim() || undefined
      } : f));
    } else {
      // Create new
      const newFaq: SupportFaq = {
        id: `faq-${Date.now()}`,
        q: faqForm.q.trim(),
        qEn: faqForm.qEn.trim() || undefined,
        a: faqForm.a.trim(),
        aEn: faqForm.aEn.trim() || undefined
      };
      setSupportFaqsList(prev => [...prev, newFaq]);
    }
    setFaqModalOpen(false);
    setEditingFaqId(null);
    setFaqForm({ q: '', qEn: '', a: '', aEn: '' });
  };

  const handleDeleteSupportFaq = (faqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف السؤال الشائع / Delete FAQ',
      message: 'هل أنت متأكد من حذف هذا السؤال من صفحة الدعم والمساعدة؟',
      confirmText: 'نعم، حذف السؤال',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        setSupportFaqsList(prev => prev.filter(f => f.id !== faqId));
      }
    });
  };

  const handleMoveFaqUp = (index: number) => {
    if (index <= 0) return;
    setSupportFaqsList(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveFaqDown = (index: number) => {
    setSupportFaqsList(prev => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleResetSupportFaqs = () => {
    setConfirmModal({
      isOpen: true,
      title: 'استعادة الأسئلة الافتراضية / Reset FAQs',
      message: 'هل تريد استعادة الأسئلة الشائعة الافتراضية؟ سيتم استبدال الأسئلة الحالية بالافتراضية.',
      confirmText: 'استعادة الافتراضي',
      cancelText: 'إلغاء',
      type: 'warning',
      onConfirm: () => {
        setSupportFaqsList(DEFAULT_SUPPORT_FAQS);
      }
    });
  };

  const handleSaveAllSupportFaqs = async () => {
    setIsSavingFaqs(true);
    const updatedConfig: StoreConfig = {
      ...storeConfig,
      supportFaqs: supportFaqsList
    };
    setStoreConfig(updatedConfig);
    setSettingsForm(prev => ({ ...prev, supportFaqs: supportFaqsList }));

    try {
      await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      setFaqToast('تم حفظ ونشر الأسئلة الشائعة في صفحة الدعم بنجاح!');
      setTimeout(() => setFaqToast(null), 3500);
    } catch (e) {
      console.error('Error saving support FAQs:', e);
      setFaqToast('حدث خطأ أثناء حفظ الأسئلة الشائعة');
      setTimeout(() => setFaqToast(null), 3500);
    } finally {
      setIsSavingFaqs(false);
    }
  };

  // Handles saving store settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanAdminSlug = (settingsForm.customAdminSlug || 'admin/dashboard').trim().toLowerCase().replace(/^\/+|\/+$/g, '') || 'admin/dashboard';
    const cleanLoginSlug = (settingsForm.customAdminLoginSlug || 'admin/login').trim().toLowerCase().replace(/^\/+|\/+$/g, '') || 'admin/login';
    const cleanRegisterSlug = (settingsForm.customAdminRegisterSlug || 'admin/register').trim().toLowerCase().replace(/^\/+|\/+$/g, '') || 'admin/register';

    const updated: StoreConfig = { 
      ...settingsForm, 
      customAdminSlug: cleanAdminSlug,
      customAdminLoginSlug: cleanLoginSlug,
      customAdminRegisterSlug: cleanRegisterSlug,
      storeId: activeCountrySlug || 'ma'
    };

    setStoreConfig(updated);
    setSettingsForm(updated);

    // Save to local storage for immediate browser lookup
    localStorage.setItem('ecom_custom_admin_slug', cleanAdminSlug);
    localStorage.setItem('ecom_custom_admin_login_slug', cleanLoginSlug);
    localStorage.setItem('ecom_custom_admin_register_slug', cleanRegisterSlug);

    try {
      await fetch(`/api/store-config?storeId=${activeCountrySlug || 'ma'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error saving store config to backend:', err);
    }

    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3500);
  };

  // Handles adding new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const cleanFeatures = (newProduct.features || []).filter(f => f.title && f.title.trim());
    const cleanHowToUse = (newProduct.howToUse || []).filter(s => typeof s === 'string' && s.trim());
    const cleanFaqs = (newProduct.faqs || []).filter(f => f.q && f.q.trim());
    const cleanImages = (newProduct.additionalImages || []).filter(img => img && img.trim());
    const cleanPricingTiers = (newProduct.pricingTiers || []).filter(t => t && t.quantity > 0 && t.price > 0);

    const created: Product = {
      ...newProduct,
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      price: Number(newProduct.price),
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
      image: newProduct.image || '',
      imagePosition: newProduct.imagePosition || `center ${newProduct.imageOffsetY ?? 50}%`,
      imageFit: newProduct.imageFit || 'cover',
      imageOffsetY: newProduct.imageOffsetY ?? 50,
      category: newProduct.category || 'General',
      stock: Number(newProduct.stock ?? 10),
      rating: Number(newProduct.rating ?? 5.0),
      reviewsCount: Number(newProduct.reviewsCount ?? 1),
      tagline: newProduct.tagline?.trim() || undefined,
      features: cleanFeatures.length > 0 ? cleanFeatures : undefined,
      howToUse: cleanHowToUse.length > 0 ? cleanHowToUse : undefined,
      faqs: cleanFaqs.length > 0 ? cleanFaqs : undefined,
      additionalImages: cleanImages.length > 0 ? cleanImages : undefined,
      pricingTiers: cleanPricingTiers.length > 0 ? cleanPricingTiers : undefined
    };

    setProducts(prev => [created, ...prev]);
    setShowAddModal(false);
    setModalTab('basic');
    setNewExtraImage('');
    // Reset form
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      originalPrice: undefined,
      image: '',
      imagePosition: 'center',
      imageFit: 'cover',
      imageOffsetY: 50,
      category: 'General',
      stock: 20,
      rating: 4.8,
      reviewsCount: 15,
      tagline: '',
      features: [
        { title: '', desc: '', icon: 'Award' },
        { title: '', desc: '', icon: 'ShieldCheck' },
        { title: '', desc: '', icon: 'Leaf' }
      ],
      howToUse: ['', '', ''],
      faqs: [
        { q: '', a: '' },
        { q: '', a: '' }
      ],
      additionalImages: []
    });
  };

  // Handles updating product details
  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const cleanFeatures = (editingProduct.features || []).filter(f => f.title && f.title.trim());
    const cleanHowToUse = (editingProduct.howToUse || []).filter(s => typeof s === 'string' && s.trim());
    const cleanFaqs = (editingProduct.faqs || []).filter(f => f.q && f.q.trim());
    const cleanImages = (editingProduct.additionalImages || []).filter(img => img && img.trim());
    const cleanPricingTiers = (editingProduct.pricingTiers || []).filter(t => t && t.quantity > 0 && t.price > 0);

    const updated: Product = {
      ...editingProduct,
      tagline: editingProduct.tagline?.trim() || undefined,
      features: cleanFeatures.length > 0 ? cleanFeatures : undefined,
      howToUse: cleanHowToUse.length > 0 ? cleanHowToUse : undefined,
      faqs: cleanFaqs.length > 0 ? cleanFaqs : undefined,
      additionalImages: cleanImages.length > 0 ? cleanImages : undefined,
      pricingTiers: cleanPricingTiers.length > 0 ? cleanPricingTiers : undefined
    };

    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingProduct(null);
    setEditExtraImage('');
  };

  // Handles deleting product
  const handleDeleteProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    setConfirmModal({
      isOpen: true,
      title: 'حذف المنتج / Delete Product',
      message: `هل أنت متأكد من رغبتك في حذف المنتج "${prod?.name || 'هذا المنتج'}" نهائياً من متجرك؟`,
      confirmText: 'حذف المنتج',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    });
  };

  // Simple quick stock update helper
  const adjustStock = (productId: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + amount);
        return { ...p, stock: newStock };
      }
      return p;
    }));
  };

  const dbTheme = storeConfig?.dashboardTheme || 'dark';
  const dbBg = storeConfig?.dashboardBackgroundColor || (
    dbTheme === 'midnight' ? '#0b0f19' : 
    dbTheme === 'slate' ? '#0f172a' : 
    dbTheme === 'emerald' ? '#022c22' : 
    dbTheme === 'royal-indigo' ? '#1e1b4b' : 
    dbTheme === 'luxury-black' ? '#14110b' : 
    dbTheme === 'light' ? '#f8fafc' : '#09090b'
  );
  const dbSidebar = storeConfig?.dashboardSidebarColor || (
    dbTheme === 'midnight' ? '#111827' : 
    dbTheme === 'slate' ? '#1e293b' : 
    dbTheme === 'emerald' ? '#064e3b' : 
    dbTheme === 'royal-indigo' ? '#312e81' : 
    dbTheme === 'luxury-black' ? '#221c11' : 
    dbTheme === 'light' ? '#ffffff' : '#18181b'
  );
  const dbAccent = storeConfig?.dashboardPrimaryColor || storeConfig?.themePrimaryColor || '#2563eb';

  return (
    <div 
      id="admin-panel-container" 
      dir={dashboardLang === 'ar' ? 'rtl' : 'ltr'} 
      style={{ backgroundColor: dbBg }}
      className="h-[100dvh] max-h-[100dvh] flex flex-col text-stone-100 font-sans antialiased select-none w-full max-w-full overflow-hidden relative"
    >
      {/* Top Header Navigation */}
      <header 
        id="admin-header" 
        dir={dashboardLang === 'ar' ? 'rtl' : 'ltr'}
        style={{ backgroundColor: dbSidebar }}
        className="shrink-0 relative border-b border-stone-800 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full z-40"
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button 
            onClick={onViewStore}
            className="font-logo italic text-lg sm:text-2xl tracking-normal transition-colors duration-300 focus:outline-none cursor-pointer shrink-0"
          >
            <span className="text-stone-100">Mav</span>
            <span className="text-[#2563eb]">luy</span>
          </button>

          {/* Active Store Switcher / Selector Dropdown */}
          {countries && countries.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsStoreHeaderDropdownOpen(!isStoreHeaderDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-blue-500/50 text-stone-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
                title={t.activeStore}
              >
                <CountryFlag code={countries.find(c => c.slug === activeCountrySlug)?.code || activeCountrySlug} size="xs" />
                <span className="font-extrabold text-stone-100 hidden md:inline">
                  {dashboardLang === 'ar' 
                    ? (countries.find(c => c.slug === activeCountrySlug)?.nameAr || countries.find(c => c.slug === activeCountrySlug)?.name || activeCountrySlug.toUpperCase())
                    : (countries.find(c => c.slug === activeCountrySlug)?.name || countries.find(c => c.slug === activeCountrySlug)?.nameAr || activeCountrySlug.toUpperCase())}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] text-blue-400 font-black uppercase bg-blue-950/60 px-1 sm:px-1.5 py-0.5 rounded border border-blue-900/40">
                  {countries.find(c => c.slug === activeCountrySlug)?.currency || 'MAD'}
                </span>
                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isStoreHeaderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStoreHeaderDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStoreHeaderDropdownOpen(false)} />
                  <div className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-64 bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-fadeIn">
                    <div className="px-3.5 py-1.5 border-b border-stone-800 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t.activeStore}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveTab('stores');
                          setIsStoreHeaderDropdownOpen(false);
                        }}
                        className="text-blue-400 hover:underline cursor-pointer"
                      >
                        {dashboardLang === 'ar' ? '← إدارة الكل' : 'Manage All →'}
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {countries.map(c => (
                        <button
                          key={c.id || c.slug}
                          type="button"
                          onClick={() => {
                            if (onSwitchCountry) onSwitchCountry(c.slug);
                            setIsStoreHeaderDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-start cursor-pointer transition-colors hover:bg-stone-850 ${
                            c.slug === activeCountrySlug ? 'bg-blue-950/40 text-blue-400 font-black' : 'text-stone-300 font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CountryFlag code={c.code || c.slug} size="sm" />
                            <div className="text-start">
                              <span className="block font-bold">{dashboardLang === 'ar' ? (c.nameAr || c.name) : (c.name || c.nameAr)}</span>
                              <span className="text-[10px] text-stone-500 font-normal">{dashboardLang === 'ar' ? c.name : c.nameAr}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="font-mono text-[10px] text-stone-400 font-bold block">{c.currency}</span>
                            {c.status === 'disabled' && (
                              <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-1 rounded">{t.inactive}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="pt-1.5 border-t border-stone-800 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('stores');
                          setShowAddStoreModal(true);
                          setIsStoreHeaderDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addNewStore}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-Time Live Order Notifications Popover Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsNotificationsPopoverOpen(!isNotificationsPopoverOpen)}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer shadow-xs ${
                pushEnabled || soundEnabled
                  ? 'bg-stone-900 hover:bg-stone-850 text-blue-400 border-blue-500/50 hover:border-blue-400'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border-stone-800'
              }`}
              title={dashboardLang === 'ar' ? 'إشعارات الطلبات الفورية' : 'Live Order Notifications'}
            >
              <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline text-[11px] font-extrabold text-stone-200">
                {dashboardLang === 'ar' ? 'الإشعارات' : 'Alerts'}
              </span>
              
              {/* Green active ping indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {isNotificationsPopoverOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationsPopoverOpen(false)}
                />
                <div 
                  className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-72 sm:w-80 bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl z-50 p-3.5 overflow-hidden animate-fadeIn text-stone-200 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-100">
                          {dashboardLang === 'ar' ? 'إشعارات الطلبيات المباشرة' : 'Live Order Push Alerts'}
                        </h4>
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {dashboardLang === 'ar' ? 'البث المباشر متصل (SSE Active)' : 'Live Stream Connected (SSE)'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsPopoverOpen(false)}
                      className="text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Push Permission Status / Toggle */}
                  <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="text-start">
                      <p className="text-xs font-bold text-stone-200">
                        {dashboardLang === 'ar' ? 'إشعارات المتصفح / الهاتف' : 'Browser / OS Push'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {pushPermission === 'granted'
                          ? (dashboardLang === 'ar' ? 'مفعل على هذا الجهاز' : 'Granted on device')
                          : (dashboardLang === 'ar' ? 'يتطلب الإذن' : 'Permission needed')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={togglePushEnabled}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        pushEnabled && pushPermission === 'granted'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {pushEnabled && pushPermission === 'granted' 
                        ? (dashboardLang === 'ar' ? 'مفعل' : 'ON') 
                        : (dashboardLang === 'ar' ? 'تفعيل' : 'Enable')}
                    </button>
                  </div>

                  {/* Sound Chime Toggle */}
                  <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                      <div className="text-start">
                        <p className="text-xs font-bold text-stone-200">
                          {dashboardLang === 'ar' ? 'صوت الكاشير / التنبيه' : 'Cash Register Sound'}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {soundEnabled ? (dashboardLang === 'ar' ? 'رنين الكاشير نشط' : 'Chime active') : (dashboardLang === 'ar' ? 'صامت' : 'Muted')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSoundEnabled}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        soundEnabled ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {soundEnabled ? (dashboardLang === 'ar' ? 'مفعل' : 'ON') : (dashboardLang === 'ar' ? 'كتم' : 'OFF')}
                    </button>
                  </div>

                  {/* Test Notification Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerTestNotification();
                    }}
                    className="w-full bg-stone-800 hover:bg-stone-750 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dashboardLang === 'ar' ? 'تجربة إشعار فوري (Test Notification)' : 'Send Test Notification'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Clean Language Switcher Dropdown (Matching Homepage Header Style) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAdminLangDropdownOpen(!isAdminLangDropdownOpen)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-850 hover:border-blue-500/50 text-stone-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-stone-800 cursor-pointer shadow-xs whitespace-nowrap"
              title={dashboardLang === 'ar' ? 'اختر اللغة / Select Language' : 'Select Language / اختر اللغة'}
            >
              <Globe className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
              <span className="text-[10px] sm:text-xs flex items-center gap-1 font-extrabold">
                {dashboardLang === 'ar' ? 'عربي' : 'EN'}
                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isAdminLangDropdownOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {isAdminLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsAdminLangDropdownOpen(false)}
                />
                <div 
                  className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-44 bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden animate-fadeIn text-stone-200"
                  style={{ minWidth: '160px' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleSetDashboardLang('ar');
                      setIsAdminLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-start cursor-pointer transition-colors hover:bg-stone-850 ${
                      dashboardLang === 'ar' ? 'text-[#2563eb] bg-blue-950/40 font-extrabold' : 'font-semibold'
                    }`}
                  >
                    <CountryFlag code="SA" size="sm" />
                    <span>العربية (Arabic)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSetDashboardLang('en');
                      setIsAdminLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-start cursor-pointer transition-colors hover:bg-stone-850 ${
                      dashboardLang === 'en' ? 'text-[#2563eb] bg-blue-950/40 font-extrabold' : 'font-semibold'
                    }`}
                  >
                    <CountryFlag code="GB" size="sm" />
                    <span>English (UK)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* MongoDB Atlas Live Connection Status Pill */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              mongoStatus?.connected 
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50' 
                : 'bg-amber-950/50 text-amber-300 border-amber-700/80 hover:bg-amber-900/50'
            }`}
            title={mongoStatus?.connected ? t.connectedStatus : t.mongoConnect}
          >
            <Database className={`w-3.5 h-3.5 ${mongoStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{mongoStatus?.connected ? t.mongoConnected : t.mongoConnect}</span>
            <span className={`w-2 h-2 rounded-full ${mongoStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {loggedInAdminEmail && (
            <div className="hidden xl:flex flex-col text-start">
              <span className="text-[9px] font-black text-stone-500 tracking-wider">{t.adminSession}</span>
              <span className="text-[11px] text-stone-300 font-mono font-bold">{loggedInAdminEmail}</span>
            </div>
          )}

          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-rose-950/40 hover:text-rose-400 text-stone-400 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-full transition-all border border-stone-800 hover:border-stone-700 cursor-pointer shrink-0 shadow-xs"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          )}
        </div>

        {/* Dynamic Glowing Top Progress Bar right beneath the admin header */}
        <TopLoadingBar 
          isLoading={isAdminNavigating || isSyncingMongo || isConnectingMongo || adminsLoading} 
          position="under-header" 
          color="primary" 
        />
      </header>

      {/* Main SaaS Workspace */}
      <div id="admin-workspace" className="flex-1 flex flex-col lg:flex-row w-full max-w-full min-h-0 overflow-hidden" dir={dashboardLang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Sidebar Navigation - Hidden on Mobile, Direct Under Header on Desktop */}
        <aside 
          id="admin-sidebar" 
          style={{ backgroundColor: dbSidebar }}
          className="hidden lg:flex lg:flex-col w-64 border-r border-stone-800 p-3.5 space-y-1 shrink-0 overflow-y-auto dark-scrollbar"
        >
          <div className="px-2 pt-0.5 pb-1.5 border-b border-stone-800/80 mb-1">
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">{t.dashboardOptions}</p>
          </div>

          <button
            id="tab-dashboard"
            onClick={() => handleSwitchTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t.dashboard}</span>
          </button>

          <button
            id="tab-products"
            onClick={() => handleSwitchTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>{t.products}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'}`}>
              {products.length}
            </span>
          </button>

          <button
            id="tab-orders"
            onClick={() => handleSwitchTab('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>{t.orders}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'}`}>
              {orders.length}
            </span>
          </button>

          <button
            id="tab-coupons"
            onClick={() => handleSwitchTab('coupons')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>{t.coupons}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'coupons' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'}`}>
              {coupons.length}
            </span>
          </button>

          <button
            id="tab-reviews"
            onClick={() => handleSwitchTab('reviews')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>{t.reviews}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'}`}>
              {reviews.length}
            </span>
          </button>

          <button
            id="tab-tickets"
            onClick={() => handleSwitchTab('tickets')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{t.tickets}</span>
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className={`${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} bg-red-500 text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse`}>
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>

          <button
            id="tab-pixel"
            onClick={() => handleSwitchTab('pixel')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'pixel'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{t.pixel || (dashboardLang === 'ar' ? 'البكسل والتحليلات' : 'Pixel & Analytics')}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'pixel' ? 'bg-white/20 text-white' : 'bg-blue-950/60 text-blue-300 border border-blue-900/50'}`}>
              Pixel
            </span>
          </button>

          <button
            id="tab-stores"
            onClick={() => handleSwitchTab('stores')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>{t.stores}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboardLang === 'ar' ? 'mr-auto' : 'ml-auto'} ${activeTab === 'stores' ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-300'}`}>
              {countries.length}
            </span>
          </button>

          <button
            id="tab-brand"
            onClick={() => handleSwitchTab('brand')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'brand'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{dashboardLang === 'ar' ? 'الشعار ونصوص المتجر' : 'Brand & Content'}</span>
          </button>

          <button
            id="tab-favorites"
            onClick={() => handleSwitchTab('favorites')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{dashboardLang === 'ar' ? 'المفضلة واهتمامات العملاء' : 'Favorites & Wishlists'}</span>
          </button>

          <button
            id="tab-settings"
            onClick={() => handleSwitchTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t.settings}</span>
          </button>
        </aside>

        {/* Workspace Content Panels */}
        <main id="admin-main-content" className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-8 pb-28 lg:pb-8 dark-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
          {/* TOAST NOTIFICATION */}
          {showSaveToast && (
            <div className="fixed bottom-5 right-5 z-50 bg-stone-950 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-xs font-bold uppercase tracking-wider">Store settings updated successfully!</p>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div id="panel-dashboard" className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">{t.activityOverview}</h2>
                  <p className="text-xs text-stone-400 font-medium">{t.activitySubtitle}</p>
                </div>
                <div className="text-[10px] text-stone-400 font-mono bg-stone-900 px-3 py-1.5 rounded-full border border-stone-800 font-bold">
                  {dashboardLang === 'ar' ? 'آخر مزامنة: ' : 'Last Sync: '}{new Date().toLocaleTimeString(dashboardLang === 'ar' ? 'ar-MA' : 'en-US')}
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#18181b] p-5 rounded-[2rem] border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.deliveredRevenue}</span>
                    <span className="p-2 bg-emerald-950/40 text-emerald-400 rounded-xl">
                      <Coins className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-100">{totalSales} {displayCurrency}</h3>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-wide">
                      {t.paidCod}
                    </p>
                  </div>
                </div>

                <div className="bg-[#18181b] p-5 rounded-[2rem] border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.pendingRevenue}</span>
                    <span className="p-2 bg-amber-950/40 text-amber-400 rounded-xl">
                      <Truck className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-100">{pendingSales} {displayCurrency}</h3>
                    <p className="text-[10px] text-amber-400 font-bold mt-1 uppercase tracking-wide">
                      {t.inTransit}
                    </p>
                  </div>
                </div>

                <div className="bg-[#18181b] p-5 rounded-[2rem] border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.totalOrders}</span>
                    <span className="p-2 bg-blue-950/40 text-blue-400 rounded-xl">
                      <ClipboardList className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-100">{totalOrdersCount}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[9px] font-bold">
                      <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-300 rounded border border-amber-900/40">{pendingOrdersCount} {dashboardLang === 'ar' ? 'انتظار' : 'pend'}</span>
                      <span className="px-1.5 py-0.5 bg-blue-950/40 text-blue-300 rounded border border-blue-900/40">{shippedOrdersCount} {dashboardLang === 'ar' ? 'شحن' : 'ship'}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-950/40 text-emerald-300 rounded border border-emerald-900/40">{deliveredOrdersCount} {dashboardLang === 'ar' ? 'تم' : 'del'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#18181b] p-5 rounded-[2rem] border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.averageOrderValue}</span>
                    <span className="p-2 bg-purple-950/40 text-purple-400 rounded-xl">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-100">{averageOrderValue} {displayCurrency}</h3>
                    <p className="text-[10px] text-stone-400 font-medium mt-1 uppercase tracking-wide">
                      {t.avgPerTransaction}
                    </p>
                  </div>
                </div>
              </div>

              {/* MAIN METRICS & INSIGHTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2 on Desktop: Performance & Top Products */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* CHART: Weekly Performance */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-100 text-sm sm:text-base">{t.weeklyPerformance}</h3>
                        <p className="text-xs text-stone-400">{t.weeklySalesVolume} ({displayCurrency})</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-400">COD Live</span>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2 pt-6">
                      {weeklyPerformance.map((item, index) => {
                        const percentHeight = Math.min(100, (item.sales / maxWeeklySales) * 100);
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                            <div className="w-full relative flex justify-center h-full items-end">
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-950 border border-stone-800 text-white text-[9px] px-2 py-1 rounded-lg shadow-lg pointer-events-none z-10 text-center whitespace-nowrap leading-tight">
                                <span className="font-bold text-[#2563eb]">{item.sales} {displayCurrency}</span> <br />
                                <span>{item.count} order{item.count !== 1 ? 's' : ''}</span>
                              </div>
                              {/* Bar item */}
                              <div 
                                style={{ height: `${percentHeight}%` }}
                                className="w-full max-w-[28px] bg-stone-800 group-hover:bg-[#2563eb] rounded-t-lg transition-all duration-300 relative cursor-pointer flex justify-center overflow-hidden"
                              >
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2563eb] opacity-40 group-hover:opacity-100" />
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-stone-400 group-hover:text-stone-100 transition-colors">{item.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOP SELLING PRODUCTS */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-100 text-sm sm:text-base">{t.topSellingProducts}</h3>
                        <p className="text-xs text-stone-400">{t.bySalesVolume}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-900/40 text-blue-400">Best Sellers</span>
                    </div>

                    {topSellingProducts.length > 0 ? (
                      <div className="divide-y divide-stone-800">
                        {topSellingProducts.map((p, i) => (
                          <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-stone-800 shrink-0" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <h4 className="text-stone-200 text-xs font-bold truncate max-w-[150px] sm:max-w-[250px]">{p.name}</h4>
                                <span className="text-[10px] text-stone-500 font-medium">{p.qty} {dashboardLang === 'ar' ? 'قطعة مباعة' : `item${p.qty !== 1 ? 's' : ''} sold`}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-stone-200 text-xs font-mono font-bold block">{p.revenue} {displayCurrency}</span>
                              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide">{dashboardLang === 'ar' ? 'مكتمل / مشحون' : 'Delivered / Shipped'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-stone-500 space-y-1">
                        <ShoppingBag className="w-8 h-8 text-stone-600 mx-auto" />
                        <p className="text-xs font-bold">{dashboardLang === 'ar' ? 'لا توجد مبيعات مكتملة بعد' : 'No product sales yet'}</p>
                        <p className="text-[10px] text-stone-600">{dashboardLang === 'ar' ? 'ستظهر الإحصائيات فور تسليم الطلبات للعملاء.' : 'Product metrics will show once orders are marked delivered.'}</p>
                      </div>
                    )}
                  </div>

                  {/* INVENTORY / LOW STOCK ALERTS */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-100 text-sm sm:text-base">{t.stockAlerts}</h3>
                        <p className="text-xs text-stone-400">{t.productsNeedingRestock}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-400">Inventory</span>
                    </div>

                    {lowStockProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lowStockProducts.map((p) => (
                          <div key={p.id} className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-2xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded-md object-cover border border-stone-800 shrink-0" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <h4 className="text-stone-200 text-xs font-bold truncate">{p.name}</h4>
                                <span className="text-[10px] text-stone-500 font-semibold uppercase">{p.category}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-mono font-black ${p.stock === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                                {p.stock} {dashboardLang === 'ar' ? 'متبقي' : 'left'}
                              </span>
                              <button 
                                onClick={() => {
                                  setActiveTab('products');
                                  setEditingProduct(p);
                                }}
                                className="block text-[9px] text-[#2563eb] hover:underline font-bold"
                              >
                                {t.edit}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-stone-900/30 border border-stone-800/40 p-4 rounded-2xl flex items-center gap-3 text-stone-400 text-xs font-semibold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>{dashboardLang === 'ar' ? 'جميع المنتجات لديها مخزون ممتاز وكافٍ!' : 'All products have optimal stock levels. Great management!'}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Column 3 on Desktop: Geographic & Feed & Support Resolution */}
                <div className="space-y-6">

                  {/* GEOGRAPHIC: Sales by City */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-100 text-sm sm:text-base">{t.salesByCity}</h3>
                        <p className="text-xs text-stone-400">{t.moroccoCod}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-900/40 text-purple-400">Demographics</span>
                    </div>

                    <div className="space-y-3.5">
                      {salesByCity.length > 0 ? (
                        salesByCity.map((c, i) => {
                          const maxSales = Math.max(...salesByCity.map(item => item.total));
                          const percentWidth = maxSales > 0 ? (c.total / maxSales) * 100 : 0;
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-stone-200 flex items-center gap-1.5 font-bold">
                                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                                  {c.city}
                                </span>
                                <span className="text-stone-300 font-mono font-bold">{c.total} {storeConfig.currency} <span className="text-[10px] text-stone-500 font-sans">({c.count})</span></span>
                              </div>
                              <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                                <div style={{ width: `${percentWidth}%` }} className="h-full bg-[#2563eb] rounded-full" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-stone-600 space-y-1">
                          <MapPin className="w-7 h-7 mx-auto text-stone-700" />
                          <p className="text-xs font-bold">{dashboardLang === 'ar' ? 'لا توجد بيانات مدن مسجلة بعد' : 'No geographic order data yet'}</p>
                          <p className="text-[10px] text-stone-600">{dashboardLang === 'ar' ? 'ستظهر توزيعات المدن تلقائياً بمجرد إتمام الطلبات الحقيقية.' : 'City analytics populate as real customer orders arrive.'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE CUSTOMER SUPPORT SECT */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-100 text-sm sm:text-base">{t.supportDesk}</h3>
                        <p className="text-xs text-stone-400">{t.customerFeedback}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
                        {openTicketsCount} {t.open}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {tickets.length > 0 ? (
                        tickets.slice(0, 3).map((tItem, idx) => (
                          <div key={idx} className="p-3 bg-stone-900/40 border border-stone-850 rounded-2xl space-y-1.5 text-xs font-semibold">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-200 font-bold">{tItem.customerName}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                tItem.status === 'open' 
                                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                              }`}>
                                {tItem.status}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-stone-300 font-medium line-clamp-2 italic">"{tItem.message}"</p>
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800/40 text-[9px] text-stone-500 font-mono font-bold">
                              <span>{tItem.customerPhone}</span>
                              <span>{tItem.date}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-stone-600 space-y-1">
                          <MessageSquare className="w-8 h-8 mx-auto text-stone-700" />
                          <p className="text-xs font-bold">{dashboardLang === 'ar' ? 'لا توجد تذاكر دعم مسجلة' : 'No tickets filed'}</p>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setActiveTab('tickets')}
                        className="w-full text-center text-xs text-[#2563eb] hover:underline font-bold block pt-1 cursor-pointer"
                      >
                        {dashboardLang === 'ar' ? 'الذهاب إلى قسم تذاكر الدعم والشكاوى ←' : 'Go to Support Tickets Panel →'}
                      </button>
                    </div>
                  </div>

                  {/* SYSTEM & SETTINGS SUMMARY CARD */}
                  <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-xs space-y-4">
                    <div>
                      <h3 className="font-bold text-stone-100 text-sm sm:text-base">Store Identity</h3>
                      <p className="text-xs text-stone-400">Current active configurations</p>
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-stone-300">
                      <div className="flex items-center justify-between py-1.5 border-b border-stone-800/60">
                        <span className="text-stone-500">Store Name</span>
                        <span className="text-stone-200 font-bold">{storeConfig.storeName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-stone-800/60">
                        <span className="text-stone-500">Phone Contact</span>
                        <span className="text-stone-200 font-mono font-bold">{storeConfig.phone}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-stone-800/60">
                        <span className="text-stone-500">COD Location</span>
                        <span className="text-stone-200 font-bold">{storeConfig.location}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-stone-500">Shipping Fee</span>
                        <span className="text-stone-200 font-mono font-bold">{storeConfig.shippingFee} {storeConfig.currency}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div id="panel-products" className="space-y-6 animate-fadeIn">
              {showAddModal ? (
                <ProductForm
                  isEdit={false}
                  product={newProduct}
                  onChange={(updater) => setNewProduct(prev => updater(prev) as any)}
                  onSubmit={handleAddProduct}
                  onCancel={() => { setShowAddModal(false); setModalTab('basic'); }}
                  storeConfig={storeConfig}
                  modalTab={modalTab}
                  setModalTab={setModalTab}
                  extraImage={newExtraImage}
                  setExtraImage={setNewExtraImage}
                  dashboardLang={dashboardLang}
                />
              ) : editingProduct ? (
                <ProductForm
                  isEdit={true}
                  product={editingProduct}
                  onChange={(updater) => setEditingProduct(prev => (prev ? updater(prev) as Product : null))}
                  onSubmit={handleUpdateProduct}
                  onCancel={() => { setEditingProduct(null); setModalTab('basic'); }}
                  storeConfig={storeConfig}
                  modalTab={modalTab}
                  setModalTab={setModalTab}
                  extraImage={editExtraImage}
                  setExtraImage={setEditExtraImage}
                  dashboardLang={dashboardLang}
                />
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">{t.productsManagement}</h2>
                      <p className="text-xs text-stone-400 font-medium">{t.productsSubtitle}</p>
                    </div>
                    <button
                      id="btn-add-product"
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addProductBtn}</span>
                    </button>
                  </div>

                  {/* PRODUCTS LIST - Responsive Mobile Cards + Desktop Table */}
                  <div className="bg-[#18181b] rounded-3xl sm:rounded-[2rem] border border-stone-800 shadow-xs overflow-hidden">
                {/* Mobile Cards (visible on sm and below) */}
                <div className="block md:hidden divide-y divide-stone-850">
                  {products.map((product) => (
                    <div key={product.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-16 h-16 object-cover rounded-2xl border border-stone-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-100 text-sm line-clamp-1">{product.name}</h4>
                              {product.sku && (
                                <span className="inline-block mt-0.5 font-mono text-[9px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900/40 px-1.5 py-0.2 rounded uppercase">
                                  {product.sku}
                                </span>
                              )}
                            </div>
                            <span className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0">
                              {product.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{product.description}</p>
                          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                            <span className="font-black text-stone-100 text-sm">{product.price} {displayCurrency}</span>
                            {product.originalPrice && (
                              <span className="text-[10px] text-stone-500 line-through font-medium">{product.originalPrice} {displayCurrency}</span>
                            )}
                            {product.pricingTiers && product.pricingTiers.length > 0 && (
                              <span className="text-[9px] font-black text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-amber-400" />
                                <span>{product.pricingTiers.length} {dashboardLang === 'ar' ? 'باقات كميات' : 'Tiers'}</span>
                                {product.pricingTiers.some(t => t.isPopular) && (
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                        {/* Stock Controls */}
                        <div className="flex items-center gap-1.5 bg-stone-900 px-2.5 py-1 rounded-xl border border-stone-800">
                          <span className="text-[10px] text-stone-400 font-medium mr-1">{dashboardLang === 'ar' ? 'المخزون:' : 'Stock:'}</span>
                          <button 
                            onClick={() => adjustStock(product.id, -1)}
                            className="w-5 h-5 rounded-lg border border-stone-800 hover:bg-stone-800 flex items-center justify-center font-bold text-stone-300 transition-all cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className={`font-mono font-bold text-xs px-1 ${product.stock === 0 ? 'text-rose-400' : product.stock <= 5 ? 'text-amber-400' : 'text-stone-200'}`}>
                            {product.stock}
                          </span>
                          <button 
                            onClick={() => adjustStock(product.id, 1)}
                            className="w-5 h-5 rounded-lg border border-stone-800 hover:bg-stone-800 flex items-center justify-center font-bold text-stone-300 transition-all cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="px-3 py-1.5 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.edit}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-stone-400 hover:bg-rose-950/40 hover:text-rose-400 rounded-xl cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (hidden on mobile, visible on md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-900 border-b border-stone-800 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        <th className="px-6 py-4.5">{t.productCol}</th>
                        <th className="px-6 py-4.5">{t.categoryCol}</th>
                        <th className="px-6 py-4.5">{t.priceCol}</th>
                        <th className="px-6 py-4.5 text-center">{t.stockCol}</th>
                        <th className="px-6 py-4.5 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 text-xs text-stone-300 font-semibold">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-stone-900/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-12 h-12 object-cover rounded-xl border border-stone-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-stone-100 text-sm truncate max-w-[200px] sm:max-w-[300px]">{product.name}</h4>
                                  {product.sku && (
                                    <span className="font-mono text-[9px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900/40 px-1.5 py-0.5 rounded uppercase">
                                      {product.sku}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-500 font-medium truncate max-w-[200px] sm:max-w-[300px] mt-0.5">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-stone-900 border border-stone-800 text-stone-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-stone-100 text-sm">{product.price} {displayCurrency}</div>
                            {product.originalPrice && (
                              <div className="text-[10px] text-stone-500 line-through font-medium mt-0.5">{product.originalPrice} {displayCurrency}</div>
                            )}
                            {product.pricingTiers && product.pricingTiers.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                                  <Tag className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{product.pricingTiers.length} {dashboardLang === 'ar' ? 'باقات كميات' : 'Tiers'}</span>
                                  {product.pricingTiers.some(t => t.isPopular) && (
                                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                                      <span>{dashboardLang === 'ar' ? 'الأكثر طلباً' : 'Popular'}</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => adjustStock(product.id, -1)}
                                className="w-6 h-6 rounded-full border border-stone-800 hover:bg-stone-850 flex items-center justify-center font-bold text-stone-400 transition-all cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className={`font-mono font-bold w-12 text-center text-xs ${product.stock === 0 ? 'text-rose-400' : product.stock <= 5 ? 'text-amber-400' : 'text-stone-300'}`}>
                                {product.stock === 0 ? t.outOfStock : `${product.stock} ${dashboardLang === 'ar' ? 'قطعة' : 'units'}`}
                              </span>
                              <button 
                                onClick={() => adjustStock(product.id, 1)}
                                className="w-6 h-6 rounded-full border border-stone-800 hover:bg-stone-850 flex items-center justify-center font-bold text-stone-400 transition-all cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="p-2 text-stone-400 hover:bg-stone-800 hover:text-white rounded-xl transition-all cursor-pointer"
                                title={t.edit}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-stone-400 hover:bg-rose-950/40 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

                </>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div id="panel-orders" className="space-y-6 animate-fadeIn">
              {/* Header with Title & Google Sheet Export / Import CTAs */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">
                        {dashboardLang === 'ar' ? 'طلبات الدفع عند الاستلام وجوجل شيت' : 'COD Orders & Google Sheets'}
                      </h2>
                      <p className="text-xs text-stone-400 font-medium font-sans">
                        {t.ordersSubtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* IMPORT ORDERS BUTTON */}
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setImportOrdersError('');
                      setImportOrdersSuccess('');
                      setParsedImportOrders([]);
                      setImportOrdersFile(null);
                    }}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-stone-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    title={dashboardLang === 'ar' ? 'استيراد طلبات من ملف CSV / جوجل شيت' : 'Import orders from Google Sheets / Excel CSV file'}
                  >
                    <FileUp className="w-4 h-4 text-emerald-400" />
                    <span>{t.importSheetBtn}</span>
                  </button>

                  {/* EXPORT TO GOOGLE SHEETS / EXCEL CSV */}
                  <button
                    onClick={() => handleExportOrdersToCSV(filteredOrders)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                    title={dashboardLang === 'ar' ? 'تحميل ملف CSV متوافق مع جوجل شيت وإكسيل' : 'Download CSV formatted for Google Sheets and Excel'}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadSheetBtn} ({filteredOrders.length})</span>
                  </button>
                </div>
              </div>

              {/* DATE RANGE & STATUS FILTERS TOOLBAR */}
              <div className="bg-[#18181b] p-5 rounded-[2rem] border border-stone-800 space-y-4 shadow-sm">
                {/* Row 1: Search & Date Range Selectors */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t.searchOrdersPlaceholder}
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Date Range Selector Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-850">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>{t.periodLabel}</span>
                    </span>
                    <button
                      onClick={() => setOrderDateRange('all')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodAll}
                    </button>
                    <button
                      onClick={() => setOrderDateRange('today')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'today'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodToday}
                    </button>
                    <button
                      onClick={() => setOrderDateRange('yesterday')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'yesterday'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodYesterday}
                    </button>
                    <button
                      onClick={() => setOrderDateRange('week')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'week'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodWeek}
                    </button>
                    <button
                      onClick={() => setOrderDateRange('month')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'month'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodMonth}
                    </button>
                    <button
                      onClick={() => setOrderDateRange('custom')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        orderDateRange === 'custom'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {t.periodCustom}
                    </button>
                  </div>
                </div>

                {/* Custom Date Pickers (Shown if orderDateRange === 'custom') */}
                {orderDateRange === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-800/60 animate-fadeIn text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold text-[11px]">{t.fromDate}:</span>
                      <input
                        type="date"
                        value={orderCustomStartDate}
                        onChange={(e) => setOrderCustomStartDate(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold text-[11px]">{t.toDate}:</span>
                      <input
                        type="date"
                        value={orderCustomEndDate}
                        onChange={(e) => setOrderCustomEndDate(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    {(orderCustomStartDate || orderCustomEndDate) && (
                      <button
                        onClick={() => {
                          setOrderCustomStartDate('');
                          setOrderCustomEndDate('');
                        }}
                        className="text-[11px] text-rose-400 hover:underline font-bold"
                      >
                        {t.clearDate}
                      </button>
                    )}
                  </div>
                )}

                {/* Row 2: Status Filter Tabs & Summary Counter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-850">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-stone-400" />
                      {t.statusFilterLabel}:
                    </span>
                    {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                        }`}
                      >
                        {st === 'all' && `${t.all} (${orders.length})`}
                        {st === 'pending' && `${t.pending} (${orders.filter(o => o.status === 'pending').length})`}
                        {st === 'shipped' && `${t.shipped} (${orders.filter(o => o.status === 'shipped').length})`}
                        {st === 'delivered' && `${t.delivered} (${orders.filter(o => o.status === 'delivered').length})`}
                        {st === 'cancelled' && `${t.cancelled} (${orders.filter(o => o.status === 'cancelled').length})`}
                      </button>
                    ))}
                  </div>

                  {/* Summary Metric Ribbon */}
                  <div className="flex items-center gap-3 text-xs font-semibold text-stone-400">
                    <div>
                      <span>{t.displayedOrders}: </span>
                      <strong className="text-emerald-400 font-bold">{filteredOrders.length}</strong>
                    </div>
                    <span>•</span>
                    <div>
                      <span>{t.totalAmountLabel}: </span>
                      <strong className="text-blue-400 font-bold">
                        {filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} {getDisplayCurrency(storeConfig.currency, dashboardLang)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ORDERS LIST */}
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-[#18181b] rounded-[2rem] p-12 border border-stone-800 shadow-xs text-center space-y-3">
                    <Package className="w-12 h-12 text-stone-600 mx-auto" />
                    <h3 className="font-bold text-stone-300 text-sm uppercase tracking-wider">
                      {orders.length === 0 ? t.noOrdersFound : (dashboardLang === 'ar' ? 'لا توجد طلبات تطابق الفلتر المحدد' : 'No Orders Match Selected Filter')}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                      {orders.length === 0 
                        ? t.noOrdersDesc
                        : (dashboardLang === 'ar' ? 'جرب تغيير خيارات الفلترة أو التاريخ أو مسح كلمة البحث لرؤية باقي الطلبات.' : 'Try changing filter parameters, date range, or clear the search query to see other orders.')}
                    </p>
                    {orders.length > 0 && (
                      <button
                        onClick={() => {
                          setOrderDateRange('all');
                          setOrderStatusFilter('all');
                          setOrderSearchQuery('');
                          setOrderCustomStartDate('');
                          setOrderCustomEndDate('');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold border border-stone-700 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.resetAllFilters}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-[#18181b] rounded-[2.25rem] border border-stone-800 shadow-xs overflow-visible relative flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-stone-800 transition-all hover:border-stone-750"
                    >
                      {/* Left Side: Client Data */}
                      <div className="p-6 lg:w-1/3 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-blue-400 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/30">
                            {order.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-500 font-bold font-mono">
                              {new Date(order.date).toLocaleString('en-US', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900/50 cursor-pointer"
                              title={dashboardLang === 'ar' ? 'حذف هذا الطلب نهائياً' : 'Delete this order permanently'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 font-semibold">
                          <h4 className="font-black text-stone-100 text-sm flex items-center gap-2">
                            <span>{order.customerName}</span>
                            {order.id.startsWith('ORD-IMP') && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-900/30">
                                {dashboardLang === 'ar' ? 'مستورد من شيت' : 'Sheet Import'}
                              </span>
                            )}
                          </h4>
                          <div className="text-xs text-stone-400 space-y-1.5 font-semibold">
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-stone-500" />
                              <a href={`tel:${order.customerPhone}`} className="hover:underline text-stone-200 font-bold font-mono">{order.customerPhone}</a>
                            </p>
                            <p className="flex items-start gap-2 leading-relaxed">
                              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                              <span>{order.customerAddress}, <strong className="text-stone-100 uppercase font-black tracking-wide">{order.customerCity}</strong></span>
                            </p>
                          </div>
                        </div>

                        {/* Order status selector picker */}
                        <div className="space-y-1.5 pt-2">
                          <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">{t.statusCol}</label>
                          <CustomSelect
                            value={order.status}
                            onChange={(val) => handleUpdateOrderStatus(order.id, val as any)}
                            theme="dark"
                            size="sm"
                            options={[
                              { value: 'pending', label: dashboardLang === 'ar' ? 'قيد التأكيد' : 'Pending Confirmation' },
                              { value: 'shipped', label: dashboardLang === 'ar' ? 'قيد الشحن والتوصيل' : 'Shipped / In Transit' },
                              { value: 'delivered', label: dashboardLang === 'ar' ? 'تم الاستلام والدفع' : 'Delivered & Paid' },
                              { value: 'cancelled', label: dashboardLang === 'ar' ? 'ملغى' : 'Cancelled' }
                            ]}
                          />
                        </div>

                        {/* WhatsApp confirm direct CTA */}
                        <div className="pt-2">
                          <a 
                            href={`https://wa.me/212${order.customerPhone.replace(/^0/, '')}?text=Bonjour%20${encodeURIComponent(order.customerName)},%20c'est%20la%20boutique%20${encodeURIComponent(storeConfig.storeName)}.%20Nous%20souhaitons%20confirmer%20votre%20commande%20${order.id}%20de%20${order.total}%20DH.`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-full transition-all shadow-md shadow-blue-600/15"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{dashboardLang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm on WhatsApp'}</span>
                          </a>
                        </div>
                      </div>

                      {/* Right Side: Purchased Products detail */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{t.orderItems}</h5>
                          
                          <div className="divide-y divide-stone-800 max-h-56 overflow-y-auto pr-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="py-2 flex items-center justify-between gap-4 text-xs font-semibold">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img 
                                    src={item.image} 
                                    alt={item.productName} 
                                    className="w-10 h-10 object-cover rounded-lg border border-stone-800 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h6 className="font-bold text-stone-200 truncate max-w-[150px] sm:max-w-xs">{item.productName}</h6>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase mt-0.5">
                                      {dashboardLang === 'ar' ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-black text-stone-100 shrink-0">{item.price * item.quantity} {getDisplayCurrency(storeConfig.currency, dashboardLang)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Notes */}
                        {order.notes && (
                          <div className="bg-amber-950/35 border border-amber-900/45 rounded-2xl p-3 text-[11px] text-amber-300 font-semibold leading-relaxed">
                            <span className="font-bold uppercase tracking-wider text-[9px] block mb-0.5">
                              {dashboardLang === 'ar' ? 'ملاحظة العميل:' : 'Client Note:'}
                            </span>
                            "{order.notes}"
                          </div>
                        )}

                        {/* Math Breakdown Box */}
                        <div className="border-t border-stone-800 pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400 font-bold">
                            <div>{dashboardLang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} <span className="text-stone-200">{order.subtotal} {getDisplayCurrency(storeConfig.currency, dashboardLang)}</span></div>
                            {order.couponCode && (
                              <div className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-900/40">
                                <span>{dashboardLang === 'ar' ? `كوبون (${order.couponCode}):` : `Coupon (${order.couponCode}):`}</span>
                                <span>-{order.discountAmount || 0} {getDisplayCurrency(storeConfig.currency, dashboardLang)}</span>
                              </div>
                            )}
                            <div>{dashboardLang === 'ar' ? 'الشحن:' : 'Shipping:'} <span className="text-stone-200">{order.shippingFee === 0 ? (dashboardLang === 'ar' ? 'مجاني' : 'FREE') : `${order.shippingFee} ${getDisplayCurrency(storeConfig.currency, dashboardLang)}`}</span></div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3.5">
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{t.totalAmountLabel}:</span>
                            <span className="text-base font-black text-blue-400">{order.total} {getDisplayCurrency(storeConfig.currency, dashboardLang)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MODAL: IMPORT ORDERS FROM GOOGLE SHEETS / CSV */}
              {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
                  <div className="bg-[#18181b] border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                          <FileUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-stone-100 font-serif">
                            {dashboardLang === 'ar' ? 'استيراد طلبات من Google Sheets / Excel' : 'Import Orders from Google Sheets / Excel'}
                          </h3>
                          <p className="text-xs text-stone-400 font-medium font-sans">
                            {dashboardLang === 'ar' ? 'ارفع طلباتك القادمة من واتساب، فيسبوك، أو إنستغرام لدمجها تلقائياً مع طلبات المتجر' : 'Upload orders from WhatsApp, Facebook, or Instagram to merge seamlessly with store orders.'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowImportModal(false)}
                        className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Step 1: Download Template */}
                    <div className="bg-stone-900/60 border border-stone-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-stone-200">
                          {dashboardLang === 'ar' ? '1. نموذج الشيت الجاهز (Google Sheet Template)' : '1. Google Sheets CSV Template'}
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {dashboardLang === 'ar' ? 'حمل النموذج المجهز مسبقاً، املأ به أسماء الزبائن وأرقام هواتفهم، ثم احفظه كـ CSV.' : 'Download the pre-formatted sheet, fill in customer contacts & addresses, and save as CSV.'}
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadOrderTemplate}
                        className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-700 transition-all shrink-0 cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-emerald-400" />
                        <span>{dashboardLang === 'ar' ? 'تحميل النموذج CSV' : 'Download Template CSV'}</span>
                      </button>
                    </div>

                    {/* Step 2: Upload CSV File */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-stone-300 block">
                        {dashboardLang === 'ar' ? '2. رفع ملف الطلبات (.CSV)' : '2. Upload Orders File (.CSV)'}
                      </label>
                      <div className="border-2 border-dashed border-stone-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-stone-900/30 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleParseImportCSV(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-stone-200">
                          {importOrdersFile ? importOrdersFile.name : (dashboardLang === 'ar' ? 'اسحب ملف CSV هنا أو اضغط للاختيار' : 'Drag & drop CSV file here or click to browse')}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-1">
                          {dashboardLang === 'ar' ? 'يدعم الملفات المصدرة من Google Sheets و Excel (UTF-8 CSV)' : 'Supports exported UTF-8 CSV from Google Sheets & Microsoft Excel'}
                        </p>
                      </div>
                    </div>

                    {/* Error & Success Banners */}
                    {importOrdersError && (
                      <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{importOrdersError}</span>
                      </div>
                    )}
                    {importOrdersSuccess && (
                      <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{importOrdersSuccess}</span>
                      </div>
                    )}

                    {/* Step 3: Parsed Orders Preview */}
                    {parsedImportOrders.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCheck className="w-4 h-4" />
                            {dashboardLang === 'ar' ? `تم العثور على ${parsedImportOrders.length} طلب جاهز للاستيراد` : `Found ${parsedImportOrders.length} ready-to-import orders`}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {dashboardLang === 'ar' ? 'المجموع التقديري:' : 'Estimated Total:'} {parsedImportOrders.reduce((sum, o) => sum + (o.total || 0), 0)} {getDisplayCurrency(storeConfig.currency, dashboardLang)}
                          </span>
                        </div>

                        <div className="border border-stone-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-stone-900 text-stone-400 font-bold uppercase text-[9px] border-b border-stone-800 sticky top-0">
                              <tr>
                                <th className="p-2.5">{t.customerCol}</th>
                                <th className="p-2.5">{t.phoneCol}</th>
                                <th className="p-2.5">{t.cityCol}</th>
                                <th className="p-2.5">{t.productCol}</th>
                                <th className="p-2.5 text-right">{t.priceCol}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-850 bg-[#18181b]">
                              {parsedImportOrders.map((o, idx) => (
                                <tr key={idx} className="hover:bg-stone-900/40">
                                  <td className="p-2.5 font-bold text-stone-200">{o.customerName}</td>
                                  <td className="p-2.5 font-mono text-stone-400">{o.customerPhone}</td>
                                  <td className="p-2.5 text-stone-300">{o.customerCity}</td>
                                  <td className="p-2.5 text-stone-400 truncate max-w-[120px]">{o.productName}</td>
                                  <td className="p-2.5 text-right font-black text-emerald-400">{o.total} {getDisplayCurrency(storeConfig.currency, dashboardLang)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                      <button
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2.5 text-xs font-bold text-stone-400 hover:text-white rounded-xl transition-all"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={handleConfirmImportOrders}
                        disabled={parsedImportOrders.length === 0 || isImportingOrders}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                      >
                        {isImportingOrders ? (
                          <>
                            <SleekSpinner size="xs" variant="white" />
                            <span>{dashboardLang === 'ar' ? 'جاري الاستيراد والحفظ...' : 'Importing & Saving...'}</span>
                          </>
                        ) : (
                          <>
                            <FileUp className="w-4 h-4" />
                            <span>{dashboardLang === 'ar' ? `تأكيد استيراد (${parsedImportOrders.length}) طلب` : `Confirm Import (${parsedImportOrders.length}) Orders`}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE SETTINGS CUSTOMIZATION */}
          {activeTab === 'settings' && (
            <div id="panel-settings" className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">{t.storeSettings}</h2>
                <p className="text-xs text-stone-400 font-medium font-sans">{t.storeSettingsDesc}</p>
              </div>

              {/* MONGODB ATLAS CLOUD PERSISTENCE & DATABASE STATUS CARD */}
              <div className="bg-gradient-to-br from-[#121826] to-[#18181b] border border-blue-500/30 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      mongoStatus?.connected
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    }`}>
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-100 font-serif">
                          {dashboardLang === 'ar' ? 'قاعدة بيانات MongoDB Atlas السحابية' : 'MongoDB Atlas Cloud Database'}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                          mongoStatus?.connected 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' 
                            : 'bg-amber-950 text-amber-300 border-amber-700/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${mongoStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                          <span>
                            {mongoStatus?.connected 
                              ? (dashboardLang === 'ar' ? 'متصل بالسحابة (Live)' : 'Connected (Live)') 
                              : (dashboardLang === 'ar' ? 'وضع التخزين المؤقت (Offline)' : 'Local Storage Mode (Offline)')}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {mongoStatus?.connected
                          ? (dashboardLang === 'ar' 
                              ? 'قاعدة البيانات متصلة بشكل دائم ومباشر. كافة المنتجات، الطلبات، وحسابات الإدارة محفوظة في السحابة ولن تضيع أبداً.'
                              : 'Cloud database is connected and active. All products, orders, coupons, and administrators are securely backed up.')
                          : (dashboardLang === 'ar'
                              ? 'المتجر يعمل حالياً على التخزين المؤقت. اربط حساب MongoDB Atlas الخاص بك لحفظ جميع المنتجات والطلبات بشكل دائم.'
                              : 'Store is currently operating on local cache. Connect your MongoDB Atlas cluster for permanent cloud data storage.')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mongoStatus?.connected && (
                      <button
                        type="button"
                        onClick={handleSyncToMongo}
                        disabled={isSyncingMongo}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        title={dashboardLang === 'ar' ? 'مزامنة كافة المنتجات والطلبات مع MongoDB' : 'Force sync all products & orders to MongoDB'}
                      >
                        {isSyncingMongo ? (
                          <>
                            <SleekSpinner size="xs" variant="white" />
                            <span>{dashboardLang === 'ar' ? 'جاري المزامنة...' : 'Syncing Data...'}</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{dashboardLang === 'ar' ? 'مزامنة البيانات الآن' : 'Sync All Data Now'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status and Diagnostics Banner */}
                {mongoStatus?.connected && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        {dashboardLang === 'ar' ? 'المنتجات المحفوظة بالسحابة' : 'Cloud Stored Products'}
                      </span>
                      <span className="text-stone-100 font-mono font-bold text-sm sm:text-base">
                        {mongoStatus.remoteCounts?.products ?? products.length} {dashboardLang === 'ar' ? 'منتج' : 'Items'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        {dashboardLang === 'ar' ? 'الطلبات المسجلة بالسحابة' : 'Cloud Stored Orders'}
                      </span>
                      <span className="text-stone-100 font-mono font-bold text-sm sm:text-base">
                        {mongoStatus.remoteCounts?.orders ?? orders.length} {dashboardLang === 'ar' ? 'طلب' : 'Orders'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        {dashboardLang === 'ar' ? 'حسابات المسؤولين بالسحابة' : 'Cloud Stored Admins'}
                      </span>
                      <span className="text-stone-100 font-mono font-bold text-sm sm:text-base">
                        {mongoStatus.remoteCounts?.admins ?? 1} {dashboardLang === 'ar' ? 'مسؤول' : 'Admins'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        {dashboardLang === 'ar' ? 'رابط الاتصال المشفر' : 'Encrypted URI'}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold text-[11px] truncate block" title={mongoStatus.maskedUri}>
                        {mongoStatus.maskedUri || 'MongoDB Atlas Live'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Connection Form */}
                <form onSubmit={handleConnectMongo} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                      {mongoStatus?.connected 
                        ? (dashboardLang === 'ar' ? 'تحديث رابط الاتصال (Update URI)' : 'Update MongoDB Connection String') 
                        : (dashboardLang === 'ar' ? 'أدخل رابط اتصال MongoDB Atlas Connection String' : 'Enter MongoDB Atlas Connection String')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={mongoUriInput}
                        onChange={e => setMongoUriInput(e.target.value)}
                        placeholder="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/my_store?retryWrites=true&w=majority"
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs font-mono focus:outline-none focus:border-[#2563eb] pl-10"
                      />
                      <Server className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">
                      {dashboardLang === 'ar' ? 'مثال:' : 'Example:'} <code className="text-blue-300 font-mono text-[10px]">mongodb+srv://user:pass@cluster0.abc.mongodb.net/ecommerce?retryWrites=true&w=majority</code>
                    </p>
                  </div>

                  {mongoError && (
                    <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{mongoError}</span>
                    </div>
                  )}

                  {mongoSuccess && (
                    <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{mongoSuccess}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={isConnectingMongo || !mongoUriInput.trim()}
                      className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isConnectingMongo ? (
                        <>
                          <SleekSpinner size="xs" variant="white" />
                          <span>{dashboardLang === 'ar' ? 'جاري فحص وربط قاعدة البيانات...' : 'Connecting & Testing Database...'}</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          <span>{dashboardLang === 'ar' ? 'ربط واختبار الاتصال مع MongoDB' : 'Connect & Backup to MongoDB Atlas'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Helpful instructions for free MongoDB Atlas Cluster */}
                <div className="border-t border-stone-800/80 pt-4 bg-stone-900/40 p-4 rounded-2xl text-xs text-stone-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-stone-200">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>{dashboardLang === 'ar' ? 'كيفية الحصول على رابط قاعدة البيانات المجانية من MongoDB Atlas:' : 'How to obtain your free MongoDB Atlas connection string:'}</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-300 pr-2">
                    {dashboardLang === 'ar' ? (
                      <>
                        <li>قم بإنشاء حساب مجاني على موقع <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">mongodb.com/cloud/atlas</a>.</li>
                        <li>أنشئ Free Cluster (M0 Free Tier)، ثم أضف مستخدم قاعدة بيانات (Database User) باسم وكلمة سر من اختيارك.</li>
                        <li>من قائمة <span className="font-bold text-stone-100">Network Access</span>، أضف <span className="font-mono text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">0.0.0.0/0</span> لكي يستطيع السيرفر الاتصال بها.</li>
                        <li>انقر على <span className="font-bold text-stone-100">Connect</span> &gt; <span className="font-bold text-stone-100">Drivers (Node.js)</span> وانسخ رابط الاتصال وضعه في الحقل أعلاه.</li>
                      </>
                    ) : (
                      <>
                        <li>Create a free account at <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">mongodb.com/cloud/atlas</a>.</li>
                        <li>Create a free M0 tier cluster and create a database user with username and password.</li>
                        <li>In <span className="font-bold text-stone-100">Network Access</span>, allow access from anywhere (<span className="font-mono text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">0.0.0.0/0</span>).</li>
                        <li>Click <span className="font-bold text-stone-100">Connect</span> &gt; <span className="font-bold text-stone-100">Drivers (Node.js)</span> and paste your connection URI into the field above.</li>
                      </>
                    )}
                  </ol>
                </div>
              </div>

              {/* REAL-TIME ORDER PUSH NOTIFICATIONS & SOUND ALERTS CARD */}
              <div className="bg-gradient-to-br from-[#131b2e] to-[#18181b] border border-blue-500/40 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                      <Bell className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-stone-100 font-serif">
                          {dashboardLang === 'ar' ? 'نظام إشعارات الطلبيات المباشرة (Live Order Push & Sound)' : 'Live Order Push Notifications & Sound Alerts'}
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{dashboardLang === 'ar' ? 'بث مباشر نشط' : 'Live Stream Active'}</span>
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {dashboardLang === 'ar'
                          ? 'تصلك تنبيهات فورية كالتطبيقات الذكية على الشاشة ورنين الكاشير بمجرد أن يقوم أي زبون بطلب جديد في متجرك، ومخصصة فقط للمسؤولين المصرح لهم.'
                          : 'Receive real-time instant push notifications like a mobile app and cash register sounds whenever a new customer places an order.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerTestNotification}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{dashboardLang === 'ar' ? 'تجربة إشعار فوري الآن' : 'Test Live Notification'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Browser & OS Push Notifications Setting */}
                  <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-100 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-blue-400" />
                        <span>{dashboardLang === 'ar' ? 'إشعارات المتصفح والنظام (Desktop/Mobile Push)' : 'Browser & OS Push Alerts'}</span>
                      </h4>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {dashboardLang === 'ar' 
                          ? 'إظهار إشعار فوري على سطح المكتب أو الهاتف حتى لو كانت الصفحة في الخلفية.' 
                          : 'Display native OS popups even if the dashboard is running in the background.'}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {dashboardLang === 'ar' ? 'حالة الإذن: ' : 'Status: '}
                        <span className={`font-bold ${pushPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {pushPermission === 'granted' 
                            ? (dashboardLang === 'ar' ? 'مفعل ومسموح به' : 'Granted') 
                            : pushPermission === 'denied' 
                              ? (dashboardLang === 'ar' ? 'مرفوض في المتصفح' : 'Denied in browser')
                              : (dashboardLang === 'ar' ? 'بانتظار الموافقة' : 'Permission needed')}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={togglePushEnabled}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                        pushEnabled && pushPermission === 'granted'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      }`}
                    >
                      {pushEnabled && pushPermission === 'granted'
                        ? (dashboardLang === 'ar' ? 'مفعل (ON)' : 'Enabled')
                        : (dashboardLang === 'ar' ? 'طلب الإذن والتفعيل' : 'Enable Push')}
                    </button>
                  </div>

                  {/* Cash Register Sound Setting */}
                  <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-100 flex items-center gap-2">
                        {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        <span>{dashboardLang === 'ar' ? 'صوت رنين الكاشير (Cash Chime)' : 'Cash Register Sound Chime'}</span>
                      </h4>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {dashboardLang === 'ar'
                          ? 'تشغيل نغمة كاشير واضحة وعصرية فور وصول طلب جديد للتنبيه الصوتي السريع.'
                          : 'Plays a clear 3-tone cash register chime whenever a new order is received.'}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {dashboardLang === 'ar' ? 'يعمل بتقنية Web Audio فائقة السرعة بدون أي تأخير.' : 'Synthesized Web Audio with zero network lag.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSoundEnabled}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                        soundEnabled
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      }`}
                    >
                      {soundEnabled
                        ? (dashboardLang === 'ar' ? 'مفعل (ON)' : 'Active')
                        : (dashboardLang === 'ar' ? 'مكتوم (OFF)' : 'Muted')}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECURITY & DYNAMIC CUSTOM URLS MANAGEMENT VAULT */}
              <div className="bg-gradient-to-br from-[#1c1917] via-[#18181b] to-[#141416] border border-amber-500/40 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                {/* Header with Security Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2 font-serif">
                        <span>{dashboardLang === 'ar' ? 'تخصيص روابط لوحة الإدارة والأمان (Dynamic Admin Links)' : 'Dynamic Admin Links & Security Vault'}</span>
                        <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
                          {dashboardLang === 'ar' ? 'حماية فائقة' : 'High Security'}
                        </span>
                      </h3>
                      <p className="text-xs text-stone-400 font-sans mt-0.5">
                        {dashboardLang === 'ar' 
                          ? 'قم بتخصيص روابط لوحة التحكم، تسجيل الدخول، والتسجيل. عند تحديث أي رابط، يتم إبطال وحذف الروابط القديمة نهائياً.'
                          : 'Customize URLs for Dashboard, Login, and Registration. Saving new links immediately invalidates and removes old routes.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-amber-500/15 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{dashboardLang === 'ar' ? 'حفظ وتحديث الروابط فورياً' : 'Save & Invalidate Old Links'}</span>
                  </button>
                </div>

                {/* Warning / Explanation Banner */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-200/90 text-xs">
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-300">
                      {dashboardLang === 'ar' ? 'ميزة الأمان الفوري (Instant Route Revocation):' : 'Instant Route Revocation Active:'}
                    </p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      {dashboardLang === 'ar'
                        ? 'فور قيامك بتغيير الرابط والضغط على حفظ، لن يتمكن أي شخص من فتح الروابط القديمة أو الافتراضية نهائياً. احرص على حفظ أو نسخ الروابط الجديدة للوصول إلى لوحتك.'
                        : 'Once you update and save a route, the previous route is purged permanently. Make sure to copy or bookmark your active links.'}
                    </p>
                  </div>
                </div>

                {/* 3 Admin Links Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* 1. Admin Dashboard Link */}
                  <div className="bg-[#111114] border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                          <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                          {dashboardLang === 'ar' ? '1. رابط لوحة الإدارة' : '1. Dashboard Route'}
                        </span>
                        <span className="text-[9px] bg-blue-950/60 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono">
                          Dashboard
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        {dashboardLang === 'ar' ? 'مسار التحكم بالمنتجات والطلبات والإحصائيات.' : 'Main control panel route.'}
                      </p>

                      <div className="flex items-center bg-[#18181b] border border-stone-700/80 focus-within:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono text-stone-200">
                        <span className="text-stone-500 select-none text-[11px]">/</span>
                        <input 
                          type="text"
                          value={settingsForm.customAdminSlug !== undefined ? settingsForm.customAdminSlug : (storeConfig.customAdminSlug || 'admin/dashboard')}
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9\-_/]/g, '');
                            setSettingsForm(prev => ({ ...prev, customAdminSlug: val }));
                          }}
                          placeholder="admin/dashboard"
                          className="bg-transparent text-blue-300 font-bold font-mono focus:outline-none w-full ml-1"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const slug = (settingsForm.customAdminSlug || storeConfig.customAdminSlug || 'admin/dashboard').replace(/^\/+/, '');
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}`;
                          handleCopyLink('admin-dash', url);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          copiedLinkKey === 'admin-dash'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                        }`}
                      >
                        {copiedLinkKey === 'admin-dash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                        <span>{copiedLinkKey === 'admin-dash' ? (dashboardLang === 'ar' ? 'تم النسخ!' : 'Copied!') : (dashboardLang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                      </button>

                      <a
                        href={`/${(settingsForm.customAdminSlug || storeConfig.customAdminSlug || 'admin/dashboard').replace(/^\/+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors cursor-pointer"
                        title={dashboardLang === 'ar' ? 'فتح في نافذة جديدة' : 'Open in new tab'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* 2. Admin Login Link */}
                  <div className="bg-[#111114] border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-amber-400" />
                          {dashboardLang === 'ar' ? '2. رابط تسجيل الدخول' : '2. Login Route'}
                        </span>
                        <span className="text-[9px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-mono">
                          Login
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        {dashboardLang === 'ar' ? 'بوابة دخول المسؤولين بكلمة المرور المشفرة.' : 'Secure entrance for authorized admins.'}
                      </p>

                      <div className="flex items-center bg-[#18181b] border border-stone-700/80 focus-within:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-stone-200">
                        <span className="text-stone-500 select-none text-[11px]">/</span>
                        <input 
                          type="text"
                          value={settingsForm.customAdminLoginSlug !== undefined ? settingsForm.customAdminLoginSlug : (storeConfig.customAdminLoginSlug || 'admin/login')}
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9\-_/]/g, '');
                            setSettingsForm(prev => ({ ...prev, customAdminLoginSlug: val }));
                          }}
                          placeholder="admin/login"
                          className="bg-transparent text-amber-300 font-bold font-mono focus:outline-none w-full ml-1"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const slug = (settingsForm.customAdminLoginSlug || storeConfig.customAdminLoginSlug || 'admin/login').replace(/^\/+/, '');
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}`;
                          handleCopyLink('admin-login', url);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          copiedLinkKey === 'admin-login'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                        }`}
                      >
                        {copiedLinkKey === 'admin-login' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{copiedLinkKey === 'admin-login' ? (dashboardLang === 'ar' ? 'تم النسخ!' : 'Copied!') : (dashboardLang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                      </button>

                      <a
                        href={`/${(settingsForm.customAdminLoginSlug || storeConfig.customAdminLoginSlug || 'admin/login').replace(/^\/+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors cursor-pointer"
                        title={dashboardLang === 'ar' ? 'فتح في نافذة جديدة' : 'Open in new tab'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* 3. Admin Registration Link */}
                  <div className="bg-[#111114] border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                          {dashboardLang === 'ar' ? '3. رابط تسجيل مسؤول جديد' : '3. Register Admin Route'}
                        </span>
                        <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full font-mono">
                          Register
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">
                        {dashboardLang === 'ar' ? 'رابط سري مخصص لإنشاء حساب مسؤول جديد.' : 'Secret link to register a new admin.'}
                      </p>

                      <div className="flex items-center bg-[#18181b] border border-stone-700/80 focus-within:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-stone-200">
                        <span className="text-stone-500 select-none text-[11px]">/</span>
                        <input 
                          type="text"
                          value={settingsForm.customAdminRegisterSlug !== undefined ? settingsForm.customAdminRegisterSlug : (storeConfig.customAdminRegisterSlug || 'admin/register')}
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9\-_/]/g, '');
                            setSettingsForm(prev => ({ ...prev, customAdminRegisterSlug: val }));
                          }}
                          placeholder="admin/register"
                          className="bg-transparent text-purple-300 font-bold font-mono focus:outline-none w-full ml-1"
                        />
                      </div>

                      {/* Allow Registration Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-stone-400">
                          {dashboardLang === 'ar' ? 'السماح بإنشاء حسابات جديدة:' : 'Allow new registrations:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSettingsForm(prev => ({ ...prev, allowAdminRegistration: prev.allowAdminRegistration === false ? true : false }))}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            settingsForm.allowAdminRegistration !== false
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-stone-800 text-stone-400 border border-stone-700'
                          }`}
                        >
                          {settingsForm.allowAdminRegistration !== false 
                            ? (dashboardLang === 'ar' ? 'متاح (Open)' : 'Open')
                            : (dashboardLang === 'ar' ? 'مغلق (Locked)' : 'Locked')}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const slug = (settingsForm.customAdminRegisterSlug || storeConfig.customAdminRegisterSlug || 'admin/register').replace(/^\/+/, '');
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}`;
                          handleCopyLink('admin-reg', url);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          copiedLinkKey === 'admin-reg'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                        }`}
                      >
                        {copiedLinkKey === 'admin-reg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                        <span>{copiedLinkKey === 'admin-reg' ? (dashboardLang === 'ar' ? 'تم النسخ!' : 'Copied!') : (dashboardLang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                      </button>

                      <a
                        href={`/${(settingsForm.customAdminRegisterSlug || storeConfig.customAdminRegisterSlug || 'admin/register').replace(/^\/+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors cursor-pointer"
                        title={dashboardLang === 'ar' ? 'فتح في نافذة جديدة' : 'Open in new tab'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* STOREFRONT PUBLIC LINKS DIRECTORY CARD */}
              <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-100 flex items-center gap-2">
                        <span>{dashboardLang === 'ar' ? 'دليل روابط واجهة المتجر المباشرة (Storefront Live Links)' : 'Storefront Live Links & Section URLs'}</span>
                        <span className="text-[9px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
                          Live URLs
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {dashboardLang === 'ar' 
                          ? 'جميع الروابط المباشرة لكل أقسام المتجر (المنتجات، الدعم، السلة، الحساب، إلخ) لمشاركتها في الإعلانات ومنصات التواصل.'
                          : 'Direct URL shortcuts to every store section for social media and advertising campaigns.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Storefront Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      key: 'store-products',
                      titleAr: 'متجر المنتجات الكامل',
                      titleEn: 'All Products Catalog',
                      path: `${activeCountrySlug}/products`,
                      icon: Package,
                      color: 'text-blue-400',
                      badge: '/products'
                    },
                    {
                      key: 'store-support',
                      titleAr: 'مركز الدعم والتذاكر',
                      titleEn: 'Customer Support & Help',
                      path: `${activeCountrySlug}/support`,
                      icon: HelpCircle,
                      color: 'text-emerald-400',
                      badge: '/support'
                    },
                    {
                      key: 'store-profile',
                      titleAr: 'حسابي وسجل الطلبات',
                      titleEn: 'Customer Account & Orders',
                      path: `${activeCountrySlug}/profile`,
                      icon: User,
                      color: 'text-purple-400',
                      badge: '/profile'
                    },
                    {
                      key: 'store-favorites',
                      titleAr: 'قائمة المفضلة',
                      titleEn: 'Wishlist / Favorites',
                      path: `${activeCountrySlug}/favorites`,
                      icon: Heart,
                      color: 'text-rose-400',
                      badge: '/favorites'
                    },
                    {
                      key: 'store-cart',
                      titleAr: 'سلة المشتريات المباشرة',
                      titleEn: 'Direct Shopping Cart',
                      path: `${activeCountrySlug}/cart`,
                      icon: ShoppingBag,
                      color: 'text-amber-400',
                      badge: '/cart'
                    },
                    {
                      key: 'store-checkout',
                      titleAr: 'صفحة إتمام الطلب والدفع',
                      titleEn: 'Checkout & Payment Page',
                      path: `${activeCountrySlug}/checkout`,
                      icon: CreditCard,
                      color: 'text-emerald-400',
                      badge: '/checkout'
                    }
                  ].map((sec) => {
                    const SecIcon = sec.icon;
                    const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${sec.path}`;
                    const isCopied = copiedLinkKey === sec.key;
                    return (
                      <div 
                        key={sec.key} 
                        className="bg-[#111114] border border-stone-850 hover:border-stone-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-200 flex items-center gap-2">
                              <SecIcon className={`w-4 h-4 ${sec.color}`} />
                              {dashboardLang === 'ar' ? sec.titleAr : sec.titleEn}
                            </span>
                            <span className="text-[9px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                              {sec.badge}
                            </span>
                          </div>
                          <div className="bg-[#18181b] border border-stone-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-stone-300 truncate select-all">
                            /{sec.path}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-850/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(sec.key, fullUrl)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-stone-400" />}
                            <span>{isCopied ? (dashboardLang === 'ar' ? 'تم النسخ!' : 'Copied!') : (dashboardLang === 'ar' ? 'نسخ الرابط' : 'Copy URL')}</span>
                          </button>

                          <a
                            href={`/${sec.path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors cursor-pointer"
                            title={dashboardLang === 'ar' ? 'فتح الرابط' : 'Open link'}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-[#18181b] rounded-[2rem] border border-stone-800 shadow-xs p-6 sm:p-10 space-y-8 text-xs font-semibold">
                {/* Main Identity Information */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-stone-100 text-sm font-serif">
                    {dashboardLang === 'ar' ? 'معلومات المتجر والتواصل' : 'Branding & Contact Information'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.storeNameLabel}</label>
                      <input 
                        type="text" 
                        required
                        value={settingsForm.storeName}
                        onChange={e => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.supportPhoneLabel} *</label>
                      <input 
                        type="text" 
                        required
                        value={settingsForm.phone}
                        onChange={e => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 0612345678"
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.contactEmailLabel}</label>
                      <input 
                        type="email" 
                        value={settingsForm.email}
                        onChange={e => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.headquartersLocationLabel}</label>
                      <input 
                        type="text" 
                        value={settingsForm.location}
                        onChange={e => setSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Banner settings */}
                <div className="border-t border-stone-800 pt-6 space-y-4">
                  <h4 className="font-extrabold text-stone-100 text-sm font-serif">
                    {dashboardLang === 'ar' ? 'إعدادات البانر الرئيسي للمتجر' : 'Hero Landing Banner Configuration'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.bannerTitleLabel}</label>
                      <input 
                        type="text" 
                        required
                        value={settingsForm.bannerTitle}
                        onChange={e => setSettingsForm(prev => ({ ...prev, bannerTitle: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.bannerSubtitleLabel}</label>
                      <input 
                        type="text" 
                        required
                        value={settingsForm.bannerSubtitle}
                        onChange={e => setSettingsForm(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">{t.bannerImageLabel}</label>
                        {settingsForm.bannerImage && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, bannerImage: '' }))}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> {t.removeImage}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <label className="flex-1 w-full border-2 border-dashed border-stone-800 hover:border-blue-500/50 bg-stone-900/50 hover:bg-stone-900 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                try {
                                  const dataUrl = await readFileAsDataUrl(files[0]);
                                  setSettingsForm(prev => ({ ...prev, bannerImage: dataUrl }));
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          />
                          <Upload className="w-4 h-4 text-[#2563eb]" />
                          <span className="text-xs font-bold text-stone-300">
                            {settingsForm.bannerImage 
                              ? (dashboardLang === 'ar' ? 'تغيير صورة البانر من الحاسوب' : 'Change Banner Image from PC') 
                              : (dashboardLang === 'ar' ? 'رفع صورة البانر من الحاسوب' : 'Upload Banner Image from PC')}
                          </span>
                        </label>

                        {settingsForm.bannerImage && (
                          <div className="w-24 h-14 rounded-xl overflow-hidden border border-stone-700 shrink-0 bg-stone-950">
                            <img src={settingsForm.bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery pricing thresholds */}
                <div className="border-t border-stone-800 pt-6 space-y-4">
                  <h4 className="font-extrabold text-stone-100 text-sm font-serif">
                    {dashboardLang === 'ar' ? 'رسوم الشحن والتوصيل المجاني' : 'Shipping Fees & Free Delivery Threshold'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {t.shippingFeeLabel} ({getDisplayCurrency(storeConfig.currency, dashboardLang)})
                      </label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={settingsForm.shippingFee}
                        onChange={e => setSettingsForm(prev => ({ ...prev, shippingFee: Number(e.target.value) }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] focus:bg-stone-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'الحد الأدنى للتوصيل المجاني' : 'Free Delivery Minimum Threshold'} ({getDisplayCurrency(storeConfig.currency, dashboardLang)})
                      </label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={settingsForm.currency === '$' ? 150 : 300}
                        disabled
                        className="w-full border border-stone-800 bg-stone-950 rounded-xl p-3 text-xs text-stone-500 font-mono"
                      />
                      <p className="text-[10px] text-stone-500 font-medium">
                        {dashboardLang === 'ar' 
                          ? 'يتم تفعيل التوصيل المجاني تلقائياً عند تجاوز سلة المشتريات 300 درهم (أو 150 دولار حسب الدولة).'
                          : 'Free delivery is auto-triggered above 300 DH (or $150 based on store settings) as standard.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Support Availability & Schedule */}
                <div className="border-t border-stone-800 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-stone-100 text-sm font-serif">
                        {dashboardLang === 'ar' ? 'أوقات وحالة خدمة العملاء' : 'Customer Support Availability & Working Hours'}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-medium">
                        {dashboardLang === 'ar' ? 'حدد مواعيد العمل الرسمية أو فعّل وضع التواجد يدوياً' : 'Configure when your staff is online/offline and set exact working hours'}
                      </p>
                    </div>

                    {/* Quick Online Status Indicator */}
                    <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-full">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        settingsForm.supportStatusMode === 'manual' 
                          ? (settingsForm.supportIsOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500')
                          : 'bg-blue-500 animate-pulse'
                      }`} />
                      <span className="text-[10px] font-bold text-stone-300">
                        {settingsForm.supportStatusMode === 'manual'
                          ? (settingsForm.supportIsOnline ? (dashboardLang === 'ar' ? 'فريق الدعم متصل (يدوي)' : 'Staff Online (Manual)') : (dashboardLang === 'ar' ? 'فريق الدعم غير متصل (يدوي)' : 'Staff Offline (Manual)'))
                          : (dashboardLang === 'ar' ? `مجدول (${settingsForm.supportStartTime || '09:00'} - ${settingsForm.supportEndTime || '22:00'})` : `Scheduled (${settingsForm.supportStartTime || '09:00'} - ${settingsForm.supportEndTime || '22:00'})`)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mode selector */}
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'طريقة تحديد حالة الدعم' : 'Status Determination Mode'}
                      </label>
                      <CustomSelect
                        value={settingsForm.supportStatusMode || 'schedule'}
                        onChange={val => setSettingsForm(prev => ({ ...prev, supportStatusMode: val as 'manual' | 'schedule' }))}
                        theme="dark"
                        size="sm"
                        options={[
                          { value: 'schedule', label: dashboardLang === 'ar' ? 'تلقائي حسب جدول العمل' : 'Automatic by Schedule' },
                          { value: 'manual', label: dashboardLang === 'ar' ? 'تفعيل / إيقاف يدوي' : 'Manual Staff Toggle' }
                        ]}
                      />
                    </div>

                    {/* Manual Toggle (if manual mode selected) */}
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'حالة التواجد الحالية (يدوي)' : 'Staff Online Status (Manual)'}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSettingsForm(prev => ({ ...prev, supportIsOnline: true }))}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            settingsForm.supportIsOnline !== false
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 shadow-xs'
                              : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                          }`}
                        >
                          {dashboardLang === 'ar' ? '● متصل الآن (Online)' : '● Online'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsForm(prev => ({ ...prev, supportIsOnline: false }))}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            settingsForm.supportIsOnline === false
                              ? 'bg-red-950/60 text-red-300 border-red-700/60 shadow-xs'
                              : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                          }`}
                        >
                          {dashboardLang === 'ar' ? '○ غير متصل (Offline)' : '○ Offline'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'وقت بدء العمل اليومي' : 'Support Start Time'}
                      </label>
                      <input 
                        type="time" 
                        value={settingsForm.supportStartTime || '09:00'}
                        onChange={e => setSettingsForm(prev => ({ ...prev, supportStartTime: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'وقت انتهاء العمل اليومي' : 'Support End Time'}
                      </label>
                      <input 
                        type="time" 
                        value={settingsForm.supportEndTime || '22:00'}
                        onChange={e => setSettingsForm(prev => ({ ...prev, supportEndTime: e.target.value }))}
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                        {dashboardLang === 'ar' ? 'عبارة أيام العمل' : 'Working Days Label'}
                      </label>
                      <input 
                        type="text" 
                        value={settingsForm.supportWorkDays || 'طيلة أيام الأسبوع (7j/7)'}
                        onChange={e => setSettingsForm(prev => ({ ...prev, supportWorkDays: e.target.value }))}
                        placeholder="e.g. طيلة أيام الأسبوع"
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>
                </div>

                {/* Pixel & Marketing Tracking Settings */}
                <div className="border-t border-stone-800 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-stone-100 text-sm font-serif flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span>{dashboardLang === 'ar' ? 'إعدادات تتبع الإعلانات (Meta & TikTok Pixel)' : 'Ad Tracking & Pixel Setup'}</span>
                      </h4>
                      <p className="text-xs text-stone-400 font-sans">
                        {dashboardLang === 'ar' 
                          ? 'ربط وتتبع أحداث الزيارات (Page Views, Leads, Purchases, Add To Cart, Initiate Checkout, View Content)'
                          : 'Connect and stream pixel events for conversion optimization'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('pixel')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-indigo-950/40 border border-indigo-900/50 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                    >
                      <span>{dashboardLang === 'ar' ? 'فتح لوحة إحصائيات Pixel' : 'Open Pixel Dashboard'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Meta Pixel ID (Facebook / Instagram)</span>
                      </label>
                      <input 
                        type="text" 
                        value={settingsForm.metaPixelId || ''}
                        onChange={e => setSettingsForm(prev => ({ ...prev, metaPixelId: e.target.value }))}
                        placeholder="e.g. 123456789012345"
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] font-mono"
                      />
                      <p className="text-[10px] text-stone-500">
                        {dashboardLang === 'ar' ? 'معرف البيكسل الخاص بحساب إعلانات Meta' : 'Your 15-16 digit Meta Pixel ID'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>TikTok Pixel ID</span>
                      </label>
                      <input 
                        type="text" 
                        value={settingsForm.tiktokPixelId || ''}
                        onChange={e => setSettingsForm(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                        placeholder="e.g. C1234567890ABCDEF"
                        className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb] font-mono"
                      />
                      <p className="text-[10px] text-stone-500">
                        {dashboardLang === 'ar' ? 'معرف البيكسل الخاص بـ TikTok Ads Manager' : 'Your TikTok Ads Pixel Code / ID'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save CTA Submit */}
                <div className="pt-6 border-t border-stone-800 flex items-center justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-4 px-8 rounded-full font-bold uppercase tracking-widest transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {t.saveSettings}
                  </button>
                </div>
              </form>

              {/* Administrators Management block */}
              <div className="bg-[#18181b] rounded-[2rem] border border-stone-800 shadow-xs p-6 sm:p-10 space-y-6 mt-8">
                <div>
                  <h3 className="text-base font-extrabold text-stone-100 font-serif">
                    {dashboardLang === 'ar' ? 'إدارة المسؤولين وصلاحيات الدخول' : 'Administrators & System Access'}
                  </h3>
                  <p className="text-xs text-stone-400 font-medium font-sans">
                    {dashboardLang === 'ar' ? 'الحسابات المصرح لها بإدارة المنتجات والطلبات وتعديل الإعدادات.' : 'Authorized profiles that can manage products, fulfill orders, and configure settings.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Current administrators list (left side, 7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-stone-300 text-xs uppercase tracking-wider">
                      {dashboardLang === 'ar' ? 'المسؤولون المسجلون' : 'Registered Administrators'}
                    </h4>
                    
                    {adminsLoading ? (
                      <div className="p-8 text-center bg-[#111114] border border-stone-850 rounded-2xl flex items-center justify-center gap-3 text-stone-400 font-medium">
                        <SleekSpinner size="sm" variant="primary" />
                        <span>{dashboardLang === 'ar' ? 'جاري تحميل الحسابات...' : 'Loading profiles...'}</span>
                      </div>
                    ) : admins.length === 0 ? (
                      <div className="p-8 text-center bg-[#111114] border border-stone-850 rounded-2xl text-stone-500 font-medium">
                        {dashboardLang === 'ar' ? 'لم يتم العثور على حسابات إضافية.' : 'No administrators configured.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {admins.map((adm, index) => {
                          const isMaster = index === 0;
                          const isSelf = adm.email.toLowerCase() === loggedInAdminEmail?.toLowerCase();
                          return (
                            <div 
                              key={adm.email} 
                              className={`p-4 bg-[#111114] border rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-stone-750 ${
                                isSelf ? 'border-blue-900/40 bg-blue-950/5' : 'border-stone-850'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-stone-200 text-xs">{adm.name}</span>
                                  {isMaster && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#2563eb] bg-blue-950 border border-blue-900 px-1.5 py-0.5 rounded-md font-sans">
                                      {dashboardLang === 'ar' ? 'الرئيسي' : 'Master'}
                                    </span>
                                  )}
                                  {isSelf && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-900 px-1.5 py-0.5 rounded-md animate-pulse font-sans">
                                      {dashboardLang === 'ar' ? 'حسابك الحالي' : 'You'}
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[10.5px] text-stone-500">{adm.email}</div>
                              </div>
                              <div className="bg-stone-900 border border-stone-800 p-2 rounded-xl text-stone-400">
                                <Users className="w-4.5 h-4.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add administrator form (right side, 5 cols) */}
                  <div className="lg:col-span-5 bg-[#111114] border border-stone-850 p-6 rounded-[2rem] space-y-4">
                    <div>
                      <h4 className="font-extrabold text-stone-200 text-xs uppercase tracking-wider">
                        {dashboardLang === 'ar' ? 'إضافة مسؤول جديد' : 'Add System Access'}
                      </h4>
                      <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
                        {dashboardLang === 'ar' ? 'أنشئ حساباً إدارياً جديداً للدخول للوحة التحكم.' : 'Create another administrator credentials profile.'}
                      </p>
                    </div>

                    {adminError && (
                      <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-red-400 text-[11px] font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{adminError}</span>
                      </div>
                    )}

                    {adminSuccess && (
                      <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl text-emerald-400 text-[11px] font-semibold flex items-start gap-2">
                        <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{adminSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold uppercase tracking-wider text-[8.5px]">
                          {dashboardLang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                        </label>
                        <input 
                          type="text" 
                          required
                          disabled={adminSaving}
                          value={newAdminName}
                          onChange={e => setNewAdminName(e.target.value)}
                          placeholder="e.g. Reda Alami"
                          className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold uppercase tracking-wider text-[8.5px]">
                          {dashboardLang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                        </label>
                        <input 
                          type="email" 
                          required
                          disabled={adminSaving}
                          value={newAdminEmail}
                          onChange={e => setNewAdminEmail(e.target.value)}
                          placeholder="e.g. reda@virtuprod.com"
                          className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-stone-400 font-bold uppercase tracking-wider text-[8.5px]">
                          {dashboardLang === 'ar' ? 'كلمة المرور' : 'Access Password'}
                        </label>
                        <input 
                          type="password" 
                          required
                          disabled={adminSaving}
                          value={newAdminPassword}
                          onChange={e => setNewAdminPassword(e.target.value)}
                          placeholder={dashboardLang === 'ar' ? '6 أحرف على الأقل' : 'At least 6 characters'}
                          className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563eb]"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={adminSaving}
                          className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-[11px] py-3 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed"
                        >
                          {adminSaving ? (
                            <>
                              <SleekSpinner size="xs" variant="white" />
                              <span>{dashboardLang === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Profile...'}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              {dashboardLang === 'ar' ? 'تسجيل المسؤول الجديد' : 'Register Administrator'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STORES & MULTI-COUNTRY MANAGEMENT */}
          {activeTab === 'stores' && (
            <div id="panel-stores" className="space-y-8 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif flex items-center gap-2.5">
                    <span>{dashboardLang === 'ar' ? 'إدارة متاجر الدول والعملات' : 'Multi-Country Stores & Currencies'}</span>
                    <span className="text-xs font-sans font-bold bg-blue-950/60 text-blue-400 border border-blue-900/40 px-2.5 py-1 rounded-full">
                      {countries.filter(c => c.status !== 'disabled').length} {dashboardLang === 'ar' ? 'مفعل' : 'Active'} / {countries.length} {dashboardLang === 'ar' ? 'إجمالي' : 'Total'}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-400 font-medium mt-1">
                    {dashboardLang === 'ar' 
                      ? 'إدارة المتاجر والدول: يمكنك إخفاء متاجر معينة أو إضافة متجر لأي دولة جديدة بعملتها وسعر شحنها الخاص بكل سهولة.'
                      : 'Manage multi-country storefronts: enable or hide specific country stores, customize local currencies, and configure regional shipping rates.'}
                  </p>
                </div>

                <button
                  id="btn-add-store"
                  type="button"
                  onClick={() => {
                    setStoreActionError('');
                    setStoreActionSuccess('');
                    setShowAddStoreModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{dashboardLang === 'ar' ? 'إضافة متجر دولة جديد' : 'Add New Country Store'}</span>
                </button>
              </div>

              {/* Action Alerts */}
              {storeActionError && (
                <div className="p-4 bg-red-950/40 border border-red-900/40 rounded-2xl text-red-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400" />
                  <span>{storeActionError}</span>
                </div>
              )}

              {storeActionSuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-900/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                  <span>{storeActionSuccess}</span>
                </div>
              )}

              {/* CURRENT ACTIVE STORE BANNER */}
              {countries.find(c => c.slug === activeCountrySlug) && (
                <div className="bg-gradient-to-r from-blue-950/40 via-stone-900 to-stone-900 p-6 rounded-[2rem] border border-blue-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-stone-950 border border-blue-800/40 flex items-center justify-center shadow-inner shrink-0 p-2">
                      <CountryFlag code={countries.find(c => c.slug === activeCountrySlug)?.code || activeCountrySlug} size="md" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/50">
                          {dashboardLang === 'ar' ? 'المتجر النشط حالياً' : 'Currently Managing'}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400">
                          Slug: /{activeCountrySlug}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-stone-100 mt-1">
                        {dashboardLang === 'ar' 
                          ? (countries.find(c => c.slug === activeCountrySlug)?.nameAr || countries.find(c => c.slug === activeCountrySlug)?.name)
                          : (countries.find(c => c.slug === activeCountrySlug)?.name || countries.find(c => c.slug === activeCountrySlug)?.nameAr)}
                      </h3>
                      <p className="text-xs text-stone-400 font-mono">
                        {dashboardLang === 'ar' ? 'العملة:' : 'Currency:'} <span className="text-stone-200 font-bold">{countries.find(c => c.slug === activeCountrySlug)?.currency} ({getDisplayCurrency(countries.find(c => c.slug === activeCountrySlug)?.currency || '', dashboardLang)})</span> • {dashboardLang === 'ar' ? 'سعر الشحن:' : 'Shipping:'} <span className="text-stone-200 font-bold">{countries.find(c => c.slug === activeCountrySlug)?.shippingFee} {getDisplayCurrency(countries.find(c => c.slug === activeCountrySlug)?.currency || '', dashboardLang)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-850 text-stone-200 hover:text-white text-xs font-bold px-4 py-2.5 rounded-full border border-stone-750 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                      <span>{dashboardLang === 'ar' ? `إدارة المنتجات (${products.length})` : `Manage Products (${products.length})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onViewStore}
                      className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{dashboardLang === 'ar' ? 'معاينة المتجر' : 'Preview Store'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QUICK ADD PRESETS */}
              <div className="bg-[#18181b] p-6 rounded-[2rem] border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">
                      {dashboardLang === 'ar' ? 'إضافة سريعة لدول مقترحة بضغطة زر' : 'Quick Add Country Presets'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-stone-500 font-bold">1-Click Setup</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {dashboardLang === 'ar' ? 'انقر على أي دولة لإضافتها تلقائياً بإعدادات عملتها وشحنها الموصى بها:' : 'Click any country to pre-fill currency, name, and standard shipping settings:'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {COUNTRY_PRESETS.filter(p => !countries.some(c => c.code.toUpperCase() === p.code.toUpperCase() || c.slug.toLowerCase() === p.slug.toLowerCase())).map(preset => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => {
                        setNewStoreForm({
                          name: preset.name,
                          nameAr: preset.nameAr,
                          code: preset.code,
                          slug: preset.slug,
                          currency: preset.currency,
                          currencySymbol: preset.currencySymbol,
                          flag: preset.flag,
                          shippingFee: preset.shippingFee,
                          storeName: `Mavluy ${preset.name.split(' ')[0]}`,
                          language: 'ar',
                          status: 'active'
                        });
                        setShowAddStoreModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-stone-900 hover:bg-blue-950/60 text-stone-300 hover:text-blue-300 border border-stone-800 hover:border-blue-700/60 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <CountryFlag code={preset.code} size="xs" />
                      <span>{preset.nameAr}</span>
                      <span className="text-[10px] text-stone-500 font-mono">({preset.currency})</span>
                      <Plus className="w-3 h-3 text-blue-400 ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ALL STORES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {countries.map(c => {
                  const isActiveStore = c.slug === activeCountrySlug;
                  const isVisible = c.status !== 'disabled';

                  return (
                    <div
                      key={c.id || c.slug}
                      className={`bg-[#18181b] rounded-[2rem] border p-6 flex flex-col justify-between space-y-5 transition-all shadow-sm relative ${
                        isActiveStore 
                          ? 'border-blue-500/60 bg-blue-950/10 shadow-blue-500/5' 
                          : isVisible 
                            ? 'border-stone-800 hover:border-stone-700' 
                            : 'border-stone-850 opacity-75 bg-stone-900/30'
                      }`}
                    >
                      {/* Top Row: Flag, Name, Status */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 p-1">
                              <CountryFlag code={c.code || c.slug} size="sm" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-stone-100 text-base flex items-center gap-2">
                                <span>{c.nameAr || c.name}</span>
                                <span className="text-[10px] font-mono font-bold bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded border border-stone-800">
                                  {c.code}
                                </span>
                              </h3>
                              <p className="text-[11px] text-stone-400 font-medium">{c.name}</p>
                            </div>
                          </div>

                          {/* Visibility badge */}
                          {isVisible ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active (ظاهر)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-stone-900 text-stone-400 border border-stone-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
                              Hidden (مخفي)
                            </span>
                          )}
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                          <div className="bg-stone-900/60 border border-stone-855 p-2.5 rounded-xl">
                            <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider block">Currency / العملة</span>
                            <span className="font-mono font-black text-stone-200">{c.currency} ({c.currencySymbol})</span>
                          </div>
                          <div className="bg-stone-900/60 border border-stone-855 p-2.5 rounded-xl">
                            <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider block">Shipping / الشحن</span>
                            <span className="font-mono font-black text-stone-200">{c.shippingFee} {c.currencySymbol}</span>
                          </div>
                        </div>

                        <div className="text-[10.5px] text-stone-400 bg-stone-950/40 p-2.5 rounded-xl border border-stone-855 flex items-center justify-between font-mono">
                          <span>URL: <strong className="text-stone-300">/{c.slug}</strong></span>
                          <span>Store: <strong className="text-stone-300 truncate max-w-[130px]">{c.storeName || 'Mavluy'}</strong></span>
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="space-y-2 pt-2 border-t border-stone-800">
                        <div className="flex items-center gap-2">
                          {/* Toggle Active / Hidden */}
                          <button
                            type="button"
                            onClick={() => handleToggleCountryStatus(c)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                              isVisible
                                ? 'bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 border-amber-900/40'
                                : 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
                            }`}
                            title={isVisible ? 'Hide this store from customer view' : 'Make this store visible to customers'}
                          >
                            {isVisible ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>إخفاء (Hide)</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>إظهار (Show)</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => setEditingStore({ ...c })}
                            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all cursor-pointer"
                            title="Edit Store Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          {countries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCountryStore(c)}
                              className="p-2 rounded-xl bg-stone-900 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-stone-800 hover:border-rose-900/40 transition-all cursor-pointer"
                              title="Delete Country Store"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Switch to manage this store */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSwitchCountry) onSwitchCountry(c.slug);
                            setActiveTab('products');
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            isActiveStore
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                              : 'bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isActiveStore ? 'Currently Managing Products' : `Manage Products for ${c.nameAr || c.code}`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-Store Instructions / Help Callout */}
              <div className="bg-stone-900/40 border border-stone-850 p-6 rounded-[2rem] space-y-2">
                <div className="flex items-center gap-2 text-stone-300 font-bold text-xs">
                  <HelpCircle className="w-4 h-4 text-[#2563eb]" />
                  <span>How Multi-Country Stores Work / كيف تعمل المتاجر المتعددة:</span>
                </div>
                <ul className="text-xs text-stone-400 space-y-1.5 list-disc list-inside font-medium leading-relaxed">
                  <li><strong>إخفاء المتاجر (Hiding Stores):</strong> إذا قمت بإخفاء متاجر ليبيا والسعودية وبقي متجر المغرب فقط نشطاً، فستختفي أيقونة تبديل المتاجر بجانب اللغة في المتجر تلقائياً.</li>
                  <li><strong>إضافة دولة جديدة (Adding New Countries):</strong> يمكنك إضافة أي دولة (الإمارات، فرنسا، قطر، مصر، أمريكا...) بعملتها وشحنها وستعمل فورا وتظهر في المتجر.</li>
                  <li><strong>عزل المنتجات والطلبات:</strong> كل دولة لها كتالوج منتجات وطلبات وإعدادات شحن خاصة بها.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: COUPONS MANAGEMENT */}
          {activeTab === 'coupons' && (
            <div id="panel-coupons" className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">Coupons & Promo Codes</h2>
                  <p className="text-xs text-stone-400 font-medium">Create and manage discounts applicable to all products or single specific items</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 border border-blue-900/30 px-3.5 py-1.5 rounded-full">
                    Active Coupons: {coupons.length}
                  </span>
                </div>
              </div>

              {/* CREATE COUPON CARD */}
              <div className="bg-[#18181b] rounded-[2rem] p-6 sm:p-8 border border-stone-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-800">
                  <div className="p-2.5 bg-blue-950/50 text-blue-400 rounded-xl border border-blue-900/30">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-stone-100">Create New Coupon / إضافة كود خصم جديد</h3>
                    <p className="text-[11px] text-stone-400">Word or number with at least 4 letters/digits (e.g. MAV10, 2026, SUMMER25)</p>
                  </div>
                </div>

                {couponError && (
                  <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}

                {couponSuccess && (
                  <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-900/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{couponSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateCoupon} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Coupon Code / رمز الكوبون *
                      </label>
                      <input
                        type="text"
                        value={newCouponCode}
                        onChange={e => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        placeholder="e.g. MAV10, VIP, 2026, PROMO50"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-blue-500"
                        required
                        minLength={2}
                      />
                      <span className="text-[9px] text-stone-500 mt-1 block">Min 2 characters or numbers (e.g. 10, VIP, MAV10)</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Discount Type / نوع الخصم *
                      </label>
                      <CustomSelect
                        value={newCouponType}
                        onChange={val => setNewCouponType(val as 'percentage' | 'fixed')}
                        theme="dark"
                        size="sm"
                        options={[
                          { value: 'percentage', label: 'Percentage (%)', labelSecondary: 'نسبة مئوية' },
                          { value: 'fixed', label: `Fixed Amount (${storeConfig.currency})`, labelSecondary: 'مبلغ ثابت' }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Discount Value / قيمة الخصم *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newCouponValue}
                          onChange={e => setNewCouponValue(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={newCouponType === 'percentage' ? '10 (for 10%)' : `50 (for 50 ${storeConfig.currency})`}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-blue-500"
                          required
                          min={1}
                          max={newCouponType === 'percentage' ? 100 : undefined}
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-400">
                          {newCouponType === 'percentage' ? '%' : storeConfig.currency}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Applicable To / نطاق التطبيق *
                      </label>
                      <CustomSelect
                        value={newCouponApplyType}
                        onChange={val => setNewCouponApplyType(val as 'all' | 'specific')}
                        theme="dark"
                        size="sm"
                        options={[
                          { value: 'all', label: 'All Products', labelSecondary: 'جميع المنتجات' },
                          { value: 'specific', label: 'Single Product', labelSecondary: 'منتج واحد محدد' }
                        ]}
                      />
                    </div>

                    {newCouponApplyType === 'specific' && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">
                          Select Product / اختر المنتج *
                        </label>
                        <CustomSelect
                          value={newCouponProductId}
                          onChange={val => setNewCouponProductId(val)}
                          theme="dark"
                          size="sm"
                          searchable={true}
                          placeholder="-- Choose a product / اختر منتجاً --"
                          options={products.map(p => ({
                            value: p.id,
                            label: p.name,
                            labelSecondary: `${p.price} ${storeConfig.currency}`
                          }))}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Min Order Amount / الحد الأدنى للطلب ({storeConfig.currency})
                      </label>
                      <input
                        type="number"
                        value={newCouponMinOrder}
                        onChange={e => setNewCouponMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Optional (e.g. 150)"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* DISPLAY & PROMO SETTINGS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newCouponShowOnProductPage}
                        onChange={e => setNewCouponShowOnProductPage(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-stone-700 bg-stone-900 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-stone-200 block">
                          إظهار الكوبون في صفحة المنتج والشراء السريع
                        </span>
                        <span className="text-[10px] text-stone-400 block leading-relaxed">
                          عرض الكوبون كزر قابل للنقر للعملاء لتطبيقه بنقرة واحدة داخل تفاصيل المنتج ونموذج الدفع.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newCouponShowBadge}
                        onChange={e => setNewCouponShowBadge(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-stone-700 bg-stone-900 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-stone-200 block">
                          عرض شريط ترويجي في بطاقات المتجر (Promo Badge)
                        </span>
                        <span className="text-[10px] text-stone-400 block leading-relaxed">
                          إظهار بادج أنيق يحمل رمز الخصم على صورة المنتج في الصفحة الرئيسية وتصفح المتجر.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-3 px-6 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                    >
                      {couponLoading ? (
                        <>
                          <SleekSpinner size="xs" variant="white" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create Coupon / تفعيل الكوبون</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* LIST OF COUPONS */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-stone-200 uppercase tracking-wider">
                    {isAr ? `قائمة الكوبونات (${coupons.length})` : `Active Coupons List (${coupons.length})`}
                  </h3>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-950/60 border border-blue-900/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إجمالي الاستخدام:' : 'Total Uses:'}</span>
                      <strong className="font-mono text-white">
                        {coupons.reduce((acc, c) => {
                          const cUses = Math.max(c.usedCount || 0, orders.filter(o => o.couponCode && o.couponCode.trim().toUpperCase() === c.code.trim().toUpperCase()).length);
                          return acc + cUses;
                        }, 0)}
                      </strong>
                    </span>
                  </div>
                </div>

                {coupons.length === 0 ? (
                  <div className="bg-[#18181b] rounded-[2rem] p-10 border border-stone-800 text-center">
                    <Tag className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                    <p className="text-xs text-stone-400 font-bold">No active coupons found for this store.</p>
                    <p className="text-[11px] text-stone-500 mt-1">Create your first coupon using the form above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map(coupon => {
                      const targetProd = coupon.productId ? products.find(p => p.id === coupon.productId) : null;
                      const isShowOnPage = coupon.showOnProductPage !== false;
                      const isShowBadge = coupon.showBadgeOnProductCard !== false;
                      const actualUses = Math.max(
                        coupon.usedCount || 0,
                        orders.filter(o => o.couponCode && o.couponCode.trim().toUpperCase() === coupon.code.trim().toUpperCase()).length
                      );

                      return (
                        <div
                          key={coupon.id}
                          className="bg-[#18181b] rounded-2xl border border-stone-800 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-stone-700 transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-sm tracking-wider text-blue-400 bg-blue-950/50 border border-blue-900/40 px-3 py-1 rounded-xl">
                                {coupon.code}
                              </span>
                              <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                                {(coupon.discountType || coupon.type) === 'percentage' ? `-${coupon.discountValue || coupon.value}%` : `-${coupon.discountValue || coupon.value} ${storeConfig.currency}`}
                              </span>
                            </div>

                            {/* USAGE COUNT BADGE */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50">
                              <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                                <span>{isAr ? 'عدد مرات الاستخدام:' : 'Usage Count:'}</span>
                              </div>
                              <span className="font-mono font-black text-xs text-blue-200 bg-blue-900/70 px-2.5 py-0.5 rounded-lg border border-blue-700/60 shadow-xs">
                                {actualUses} {isAr ? (actualUses === 1 ? 'طلب' : 'طلبات') : (actualUses === 1 ? 'order' : 'orders')}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">Scope</span>
                              {coupon.productId && coupon.productId !== 'all' ? (
                                <div className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  <span className="truncate">المنتج: {targetProd?.name || coupon.productName || coupon.productId}</span>
                                </div>
                              ) : (
                                <div className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                  <span>جميع المنتجات (All Products)</span>
                                </div>
                              )}
                            </div>

                            {coupon.minOrderAmount ? (
                              <div className="text-[10px] text-stone-400 font-semibold">
                                Min Order: <span className="text-stone-200 font-bold">{coupon.minOrderAmount} {storeConfig.currency}</span>
                              </div>
                            ) : null}

                            {/* TOGGLE BUTTONS FOR PRODUCT PAGE & PROMO BADGE */}
                            <div className="pt-2 border-t border-stone-850 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-stone-400 font-medium">صفحة المنتج:</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCouponField(coupon.id, 'showOnProductPage', isShowOnPage)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isShowOnPage 
                                      ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50 hover:bg-blue-900/60' 
                                      : 'bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-300'
                                  }`}
                                  title="تحديد ظهور الكوبون في صفحة تفاصيل المنتج ونموذج الطلب"
                                >
                                  {isShowOnPage ? <Eye className="w-3 h-3 text-blue-400 shrink-0" /> : <EyeOff className="w-3 h-3 text-stone-500 shrink-0" />}
                                  <span>{isShowOnPage ? 'معروض بالمنتج' : 'مخفي (يدوي)'}</span>
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-stone-400 font-medium">شريط بالبطاقة:</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCouponField(coupon.id, 'showBadgeOnProductCard', isShowBadge)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isShowBadge 
                                      ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50 hover:bg-blue-900/60' 
                                      : 'bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-300'
                                  }`}
                                  title="تحديد ظهور شريط ترويجي بالخصم على بطاقة المنتج في المتجر"
                                >
                                  <Tag className={`w-3 h-3 shrink-0 ${isShowBadge ? 'text-blue-400' : 'text-stone-500'}`} />
                                  <span>{isShowBadge ? 'شريط مفعّل' : 'معطّل'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-stone-500">ID: {coupon.id.slice(0, 10)}</span>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MANAGEMENT */}
          {activeTab === 'reviews' && (
            <div id="panel-reviews" className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">Customer Reviews & Testimonials</h2>
                  <p className="text-xs text-stone-400 font-medium">Moderate reviews and choose which ones to display prominently on the Homepage</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-900/30 px-3.5 py-1.5 rounded-full">
                    Featured on Home: {reviews.filter(r => r.featuredOnHome).length}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 bg-stone-900 border border-stone-800 px-3.5 py-1.5 rounded-full">
                    Total: {reviews.length}
                  </span>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="bg-[#18181b] rounded-2xl p-4 border border-stone-800 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={e => setReviewSearch(e.target.value)}
                    placeholder="Search reviews by customer name, phone, or comment text..."
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <CustomSelect
                    value={reviewFilterProduct}
                    onChange={val => setReviewFilterProduct(val)}
                    theme="dark"
                    size="sm"
                    searchable={true}
                    options={[
                      { value: 'all', label: `All Products (${reviews.length})` },
                      ...products.map(p => {
                        const count = reviews.filter(r => r.productId === p.id).length;
                        return {
                          value: p.id,
                          label: p.name,
                          labelSecondary: `(${count})`
                        };
                      })
                    ]}
                  />
                </div>
              </div>

              {/* REVIEWS GRID */}
              {filteredReviews.length === 0 ? (
                <div className="bg-[#18181b] rounded-[2rem] p-12 border border-stone-800 text-center">
                  <Star className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <h3 className="font-bold text-stone-300 text-sm uppercase tracking-wider">No Reviews Found</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {reviews.length === 0 
                      ? "Reviews submitted by logged-in customers will appear here automatically." 
                      : "No reviews match your search filter."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredReviews.map((rev) => {
                    const prod = products.find(p => p.id === rev.productId);
                    return (
                      <div
                        key={rev.id}
                        className={`bg-[#18181b] rounded-[2rem] border p-6 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                          rev.featuredOnHome ? 'border-amber-500/40 bg-amber-950/10' : 'border-stone-800'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-100 text-sm">{rev.author || rev.customerName || 'Anonymous Customer'}</h4>
                                {(rev.city || rev.customerCity) && (
                                  <span className="text-[10px] text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-full font-medium">
                                    {rev.city || rev.customerCity}
                                  </span>
                                )}
                              </div>
                              {(rev.authorPhone || rev.customerPhone) && (
                                <p className="text-[10px] text-stone-500 font-mono mt-0.5 font-semibold">
                                  Phone: {rev.authorPhone || rev.customerPhone}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-900/30 px-2.5 py-1 rounded-full">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400' : 'text-stone-700'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-amber-300 ml-1">{rev.rating}.0</span>
                            </div>
                          </div>

                          {/* PRODUCT ATTACHED */}
                          <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Product:</span>
                            <span className="text-xs text-stone-200 font-bold truncate max-w-[220px]">
                              {prod?.name || rev.productName || 'General Product'}
                            </span>
                          </div>

                          {/* COMMENT TEXT */}
                          <div className="bg-stone-900/40 border border-stone-850/60 rounded-2xl p-4">
                            <p className="text-xs text-stone-300 leading-relaxed font-semibold italic">"{rev.comment}"</p>
                            <span className="block text-[9px] text-stone-500 font-bold text-right font-mono mt-2">
                              {new Date(rev.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                          {/* TOGGLE FEATURED ON HOMEPAGE BUTTON */}
                          <button
                            onClick={() => handleToggleReviewFeature(rev.id, !!rev.featuredOnHome)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              rev.featuredOnHome
                                ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                                : 'bg-stone-900 text-stone-400 hover:text-amber-300 hover:bg-stone-850 border border-stone-800'
                            }`}
                            title="When enabled, this review appears in the 'Loved by Thousands' section on the Store Homepage"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{rev.featuredOnHome ? 'Featured on Home' : 'Show on Home'}</span>
                          </button>

                          {/* TOGGLE APPROVAL STATUS */}
                          <button
                            onClick={() => handleToggleReviewStatus(rev.id, rev.status || 'approved')}
                            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              rev.status === 'approved' || !rev.status
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                                : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{rev.status === 'pending' ? 'Pending' : 'Approved'}</span>
                          </button>

                          {/* DELETE REVIEW */}
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all cursor-pointer ml-auto"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPPORT TICKETS & FAQS MANAGEMENT */}
          {activeTab === 'tickets' && (
            <div id="panel-tickets" className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">
                    {supportSubTab === 'tickets' ? 'Customer Support & Tickets' : 'Support FAQs Management'}
                  </h2>
                  <p className="text-xs text-stone-400 font-medium font-sans">
                    {supportSubTab === 'tickets' 
                      ? 'الرد المباشر على تذاكر واستفسارات العملاء من لوحة التحكم دون الحاجة للتحويل إلى واتساب'
                      : 'تعديل وإضافة وترتيب وحذف الأسئلة الشائعة التي تظهر للعملاء في صفحة الدعم والمساعدة'}
                  </p>
                </div>
                
                {/* Stats & Quick Online Status Switch */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quick Online Switch Button */}
                  <button
                    onClick={async () => {
                      const nextStatus = !(storeConfig.supportIsOnline ?? true);
                      const updated = { ...storeConfig, supportStatusMode: 'manual' as const, supportIsOnline: nextStatus };
                      setStoreConfig(updated);
                      setSettingsForm(prev => ({ ...prev, supportStatusMode: 'manual', supportIsOnline: nextStatus }));
                      try {
                        await fetch('/api/store-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated)
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      (storeConfig.supportIsOnline ?? true)
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                        : 'bg-red-950/60 text-red-300 border-red-700/60 hover:bg-red-900/60'
                    }`}
                    title="Click to toggle live presence for website visitors"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      (storeConfig.supportIsOnline ?? true) ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`} />
                    <span>{(storeConfig.supportIsOnline ?? true) ? 'Staff: ONLINE' : 'Staff: OFFLINE'}</span>
                  </button>

                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-900 border border-stone-850 px-3.5 py-1.5 rounded-full">
                    Tickets: {tickets.length}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/30 border border-red-900/30 px-3.5 py-1.5 rounded-full animate-pulse">
                    Open: {tickets.filter(t => t.status === 'open').length}
                  </span>
                </div>
              </div>

              {/* Sub-Navigation Switcher between Tickets and FAQs */}
              <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                <button
                  type="button"
                  onClick={() => setSupportSubTab('tickets')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === 'tickets'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>تذاكر واستفسارات العملاء (Tickets)</span>
                  {tickets.filter(t => t.status === 'open').length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {tickets.filter(t => t.status === 'open').length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSupportSubTab('faqs')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === 'faqs'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>تعديل الأسئلة الشائعة في الدعم (Support FAQs)</span>
                  <span className="bg-stone-800 text-stone-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {supportFaqsList.length}
                  </span>
                </button>
              </div>

              {/* Notification Toast for FAQ */}
              {faqToast && (
                <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{faqToast}</span>
                  </div>
                  <button onClick={() => setFaqToast(null)} className="text-emerald-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* VIEW 1: TICKETS */}
              {supportSubTab === 'tickets' && (
                <>
                  {/* Top Bar: Search, Filters & Analysis Data Exports */}
                  <div className="bg-[#18181b] p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Status Filter Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
                        <button
                          type="button"
                          onClick={() => setTicketStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            ticketStatusFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          <span>الكل (All)</span>
                          <span className="ml-1 text-[10px] opacity-75 font-mono">({tickets.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTicketStatusFilter('open')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            ticketStatusFilter === 'open'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          <span>قيد المتابعة (Open)</span>
                          <span className="ml-1 text-[10px] opacity-75 font-mono">
                            ({tickets.filter(t => t.status === 'open').length})
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTicketStatusFilter('resolved')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            ticketStatusFilter === 'resolved'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          <span>مغلقة ومكتملة (Resolved)</span>
                          <span className="ml-1 text-[10px] opacity-75 font-mono">
                            ({tickets.filter(t => t.status === 'resolved').length})
                          </span>
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="flex-1 max-w-md relative">
                        <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="بحث باسم العميل، الهاتف، رقم التذكرة، أو نص الرسالة..."
                          value={ticketSearchQuery}
                          onChange={(e) => setTicketSearchQuery(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl pr-9 pl-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-blue-500 font-medium"
                        />
                        {ticketSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTicketSearchQuery('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Data Export & Problem Analysis Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>تحليل وتصدير التذاكر (Recurring Issues Analysis):</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportTicketsCsv(false)}
                          disabled={tickets.length === 0}
                          className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 disabled:opacity-40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title="تصدير جدول إكسل كامل لدراسة المشاكل والأسئلة المتكررة"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>تصدير تقرير Excel (CSV)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportTicketsCsv(true)}
                          disabled={tickets.filter(t => t.status === 'resolved').length === 0}
                          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-40 text-stone-300 border border-stone-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="تصدير التذاكر المغلقة والمكتملة فقط"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>تصدير التذاكر المغلقة فقط ({tickets.filter(t => t.status === 'resolved').length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportTicketsJson(false)}
                          disabled={tickets.length === 0}
                          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-40 text-stone-400 hover:text-stone-200 border border-stone-800 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="تصدير بصيغة JSON للأرشفة"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="bg-[#18181b] rounded-[2rem] p-12 border border-stone-800 shadow-xs text-center">
                      <MessageSquare className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                      <h3 className="font-bold text-stone-300 text-sm uppercase tracking-wider">
                        {tickets.length === 0 ? 'No Tickets Submitted' : 'لا توجد تذاكر مطابقة لخيارات البحث'}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {tickets.length === 0
                          ? 'Support requests sent by your store clients will appear here instantly.'
                          : 'جرب تغيير خيار التصفية أو مسح عبارة البحث لرؤية التذاكر الأخرى.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className={`bg-[#18181b] rounded-[2rem] border p-6 flex flex-col justify-between space-y-5 shadow-sm transition-all ${
                        ticket.status === 'open' ? 'border-amber-900/40 bg-stone-900/10' : 'border-stone-800'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[11px] text-blue-400 bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-900/30">
                              {ticket.id}
                            </span>
                            {ticket.seen && (
                              <span className="text-[9px] font-bold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-850 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Seen
                              </span>
                            )}
                          </div>
                          
                          {ticket.status === 'open' ? (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-900/30 animate-pulse">
                              Open (قيد المتابعة)
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-900/30">
                              Resolved (مكتملة ومغلقة)
                            </span>
                          )}
                        </div>

                        {/* Customer Information with Account Edit / Delete & Orders Management */}
                        <div className="space-y-2 bg-stone-900/50 p-3.5 rounded-2xl border border-stone-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                                {dashboardLang === 'ar' ? 'معلومات العميل والحساب' : 'Customer & Account Info'}
                              </span>
                              <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                                <span>{ticket.customerName}</span>
                              </h4>
                              <p className="text-xs text-stone-400 font-mono font-semibold">
                                {dashboardLang === 'ar' ? 'الهاتف:' : 'Phone:'}{' '}
                                <a href={`tel:${ticket.customerPhone}`} className="hover:underline text-blue-400 font-bold">
                                  {ticket.customerPhone}
                                </a>
                              </p>
                            </div>
                            
                            <span className="text-[10px] text-stone-500 font-mono font-bold self-start sm:self-center">
                              {new Date(ticket.date).toLocaleString('en-US', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Quick Actions: Edit Account, Delete Account, Modify Orders for this Ticket */}
                          <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-2">
                            {/* 1. Edit Customer Account Info */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomerAccount({
                                  phone: ticket.customerPhone,
                                  name: ticket.customerName,
                                  password: ''
                                });
                                setCustomerAccountError('');
                                setCustomerAccountSuccess('');
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 border border-blue-800/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              title={dashboardLang === 'ar' ? 'تعديل بيانات الحساب (الاسم / كلمة المرور)' : 'Edit Customer Account (Name / Password)'}
                            >
                              <Edit3 className="w-3 h-3 text-blue-400" />
                              <span>{dashboardLang === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account'}</span>
                            </button>

                            {/* 2. Modify / View Orders linked to this Customer */}
                            <button
                              type="button"
                              onClick={() => {
                                const customerOrders = orders.filter(o => o.customerPhone === ticket.customerPhone);
                                if (customerOrders.length === 1) {
                                  setEditingTicketOrder({ ...customerOrders[0] });
                                  setTicketOrderError('');
                                  setTicketOrderSuccess('');
                                } else {
                                  setSelectedTicketForOrders(ticket);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              title={dashboardLang === 'ar' ? 'تعديل معلومات طلبات العميل من التذكرة' : 'Modify Order details for this Customer'}
                            >
                              <Package className="w-3 h-3 text-amber-400" />
                              <span>
                                {dashboardLang === 'ar' 
                                  ? `تعديل الطلب (${orders.filter(o => o.customerPhone === ticket.customerPhone).length})` 
                                  : `Modify Orders (${orders.filter(o => o.customerPhone === ticket.customerPhone).length})`}
                              </span>
                            </button>

                            {/* 3. Delete Customer Account Permanently */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomerAccount(ticket.customerPhone, ticket.customerName)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              title={dashboardLang === 'ar' ? 'حذف حساب هذا العميل نهائياً من قاعدة البيانات' : 'Permanently Delete this Customer Account'}
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>{dashboardLang === 'ar' ? 'حذف الحساب' : 'Delete Account'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Original Customer Message */}
                        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {ticket.subject}
                            </span>
                            <span className="text-[10px] text-stone-500">رسالة العميل الأساسية</span>
                          </div>
                          <p className="text-xs text-stone-200 leading-relaxed font-semibold">"{ticket.message}"</p>
                        </div>

                        {/* Conversation Thread / Previous Replies */}
                        {ticket.messages && ticket.messages.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                              سجل الردود والمحادثة ({ticket.messages.length}):
                            </span>
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                              {ticket.messages.map((msg, mIdx) => (
                                <div
                                  key={msg.id || mIdx}
                                  className={`p-3 rounded-xl text-xs space-y-1 ${
                                    msg.sender === 'support'
                                      ? 'bg-blue-950/30 border border-blue-900/40 text-blue-200 ml-4'
                                      : 'bg-stone-900 border border-stone-800 text-stone-300 mr-4'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className={`flex items-center gap-1.5 ${msg.sender === 'support' ? 'text-blue-400' : 'text-stone-400'}`}>
                                      {msg.sender === 'support' ? (
                                        <>
                                          <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                                          <span>الدعم الفني (Support Team)</span>
                                        </>
                                      ) : (
                                        <>
                                          <Users className="w-3 h-3 text-stone-400 shrink-0" />
                                          <span>{msg.senderName || ticket.customerName}</span>
                                        </>
                                      )}
                                    </span>
                                    <span className="text-stone-500 font-mono">
                                      {new Date(msg.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="leading-relaxed font-semibold">{msg.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* In-Dashboard Reply Form */}
                        <div className="space-y-2 pt-2 border-t border-stone-800/80">
                          <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center justify-between">
                            <span>الرد على العميل مباشرة من الداشبورد:</span>
                            {ticketSuccessMsgs[ticket.id] && (
                              <span className="text-emerald-400 font-bold animate-fadeIn flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                {ticketSuccessMsgs[ticket.id]}
                              </span>
                            )}
                          </label>

                          {/* Quick Reply Template Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { text: 'تم تأكيد طلبكم وجاري تجهيز الشحن فوراً.', icon: CheckCircle2 },
                              { text: 'الشحنة قيد التوصيل وسيتواصل معكم الموزع اليوم.', icon: Truck },
                              { text: 'تم تعديل العنوان ورقم الهاتف بنجاح.', icon: MapPin },
                              { text: 'تم حل المشكلة، شكراً لتواصلكم معنا!', icon: Sparkles }
                            ].map((quickItem, qIdx) => {
                              const QuickIcon = quickItem.icon;
                              return (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() => setTicketReplyDrafts(prev => ({ ...prev, [ticket.id]: quickItem.text }))}
                                  className="text-[10px] bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 px-2.5 py-1 rounded-lg border border-stone-800 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <QuickIcon className="w-3 h-3 text-blue-400 shrink-0" />
                                  <span>{quickItem.text.slice(0, 24)}...</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="relative">
                            <textarea
                              rows={2}
                              value={ticketReplyDrafts[ticket.id] || ''}
                              onChange={(e) => setTicketReplyDrafts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              placeholder="اكتب ردك للعميل هنا وسيتم حفظه فوراً في حسابه ومتابعته..."
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-blue-500 font-semibold"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendAdminTicketReply(ticket.id)}
                              disabled={!(ticketReplyDrafts[ticket.id] || '').trim() || isSubmittingTicketReply[ticket.id]}
                              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-900/20 cursor-pointer"
                            >
                              {isSubmittingTicketReply[ticket.id] ? (
                                <>
                                  <SleekSpinner size="xs" variant="white" />
                                  <span>جاري الإرسال...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>إرسال الرد (Send Reply)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Status, Transcript Download & Delete Bottom Actions */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-800">
                        <div className="flex items-center gap-2">
                          {ticket.status === 'open' ? (
                            <button
                              onClick={() => handleToggleTicketStatus(ticket.id, 'resolved')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تعيين كمكتملة (Mark Resolved)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleTicketStatus(ticket.id, 'open')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>إعادة فتح التذكرة (Reopen)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExportSingleTicketTranscript(ticket)}
                            className="flex items-center gap-1 px-2.5 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
                            title="تحميل وتنزيل سجل هذه المحادثة بالكامل كملف نصي"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">تحميل السجل</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                          title="حذف التذكرة نهائياً من قاعدة البيانات"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* VIEW 2: SUPPORT FAQS MANAGEMENT */}
          {supportSubTab === 'faqs' && (
            <div className="space-y-6">
              {/* Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#18181b] p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenNewFaqModal}
                    className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-900/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال شائع جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSupportFaqs}
                    className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 px-3 py-2 rounded-xl text-xs font-bold border border-stone-800 transition-all cursor-pointer"
                    title="استعادة الأسئلة الافتراضية"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">استعادة الافتراضي</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllSupportFaqs}
                  disabled={isSavingFaqs}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingFaqs ? 'جاري الحفظ والتحميل...' : 'حفظ ونشر التعديلات في المتجر'}</span>
                </button>
              </div>

              {/* FAQs List */}
              {supportFaqsList.length === 0 ? (
                <div className="bg-[#18181b] rounded-2xl p-10 border border-stone-800 text-center">
                  <HelpCircle className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                  <h4 className="font-bold text-stone-300 text-sm">لا توجد أي أسئلة شائعة مضافة</h4>
                  <p className="text-xs text-stone-500 mt-1">اضغط على زر "إضافة سؤال شائع جديد" أعلاه لإضافة سؤال وجواب لصفحة الدعم.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supportFaqsList.map((faq, idx) => (
                    <div
                      key={faq.id || idx}
                      className="bg-[#18181b] border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      {/* Left: Reorder & Number */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-bold text-stone-400">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveFaqUp(idx)}
                            className="p-1 rounded-md bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-stone-400 hover:text-white cursor-pointer transition-all"
                            title="تحريك لأعلى"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === supportFaqsList.length - 1}
                            onClick={() => handleMoveFaqDown(idx)}
                            className="p-1 rounded-md bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-stone-400 hover:text-white cursor-pointer transition-all"
                            title="تحريك لأسفل"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 space-y-2 min-w-0" dir="rtl">
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            <span>{faq.q}</span>
                          </h4>
                          {faq.qEn && (
                            <p className="text-xs text-stone-400 font-sans italic" dir="ltr">
                              EN: {faq.qEn}
                            </p>
                          )}
                        </div>
                        <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-850 text-xs text-stone-300 leading-relaxed whitespace-pre-line">
                          {faq.a}
                        </div>
                        {faq.aEn && (
                          <div className="bg-stone-900/30 p-2 rounded-lg border border-stone-850 text-[11px] text-stone-400 font-sans italic" dir="ltr">
                            EN: {faq.aEn}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFaqModal(faq)}
                          className="flex items-center gap-1.5 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-900/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupportFaq(faq.id)}
                          className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODAL: ADD / EDIT SUPPORT FAQ */}
          {faqModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-[#18181b] rounded-3xl border border-stone-800 p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-900/40 flex items-center justify-center text-blue-400">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-100 text-base">
                        {editingFaqId ? 'تعديل السؤال الشائع' : 'إضافة سؤال شائع جديد'}
                      </h3>
                      <p className="text-xs text-stone-400">
                        سيظهر هذا السؤال في صفحة خدمة العملاء والدعم والمساعدة
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFaqModalOpen(false)}
                    className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4" dir="rtl">
                  {/* Arabic Question */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                      <span>السؤال (باللغة العربية)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كم يستغرق توصيل الطلب إلى عنواني؟"
                      value={faqForm.q}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, q: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Arabic Answer */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                      <span>الإجابة والتوضيح (باللغة العربية)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="اكتب الإجابة المفصلة التي ستظهر للعميل عند الضغط على السؤال..."
                      value={faqForm.a}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, a: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* English Question (Optional) */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-850">
                    <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5" dir="ltr">
                      <span>Question in English (Optional)</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. How long does delivery take?"
                      value={faqForm.qEn}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, qEn: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>

                  {/* English Answer (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400 flex items-center gap-1.5" dir="ltr">
                      <span>Answer in English (Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      dir="ltr"
                      placeholder="e.g. Orders are delivered within 24 to 48 hours to all cities."
                      value={faqForm.aEn}
                      onChange={(e) => setFaqForm(prev => ({ ...prev, aEn: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 resize-none font-sans text-left leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setFaqModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFaqModal}
                    disabled={!faqForm.q.trim() || !faqForm.a.trim()}
                    className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingFaqId ? 'تحديث السؤال' : 'إضافة السؤال'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 1: EDIT CUSTOMER ACCOUNT FROM TICKET */}
          {editingCustomerAccount && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-[#18181b] rounded-3xl border border-stone-800 p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-900/40 flex items-center justify-center text-blue-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-100 text-base">
                        {dashboardLang === 'ar' ? 'تعديل بيانات حساب العميل' : 'Edit Customer Account Profile'}
                      </h3>
                      <p className="text-xs text-stone-400 font-mono">
                        {dashboardLang === 'ar' ? 'رقم الهاتف:' : 'Phone:'} {editingCustomerAccount.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCustomerAccount(null);
                      setCustomerAccountError('');
                      setCustomerAccountSuccess('');
                    }}
                    className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCustomerAccount} className="space-y-4">
                  {/* Customer Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300">
                      {dashboardLang === 'ar' ? 'الاسم الكامل للعميل' : 'Customer Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCustomerAccount.name}
                      onChange={(e) => setEditingCustomerAccount(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  {/* Customer Phone (Read-Only identifier or account reference) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">
                      {dashboardLang === 'ar' ? 'رقم الهاتف المسجل (معرّف الحساب)' : 'Account Phone Number (ID)'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingCustomerAccount.phone}
                      className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-2.5 text-xs text-stone-400 font-mono cursor-not-allowed"
                    />
                  </div>

                  {/* Optional: Reset Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                      <span>{dashboardLang === 'ar' ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)'}</span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        {dashboardLang === 'ar' ? 'اتركه فارغاً إذا لم ترغب في التغيير' : 'Leave blank to keep unchanged'}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder={dashboardLang === 'ar' ? 'أدخل كلمة مرور جديدة للعميل...' : 'Enter new password for customer...'}
                      value={editingCustomerAccount.password || ''}
                      onChange={(e) => setEditingCustomerAccount(prev => prev ? { ...prev, password: e.target.value } : null)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {customerAccountError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-900/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{customerAccountError}</span>
                    </div>
                  )}

                  {customerAccountSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{customerAccountSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => setEditingCustomerAccount(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                    >
                      {dashboardLang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCustomerAccount || !editingCustomerAccount.name.trim()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                    >
                      {isSavingCustomerAccount ? (
                        <>
                          <SleekSpinner size="xs" variant="white" />
                          <span>{dashboardLang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{dashboardLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: SELECT AN ORDER FOR CUSTOMER (When customer has multiple orders) */}
          {selectedTicketForOrders && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-[#18181b] rounded-3xl border border-stone-800 p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-900/40 flex items-center justify-center text-amber-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-100 text-base">
                        {dashboardLang === 'ar' ? 'طلبات العميل المرتبطة بالتذكرة' : 'Customer Orders for this Ticket'}
                      </h3>
                      <p className="text-xs text-stone-400">
                        {selectedTicketForOrders.customerName} ({selectedTicketForOrders.customerPhone})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicketForOrders(null)}
                    className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {orders.filter(o => o.customerPhone === selectedTicketForOrders.customerPhone).length === 0 ? (
                    <div className="text-center py-8 text-stone-500 text-xs">
                      {dashboardLang === 'ar' ? 'لا توجد طلبات مسجلة بهذا الرقم حتى الآن.' : 'No orders found for this phone number.'}
                    </div>
                  ) : (
                    orders
                      .filter(o => o.customerPhone === selectedTicketForOrders.customerPhone)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="bg-stone-900/60 hover:bg-stone-900 border border-stone-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-900/30">
                                {order.id}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {new Date(order.date).toLocaleDateString()}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                order.status === 'delivered' ? 'bg-emerald-950 text-emerald-400' :
                                order.status === 'shipped' ? 'bg-blue-950 text-blue-400' :
                                order.status === 'cancelled' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-stone-300 font-semibold truncate">
                              {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                            </p>
                            <p className="text-[11px] text-stone-400">
                              {order.customerCity} - {order.customerAddress}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-stone-100 text-xs">
                              {order.total} {storeConfig.currency || 'DH'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTicketOrder({ ...order });
                                setSelectedTicketForOrders(null);
                                setTicketOrderError('');
                                setTicketOrderSuccess('');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{dashboardLang === 'ar' ? 'تعديل' : 'Edit'}</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODAL 3: DIRECT EDIT ORDER DETAILS FROM TICKET */}
          {editingTicketOrder && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-[#18181b] rounded-3xl border border-stone-800 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-900/40 flex items-center justify-center text-blue-400">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-100 text-base">
                        {dashboardLang === 'ar' ? `تعديل معلومات الطلب (${editingTicketOrder.id})` : `Modify Order (${editingTicketOrder.id})`}
                      </h3>
                      <p className="text-xs text-stone-400 font-sans">
                        {dashboardLang === 'ar' ? 'تعديل العنوان، رقم الهاتف، اسم المستلم، أو حالة الطلب' : 'Update recipient name, phone, address, or delivery status'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTicketOrder(null);
                      setTicketOrderError('');
                      setTicketOrderSuccess('');
                    }}
                    className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTicketOrder} className="space-y-4">
                  {/* Recipient Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingTicketOrder.customerName}
                        onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'رقم هاتف المستلم' : 'Recipient Phone'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={editingTicketOrder.customerPhone}
                        onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, customerPhone: e.target.value } : null)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* City & Detailed Delivery Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'المدينة' : 'City'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingTicketOrder.customerCity}
                        onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, customerCity: e.target.value } : null)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'العنوان التفصيلي للتوصيل' : 'Full Shipping Address'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingTicketOrder.customerAddress}
                        onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, customerAddress: e.target.value } : null)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Order Status & Total */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'حالة الطلب' : 'Order Status'}
                      </label>
                      <CustomSelect
                        value={editingTicketOrder.status}
                        onChange={(val) => setEditingTicketOrder(prev => prev ? { ...prev, status: val as any } : null)}
                        theme="dark"
                        size="sm"
                        options={[
                          { value: 'pending', label: dashboardLang === 'ar' ? 'قيد التأكيد (Pending)' : 'Pending' },
                          { value: 'shipped', label: dashboardLang === 'ar' ? 'قيد الشحن والتوصيل (Shipped)' : 'Shipped' },
                          { value: 'delivered', label: dashboardLang === 'ar' ? 'تم الاستلام والدفع (Delivered)' : 'Delivered' },
                          { value: 'cancelled', label: dashboardLang === 'ar' ? 'ملغى (Cancelled)' : 'Cancelled' }
                        ]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">
                        {dashboardLang === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editingTicketOrder.total}
                          onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, total: Number(e.target.value) } : null)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                          {storeConfig.currency || 'DH'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300">
                      {dashboardLang === 'ar' ? 'ملاحظة العميل أو موظف التوصيل' : 'Customer / Delivery Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingTicketOrder.notes || ''}
                      onChange={(e) => setEditingTicketOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
                      placeholder={dashboardLang === 'ar' ? 'أي تعليمات إضافية بخصوص الشحن...' : 'Any extra delivery instructions...'}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-semibold resize-none"
                    />
                  </div>

                  {ticketOrderError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-900/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{ticketOrderError}</span>
                    </div>
                  )}

                  {ticketOrderSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{ticketOrderSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => setEditingTicketOrder(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 transition-colors"
                    >
                      {dashboardLang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingTicketOrder}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                    >
                      {isSavingTicketOrder ? (
                        <>
                          <SleekSpinner size="xs" variant="white" />
                          <span>{dashboardLang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{dashboardLang === 'ar' ? 'حفظ تعديلات الطلب' : 'Save Order Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: BRAND, LOGO & CONTENT CUSTOMIZER */}
      {activeTab === 'brand' && (
        <div id="panel-brand" className="space-y-6 animate-fadeIn">
          <BrandAndContentEditor
            storeConfig={storeConfig}
            setStoreConfig={setStoreConfig}
            dashboardLang={dashboardLang}
            onSaveSuccess={async () => {
              if (onReloadStoreData) {
                await onReloadStoreData();
              }
            }}
          />
        </div>
      )}

      {/* TAB: PIXEL & TRACKING DASHBOARD */}
      {activeTab === 'pixel' && (
        <div id="panel-pixel" className="space-y-6 animate-fadeIn">
          <PixelDashboard
            storeConfig={storeConfig}
            setStoreConfig={setStoreConfig}
            countries={countries}
            activeCountrySlug={activeCountrySlug}
            dashboardLang={dashboardLang}
            onSaveConfig={async (updated) => {
              setSettingsForm(updated);
              if (onReloadStoreData) {
                await onReloadStoreData();
              }
            }}
          />
        </div>
      )}

      {/* TAB: CUSTOMER FAVORITES & WISHLIST MARKET DEMAND */}
      {activeTab === 'favorites' && (
        <div id="panel-favorites" className="space-y-6 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#18181b] border border-stone-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 fill-rose-500/20" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-100 flex items-center gap-2 flex-wrap">
                  <span>{dashboardLang === 'ar' ? 'تحليلات المفضلة ورغبات العملاء' : 'Customer Wishlists & Market Demand'}</span>
                  <span className="text-xs font-mono font-bold bg-rose-950/60 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-900/40">
                    {favoritesAnalytics.reduce((acc, item) => acc + (item.favoriteCount || 0), 0)} {dashboardLang === 'ar' ? 'إعجاب' : 'Likes'}
                  </span>
                  <span className="text-xs font-mono font-bold bg-blue-950/60 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-900/40">
                    {favoritesCustomers.length} {dashboardLang === 'ar' ? 'حساب نشط' : 'Active Accounts'}
                  </span>
                </h3>
                <p className="text-xs text-stone-400 font-semibold mt-1">
                  {dashboardLang === 'ar'
                    ? 'اكتشف كل حساب زبون والمنتجات التي نالت إعجابه لتحديد رغبات السوق والتواصل المباشر مع المهتمين.'
                    : 'Analyze customer accounts and their saved products to understand market demand and engage directly with buyers.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* View Switcher: By Customers vs By Products */}
              <div className="bg-stone-900 border border-stone-800 p-1 rounded-2xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFavoritesViewMode('customers')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    favoritesViewMode === 'customers'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{dashboardLang === 'ar' ? 'حسب حسابات الزبناء' : 'By Customer Accounts'}</span>
                  <span className="bg-stone-950/60 text-[10px] px-1.5 py-0.2 rounded-md">{favoritesCustomers.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFavoritesViewMode('products')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    favoritesViewMode === 'products'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{dashboardLang === 'ar' ? 'حسب المنتجات' : 'By Products'}</span>
                  <span className="bg-stone-950/60 text-[10px] px-1.5 py-0.2 rounded-md">{favoritesAnalytics.filter(p => (p.favoriteCount || 0) > 0).length}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={fetchFavoritesAnalytics}
                disabled={loadingFavoritesAnalytics}
                className="flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-stone-800 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFavoritesAnalytics ? 'animate-spin text-rose-400' : ''}`} />
                <span>{dashboardLang === 'ar' ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                {dashboardLang === 'ar' ? 'إجمالي الحسابات ذات المفضلة' : 'Customer Accounts With Wishlists'}
              </span>
              <p className="text-2xl font-black text-stone-100">{favoritesCustomers.length}</p>
            </div>
            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                {dashboardLang === 'ar' ? 'إجمالي علامات الإعجاب' : 'Total Wishlist Saves'}
              </span>
              <p className="text-2xl font-black text-rose-400">
                {favoritesAnalytics.reduce((acc, item) => acc + (item.favoriteCount || 0), 0)}
              </p>
            </div>
            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                {dashboardLang === 'ar' ? 'المنتج الأكثر طلباً وإعجاباً' : 'Top Favorited Item'}
              </span>
              <p className="text-sm font-black text-blue-400 truncate">
                {favoritesAnalytics[0]?.name || (dashboardLang === 'ar' ? 'لا توجد بيانات' : 'No data yet')}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-3.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-stone-500 shrink-0" />
            <input
              type="text"
              value={favoritesSearch}
              onChange={(e) => setFavoritesSearch(e.target.value)}
              placeholder={
                dashboardLang === 'ar'
                  ? 'بحث باسم الزبون، برقم الهاتف، أو باسم المنتج...'
                  : 'Search by customer name, phone number, or product title...'
              }
              className="bg-transparent border-none text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none w-full"
            />
            {favoritesSearch && (
              <button
                type="button"
                onClick={() => setFavoritesSearch('')}
                className="text-stone-500 hover:text-stone-300 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Content Loading / Empty / Data */}
          {loadingFavoritesAnalytics ? (
            <div className="bg-[#18181b] border border-stone-800 rounded-3xl p-12 text-center">
              <SleekLoadingBlock title={dashboardLang === 'ar' ? 'جاري جلب تحليلات المفضلة...' : 'Loading favorites analytics...'} />
            </div>
          ) : (favoritesViewMode === 'customers' ? favoritesCustomers.length === 0 : favoritesAnalytics.length === 0) ? (
            <div className="bg-[#18181b] border border-stone-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-stone-200">
                {dashboardLang === 'ar' ? 'لم يقم أي عميل بإضافة منتجات للمفضلة بعد' : 'No products wishlisted yet'}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {dashboardLang === 'ar'
                  ? 'عندما يسجل العملاء دخولهم ويضغطون على زر القلب في المتجر، ستظهر إحصائياتهم وحساباتهم هنا فوراً.'
                  : 'When customers log in and favorite items in the store, their saved products and details will appear here.'}
              </p>
            </div>
          ) : favoritesViewMode === 'customers' ? (
            /* VIEW 1: BY CUSTOMER ACCOUNTS */
            <div className="space-y-4">
              {favoritesCustomers
                .filter(cust => {
                  if (!favoritesSearch.trim()) return true;
                  const query = favoritesSearch.toLowerCase();
                  const matchCust = (cust.name || '').toLowerCase().includes(query) || (cust.phone || '').includes(query);
                  const matchProd = (cust.favoriteProducts || []).some((p: any) => (p.name || '').toLowerCase().includes(query) || (p.nameAr || '').includes(query));
                  return matchCust || matchProd;
                })
                .map((cust, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-[#18181b] border border-stone-800 hover:border-stone-700/80 rounded-3xl p-6 transition-all shadow-lg space-y-5"
                  >
                    {/* Customer Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
                      <div className="flex items-center gap-3.5">
                        {cust.avatar ? (
                          <img
                            src={cust.avatar}
                            alt={cust.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-stone-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black flex items-center justify-center text-sm shrink-0">
                            {(cust.name || cust.phone || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-stone-100">{cust.name || (dashboardLang === 'ar' ? 'عميل المتجر' : 'Customer')}</h4>
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/40 border border-rose-900/50 text-rose-300 font-extrabold text-[11px]">
                              <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                              <span>{cust.favoritesCount} {dashboardLang === 'ar' ? 'منتجات بالمفضلة' : 'Wishlist Items'}</span>
                            </span>
                            {cust.ordersCount > 0 && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 font-extrabold text-[11px]">
                                <span>{cust.ordersCount} {dashboardLang === 'ar' ? 'طلبات سابقة' : 'Past Orders'}</span>
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-stone-400 mt-1 flex items-center gap-2">
                            <span>📞 {cust.phone}</span>
                            {cust.lastOrderDate && (
                              <span className="text-[11px] text-stone-500">
                                • {dashboardLang === 'ar' ? 'آخر طلب:' : 'Last order:'} {new Date(cust.lastOrderDate).toLocaleDateString(dashboardLang === 'ar' ? 'ar-MA' : 'en-US')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {cust.phone && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <a
                            href={`https://wa.me/212${cust.phone.replace(/^0/, '')}?text=Bonjour%20${encodeURIComponent(cust.name || '')},%20nous%20avons%20remarque%20votre%20interet%20pour%20nos%20produits.%20Souhaitez-vous%20un%20code%20promo%20special%20pour%20finaliser%20votre%20commande%20?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{dashboardLang === 'ar' ? 'مراسلة عبر واتساب' : 'WhatsApp Client'}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Products Wishlisted by this customer */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">
                        {dashboardLang === 'ar' ? 'المنتجات التي وضعها هذا الزبون في المفضلة:' : 'Products favorited by this customer:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {(cust.favoriteProducts || []).map((prod: any, pIdx: number) => (
                          <div
                            key={pIdx}
                            className="bg-stone-900/90 border border-stone-800/90 hover:border-stone-700 rounded-2xl p-3 flex items-center gap-3 transition-all"
                          >
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-800 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-stone-200 text-xs truncate">{prod.name}</h5>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="font-mono font-black text-blue-400 text-xs">
                                  {prod.price} {getDisplayCurrency(storeConfig.currency, dashboardLang)}
                                </span>
                                <span className="text-[10px] font-bold text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-md truncate max-w-[80px]">
                                  {prod.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* VIEW 2: BY TRENDING PRODUCTS */
            <div className="space-y-4">
              {favoritesAnalytics
                .filter(item => {
                  if (!favoritesSearch.trim()) return true;
                  const query = favoritesSearch.toLowerCase();
                  const matchProd = (item.name || '').toLowerCase().includes(query) || (item.category || '').toLowerCase().includes(query);
                  const matchCust = (item.customers || []).some((c: any) => (c.name || '').toLowerCase().includes(query) || (c.phone || '').includes(query));
                  return matchProd || matchCust;
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#18181b] border border-stone-800 hover:border-stone-700/80 rounded-3xl p-6 transition-all shadow-lg space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-stone-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-sm font-black text-stone-100">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="font-mono font-bold text-blue-400">
                              {item.price} {getDisplayCurrency(storeConfig.currency, dashboardLang)}
                            </span>
                            <span className="text-stone-600">•</span>
                            <span className="text-stone-400 text-[11px]">{item.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/40 border border-rose-900/50 text-rose-300 font-extrabold text-xs">
                          <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                          <span>{item.favoriteCount || 0} {dashboardLang === 'ar' ? 'حساب قام بالمفضلة' : 'Account saves'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Interested Customers Accounts */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">
                        {dashboardLang === 'ar' ? 'العملاء الذين أضافوا هذا المنتج للمفضلة:' : 'Customers who saved this product:'}
                      </span>
                      {(!item.customers || item.customers.length === 0) ? (
                        <p className="text-xs text-stone-500 italic">{dashboardLang === 'ar' ? 'لا يوجد حساب مسجل لهذا المنتج حالياً.' : 'No customer accounts linked yet.'}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {item.customers.map((cust: any, cIdx: number) => (
                            <div
                              key={cIdx}
                              className="bg-stone-900/80 border border-stone-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {cust.avatar ? (
                                  <img src={cust.avatar} alt={cust.name} className="w-8 h-8 rounded-full object-cover border border-stone-700 shrink-0" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                    {(cust.name || cust.phone || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-stone-200 truncate">{cust.name || (dashboardLang === 'ar' ? 'عميل' : 'Customer')}</p>
                                  <a href={`tel:${cust.phone}`} className="font-mono text-[11px] text-stone-400 hover:text-blue-400 transition-colors block truncate">
                                    {cust.phone}
                                  </a>
                                </div>
                              </div>
                              {cust.phone && (
                                <a
                                  href={`https://wa.me/212${cust.phone.replace(/^0/, '')}?text=Bonjour%20${encodeURIComponent(cust.name || '')},%20nous%20avons%20remarque%20que%20vous%20avez%20ajoute%20${encodeURIComponent(item.name)}%20a%20vos%20favoris.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-400 transition-all shrink-0 cursor-pointer"
                                  title={dashboardLang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
          </div>
        </main>
      </div>

      {/* STICKY BOTTOM NAVIGATION BAR FOR MOBILE & TABLETS (< lg) */}
      <nav 
        id="admin-mobile-bottom-nav" 
        dir={dashboardLang === 'ar' ? 'rtl' : 'ltr'}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#18181b] border-t border-stone-800 py-2 px-1 sm:px-3 flex justify-around items-center z-50 shadow-2xl select-none"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setShowMobileMoreMenu(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'dashboard' && !showMobileMoreMenu ? 'text-[#2563eb] font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-center truncate block">
            {dashboardLang === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('products');
            setShowMobileMoreMenu(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'products' && !showMobileMoreMenu ? 'text-[#2563eb] font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-center truncate block">
            {dashboardLang === 'ar' ? 'المنتجات' : 'Products'}
          </span>
          <span className="absolute top-0 right-2 sm:right-4 text-[8px] bg-stone-800 text-stone-300 border border-stone-700 font-extrabold h-3.5 min-w-3.5 px-0.5 rounded-full flex items-center justify-center scale-90">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setShowMobileMoreMenu(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'orders' && !showMobileMoreMenu ? 'text-[#2563eb] font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-center truncate block">
            {dashboardLang === 'ar' ? 'الطلبات' : 'Orders'}
          </span>
          <span className="absolute top-0 right-2 sm:right-4 text-[8px] bg-blue-600 text-white font-extrabold h-3.5 min-w-3.5 px-0.5 rounded-full flex items-center justify-center scale-90">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tickets');
            setShowMobileMoreMenu(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'tickets' && !showMobileMoreMenu ? 'text-[#2563eb] font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-center truncate block">
            {dashboardLang === 'ar' ? 'الدعم' : 'Support'}
          </span>
          {tickets.filter(t => t.status === 'open').length > 0 && (
            <span className="absolute top-0 right-2 sm:right-4 text-[8px] bg-red-500 text-white font-extrabold h-3.5 min-w-3.5 px-0.5 rounded-full flex items-center justify-center scale-90 animate-pulse">
              {tickets.filter(t => t.status === 'open').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-0.5 rounded-lg transition-all cursor-pointer relative ${
            showMobileMoreMenu || ['coupons', 'reviews', 'stores', 'settings'].includes(activeTab)
              ? 'text-[#2563eb] font-bold scale-105' 
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-center truncate block">
            {dashboardLang === 'ar' ? 'المزيد' : 'More'}
          </span>
          {(coupons.length > 0 || countries.length > 0) && !showMobileMoreMenu && ['coupons', 'reviews', 'stores', 'settings'].includes(activeTab) && (
            <span className="absolute top-0.5 right-3 sm:right-5 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </button>
      </nav>

      {/* MOBILE "MORE" BOTTOM SHEET DRAWER (< lg) */}
      {showMobileMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end animate-fadeIn">
          {/* Backdrop */}
          <div 
            onClick={() => setShowMobileMoreMenu(false)}
            className="absolute inset-0 bg-black/80 transition-opacity"
          />

          {/* Drawer Content */}
          <div 
            dir={dashboardLang === 'ar' ? 'rtl' : 'ltr'}
            className="relative bg-[#18181b] border-t border-stone-800 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto dark-scrollbar z-10 pb-8"
          >
            {/* Drawer Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider">
                  {dashboardLang === 'ar' ? 'أقسام وإعدادات إضافية' : 'More Management Tools'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMoreMenu(false)}
                className="p-1.5 text-stone-400 hover:text-white bg-stone-900 rounded-full border border-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Tools */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Coupons */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('coupons');
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'coupons'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-blue-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.coupons}</div>
                    <div className="text-[10px] text-stone-500">{coupons.length} {dashboardLang === 'ar' ? 'كوبونات' : 'active'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Reviews */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'reviews'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-amber-400">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.reviews}</div>
                    <div className="text-[10px] text-stone-500">{reviews.length} {dashboardLang === 'ar' ? 'تقييمات' : 'reviews'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Country Stores */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stores');
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'stores'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-emerald-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.stores}</div>
                    <div className="text-[10px] text-stone-500">{countries.length} {dashboardLang === 'ar' ? 'متاجر دول' : 'countries'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Pixel & Analytics */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pixel');
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'pixel'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.pixel || (dashboardLang === 'ar' ? 'البكسل والتحليلات' : 'Pixel & Analytics')}</div>
                    <div className="text-[10px] text-stone-500">{dashboardLang === 'ar' ? 'Meta & TikTok' : 'Tracking & Stats'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Brand & Content Customizer */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('brand');
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'brand'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-amber-400">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{dashboardLang === 'ar' ? 'الشعار والنصوص' : 'Brand & Content'}</div>
                    <div className="text-[10px] text-stone-500">{dashboardLang === 'ar' ? 'تخصيص كامل' : 'CMS & Theme'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Favorites & Wishlists */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('favorites');
                  fetchFavoritesAnalytics();
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'favorites'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-rose-400">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{dashboardLang === 'ar' ? 'المفضلة والاهتمامات' : 'Favorites'}</div>
                    <div className="text-[10px] text-stone-500">{dashboardLang === 'ar' ? 'رغبات العملاء' : 'Wishlists'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              {/* Store Settings */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setSettingsForm({ ...storeConfig });
                  setShowMobileMoreMenu(false);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  activeTab === 'settings'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-black'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-stone-800 text-purple-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{t.settings}</div>
                    <div className="text-[10px] text-stone-500">{dashboardLang === 'ar' ? 'الهوية والشحن' : 'Config'}</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-500 ${dashboardLang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW COUNTRY STORE */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/85 overflow-y-auto animate-fadeIn dark-scrollbar">
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 my-4 sm:my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-950 text-blue-400 rounded-xl border border-blue-900/40">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-100 font-serif">
                    {dashboardLang === 'ar' ? 'إضافة متجر دولة جديد' : 'Add New Country Store'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {dashboardLang === 'ar' ? 'تخصيص سوق دولة جديدة بالعملة المحلية والشحن' : 'Configure new country market with localized currency & shipping'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-300 hover:bg-stone-900 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {storeActionError && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/40 rounded-xl text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{storeActionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCountryStore} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'اسم الدولة بالعربية *' : 'Country Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={dashboardLang === 'ar' ? 'مثال: الإمارات العربية المتحدة' : 'e.g. الإمارات العربية المتحدة'}
                    value={newStoreForm.nameAr || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'اسم الدولة بالإنجليزية *' : 'Country Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United Arab Emirates"
                    value={newStoreForm.name || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'رمز الدولة (حرفين) *' : 'Country Code (2 Letters) *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. AE"
                    value={newStoreForm.code || ''}
                    onChange={e => {
                      const code = e.target.value.toUpperCase();
                      setNewStoreForm(prev => ({ 
                        ...prev, 
                        code,
                        slug: prev.slug ? prev.slug : code.toLowerCase()
                      }));
                    }}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs uppercase font-mono font-bold focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'مسار رابط المتجر *' : 'Store URL Slug *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ae"
                    value={newStoreForm.slug || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'علم الدولة *' : 'Flag Emoji *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="🇦🇪"
                    value={newStoreForm.flag || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, flag: e.target.value }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs text-center text-lg focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'رمز العملة *' : 'Currency Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AED, USD, EUR"
                    value={newStoreForm.currency || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono uppercase focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'رمز عرض العملة *' : 'Currency Symbol *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. د.إ., $, €"
                    value={newStoreForm.currencySymbol || ''}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, currencySymbol: e.target.value }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'سعر الشحن الافتراضي *' : 'Default Shipping Fee *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={newStoreForm.shippingFee ?? 25}
                    onChange={e => setNewStoreForm(prev => ({ ...prev, shippingFee: Number(e.target.value) }))}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                  {dashboardLang === 'ar' ? 'اسم عرض المتجر' : 'Store Brand Display Name'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mavluy UAE"
                  value={newStoreForm.storeName || ''}
                  onChange={e => setNewStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-5 py-3 rounded-full text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 transition-all cursor-pointer"
                >
                  {dashboardLang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={storeSaving}
                  className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-3 px-7 rounded-full font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {storeSaving ? (
                    <>
                      <SleekSpinner size="xs" variant="white" />
                      <span>{dashboardLang === 'ar' ? 'جاري الإنشاء...' : 'Creating Store...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{dashboardLang === 'ar' ? 'إنشاء متجر الدولة' : 'Create Country Store'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COUNTRY STORE */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/85 overflow-y-auto animate-fadeIn dark-scrollbar">
          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 my-4 sm:my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 p-1">
                  <CountryFlag code={editingStore.code || editingStore.slug} size="sm" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-100 font-serif">
                    {dashboardLang === 'ar' ? `تعديل المتجر: ${editingStore.nameAr || editingStore.name}` : `Edit Store: ${editingStore.name || editingStore.nameAr}`}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">Code: {editingStore.code} • Slug: /{editingStore.slug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-300 hover:bg-stone-900 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCountryStore} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'اسم الدولة بالعربية' : 'Country Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.nameAr || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, nameAr: e.target.value }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'اسم الدولة بالإنجليزية' : 'Country Name (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.name || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'رمز العملة' : 'Currency Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.currency || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, currency: e.target.value.toUpperCase() }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs font-mono uppercase focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'رمز العرض' : 'Currency Symbol'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.currencySymbol || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, currencySymbol: e.target.value }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'علم الدولة' : 'Flag Emoji'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.flag || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, flag: e.target.value }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs text-center text-lg focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'سعر الشحن القياسي' : 'Standard Shipping Fee'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingStore.shippingFee ?? 25}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, shippingFee: Number(e.target.value) }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                    {dashboardLang === 'ar' ? 'اسم عرض المتجر' : 'Store Display Name'}
                  </label>
                  <input
                    type="text"
                    value={editingStore.storeName || ''}
                    onChange={e => setEditingStore(prev => prev ? ({ ...prev, storeName: e.target.value }) : null)}
                    className="w-full border border-stone-800 bg-stone-900 text-stone-100 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-5 py-3 rounded-full text-xs font-bold text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 transition-all cursor-pointer"
                >
                  {dashboardLang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={storeSaving}
                  className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-3 px-7 rounded-full font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  {storeSaving ? (
                    <>
                      <SleekSpinner size="xs" variant="white" />
                      <span>{dashboardLang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{dashboardLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Live Order Push Notification Banner (App-like Realtime Floating Alert) */}
      <OrderNotificationBanner
        order={activeBannerOrder}
        isTest={isTestBanner}
        onClose={closeBanner}
        onViewOrder={(orderId) => {
          handleSwitchTab('orders');
          setOrderSearchQuery(orderId);
        }}
        lang={dashboardLang}
      />

      {/* Sleek Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        theme="dark"
        lang={dashboardLang}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
