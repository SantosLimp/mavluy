import { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../types';
import { playOrderChime } from './audioAlerts';

interface UseOrderLiveNotificationsOptions {
  isAdminLoggedIn?: boolean;
  adminEmail?: string;
  onNewOrderReceived?: (order: Order) => void;
  lang?: 'ar' | 'en' | 'fr' | string;
}

export function useOrderLiveNotifications({
  isAdminLoggedIn = true,
  adminEmail,
  onNewOrderReceived,
  lang = 'ar'
}: UseOrderLiveNotificationsOptions = {}) {
  const [activeBannerOrder, setActiveBannerOrder] = useState<Order | null>(null);
  const [isTestBanner, setIsTestBanner] = useState<boolean>(false);

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mavluy_push_enabled') === 'true';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('mavluy_sound_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const onNewOrderReceivedRef = useRef(onNewOrderReceived);
  useEffect(() => {
    onNewOrderReceivedRef.current = onNewOrderReceived;
  }, [onNewOrderReceived]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const pushEnabledRef = useRef(pushEnabled);
  useEffect(() => {
    pushEnabledRef.current = pushEnabled;
  }, [pushEnabled]);

  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const handleIncomingOrder = useCallback((order: Order, isTest = false) => {
    setActiveBannerOrder(order);
    setIsTestBanner(isTest);

    if (soundEnabledRef.current) {
      playOrderChime();
    }

    if (
      pushEnabledRef.current &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const title = isTest
          ? (langRef.current === 'ar' ? 'طلب تجريبي جديد' : 'Test Order Received')
          : (langRef.current === 'ar' ? 'طلب جديد وصل الآن!' : 'New Order Received!');
        const body = `${order.customerName || 'عميل'} • ${order.total} ${order.currency || 'MAD'} (${order.customerCity || ''})`;
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Could not show system notification:', err);
      }
    }

    if (onNewOrderReceivedRef.current) {
      onNewOrderReceivedRef.current(order);
    }
  }, []);

  const closeBanner = useCallback(() => {
    setActiveBannerOrder(null);
    setIsTestBanner(false);
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('mavluy_push_enabled', 'true');
      } else {
        setPushEnabled(false);
        localStorage.setItem('mavluy_push_enabled', 'false');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }, []);

  const togglePushEnabled = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      await requestPushPermission();
      return;
    }
    setPushEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mavluy_push_enabled', String(next));
      return next;
    });
  }, [requestPushPermission]);

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mavluy_sound_enabled', String(next));
      return next;
    });
  }, []);

  const triggerTestNotification = useCallback(async () => {
    const mockOrder: Order = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: 'ma',
      customerName: langRef.current === 'ar' ? 'عميل تجريبي' : 'Test Customer',
      customerPhone: '+212 600-000000',
      customerCity: langRef.current === 'ar' ? 'الدار البيضاء' : 'Casablanca',
      customerAddress: langRef.current === 'ar' ? 'شارع أنفا' : 'Boulevard d Anfa',
      items: [
        {
          productId: 'p-1',
          productName: langRef.current === 'ar' ? 'منتج تجريبي ممتاز' : 'Premium Sample Product',
          price: 299,
          quantity: 1
        }
      ],
      subtotal: 299,
      shippingFee: 0,
      total: 299,
      currency: 'MAD',
      status: 'pending',
      date: new Date().toISOString()
    };

    handleIncomingOrder(mockOrder, true);

    try {
      fetch('/api/admin/orders/test-notification', { method: 'POST' }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }, [handleIncomingOrder]);

  // Connect to SSE stream
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        const url = `/api/admin/orders/live-stream?adminEmail=${encodeURIComponent(adminEmail || 'admin')}`;
        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_ORDER' && data.order) {
              handleIncomingOrder(data.order, !!data.isTest);
            }
          } catch (e) {
            // non-JSON heartbeat or message
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [isAdminLoggedIn, adminEmail, handleIncomingOrder]);

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
