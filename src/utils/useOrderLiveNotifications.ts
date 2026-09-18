import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types';
import { playOrderChime } from './audioAlerts';

interface UseOrderLiveNotificationsProps {
  isAdminLoggedIn?: boolean;
  adminEmail?: string;
  onNewOrderReceived?: (order: Order) => void;
  lang?: 'ar' | 'en';
}

export function useOrderLiveNotifications({
  isAdminLoggedIn = true,
  onNewOrderReceived,
  lang = 'ar'
}: UseOrderLiveNotificationsProps = {}) {
  const [activeBannerOrder, setActiveBannerOrder] = useState<Order | null>(null);
  const [isTestBanner, setIsTestBanner] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mavluy_push_enabled') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('mavluy_sound_enabled') !== 'false';
  });
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'default'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);

  const closeBanner = useCallback(() => {
    setActiveBannerOrder(null);
    setIsTestBanner(false);
  }, []);

  const togglePushEnabled = useCallback(() => {
    setPushEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mavluy_push_enabled', String(next));
      return next;
    });
  }, []);

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mavluy_sound_enabled', String(next));
      return next;
    });
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('mavluy_push_enabled', 'true');
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  }, []);

  const triggerTestNotification = useCallback(() => {
    const testOrder: Order = {
      id: `test-${Date.now()}`,
      customerName: lang === 'ar' ? 'محمد بن علي (طلب تجريبي)' : 'John Doe (Test Order)',
      customerPhone: '+212612345678',
      city: lang === 'ar' ? 'الدار البيضاء' : 'Casablanca',
      address: lang === 'ar' ? 'شارع محمد الخامس' : 'Mohammed V Blvd',
      items: [
        {
          productId: 'test-prod-1',
          productName: lang === 'ar' ? 'منتج تجريبي فاخر' : 'Premium Test Product',
          quantity: 1,
          price: 299
        }
      ],
      totalPrice: 299,
      status: 'pending',
      createdAt: new Date().toISOString(),
      countryCode: 'MA'
    };

    setIsTestBanner(true);
    setActiveBannerOrder(testOrder);

    if (soundEnabled) {
      playOrderChime(0.8);
    }

    if (pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(lang === 'ar' ? '🔔 طلب تجريبي جديد!' : '🔔 New Test Order!', {
          body: `${testOrder.customerName} - ${testOrder.totalPrice} DH`,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }
  }, [lang, soundEnabled, pushEnabled]);

  // Polling for live orders
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    let isMounted = true;

    const checkOrders = async () => {
      try {
        const token = localStorage.getItem('mavluy_admin_token') || localStorage.getItem('virtuprod_admin_token') || '';
        const res = await fetch('/api/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!res.ok) return;
        const data = await res.json();
        const ordersList: Order[] = Array.isArray(data) ? data : (data.orders || []);

        if (isInitialFetchRef.current) {
          ordersList.forEach(o => knownOrderIdsRef.current.add(o.id));
          isInitialFetchRef.current = false;
          return;
        }

        // Find genuinely new orders
        const newOrders = ordersList.filter(o => !knownOrderIdsRef.current.has(o.id));
        if (newOrders.length > 0 && isMounted) {
          newOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
          const newest = newOrders[0];

          setActiveBannerOrder(newest);
          setIsTestBanner(false);

          if (soundEnabled) {
            playOrderChime(0.9);
          }

          if (pushEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const prodTitle = newest.items?.[0]?.productName || newest.items?.[0]?.productTitle || (lang === 'ar' ? 'طلب جديد' : 'New Order');
              new Notification(lang === 'ar' ? '📦 طلب شراء جديد!' : '📦 New Customer Order!', {
                body: `${newest.customerName} - ${prodTitle} (${newest.totalPrice || newest.total || 0} DH)`,
                icon: '/favicon.ico'
              });
            } catch (e) {}
          }

          if (onNewOrderReceived) {
            onNewOrderReceived(newest);
          }
        }
      } catch (err) {
        // Silent catch for background poll
      }
    };

    checkOrders();
    const interval = setInterval(checkOrders, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdminLoggedIn, soundEnabled, pushEnabled, lang, onNewOrderReceived]);

  return {
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
  };
}
