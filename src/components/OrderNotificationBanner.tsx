import React, { useEffect, useState } from 'react';
import { ShoppingBag, X, ArrowRight, ArrowLeft, Bell, MapPin, Phone, User, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';

interface OrderNotificationBannerProps {
  order: Order | null;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
  lang?: 'ar' | 'en' | 'fr';
  isTest?: boolean;
}

export const OrderNotificationBanner: React.FC<OrderNotificationBannerProps> = ({
  order,
  onClose,
  onViewOrder,
  lang = 'ar',
  isTest = false
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!order) return;
    setProgress(100);

    const startTime = Date.now();
    const duration = 9000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [order, onClose]);

  if (!order) return null;

  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      className={`fixed top-3 inset-x-2.5 sm:inset-x-auto sm:top-6 sm:w-96 ${isRtl ? 'sm:left-6 sm:right-auto' : 'sm:right-6 sm:left-auto'} z-[9999] max-w-full sm:max-w-md w-auto animate-fadeIn transition-all`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="relative bg-[#18181b] border border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-950/60 overflow-hidden text-stone-100 p-3.5 sm:p-5">

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#18181b] animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#18181b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-stone-100 flex items-center gap-1.5">
                  {lang === 'ar' ? 'طلب جديد وصل الآن!' : lang === 'fr' ? 'Nouvelle Commande Reçue !' : 'New Order Arrived!'}
                </h4>
                {isTest && (
                  <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                    {lang === 'ar' ? 'تجريبي' : 'TEST'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-mono">
                #{order.id} • {new Date(order.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#111114] border border-stone-800 rounded-xl p-3 space-y-1.5 mb-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <strong className="text-stone-200">{order.customerName}</strong>
            </span>
            <span className="text-emerald-400 font-black font-mono text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              {order.total} {order.currency || 'MAD'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5 border-t border-stone-800/60">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{order.customerCity}</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-stone-300">
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{order.customerPhone}</span>
            </span>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="text-[11px] text-stone-400 truncate pt-1 border-t border-stone-800/60">
              <span className="text-stone-500 font-medium">{lang === 'ar' ? 'المنتجات:' : 'Items:'} </span>
              <span className="text-stone-300 font-medium">
                {order.items.map(i => `${i.productName} (${i.quantity}x)`).join(' • ')}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onViewOrder(order.id);
            onClose();
          }}
          className="w-full bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          <span>{lang === 'ar' ? 'معاينة الطلب والتفاصيل' : lang === 'fr' ? 'Voir la commande' : 'View Order Details'}</span>
          <ArrowIcon className="w-3.5 h-3.5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-800 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
