import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Product, StoreConfig, Order, SupportTicket, CountryStore, Category, Coupon, ShippingMethod, Review } from './types';
import { DEFAULT_PRODUCTS, DEFAULT_STORE_CONFIG, DEFAULT_ORDERS, DEFAULT_TICKETS, DEFAULT_STORES } from './data';
import AdminPanel from './components/AdminPanel';
import OnlineStore from './components/OnlineStore';
import AdminAuth from './components/AdminAuth';
import LoadingScreen from './components/LoadingScreen';

const COLOR_THEMES: Record<string, {
  primary: string;
  primaryHover: string;
  text: string;
  bgLight: string;
  border: string;
  ring: string;
}> = {
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    bgLight: 'bg-emerald-50/70',
    border: 'border-emerald-500',
    ring: 'focus:ring-emerald-500',
  },
  indigo: {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    text: 'text-indigo-600',
    bgLight: 'bg-indigo-50/70',
    border: 'border-indigo-500',
    ring: 'focus:ring-indigo-500',
  },
  amber: {
    primary: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    text: 'text-amber-500',
    bgLight: 'bg-amber-50/70',
    border: 'border-amber-500',
    ring: 'focus:ring-amber-500',
  },
  rose: {
    primary: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-600',
    text: 'text-rose-500',
    bgLight: 'bg-rose-50/70',
    border: 'border-rose-500',
    ring: 'focus:ring-rose-500',
  },
  slate: {
    primary: 'bg-slate-800',
    primaryHover: 'hover:bg-slate-900',
    text: 'text-slate-800',
    bgLight: 'bg-slate-100',
    border: 'border-slate-800',
    ring: 'focus:ring-slate-800',
  },
};

