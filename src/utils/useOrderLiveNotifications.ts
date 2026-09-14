import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types';

interface UseOrderLiveNotificationsProps {
  isAdminLoggedIn: boolean;
  adminEmail?: string;
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
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('ecom_admin_push_notifications') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('ecom_admin_sound_notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  const lastKnownOrderIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio autoplay restrictions
    }
  }, [soundEnabled]);

  const showPushNotification = useCallback((order: Order) => {
    if (!pushEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const title = lang === 'ar' ? 'طلب جديد وارد! 📦' : lang === 'fr' ? 'Nouvelle commande !' : 'New Order Received!';
      const body = `${order.customerName} - ${order.totalPrice}`;
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {}
  }, [pushEnabled, lang]);

  const handleNewOrder = useCallback((order: Order, isTest = false) => {
    setActiveBannerOrder(order);
    setIsTestBanner(isTest);
    playNotificationSound();
    showPushNotification(order);
    if (onNewOrderReceived && !isTest) {
      onNewOrderReceived(order);
    }
  }, [playNotificationSound, showPushNotification, onNewOrderReceived]);

  const closeBanner = useCallback(() => {
    setActiveBannerOrder(null);
    setIsTestBanner(false);
  }, []);

  const togglePushEnabled = useCallback(async () => {
    if (!pushEnabled && typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('ecom_admin_push_notifications', 'true');
      }
    } else {
      setPushEnabled(false);
      localStorage.setItem('ecom_admin_push_notifications', 'false');
    }
  }, [pushEnabled]);

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ecom_admin_sound_notifications', String(next));
      return next;
    });
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('ecom_admin_push_notifications', 'true');
      }
    }
  }, []);

  const triggerTestNotification = useCallback(() => {
    const testOrder: Order = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: lang === 'ar' ? 'عميل تجريبي' : 'Test Customer',
      customerPhone: '6xxxxxxxx',
      city: lang === 'ar' ? 'الدار البيضاء' : 'Casablanca',
      address: lang === 'ar' ? 'شارع محمد الخامس' : 'Boulevard Mohamed V',
      totalPrice: '299 DH',
      items: [{
        productId: 'test',
        productTitle: lang === 'ar' ? 'منتج تجريبي' : 'Sample Product',
        price: '299 DH',
        quantity: 1
      }],
      date: new Date().toISOString(),
      status: 'pending'
    };
    handleNewOrder(testOrder, true);
  }, [lang, handleNewOrder]);

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
