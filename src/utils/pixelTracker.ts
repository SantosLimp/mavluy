import { PixelEventType, PixelEventRecord, StoreConfig } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    _ttq?: any;
  }
}

let activeMetaPixelId: string | null = null;
let activeTikTokPixelId: string | null = null;

export function initPixels(config?: StoreConfig | null) {
  if (!config) return;
  const { metaPixelId, tiktokPixelId, pixelTrackingEnabled = true } = config;

  if (pixelTrackingEnabled === false) {
    return;
  }

  if (metaPixelId && metaPixelId.trim() && metaPixelId !== activeMetaPixelId) {
    activeMetaPixelId = metaPixelId.trim();
    try {
      if (!window.fbq) {
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }
      if (window.fbq) {
        window.fbq('init', activeMetaPixelId);
        window.fbq('track', 'PageView');
      }
    } catch (e) {
      console.warn('Notice: Meta Pixel script initialization skipped:', e);
    }
  }

  if (tiktokPixelId && tiktokPixelId.trim() && tiktokPixelId !== activeTikTokPixelId) {
    activeTikTokPixelId = tiktokPixelId.trim();
    try {
      if (!window.ttq) {
        (function (w: any, d: any, t: any) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page',
            'track',
            'identify',
            'instances',
            'debug',
            'on',
            'off',
            'once',
            'ready',
            'alias',
            'group',
            'enableCookie',
            'disableCookie'
          ];
          ttq.setAndDefer = function (t: any, e: any) {
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function (t: any) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
              ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function (e: any, n: any) {
            var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            (ttq._i = ttq._i || {}),
              (ttq._i[e] = []),
              (ttq._i[e]._u = i),
              (ttq._t = ttq._t || {}),
              (ttq._t[e] = +new Date()),
              (ttq._o = ttq._o || {}),
              (ttq._o[e] = n || {});
            var o = document.createElement('script');
            (o.type = 'text/javascript'), (o.async = !0), (o.src = i + '?sdkid=' + e + '&lib=' + t);
            var a = document.getElementsByTagName('script')[0];
            a.parentNode.insertBefore(o, a);
          };
        })(window, document, 'ttq');
      }
      if (window.ttq && window.ttq.load) {
        window.ttq.load(activeTikTokPixelId);
        window.ttq.page();
      }
    } catch (e) {
      console.warn('Notice: TikTok Pixel script initialization skipped:', e);
    }
  }
}

