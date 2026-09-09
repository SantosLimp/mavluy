import { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../types';
import { playOrderChime } from './audioAlerts';

interface UseOrderLiveNotificationsProps {
  isAdminLoggedIn: boolean;
  adminEmail?: string | null;
  onNewOrderReceived?: (order: Order) => void;
  lang?: 'ar' | 'en' | 'fr';
}

export function useOrderLiveNotifications({
  isAdminLoggedIn,
  adminEmail,
  onNewOrderReceived,
  lang = 'ar'
}: UseOrderLiveNotificationsProps) {
  const [activeBannerOrder, setActiveBannerOrder] = useState<Order | null>(null);
  const [isTestBanner, setIsTestBanner] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('ecom_admin_push_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('ecom_admin_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert(lang === 'ar' ? 'متصفحك لا يدعم الإشعارات الفورية' : 'Your browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('ecom_admin_push_enabled', 'true');
        return true;
      } else {
        setPushEnabled(false);
        localStorage.setItem('ecom_admin_push_enabled', 'false');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [lang]);

  const triggerNativeNotification = useCallback((order: Order) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted' || !pushEnabled) return;

    try {
      const title = lang === 'ar'
        ? `🛒 طلبية جديدة وصلت! (${order.total} ${order.currency || 'MAD'})`
        : `🛒 New Order Placed! (${order.total} ${order.currency || 'MAD'})`;

      const body = lang === 'ar'
        ? `الزبون: ${order.customerName} - المدينة: ${order.customerCity}\nالهاتف: ${order.customerPhone}`
        : `Customer: ${order.customerName} - ${order.customerCity}\nPhone: ${order.customerPhone}`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `order-${order.id}`,
        requireInteraction: false,
        silent: !soundEnabled
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Could not dispatch OS push notification:', err);
    }
  }, [pushEnabled, soundEnabled, lang]);

  const handleIncomingOrder = useCallback((order: Order, isTest = false) => {
    if (!order || !order.id) return;

    if (!isTest && knownOrderIdsRef.current.has(order.id)) {
      return;
    }
    knownOrderIdsRef.current.add(order.id);

    if (soundEnabled) {
      playOrderChime(0.85);
    }

    triggerNativeNotification(order);

    setIsTestBanner(isTest);
    setActiveBannerOrder(order);

    if (onNewOrderReceived) {
      onNewOrderReceived(order);
    }
  }, [soundEnabled, triggerNativeNotification, onNewOrderReceived]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        const query = adminEmail ? `?adminEmail=${encodeURIComponent(adminEmail)}` : '';
        eventSource = new EventSource(`/api/admin/orders/live-stream${query}`);

        eventSource.onopen = () => {
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_ORDER' && data.order) {
              handleIncomingOrder(data.order, !!data.isTest);
            }
          } catch (e) {
            console.warn('Error parsing SSE message:', e);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn('Could not initiate SSE live stream:', err);
        reconnectTimeout = setTimeout(connectSSE, 6000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAdminLoggedIn, adminEmail, handleIncomingOrder]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const checkRecentOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) return;
        const orders: Order[] = await res.json();

        if (Array.isArray(orders)) {
          if (isInitialLoadRef.current) {
            orders.forEach(o => knownOrderIdsRef.current.add(o.id));
            isInitialLoadRef.current = false;
            return;
          }

          orders.forEach(order => {
            if (!knownOrderIdsRef.current.has(order.id)) {
              handleIncomingOrder(order, false);
            }
          });
        }
      } catch (err) {
      }
    };

    const interval = setInterval(checkRecentOrders, 12000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn, handleIncomingOrder]);

  const triggerTestNotification = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders/test-notification', { method: 'POST' });
      const data = await res.json();
      if (data && data.order) {
        handleIncomingOrder(data.order, true);
      }
    } catch (e) {
      const testOrder: Order = {
        id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'محمد العلوي (Test Customer)',
        customerPhone: '+212 612-345678',
        customerCity: 'الدار البيضاء / Casablanca',
        customerAddress: 'شارع الزرقطوني',
        items: [
          {
            productId: 'test-1',
            productName: 'منتج تجريبي فاخر / Luxury Item',
            price: 299,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
          }
        ],
        subtotal: 299,
        shippingFee: 35,
        total: 334,
        currency: 'MAD',
        status: 'pending',
        date: new Date().toISOString()
      };
      handleIncomingOrder(testOrder, true);
    }
  }, [handleIncomingOrder]);

  const togglePushEnabled = useCallback(() => {
    if (!pushEnabled && pushPermission !== 'granted') {
      requestPushPermission();
    } else {
      setPushEnabled(prev => {
        const next = !prev;
        localStorage.setItem('ecom_admin_push_enabled', next ? 'true' : 'false');
        return next;
      });
    }
  }, [pushEnabled, pushPermission, requestPushPermission]);

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ecom_admin_sound_enabled', next ? 'true' : 'false');
      if (next) {
        playOrderChime(0.7);
      }
      return next;
    });
  }, []);

  return {
    activeBannerOrder,
    isTestBanner,
    closeBanner: () => setActiveBannerOrder(null),
    pushEnabled,
    soundEnabled,
    pushPermission,
    togglePushEnabled,
    toggleSoundEnabled,
    requestPushPermission,
    triggerTestNotification
  };
}
