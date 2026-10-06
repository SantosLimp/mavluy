import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global secure fetch interceptor to automatically attach admin JWT credentials and track mutations
const originalFetch = window.fetch;
let activeMutationsCount = 0;
let heavyTimer: any = null;

function notifyMutationState(delta: number, isHeavyImmediate = false) {
  activeMutationsCount = Math.max(0, activeMutationsCount + delta);
  (window as any).__lastMutationTimestamp = Date.now();
  try {
    if (activeMutationsCount > 0) {
      if (isHeavyImmediate) {
        if (heavyTimer) clearTimeout(heavyTimer);
        window.dispatchEvent(new CustomEvent('mavluy-sync-state', { detail: { syncing: true } }));
      } else if (!heavyTimer) {
        heavyTimer = setTimeout(() => {
          heavyTimer = null;
          if (activeMutationsCount > 0) {
            window.dispatchEvent(new CustomEvent('mavluy-sync-state', { detail: { syncing: true } }));
          }
        }, 220);
      }
    } else {
      if (heavyTimer) {
        clearTimeout(heavyTimer);
        heavyTimer = null;
      }
      window.dispatchEvent(new CustomEvent('mavluy-sync-state', { detail: { syncing: false } }));
    }
  } catch {}
}

const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  const method = (init?.method || 'GET').toUpperCase();
  const isSilentBackground = url.includes('/api/pixel/event') || url.includes('/api/customers/sync-favorites');
  const isMutation = (url.startsWith('/api/') || url.includes('/api/')) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !isSilentBackground;
  const isUpload = url.includes('/api/upload');

  if (url.startsWith('/api/') || url.includes('/api/')) {
    const adminToken = localStorage.getItem('mavluy_admin_token') || localStorage.getItem('virtuprod_admin_token') || 'local-token-999';
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }
    if (method === 'GET') {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      init.cache = 'no-store';
    }
    init.headers = headers;
  }

  if (isMutation) {
    notifyMutationState(1, isUpload);
  }
  try {
    return await originalFetch.call(this || window, input, init);
  } finally {
    if (isMutation) {
      notifyMutationState(-1);
    }
  }
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.warn("Global fetch interception is disabled because window.fetch is read-only on this host.", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