export async function sendPixelEvent(
  eventType: PixelEventType,
  payload: {
    storeId?: string;
    pageUrl?: string;
    productId?: string;
    productName?: string;
    value?: number;
    currency?: string;
    orderId?: string;
    customerPhone?: string;
    customerName?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    if (window.fbq) {
      if (eventType === 'PageView') {
        window.fbq('track', 'PageView');
      } else if (eventType === 'ViewContent') {
        window.fbq('track', 'ViewContent', {
          content_ids: payload.productId ? [payload.productId] : undefined,
          content_name: payload.productName,
          value: payload.value,
          currency: payload.currency || 'MAD',
          content_type: 'product'
        });
      } else if (eventType === 'AddToCart') {
        window.fbq('track', 'AddToCart', {
          content_ids: payload.productId ? [payload.productId] : undefined,
          content_name: payload.productName,
          value: payload.value,
          currency: payload.currency || 'MAD',
          content_type: 'product'
        });
      } else if (eventType === 'InitiateCheckout') {
        window.fbq('track', 'InitiateCheckout', {
          value: payload.value,
          currency: payload.currency || 'MAD',
          num_items: payload.metadata?.itemsCount || 1
        });
      } else if (eventType === 'Purchase') {
        window.fbq('track', 'Purchase', {
          content_ids: payload.productId ? [payload.productId] : undefined,
          content_name: payload.productName,
          value: payload.value,
          currency: payload.currency || 'MAD',
          num_items: payload.metadata?.itemsCount || 1
        });
      } else if (eventType === 'Lead') {
        window.fbq('track', 'Lead', {
          content_name: payload.productName || 'Lead / Inquiry',
          value: payload.value || 0,
          currency: payload.currency || 'MAD'
        });
      }
    }
  } catch (err) {
  }

  try {
    if (window.ttq) {
      if (eventType === 'PageView') {
        window.ttq.page();
      } else if (eventType === 'ViewContent') {
        window.ttq.track('ViewContent', {
          contents: payload.productId ? [{ content_id: payload.productId, content_name: payload.productName, price: payload.value }] : undefined,
          value: payload.value,
          currency: payload.currency || 'MAD'
        });
      } else if (eventType === 'AddToCart') {
        window.ttq.track('AddToCart', {
          contents: payload.productId ? [{ content_id: payload.productId, content_name: payload.productName, price: payload.value }] : undefined,
          value: payload.value,
          currency: payload.currency || 'MAD'
        });
      } else if (eventType === 'InitiateCheckout') {
        window.ttq.track('InitiateCheckout', {
          value: payload.value,
          currency: payload.currency || 'MAD'
        });
      } else if (eventType === 'Purchase') {
        window.ttq.track('CompletePayment', {
          contents: payload.productId ? [{ content_id: payload.productId, content_name: payload.productName, price: payload.value }] : undefined,
          value: payload.value,
          currency: payload.currency || 'MAD'
        });
      } else if (eventType === 'Lead') {
        window.ttq.track('Contact', {
          value: payload.value || 0,
          currency: payload.currency || 'MAD'
        });
      }
    }
  } catch (err) {
  }

  try {
    fetch('/api/pixel/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        storeId: payload.storeId || 'ma',
        pageUrl: payload.pageUrl || window.location.href,
        productId: payload.productId,
        productName: payload.productName,
        value: payload.value,
        currency: payload.currency || 'MAD',
        orderId: payload.orderId,
        customerPhone: payload.customerPhone,
        customerName: payload.customerName,
        metadata: payload.metadata
      })
    }).catch(() => {});
  } catch (e) {
  }
}

export const Pixel = {
  init: initPixels,
  pageView: (storeId?: string, pageUrl?: string) =>
    sendPixelEvent('PageView', { storeId, pageUrl }),

  viewContent: (product: { id: string; name: string; price: number; category?: string }, storeId?: string) =>
    sendPixelEvent('ViewContent', {
      storeId,
      productId: product.id,
      productName: product.name,
      value: product.price,
      metadata: { category: product.category }
    }),

  addToCart: (product: { id: string; name: string; price: number; quantity?: number }, storeId?: string) =>
    sendPixelEvent('AddToCart', {
      storeId,
      productId: product.id,
      productName: product.name,
      value: product.price * (product.quantity || 1),
      metadata: { quantity: product.quantity || 1 }
    }),

  initiateCheckout: (items: Array<{ id: string; name: string; price: number; quantity: number }>, total: number, storeId?: string) =>
    sendPixelEvent('InitiateCheckout', {
      storeId,
      value: total,
      metadata: {
        itemsCount: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        products: items.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))
      }
    }),

  purchase: (order: { id: string; total: number; currency?: string; items?: any[]; customerName?: string; customerPhone?: string }, storeId?: string) =>
    sendPixelEvent('Purchase', {
      storeId,
      orderId: order.id,
      value: order.total,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productId: order.items && order.items.length > 0 ? order.items[0].productId : undefined,
      productName: order.items && order.items.length > 0 ? order.items[0].productName : undefined,
      metadata: { itemsCount: order.items?.length || 1 }
    }),

  lead: (lead: { name: string; phone: string; subject?: string; type?: string; value?: number }, storeId?: string) =>
    sendPixelEvent('Lead', {
      storeId,
      customerName: lead.name,
      customerPhone: lead.phone,
      value: lead.value || 0,
      metadata: { subject: lead.subject, type: lead.type }
    })
};
