// Mavluy Progressive Web App Service Worker
const CACHE_NAME = 'mavluy-pwa-cache-v1';
const LATEST_ORDER_KEY = 'mavluy-latest-seen-order';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  // Initialize the latest order on activation so we don't spam notifications for old orders
  event.waitUntil(initializeLatestOrder());
});

async function initializeLatestOrder() {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const orders = await res.json();
      if (Array.isArray(orders) && orders.length > 0) {
        const latestId = orders[0].id;
        const cache = await caches.open(CACHE_NAME);
        await cache.put(LATEST_ORDER_KEY, new Response(latestId));
      }
    }
  } catch (err) {
    console.error('Failed to initialize latest order in SW:', err);
  }
}

// Background order checker loop
async function checkNewOrders() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) return;
    
    const orders = await res.json();
    if (!Array.isArray(orders) || orders.length === 0) return;

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(LATEST_ORDER_KEY);
    let lastSeenId = '';
    
    if (cachedResponse) {
      lastSeenId = await cachedResponse.text();
    }

    const latestOrder = orders[0];
    
    // If the latest order ID is different from our last seen ID, notify!
    if (latestOrder.id && latestOrder.id !== lastSeenId) {
      // Avoid notifying if we have no stored lastSeenId (first run) to prevent old order spam
      if (lastSeenId) {
        showNotification(latestOrder);
      }
      // Save new latest order ID
      await cache.put(LATEST_ORDER_KEY, new Response(latestOrder.id));
    }
  } catch (err) {
    console.error('Background order check failed:', err);
  }
}

function showNotification(order) {
  const title = 'طلبية جديدة واردة! | New Order';
  const body = `${order.customerName || 'عميل'} • ${order.total} ${order.currency || 'MAD'} (${order.customerCity || ''})`;
  const options = {
    body,
    icon: '/site-icon.png',
    badge: '/site-icon.png',
    tag: order.id,
    data: {
      url: '/admin'
    },
    requireInteraction: true
  };

  self.registration.showNotification(title, options);
}

// Poll every 30 seconds for background updates
setInterval(() => {
  checkNewOrders();
}, 30000);

// Handle notification click to open the admin panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/admin');
      }
    })
  );
});