async function safeFetchJson<T>(url: string, fallback: T, retries = 2, delayMs = 300): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const sep = url.includes('?') ? '&' : '?';
      const antiCacheUrl = `${url}${sep}_cb=${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch(antiCacheUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
      return fallback;
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  return fallback;
}

export default function App() {
  const [countries, setCountries] = useState<CountryStore[]>(DEFAULT_STORES);

  const getSlugFromUrl = (): string => {
    const path = window.location.pathname.toLowerCase().replace(/^\/+/, '');
    const firstSegment = path.split('/')[0];
    const params = new URLSearchParams(window.location.search);
    if (params.has('store')) return params.get('store')!.toLowerCase();

    const reservedWords = [
      'admin', 'dashboard', 'api', 'login', 'register', 'cart', 'checkout', 'profile',
      'products', 'product', 'p', 'support', 'tickets', 'ticket', 'orders', 'order',
      'track', 'tracking', 'favorites', 'wishlist', 'category', 'categories', 'index.html',
      'mavluy-secure-gate-789', 'mavluy-admin-gate', 'secure-admin-portal', 'gate', 'portal', ''
    ];
    if (firstSegment && !reservedWords.includes(firstSegment)) {
      const isKnownCountry = DEFAULT_STORES.some(s => s.slug === firstSegment || s.code.toLowerCase() === firstSegment);
      if (isKnownCountry || (firstSegment.length >= 2 && firstSegment.length <= 4 && /^[a-z]+$/.test(firstSegment))) {
        return firstSegment;
      }
    }
    return localStorage.getItem('ecom_active_country_slug') || 'ma';
  };

  const initialSlug = getSlugFromUrl();
  const [activeCountrySlug, setActiveCountrySlug] = useState<string>(initialSlug);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem(`ecom_cached_products_${initialSlug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('ecom_cached_store_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return { ...DEFAULT_STORE_CONFIG, ...parsed };
      }
      const cachedPrimary = localStorage.getItem('ecom_cached_theme_primary_color');
      const cachedBg = localStorage.getItem('ecom_cached_store_bg_color');
      const cachedHeaderBg = localStorage.getItem('ecom_cached_header_bg_color');
      if (cachedPrimary || cachedBg || cachedHeaderBg) {
        return {
          ...DEFAULT_STORE_CONFIG,
          ...(cachedPrimary ? { themePrimaryColor: cachedPrimary, logoAccentColor: cachedPrimary } : {}),
          ...(cachedBg ? { storeBackgroundColor: cachedBg } : {}),
          ...(cachedHeaderBg ? { headerBackgroundColor: cachedHeaderBg } : {})
        };
      }
    } catch (e) {
      console.warn('Error reading cached store config', e);
    }
    return DEFAULT_STORE_CONFIG;
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem(`ecom_cached_categories_${initialSlug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(() => {
    try {
      const cached = localStorage.getItem(`ecom_cached_shipping_${initialSlug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const cached = localStorage.getItem(`ecom_cached_reviews_${initialSlug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Fast start: If we already have products and storeConfig cached, skip blocking loader immediately
  const hasCachedProducts = products.length > 0;
  const [loading, setLoading] = useState(!hasCachedProducts);
  const [initialLoadComplete, setInitialLoadComplete] = useState(hasCachedProducts);

  const [loggedInAdminEmail, setLoggedInAdminEmail] = useState<string | null>(() => {
    return localStorage.getItem('mavluy_logged_in_admin') || sessionStorage.getItem('mavluy_logged_in_admin') || localStorage.getItem('virtuprod_logged_in_admin') || sessionStorage.getItem('virtuprod_logged_in_admin');
  });
  const [adminAuthTab, setAdminAuthTab] = useState<'login' | 'register'>(() => {
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const savedRegSlug = (localStorage.getItem('ecom_custom_admin_register_slug') || 'admin/register').toLowerCase().replace(/^\/+|\/+$/g, '');
    if (path === savedRegSlug || path.startsWith(savedRegSlug + '/') || path === 'admin/register' || path === 'register') {
      return 'register';
    }
    return 'login';
  });

  const [viewMode, setViewMode] = useState<'client' | 'admin'>(() => {
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const savedCustomSlug = (localStorage.getItem('ecom_custom_admin_slug') || 'admin/dashboard').toLowerCase().replace(/^\/+|\/+$/g, '');
    const savedLoginSlug = (localStorage.getItem('ecom_custom_admin_login_slug') || 'admin/login').toLowerCase().replace(/^\/+|\/+$/g, '');
    const savedRegSlug = (localStorage.getItem('ecom_custom_admin_register_slug') || 'admin/register').toLowerCase().replace(/^\/+|\/+$/g, '');

    if (
      path === savedCustomSlug || path.startsWith(savedCustomSlug + '/') ||
      path === savedLoginSlug || path.startsWith(savedLoginSlug + '/') ||
      path === savedRegSlug || path.startsWith(savedRegSlug + '/') ||
      path === 'admin' || path.startsWith('admin/') ||
      path === 'dashboard' || path.startsWith('dashboard/') ||
      path === 'login' || path === 'register'
    ) {
      return 'admin';
    }
    return 'client';
  });

  useEffect(() => {
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const activeAdminSlug = (storeConfig.customAdminSlug || localStorage.getItem('ecom_custom_admin_slug') || 'admin/dashboard').toLowerCase().replace(/^\/+/, '');
    const activeAdminLoginSlug = (storeConfig.customAdminLoginSlug || localStorage.getItem('ecom_custom_admin_login_slug') || 'admin/login').toLowerCase().replace(/^\/+/, '');

    if (
      path === 'dashboard' ||
      path.startsWith('dashboard/') ||
      path.includes('mavluy-secure-gate') ||
      path.includes('mavluy-admin-gate') ||
      path.includes('secure-admin-portal')
    ) {
      const url = new URL(window.location.href);
      url.pathname = `/${loggedInAdminEmail ? activeAdminSlug : activeAdminLoginSlug}`;
      window.history.replaceState({}, '', url.toString());
      setViewMode('admin');
    }
  }, [storeConfig.customAdminSlug, storeConfig.customAdminLoginSlug, loggedInAdminEmail]);

  const loadCountries = useCallback(async () => {
    try {
      const data = await safeFetchJson<CountryStore[]>('/api/countries', DEFAULT_STORES, 1);
      if (Array.isArray(data) && data.length > 0) {
        setCountries(prev => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
        try {
          localStorage.setItem('ecom_cached_countries', JSON.stringify(data));
        } catch (e) {}
        const activeList = data.filter((c: any) => c.status !== 'disabled');
        if (activeList.length > 0) {
          const current = data.find((c: any) => c.slug === activeCountrySlug);
          if (current && current.status === 'disabled' && viewMode === 'client') {
            setActiveCountrySlug(activeList[0].slug);
          }
        }
      }
    } catch (e) {
      console.warn('Countries fetch warning, using fallback:', e);
    }
  }, [activeCountrySlug, viewMode]);

  const loadStoreData = useCallback(async (slug: string, isSilent = false) => {
    if (!isSilent && products.length === 0) {
      setLoading(true);
    }
    try {
      if (viewMode === 'client') {
        // Fast storefront fetch: only download necessary catalog data
        const [resProducts, resConfig, resCats, resCoup, resShip, resReviews] = await Promise.all([
          safeFetchJson<Product[]>(`/api/products?storeId=${slug}`, [], 1),
          safeFetchJson<StoreConfig>(`/api/store-config?storeId=${slug}`, DEFAULT_STORE_CONFIG, 1),
          safeFetchJson<Category[]>(`/api/categories?storeId=${slug}`, [], 1),
          safeFetchJson<Coupon[]>(`/api/coupons?storeId=${slug}`, [], 1),
          safeFetchJson<ShippingMethod[]>(`/api/shipping?storeId=${slug}`, [], 1),
          safeFetchJson<Review[]>(`/api/reviews?storeId=${slug}`, [], 1)
        ]);

        if (Array.isArray(resProducts)) {
          setProducts(prev => (JSON.stringify(prev) === JSON.stringify(resProducts) ? prev : resProducts));
          try {
            localStorage.setItem(`ecom_cached_products_${slug}`, JSON.stringify(resProducts));
          } catch (e) {}
        }
        if (resConfig) {
          setStoreConfig(prev => (JSON.stringify(prev) === JSON.stringify(resConfig) ? prev : resConfig));
          try {
            localStorage.setItem('ecom_cached_store_config', JSON.stringify(resConfig));
            if (resConfig.themePrimaryColor) {
              localStorage.setItem('ecom_cached_theme_primary_color', resConfig.themePrimaryColor);
            }
            if (resConfig.storeBackgroundColor) {
              localStorage.setItem('ecom_cached_store_bg_color', resConfig.storeBackgroundColor);
            }
            if (resConfig.headerBackgroundColor) {
              localStorage.setItem('ecom_cached_header_bg_color', resConfig.headerBackgroundColor);
            }
          } catch (e) {}
        }
        if (Array.isArray(resCats)) {
          setCategories(prev => (JSON.stringify(prev) === JSON.stringify(resCats) ? prev : resCats));
          try {
            localStorage.setItem(`ecom_cached_categories_${slug}`, JSON.stringify(resCats));
          } catch (e) {}
        }
        if (Array.isArray(resCoup)) {
          setCoupons(prev => (JSON.stringify(prev) === JSON.stringify(resCoup) ? prev : resCoup));
        }
        if (Array.isArray(resShip)) {
          setShippingMethods(prev => (JSON.stringify(prev) === JSON.stringify(resShip) ? prev : resShip));
          try {
            localStorage.setItem(`ecom_cached_shipping_${slug}`, JSON.stringify(resShip));
          } catch (e) {}
        }
        if (Array.isArray(resReviews)) {
          setReviews(prev => (JSON.stringify(prev) === JSON.stringify(resReviews) ? prev : resReviews));
          try {
            localStorage.setItem(`ecom_cached_reviews_${slug}`, JSON.stringify(resReviews));
          } catch (e) {}
        }
      } else {
        // Admin fetch: includes orders, tickets, and financial data
        const [resProducts, resConfig, resOrders, resTickets, resCats, resCoup, resShip, resReviews] = await Promise.all([
          safeFetchJson<Product[]>(`/api/products?storeId=${slug}`, [], 1),
          safeFetchJson<StoreConfig>(`/api/store-config?storeId=${slug}`, DEFAULT_STORE_CONFIG, 1),
          safeFetchJson<Order[]>(`/api/orders?storeId=${slug}`, [], 1),
          safeFetchJson<SupportTicket[]>(`/api/tickets?storeId=${slug}`, [], 1),
          safeFetchJson<Category[]>(`/api/categories?storeId=${slug}`, [], 1),
          safeFetchJson<Coupon[]>(`/api/coupons?storeId=${slug}`, [], 1),
          safeFetchJson<ShippingMethod[]>(`/api/shipping?storeId=${slug}`, [], 1),
          safeFetchJson<Review[]>(`/api/reviews?storeId=${slug}`, [], 1)
        ]);

        if (Array.isArray(resProducts)) {
          setProducts(prev => (JSON.stringify(prev) === JSON.stringify(resProducts) ? prev : resProducts));
          try {
            localStorage.setItem(`ecom_cached_products_${slug}`, JSON.stringify(resProducts));
          } catch (e) {}
        }
        if (resConfig) {
          setStoreConfig(prev => (JSON.stringify(prev) === JSON.stringify(resConfig) ? prev : resConfig));
        }
        if (Array.isArray(resOrders)) {
          setOrders(prev => (JSON.stringify(prev) === JSON.stringify(resOrders) ? prev : resOrders));
        }
        if (Array.isArray(resTickets)) {
          setTickets(prev => (JSON.stringify(prev) === JSON.stringify(resTickets) ? prev : resTickets));
        }
        if (Array.isArray(resCats)) {
          setCategories(prev => (JSON.stringify(prev) === JSON.stringify(resCats) ? prev : resCats));
        }
        if (Array.isArray(resCoup)) {
          setCoupons(prev => (JSON.stringify(prev) === JSON.stringify(resCoup) ? prev : resCoup));
        }
        if (Array.isArray(resShip)) {
          setShippingMethods(prev => (JSON.stringify(prev) === JSON.stringify(resShip) ? prev : resShip));
        }
        if (Array.isArray(resReviews)) {
          setReviews(prev => (JSON.stringify(prev) === JSON.stringify(resReviews) ? prev : resReviews));
        }
      }
    } catch (error) {
      console.warn(`Transient sync warning for store [${slug}]:`, error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [viewMode, products.length]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    loadStoreData(activeCountrySlug);
    localStorage.setItem('ecom_active_country_slug', activeCountrySlug);
  }, [activeCountrySlug, loadStoreData]);

  useEffect(() => {
    const handleImmediateSync = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadStoreData(activeCountrySlug, true);
        loadCountries();
      }
    };

    const refreshInterval = viewMode === 'client' ? 30000 : 10000;
    const autoRefreshTimer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadStoreData(activeCountrySlug, true);
      }
    }, refreshInterval);

    const countriesTimer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadCountries();
      }
    }, 45000);

    window.addEventListener('focus', handleImmediateSync);
    window.addEventListener('online', handleImmediateSync);
    document.addEventListener('visibilitychange', handleImmediateSync);

    return () => {
      clearInterval(autoRefreshTimer);
      clearInterval(countriesTimer);
      window.removeEventListener('focus', handleImmediateSync);
      window.removeEventListener('online', handleImmediateSync);
      document.removeEventListener('visibilitychange', handleImmediateSync);
    };
  }, [activeCountrySlug, loadStoreData, loadCountries, viewMode]);

  useEffect(() => {
    try {
      let iconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      const customLogo = storeConfig.logoImage || storeConfig.logo;
      if (customLogo && (customLogo.startsWith('http') || customLogo.startsWith('/'))) {
        iconLink.href = customLogo;
      } else {
        iconLink.href = '/favicon.svg';
      }
    } catch (e) {}
  }, [storeConfig.logoImage, storeConfig.logo]);

  const handleSwitchCountry = (slug: string) => {
    const clean = slug.toLowerCase();
    setActiveCountrySlug(clean);
    const activeAdminSlug = (storeConfig.customAdminSlug || localStorage.getItem('ecom_custom_admin_slug') || 'admin/dashboard').toLowerCase().replace(/^\/+/, '');

    const url = new URL(window.location.href);
    if (viewMode === 'client') {
      const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      const isFirstSegmentCountry = DEFAULT_STORES.some(s => s.slug === segments[0] || s.code.toLowerCase() === segments[0]) ||
        (segments[0] && segments[0].length >= 2 && segments[0].length <= 4 && !['products', 'product', 'p', 'tickets', 'support', 'profile', 'orders', 'favorites', 'cart', 'checkout', 'category'].includes(segments[0]));

      if (isFirstSegmentCountry) {
        segments[0] = clean;
        url.pathname = `/${segments.join('/')}`;
      } else {
        url.pathname = `/${clean}${segments.length > 0 ? '/' + segments.join('/') : ''}`;
      }
    } else {
      url.pathname = `/${activeAdminSlug}`;
      url.searchParams.set('store', clean);
    }
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const checkParams = () => {
      const fullPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');

      const activeAdminDashSlug = (storeConfig.customAdminSlug || localStorage.getItem('ecom_custom_admin_slug') || 'admin/dashboard').toLowerCase().replace(/^\/+|\/+$/g, '');
      const activeAdminLoginSlug = (storeConfig.customAdminLoginSlug || localStorage.getItem('ecom_custom_admin_login_slug') || 'admin/login').toLowerCase().replace(/^\/+|\/+$/g, '');
      const activeAdminRegisterSlug = (storeConfig.customAdminRegisterSlug || localStorage.getItem('ecom_custom_admin_register_slug') || 'admin/register').toLowerCase().replace(/^\/+|\/+$/g, '');

      const isDashboardRoute =
        fullPath === activeAdminDashSlug || fullPath.startsWith(activeAdminDashSlug + '/') ||
        fullPath === 'admin/dashboard' || fullPath.startsWith('admin/dashboard/') ||
        fullPath === 'dashboard' || fullPath.startsWith('dashboard/');

      const isLoginRoute =
        fullPath === activeAdminLoginSlug || fullPath.startsWith(activeAdminLoginSlug + '/') ||
        fullPath === 'admin/login' || fullPath.startsWith('admin/login/') ||
        fullPath === 'admin' || fullPath === 'login';

      const isRegisterRoute =
        fullPath === activeAdminRegisterSlug || fullPath.startsWith(activeAdminRegisterSlug + '/') ||
        fullPath === 'admin/register' || fullPath.startsWith('admin/register/') ||
        fullPath === 'register';

      if (isDashboardRoute) {
        setViewMode('admin');
        if (!loggedInAdminEmail) {
          const loginSlug = activeAdminLoginSlug || 'admin/login';
          if (fullPath !== loginSlug) {
            const url = new URL(window.location.href);
            url.pathname = `/${loginSlug}`;
            window.history.replaceState({}, '', url.toString());
          }
          setAdminAuthTab('login');
        }
      } else if (isLoginRoute) {
        setViewMode('admin');
        if (loggedInAdminEmail) {
          const dashSlug = activeAdminDashSlug || 'admin/dashboard';
          const url = new URL(window.location.href);
          url.pathname = `/${dashSlug}`;
          window.history.replaceState({}, '', url.toString());
        } else {
          setAdminAuthTab('login');
        }
      } else if (isRegisterRoute) {
        setViewMode('admin');
        if (loggedInAdminEmail) {
          const dashSlug = activeAdminDashSlug || 'admin/dashboard';
          const url = new URL(window.location.href);
          url.pathname = `/${dashSlug}`;
          window.history.replaceState({}, '', url.toString());
        } else {
          setAdminAuthTab('register');
        }
      } else {
        setViewMode('client');
      }

      const currentSlugInUrl = getSlugFromUrl();
      if (currentSlugInUrl && currentSlugInUrl !== activeCountrySlug) {
        setActiveCountrySlug(currentSlugInUrl);
      }
    };

    checkParams();
    window.addEventListener('popstate', checkParams);
    const interval = setInterval(checkParams, 400);
    return () => {
      window.removeEventListener('popstate', checkParams);
      clearInterval(interval);
    };
  }, [activeCountrySlug, storeConfig.customAdminSlug, storeConfig.customAdminLoginSlug, storeConfig.customAdminRegisterSlug, loggedInAdminEmail]);

  const handleSetProducts = (valueOrFn: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts(valueOrFn);
  };

  const handleSetStoreConfig = (valueOrFn: StoreConfig | ((prev: StoreConfig) => StoreConfig)) => {
    setStoreConfig(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      const payload = { ...next, storeId: activeCountrySlug };

      fetch(`/api/store-config?storeId=${activeCountrySlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(e => console.error('POST store config error:', e));

      return next;
    });
  };

  const handleSetOrders = (valueOrFn: Order[] | ((prev: Order[]) => Order[])) => {
    setOrders(valueOrFn);
  };

  const handleSetTickets = (valueOrFn: SupportTicket[] | ((prev: SupportTicket[]) => SupportTicket[])) => {
    setTickets(valueOrFn);
  };

  useEffect(() => {
    const primary = storeConfig.themePrimaryColor || (storeConfig.accentColor === 'emerald' ? '#059669' : storeConfig.accentColor === 'rose' ? '#e11d48' : storeConfig.accentColor === 'amber' ? '#d97706' : storeConfig.accentColor === 'indigo' ? '#4f46e5' : storeConfig.accentColor === 'slate' ? '#0f172a' : '#2563eb');
    document.documentElement.style.setProperty('--brand-primary', primary);
    if (storeConfig.storeBackgroundColor) {
      document.documentElement.style.setProperty('--store-bg', storeConfig.storeBackgroundColor);
      localStorage.setItem('ecom_cached_store_bg_color', storeConfig.storeBackgroundColor);
    }
    if (storeConfig.headerBackgroundColor) {
      document.documentElement.style.setProperty('--header-bg', storeConfig.headerBackgroundColor);
      localStorage.setItem('ecom_cached_header_bg_color', storeConfig.headerBackgroundColor);
    }
    if (storeConfig.themePrimaryColor) {
      localStorage.setItem('ecom_cached_theme_primary_color', storeConfig.themePrimaryColor);
    }
    try {
      localStorage.setItem('ecom_cached_store_config', JSON.stringify(storeConfig));
    } catch (e) {
    }
  }, [storeConfig]);

  useEffect(() => {
    if (viewMode !== 'client') {
      if ((window as any).__lenis) {
        (window as any).__lenis.destroy();
        delete (window as any).__lenis;
      }
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      infinite: false,
    });

    (window as any).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, [viewMode]);

  const activeTheme = COLOR_THEMES[storeConfig.accentColor] || COLOR_THEMES.slate;

  return (
    <div
      className={`font-sans antialiased ${
        viewMode === 'admin'
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#09090b] flex flex-col'
          : 'min-h-screen flex flex-col'
      }`}
      style={{ backgroundColor: viewMode === 'client' ? (storeConfig.storeBackgroundColor || '#faf8f5') : undefined }}
    >
      <AnimatePresence>
        {!initialLoadComplete && viewMode === 'client' && (
          <LoadingScreen
            isReady={!loading}
            storeConfig={storeConfig}
            onComplete={() => setInitialLoadComplete(true)}
          />
        )}
      </AnimatePresence>

      <div
        className={`flex-1 flex flex-col ${
          viewMode === 'admin'
            ? 'bg-[#09090b] min-h-0 overflow-hidden relative'
            : ''
        }`}
        style={{ backgroundColor: viewMode === 'client' ? (storeConfig.storeBackgroundColor || '#faf8f5') : undefined }}
      >
        {viewMode === 'client' ? (
          <OnlineStore
            products={products}
            setProducts={handleSetProducts}
            storeConfig={storeConfig}
            orders={orders}
            setOrders={handleSetOrders}
            tickets={tickets}
            setTickets={handleSetTickets}
            categories={categories}
            coupons={coupons}
            shippingMethods={shippingMethods}
            reviews={reviews}
            setReviews={setReviews}
            theme={activeTheme}
            countries={countries}
            activeCountrySlug={activeCountrySlug}
            onSwitchCountry={handleSwitchCountry}
            onViewAdmin={() => {
              const activeAdminDashSlug = (storeConfig.customAdminSlug || localStorage.getItem('ecom_custom_admin_slug') || 'admin/dashboard').toLowerCase().replace(/^\/+/, '');
              const activeAdminLoginSlug = (storeConfig.customAdminLoginSlug || localStorage.getItem('ecom_custom_admin_login_slug') || 'admin/login').toLowerCase().replace(/^\/+/, '');
              const targetSlug = loggedInAdminEmail ? activeAdminDashSlug : activeAdminLoginSlug;
              const url = new URL(window.location.href);
              url.pathname = `/${targetSlug}`;
              window.history.pushState({}, '', url.toString());
              setViewMode('admin');
              setAdminAuthTab('login');
            }}
          />
        ) : !loggedInAdminEmail ? (
          <AdminAuth
            theme={activeTheme}
            initialTab={adminAuthTab}
            allowRegistration={storeConfig.allowAdminRegistration !== false}
            customLoginSlug={storeConfig.customAdminLoginSlug || 'admin/login'}
            customRegisterSlug={storeConfig.customAdminRegisterSlug || 'admin/register'}
            onTabChange={(tab) => {
              setAdminAuthTab(tab);
              const targetSlug = tab === 'register'
                ? (storeConfig.customAdminRegisterSlug || 'admin/register')
                : (storeConfig.customAdminLoginSlug || 'admin/login');
              const url = new URL(window.location.href);
              url.pathname = `/${targetSlug.replace(/^\/+/, '')}`;
              window.history.pushState({}, '', url.toString());
            }}
            onSuccess={(email) => {
              localStorage.setItem('mavluy_logged_in_admin', email);
              sessionStorage.setItem('mavluy_logged_in_admin', email);
              localStorage.setItem('virtuprod_logged_in_admin', email);
              sessionStorage.setItem('virtuprod_logged_in_admin', email);
              setLoggedInAdminEmail(email);
              const activeAdminSlug = (storeConfig.customAdminSlug || 'admin/dashboard').replace(/^\/+/, '');
              const url = new URL(window.location.href);
              url.pathname = `/${activeAdminSlug}`;
              window.history.pushState({}, '', url.toString());
            }}
            onBackToStore={() => {
              const url = new URL(window.location.href);
              url.pathname = `/${activeCountrySlug}`;
              window.history.pushState({}, '', url.toString());
              setViewMode('client');
            }}
          />
        ) : (
          <AdminPanel
            products={products}
            setProducts={handleSetProducts}
            storeConfig={storeConfig}
            setStoreConfig={handleSetStoreConfig}
            orders={orders}
            setOrders={handleSetOrders}
            tickets={tickets}
            setTickets={handleSetTickets}
            categories={categories}
            setCategories={setCategories}
            coupons={coupons}
            setCoupons={setCoupons}
            shippingMethods={shippingMethods}
            setShippingMethods={setShippingMethods}
            reviews={reviews}
            setReviews={setReviews}
            theme={activeTheme}
            countries={countries}
            setCountries={setCountries}
            activeCountrySlug={activeCountrySlug}
            onSwitchCountry={handleSwitchCountry}
            onReloadCountries={loadCountries}
            onReloadStoreData={() => loadStoreData(activeCountrySlug)}
            loggedInAdminEmail={loggedInAdminEmail}
            onLogout={() => {
              localStorage.removeItem('mavluy_logged_in_admin');
              localStorage.removeItem('mavluy_admin_token');
              sessionStorage.removeItem('mavluy_logged_in_admin');
              localStorage.removeItem('virtuprod_logged_in_admin');
              localStorage.removeItem('virtuprod_admin_token');
              sessionStorage.removeItem('virtuprod_logged_in_admin');
              setLoggedInAdminEmail(null);
            }}
            onViewStore={() => {
              const url = new URL(window.location.href);
              url.pathname = `/${activeCountrySlug}`;
              url.searchParams.delete('admin');
              window.history.pushState({}, '', url.toString());
              setViewMode('client');
            }}
          />
        )}
      </div>
    </div>
  );
}
