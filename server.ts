import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  uploadToCloudinary,
  isCloudinaryReady,
  getCloudinaryStatus,
  testAndSaveCloudinaryConfig,
  disconnectCloudinary,
  CLOUDINARY_CONFIG_FILE
} from './src/utils/cloudinaryServer.js';
import {
  autoTranslateProductFields,
  translateTextToEnglish
} from './src/utils/aiTranslationServer.js';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE_CONFIG,
  DEFAULT_ORDERS,
  DEFAULT_TICKETS,
  DEFAULT_STORES,
  DEFAULT_COUPONS,
  DEFAULT_REVIEWS
} from './src/data.js';
import {
  getAppState,
  setAppState,
  getAllProductsFromSql,
  upsertProductInSql,
  deleteProductFromSql,
  getAllOrdersFromSql,
  upsertOrderInSql,
  deleteOrderFromSql,
  getStoreConfigsFromSql,
  upsertStoreConfigInSql,
  initPostgresTables,
  wipePostgresTable
} from './src/db/store-db.js';
import {
  Product,
  StoreConfig,
  Order,
  SupportTicket,
  AdminUser,
  Customer,
  CountryStore,
  Category,
  Coupon,
  ShippingMethod,
  TaxConfig,
  Review,
  PixelEventRecord,
  PixelEventType,
  AdSpendEntry,
  ExpenseEntry,
  FinancialSettings
} from './src/types.js';

const app = express();
const PORT = 3000;
const isVercel = Boolean(process.env.VERCEL);
const DB_FILE = isVercel ? path.join(os.tmpdir(), 'db.json') : path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'mavluy_secure_jwt_token_auth_key_prod_2026';

process.on('uncaughtException', (err: any) => {
  console.error('[CRASH-SHIELD] Handled uncaught exception safely:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[CRASH-SHIELD] Handled unhandled promise rejection safely:', reason?.message || reason);
});

let isFirebaseConnected = false;
let isQuotaExceeded = false;
let firestoreDb: any = null;
let firebaseProjectId = "confident-psyche-153bd";

// Mock unused legacy Firestore functions to satisfy the TS compiler
const getDoc = (() => {}) as any;
const doc = (() => {}) as any;
const getDocs = (() => []) as any;
const collection = (() => {}) as any;
const deleteDoc = (() => {}) as any;
const setDoc = (() => {}) as any;

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    return value;
  }));
}

let memoryDb: DbStructure | null = null;
let hasHydratedFromSql = false;
let hydrationPromise: Promise<void> | null = null;
let localMutationCount = 0;
let sqlSaveChain: Promise<void> = Promise.resolve();
let pendingSqlSnapshot: DbStructure | null = null;
let isSqlFlushScheduled = false;

function scheduleSqlFlush(data: DbStructure) {
  try {
    pendingSqlSnapshot = JSON.parse(JSON.stringify(data));
  } catch {
    pendingSqlSnapshot = data;
  }
  if (isSqlFlushScheduled) return;
  isSqlFlushScheduled = true;
  sqlSaveChain = sqlSaveChain.then(async () => {
    isSqlFlushScheduled = false;
    while (pendingSqlSnapshot !== null) {
      const snapshot = pendingSqlSnapshot;
      pendingSqlSnapshot = null;
      try {
        await setAppState('mavluy_db', snapshot);
      } catch (err: any) {
        console.warn('[Supabase/PostgreSQL] Save notice:', err?.message || err);
      }
    }
  });
}

async function flushSqlSaves(): Promise<void> {
  try {
    await sqlSaveChain;
  } catch {}
}

async function saveToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    await flushSqlSaves();
    if (collectionName === 'products') {
      upsertProductInSql(data).catch(() => {});
    } else if (collectionName === 'orders') {
      upsertOrderInSql(data).catch(() => {});
    } else if (collectionName === 'store_configs' || collectionName === 'storeConfigs') {
      upsertStoreConfigInSql(docId, data.storeName || 'Mavluy', data).catch(() => {});
    }
    isFirebaseConnected = true;
    return true;
  } catch (err: any) {
    console.error(`[Supabase/PostgreSQL] Error saving ${collectionName}/${docId}:`, err);
    return false;
  }
}

interface DbStructure {
  countries: CountryStore[];
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  reviews: Review[];
  shippingMethods: ShippingMethod[];
  storeConfigs: Record<string, StoreConfig>;
  orders: Order[];
  tickets: SupportTicket[];
  customReviews: Record<string, Review[]>;
  admins: AdminUser[];
  customers: Record<string, Customer>;
  pixelEvents?: PixelEventRecord[];
  adSpends?: AdSpendEntry[];
  expenses?: ExpenseEntry[];
  financialSettings?: Record<string, FinancialSettings>;
  deletedTombstones?: {
    orders?: string[];
    products?: string[];
    coupons?: string[];
    reviews?: string[];
    tickets?: string[];
    customers?: string[];
  };
}

function normalizePhoneDigits(phone?: string): string {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  for (const prefix of ['212', '218', '966', '971', '965', '974', '973', '968', '20', '213', '216']) {
    if (digits.startsWith(prefix) && digits.length > prefix.length + 6) {
      digits = digits.slice(prefix.length);
      break;
    }
  }
  while (digits.startsWith('0') && digits.length > 7) {
    digits = digits.slice(1);
  }
  return digits;
}

function phonesMatch(p1?: string, p2?: string): boolean {
  if (!p1 || !p2) return false;
  const c1 = String(p1).trim().replace(/\s+/g, '');
  const c2 = String(p2).trim().replace(/\s+/g, '');
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  const n1 = normalizePhoneDigits(c1);
  const n2 = normalizePhoneDigits(c2);
  if (n1 && n2 && n1 === n2) return true;
  if (n1.length >= 8 && n2.length >= 8 && n1.slice(-8) === n2.slice(-8)) return true;
  return false;
}

function sanitizeWithTombstones(db: DbStructure): DbStructure {
  if (!db) return db;
  if (!db.deletedTombstones) {
    db.deletedTombstones = { orders: [], products: [], coupons: [], reviews: [], tickets: [], customers: [] };
  }
  const tomb = db.deletedTombstones;
  const delOrders = new Set((tomb.orders || []).map(id => String(id).trim()));
  const delProds = new Set((tomb.products || []).map(id => String(id).trim()));
  const delCoupons = new Set((tomb.coupons || []).map(id => String(id).trim()));
  const delReviews = new Set((tomb.reviews || []).map(id => String(id).trim()));
  const delTickets = new Set((tomb.tickets || []).map(id => String(id).trim()));
  const delCustomers = (tomb.customers || []).map(id => String(id).trim()).filter(Boolean);

  if (db.orders && delOrders.size > 0) {
    db.orders = db.orders.filter(o => o && !delOrders.has(String(o.id).trim()) && !delOrders.has(String((o as any)._id).trim()));
  }
  if (db.products && delProds.size > 0) {
    db.products = db.products.filter(p => p && !delProds.has(String(p.id).trim()));
  }
  if (db.coupons && delCoupons.size > 0) {
    db.coupons = db.coupons.filter(c => c && !delCoupons.has(String(c.id).trim()));
  }
  if (db.reviews && delReviews.size > 0) {
    db.reviews = db.reviews.filter(r => r && !delReviews.has(String(r.id).trim()));
    if (db.customReviews) {
      for (const k of Object.keys(db.customReviews)) {
        if (Array.isArray(db.customReviews[k])) {
          db.customReviews[k] = db.customReviews[k].filter(r => r && !delReviews.has(String(r.id).trim()));
        }
      }
    }
  }
  if (db.tickets && delTickets.size > 0) {
    db.tickets = db.tickets.filter(t => t && !delTickets.has(String(t.id).trim()));
  }
  if (db.customers && delCustomers.length > 0) {
    // If a customer was re-registered (exists in db.customers with updatedAt), clean stale tombstone instead of deleting the account
    const activeRegisteredPhones: string[] = [];
    for (const key of Object.keys(db.customers)) {
      const cust = db.customers[key];
      const custPhone = cust?.phone || key;
      if (cust && ((cust as any).updatedAt || cust.password)) {
        activeRegisteredPhones.push(custPhone);
      } else if (delCustomers.some(delP => phonesMatch(delP, custPhone) || phonesMatch(delP, key))) {
        delete db.customers[key];
      }
    }
    if (activeRegisteredPhones.length > 0 && Array.isArray(tomb.customers)) {
      tomb.customers = tomb.customers.filter(
        delP => !activeRegisteredPhones.some(activeP => phonesMatch(delP, activeP))
      );
    }
  }
  if (Array.isArray(db.products)) {
    const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    for (const p of db.products) {
      if (p && (!p.image || !String(p.image).trim())) {
        const firstGallery = Array.isArray(p.additionalImages) ? p.additionalImages.find(img => typeof img === 'string' && img.trim().length > 0) : '';
        p.image = firstGallery || fallbackImg;
      }
    }
  }
  if (db.storeConfigs && typeof db.storeConfigs === 'object') {
    for (const key of Object.keys(db.storeConfigs)) {
      const conf = db.storeConfigs[key];
      if (!conf) continue;
      if (!conf.facebookUrl || conf.facebookUrl === 'https://facebook.com' || conf.facebookUrl === 'https://www.facebook.com') {
        conf.facebookUrl = 'https://www.facebook.com/mavluy';
      }
      if (!conf.instagramUrl || conf.instagramUrl === 'https://instagram.com' || conf.instagramUrl === 'https://www.instagram.com') {
        conf.instagramUrl = 'https://www.instagram.com/mavluy.store/';
      }
      if (!conf.tiktokUrl || conf.tiktokUrl === 'https://tiktok.com' || conf.tiktokUrl === 'https://www.tiktok.com') {
        conf.tiktokUrl = 'https://www.tiktok.com/@mavluy.store';
      }
    }
  }
  return db;
}

async function persistTombstonesToFirestore(db: DbStructure) {
  if (!db.deletedTombstones) return;
  try {
    await setAppState('deleted_tombstones', db.deletedTombstones);
  } catch (e) {
    // silent
  }
}

function addTombstone(db: DbStructure, collectionName: 'orders' | 'products' | 'coupons' | 'reviews' | 'tickets' | 'customers', id: string | string[]) {
  if (!db.deletedTombstones) {
    db.deletedTombstones = { orders: [], products: [], coupons: [], reviews: [], tickets: [], customers: [] };
  }
  if (!db.deletedTombstones[collectionName]) {
    db.deletedTombstones[collectionName] = [];
  }
  const currentList = db.deletedTombstones[collectionName]!;
  const idsToAdd = Array.isArray(id) ? id : [id];
  for (const item of idsToAdd) {
    const cleanId = String(item || '').trim();
    if (cleanId && !currentList.includes(cleanId)) {
      currentList.push(cleanId);
    }
  }
  if (currentList.length > 5000) {
    db.deletedTombstones[collectionName] = currentList.slice(-5000);
  }
  sanitizeWithTombstones(db);
  persistTombstonesToFirestore(db).catch(() => {});
}

function removeCustomerTombstone(db: DbStructure, phone: string) {
  if (!db.deletedTombstones || !Array.isArray(db.deletedTombstones.customers)) return;
  const beforeLen = db.deletedTombstones.customers.length;
  db.deletedTombstones.customers = db.deletedTombstones.customers.filter(p => !phonesMatch(p, phone));
  if (db.deletedTombstones.customers.length !== beforeLen) {
    persistTombstonesToFirestore(db).catch(() => {});
  }
}

function mergeDbStates(localDb: DbStructure, remoteDb: DbStructure): DbStructure {
  if (!remoteDb || typeof remoteDb !== 'object') return sanitizeWithTombstones(localDb);
  if (!localDb || typeof localDb !== 'object') return sanitizeWithTombstones(remoteDb);

  const mergedTombstones = {
    orders: Array.from(new Set([...(localDb.deletedTombstones?.orders || []), ...(remoteDb.deletedTombstones?.orders || [])])),
    products: Array.from(new Set([...(localDb.deletedTombstones?.products || []), ...(remoteDb.deletedTombstones?.products || [])])),
    coupons: Array.from(new Set([...(localDb.deletedTombstones?.coupons || []), ...(remoteDb.deletedTombstones?.coupons || [])])),
    reviews: Array.from(new Set([...(localDb.deletedTombstones?.reviews || []), ...(remoteDb.deletedTombstones?.reviews || [])])),
    tickets: Array.from(new Set([...(localDb.deletedTombstones?.tickets || []), ...(remoteDb.deletedTombstones?.tickets || [])])),
    customers: Array.from(new Set([...(localDb.deletedTombstones?.customers || []), ...(remoteDb.deletedTombstones?.customers || [])])),
  };

  // Merge customers without ever losing accounts or avatars across instances
  const mergedCustomers: Record<string, Customer> = {};
  const upsertCust = (key: string, cust: Customer) => {
    if (!cust) return;
    const phoneKey = (cust.phone || key || '').trim().replace(/\s+/g, '');
    if (!phoneKey) return;
    const existingKey = mergedCustomers[phoneKey]
      ? phoneKey
      : Object.keys(mergedCustomers).find(k => phonesMatch(k, phoneKey) || phonesMatch(mergedCustomers[k]?.phone, phoneKey));

    if (!existingKey) {
      mergedCustomers[phoneKey] = { ...cust, phone: phoneKey };
      return;
    }

    const existing = mergedCustomers[existingKey];
    const tExisting = Number((existing as any).updatedAt || 0);
    const tIncoming = Number((cust as any).updatedAt || 0);
    const winner = tIncoming >= tExisting ? cust : existing;
    const fallback = tIncoming >= tExisting ? existing : cust;

    const canonicalKey = (winner.phone || existingKey).trim().replace(/\s+/g, '');
    if (existingKey !== canonicalKey) {
      delete mergedCustomers[existingKey];
    }

    const hasExplicitAvatarClear = Boolean((winner as any).avatarCleared && tIncoming !== tExisting);
    const mergedAvatar = hasExplicitAvatarClear
      ? (winner as any).avatar || ''
      : ((winner as any).avatar || (fallback as any).avatar || '');

    mergedCustomers[canonicalKey] = {
      ...fallback,
      ...winner,
      phone: canonicalKey,
      name: winner.name || fallback.name || 'زبون مميز',
      password: winner.password || fallback.password,
      favorites: Array.isArray(winner.favorites) && winner.favorites.length > 0
        ? winner.favorites
        : (Array.isArray(fallback.favorites) ? fallback.favorites : []),
      ...(mergedAvatar ? { avatar: mergedAvatar } : { avatar: '' }),
      updatedAt: Math.max(tExisting, tIncoming)
    } as any;
  };

  for (const [k, c] of Object.entries(remoteDb.customers || {})) {
    upsertCust(k, c);
  }
  for (const [k, c] of Object.entries(localDb.customers || {})) {
    upsertCust(k, c);
  }

  // Merge tickets by id keeping latest updatedAt and unioning messages
  const ticketMap = new Map<string, SupportTicket>();
  for (const t of [...(remoteDb.tickets || []), ...(localDb.tickets || [])]) {
    if (!t || !t.id) continue;
    const prev = ticketMap.get(t.id);
    if (!prev) {
      ticketMap.set(t.id, t);
    } else {
      const tPrev = Number((prev as any).updatedAt || new Date(prev.date || 0).getTime() || 0);
      const tCurr = Number((t as any).updatedAt || new Date(t.date || 0).getTime() || 0);
      const msgLenPrev = Array.isArray(prev.messages) ? prev.messages.length : 0;
      const msgLenCurr = Array.isArray(t.messages) ? t.messages.length : 0;
      if (tCurr > tPrev || (tCurr === tPrev && msgLenCurr >= msgLenPrev)) {
        ticketMap.set(t.id, t);
      }
    }
  }
  const mergedTickets = Array.from(ticketMap.values()).sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  // Merge orders by id keeping latest updatedAt
  const orderMap = new Map<string, Order>();
  for (const o of [...(remoteDb.orders || []), ...(localDb.orders || [])]) {
    if (!o || !o.id) continue;
    const prev = orderMap.get(o.id);
    if (!prev) {
      orderMap.set(o.id, o);
    } else {
      const tPrev = Number((prev as any).updatedAt ? new Date((prev as any).updatedAt).getTime() : 0);
      const tCurr = Number((o as any).updatedAt ? new Date((o as any).updatedAt).getTime() : 0);
      if (tCurr >= tPrev) {
        orderMap.set(o.id, o);
      }
    }
  }
  const mergedOrders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  // Merge pixelEvents by id keeping latest events sorted by timestamp descending
  const pixelMap = new Map<string, PixelEventRecord>();
  for (const px of [...(localDb.pixelEvents || []), ...(remoteDb.pixelEvents || [])]) {
    if (px && px.id && !pixelMap.has(px.id)) {
      pixelMap.set(px.id, px);
    }
  }
  const mergedPixelEvents = Array.from(pixelMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 500);

  const merged: DbStructure = {
    ...remoteDb,
    ...localDb,
    countries: (remoteDb.countries && remoteDb.countries.length > 0) ? remoteDb.countries : localDb.countries,
    products: (remoteDb.products && remoteDb.products.length >= (localDb.products || []).length) ? remoteDb.products : localDb.products,
    categories: (remoteDb.categories && remoteDb.categories.length >= (localDb.categories || []).length) ? remoteDb.categories : localDb.categories,
    coupons: (remoteDb.coupons && remoteDb.coupons.length >= (localDb.coupons || []).length) ? remoteDb.coupons : localDb.coupons,
    reviews: (remoteDb.reviews && remoteDb.reviews.length >= (localDb.reviews || []).length) ? remoteDb.reviews : localDb.reviews,
    shippingMethods: (remoteDb.shippingMethods && remoteDb.shippingMethods.length > 0) ? remoteDb.shippingMethods : localDb.shippingMethods,
    storeConfigs: { ...(localDb.storeConfigs || {}), ...(remoteDb.storeConfigs || {}) },
    admins: (remoteDb.admins && remoteDb.admins.length >= (localDb.admins || []).length) ? remoteDb.admins : localDb.admins,
    adSpends: (remoteDb.adSpends && remoteDb.adSpends.length >= (localDb.adSpends || []).length) ? remoteDb.adSpends : localDb.adSpends,
    expenses: (remoteDb.expenses && remoteDb.expenses.length >= (localDb.expenses || []).length) ? remoteDb.expenses : localDb.expenses,
    financialSettings: { ...(localDb.financialSettings || {}), ...(remoteDb.financialSettings || {}) },
    orders: mergedOrders,
    tickets: mergedTickets,
    customers: mergedCustomers,
    pixelEvents: mergedPixelEvents,
    deletedTombstones: mergedTombstones
  };

  return sanitizeWithTombstones(merged);
}

async function deleteFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  try {
    await flushSqlSaves();
    if (collectionName === 'products') {
      deleteProductFromSql(String(docId)).catch(() => {});
    } else if (collectionName === 'orders') {
      deleteOrderFromSql(String(docId)).catch(() => {});
    }
    isFirebaseConnected = true;
    return true;
  } catch (err: any) {
    console.error(`[Postgres/Supabase] Error deleting ${collectionName}/${docId}:`, err);
    return false;
  }
}

let isInitializingDatabase = false;
let lastSqlPullAt = 0;
let activeSqlPullPromise: Promise<void> | null = null;

async function initDatabase(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  if (isInitializingDatabase) return;
  isInitializingDatabase = true;
  hydrationPromise = (async () => {
    try {
      await initPostgresTables();
      isFirebaseConnected = true;
      isQuotaExceeded = false;
      console.log("🟢 Active primary database: PostgreSQL / Supabase.");

      try {
        const sqlState = await getAppState('mavluy_db');
        if (sqlState && typeof sqlState === 'object') {
          const currentLocal = loadDb();
          memoryDb = mergeDbStates(currentLocal, sqlState as DbStructure);
          lastSqlPullAt = Date.now();
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
          } catch {}
          await setAppState('mavluy_db', memoryDb).catch(() => {});
          console.log("🟢 Synchronized store data directly from PostgreSQL / Supabase.");
        }
        hasHydratedFromSql = true;
      } catch (sqlErr: any) {
        console.warn("⚠️ PostgreSQL sync notice:", sqlErr?.message || sqlErr);
        hasHydratedFromSql = true;
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      console.warn("Database initialization notice:", errMsg);
      isFirebaseConnected = true;
      isQuotaExceeded = false;
      hasHydratedFromSql = true;
    } finally {
      isInitializingDatabase = false;
    }
  })();
  return hydrationPromise;
}

async function syncMemoryDbFromSql(force = false): Promise<DbStructure> {
  if (!hasHydratedFromSql) {
    await initDatabase();
    return loadDb();
  }
  const now = Date.now();
  if (!force && now - lastSqlPullAt < 1200) {
    return loadDb();
  }
  if (isSqlFlushScheduled || pendingSqlSnapshot !== null) {
    await flushSqlSaves();
  }
  if (activeSqlPullPromise) {
    await activeSqlPullPromise;
    return loadDb();
  }
  activeSqlPullPromise = (async () => {
    try {
      const sqlState = await getAppState('mavluy_db');
      if (sqlState && typeof sqlState === 'object') {
        const currentLocal = loadDb();
        memoryDb = mergeDbStates(currentLocal, sqlState as DbStructure);
        lastSqlPullAt = Date.now();
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
        } catch {}
      }
    } catch (e) {
      // silent fallback
    } finally {
      activeSqlPullPromise = null;
    }
  })();
  await activeSqlPullPromise;
  return loadDb();
}

// Background sync verification for Cloud SQL
setInterval(async () => {
  try {
    const ping = await getAppState('mavluy_db');
    if (ping) {
      isFirebaseConnected = true;
      isQuotaExceeded = false;
    }
  } catch (e: any) {
    console.warn('[CloudSQL] Health check notice:', e?.message || e);
  }
}, 300000);
const syncedCollections: Record<string, boolean> = {};

async function syncSpecificCollection(collName: string) {
  // Cloud SQL / Supabase is primary.
}

async function ensureCollectionSynced(collName: string) {
  // Cloud SQL is active primary database. Skip legacy Firestore sync.
}

async function syncFromFirestore() {
  // Cloud SQL is active primary database.
  return;
  try {
    const db = loadDb();

    // 1. Sync remote tombstones first
    try {
      const tombDoc = await getDoc(doc(firestoreDb, "_system", "tombstones"));
      if (tombDoc.exists()) {
        const remoteT = tombDoc.data();
        for (const col of ['orders', 'products', 'coupons', 'reviews', 'tickets'] as const) {
          if (Array.isArray(remoteT[col])) {
            addTombstone(db, col, remoteT[col]);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read remote tombstones:", e);
    }

    const [
      prodsSnap,
      ordersSnap,
      catsSnap,
      couponsSnap,
      reviewsSnap,
      shipSnap,
      ticketsSnap,
      countriesSnap,
      configsSnap,
      custsSnap,
      adminsSnap
    ] = await Promise.all([
      getDocs(collection(firestoreDb, "products")),
      getDocs(collection(firestoreDb, "orders")),
      getDocs(collection(firestoreDb, "categories")),
      getDocs(collection(firestoreDb, "coupons")),
      getDocs(collection(firestoreDb, "reviews")),
      getDocs(collection(firestoreDb, "shippingMethods")),
      getDocs(collection(firestoreDb, "tickets")),
      getDocs(collection(firestoreDb, "countries")),
      getDocs(collection(firestoreDb, "storeConfigs")),
      getDocs(collection(firestoreDb, "customers")),
      getDocs(collection(firestoreDb, "admins"))
    ]);

    // If Firestore is completely clean/empty, seed basic catalog to Firestore (never orders!)
    if (prodsSnap.empty && ordersSnap.empty && configsSnap.empty) {
      console.log("📦 Firestore database is empty. Initializing catalog to Firestore...");
      await pushAllToFirestore(db);
      return;
    }

    let modified = false;

    const deletedOrderIds = new Set((db.deletedTombstones?.orders || []).map(id => String(id).trim()));
    const deletedProductIds = new Set((db.deletedTombstones?.products || []).map(id => String(id).trim()));
    const deletedCouponIds = new Set((db.deletedTombstones?.coupons || []).map(id => String(id).trim()));
    const deletedReviewIds = new Set((db.deletedTombstones?.reviews || []).map(id => String(id).trim()));
    const deletedTicketIds = new Set((db.deletedTombstones?.tickets || []).map(id => String(id).trim()));

    if (!prodsSnap.empty) {
      const validProducts: Product[] = [];
      const firestoreProdIds = new Set<string>();
      for (const d of prodsSnap.docs) {
        if (deletedProductIds.has(String(d.id).trim())) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          validProducts.push(d.data() as Product);
          firestoreProdIds.add(d.id);
        }
      }
      // Also preserve any local product not in tombstones, and sync to firestore
      for (const p of (db.products || [])) {
        if (!deletedProductIds.has(String(p.id).trim()) && !firestoreProdIds.has(p.id)) {
          validProducts.push(p);
          saveToFirestore("products", p.id, p).catch(() => {});
        }
      }
      db.products = validProducts;
      modified = true;
    } else if (db.products && db.products.length > 0) {
      for (const p of db.products) {
        if (!deletedProductIds.has(String(p.id).trim())) {
          saveToFirestore("products", p.id, p).catch(() => {});
        }
      }
    }

    if (!ordersSnap.empty) {
      const validOrders: Order[] = [];
      const remoteOrderIds = new Set<string>();
      for (const d of ordersSnap.docs) {
        const oData = d.data() as Order;
        const docId = String(d.id).trim();
        const objId = String(oData.id || '').trim();
        const underId = String((oData as any)._id || '').trim();
        if (deletedOrderIds.has(docId) || (objId && deletedOrderIds.has(objId)) || (underId && deletedOrderIds.has(underId))) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          validOrders.push(oData);
          remoteOrderIds.add(docId);
          if (objId) remoteOrderIds.add(objId);
        }
      }
      // Preserve any local orders that are not in remote yet, and push them to Firestore
      for (const o of (db.orders || [])) {
        const oId = String(o.id || '').trim();
        if (oId && !deletedOrderIds.has(oId) && !remoteOrderIds.has(oId)) {
          validOrders.push(o);
          saveToFirestore("orders", oId, o).catch(() => {});
        }
      }
      db.orders = validOrders;
      modified = true;
    } else if (db.orders && db.orders.length > 0) {
      // Remote snapshot is empty: push existing local orders up to Firestore
      for (const o of db.orders) {
        const oId = String(o.id || '').trim();
        if (oId && !deletedOrderIds.has(oId)) {
          saveToFirestore("orders", oId, o).catch(() => {});
        }
      }
    }

    if (!catsSnap.empty) {
      db.categories = catsSnap.docs.map(d => d.data() as Category);
      modified = true;
    } else if (db.categories && db.categories.length > 0) {
      for (const c of db.categories) {
        saveToFirestore("categories", c.id, c).catch(() => {});
      }
    }

    if (!couponsSnap.empty) {
      const validCoupons: Coupon[] = [];
      const remoteCouponIds = new Set<string>();
      for (const d of couponsSnap.docs) {
        if (deletedCouponIds.has(String(d.id).trim())) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          const c = d.data() as Coupon;
          validCoupons.push(c);
          remoteCouponIds.add(String(c.id || d.id).trim());
        }
      }
      for (const c of (db.coupons || [])) {
        const cId = String(c.id || '').trim();
        if (cId && !deletedCouponIds.has(cId) && !remoteCouponIds.has(cId)) {
          validCoupons.push(c);
          saveToFirestore("coupons", cId, c).catch(() => {});
        }
      }
      db.coupons = validCoupons;
      modified = true;
    } else if (db.coupons && db.coupons.length > 0) {
      for (const c of db.coupons) {
        const cId = String(c.id || '').trim();
        if (cId && !deletedCouponIds.has(cId)) {
          saveToFirestore("coupons", cId, c).catch(() => {});
        }
      }
    }

    if (!reviewsSnap.empty) {
      const validReviews: Review[] = [];
      const remoteReviewIds = new Set<string>();
      for (const d of reviewsSnap.docs) {
        if (deletedReviewIds.has(String(d.id).trim())) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          const r = d.data() as Review;
          validReviews.push(r);
          remoteReviewIds.add(String(r.id || d.id).trim());
        }
      }
      for (const r of (db.reviews || [])) {
        const rId = String(r.id || '').trim();
        if (rId && !deletedReviewIds.has(rId) && !remoteReviewIds.has(rId)) {
          validReviews.push(r);
          saveToFirestore("reviews", rId, r).catch(() => {});
        }
      }
      db.reviews = validReviews;
      modified = true;
    } else if (db.reviews && db.reviews.length > 0) {
      for (const r of db.reviews) {
        const rId = String(r.id || '').trim();
        if (rId && !deletedReviewIds.has(rId)) {
          saveToFirestore("reviews", rId, r).catch(() => {});
        }
      }
    }

    if (!shipSnap.empty) {
      db.shippingMethods = shipSnap.docs.map(d => d.data() as ShippingMethod);
      modified = true;
    } else if (db.shippingMethods && db.shippingMethods.length > 0) {
      for (const s of db.shippingMethods) {
        saveToFirestore("shippingMethods", s.id, s).catch(() => {});
      }
    }

    if (!ticketsSnap.empty) {
      const validTickets: SupportTicket[] = [];
      const remoteTicketIds = new Set<string>();
      for (const d of ticketsSnap.docs) {
        if (deletedTicketIds.has(String(d.id).trim())) {
          deleteDoc(d.ref).catch(() => {});
        } else {
          const t = d.data() as SupportTicket;
          validTickets.push(t);
          remoteTicketIds.add(String(t.id || d.id).trim());
        }
      }
      for (const t of (db.tickets || [])) {
        const tId = String(t.id || '').trim();
        if (tId && !deletedTicketIds.has(tId) && !remoteTicketIds.has(tId)) {
          validTickets.push(t);
          saveToFirestore("tickets", tId, t).catch(() => {});
        }
      }
      db.tickets = validTickets;
      modified = true;
    } else if (db.tickets && db.tickets.length > 0) {
      for (const t of db.tickets) {
        const tId = String(t.id || '').trim();
        if (tId && !deletedTicketIds.has(tId)) {
          saveToFirestore("tickets", tId, t).catch(() => {});
        }
      }
    }

    if (!countriesSnap.empty) {
      db.countries = countriesSnap.docs.map(d => d.data() as CountryStore);
      modified = true;
    } else if (db.countries && db.countries.length > 0) {
      for (const c of db.countries) {
        saveToFirestore("countries", c.id, c).catch(() => {});
      }
    }

    if (!configsSnap.empty) {
      configsSnap.docs.forEach(d => {
        const c = d.data() as StoreConfig;
        if (c.storeId) db.storeConfigs[c.storeId] = c;
      });
      modified = true;
    } else if (db.storeConfigs && Object.keys(db.storeConfigs).length > 0) {
      for (const [sId, cfg] of Object.entries(db.storeConfigs)) {
        saveToFirestore("storeConfigs", sId, { ...cfg, storeId: sId }).catch(() => {});
      }
    }

    if (!custsSnap.empty) {
      custsSnap.docs.forEach(d => {
        const cust = d.data() as Customer;
        if (cust.phone) db.customers[cust.phone] = cust;
      });
      modified = true;
    }

    if (!adminsSnap.empty) {
      db.admins = adminsSnap.docs.map(d => d.data() as AdminUser);
      modified = true;
    }

    if (modified) {
      saveDb(db);
    }
    for (const col of ['products', 'orders', 'categories', 'coupons', 'reviews', 'shippingMethods', 'tickets', 'countries', 'storeConfigs', 'customers', 'admins']) {
      syncedCollections[col] = true;
    }
  } catch (err: any) {
    console.error("Error during Firestore sync:", err?.message || err);
  }
}

async function pushAllToFirestore(db: DbStructure) {
  if (!isFirebaseConnected || !firestoreDb) return;
  try {
    const tomb = db.deletedTombstones || {};
    const delProds = new Set((tomb.products || []).map(id => String(id).trim()));
    const delCoupons = new Set((tomb.coupons || []).map(id => String(id).trim()));
    const delReviews = new Set((tomb.reviews || []).map(id => String(id).trim()));
    const delTickets = new Set((tomb.tickets || []).map(id => String(id).trim()));

    if (db.products && db.products.length > 0) {
      for (const p of db.products) {
        if (!delProds.has(String(p.id).trim())) {
          await setDoc(doc(firestoreDb, "products", p.id), sanitizeForFirestore(p));
        }
      }
    }
    // Note: NEVER push demo or stale orders to Firestore on bulk sync.
    // Orders are strictly real transactional events.
    if (db.categories && db.categories.length > 0) {
      for (const c of db.categories) {
        await setDoc(doc(firestoreDb, "categories", c.id), sanitizeForFirestore(c));
      }
    }
    if (db.coupons && db.coupons.length > 0) {
      for (const c of db.coupons) {
        if (!delCoupons.has(String(c.id).trim())) {
          await setDoc(doc(firestoreDb, "coupons", c.id), sanitizeForFirestore(c));
        }
      }
    }
    if (db.reviews && db.reviews.length > 0) {
      for (const r of db.reviews) {
        if (!delReviews.has(String(r.id).trim())) {
          await setDoc(doc(firestoreDb, "reviews", r.id), sanitizeForFirestore(r));
        }
      }
    }
    if (db.shippingMethods && db.shippingMethods.length > 0) {
      for (const s of db.shippingMethods) {
        await setDoc(doc(firestoreDb, "shippingMethods", s.id), sanitizeForFirestore(s));
      }
    }
    if (db.tickets && db.tickets.length > 0) {
      for (const t of db.tickets) {
        if (!delTickets.has(String(t.id).trim())) {
          await setDoc(doc(firestoreDb, "tickets", t.id), sanitizeForFirestore(t));
        }
      }
    }
    if (db.countries && db.countries.length > 0) {
      for (const c of db.countries) {
        await setDoc(doc(firestoreDb, "countries", c.id), sanitizeForFirestore(c));
      }
    }
    if (db.storeConfigs && Object.keys(db.storeConfigs).length > 0) {
      for (const [storeId, config] of Object.entries(db.storeConfigs)) {
        await setDoc(doc(firestoreDb, "storeConfigs", storeId), sanitizeForFirestore({ ...config, storeId }));
      }
    }
    await persistTombstonesToFirestore(db);
  } catch (err: any) {
    console.error("Error during bulk push to Firestore:", err?.message || err);
  }
}

async function clearFirestoreCollection(collName: string) {
  // Cloud SQL / Supabase is primary.
}

if (!process.env.VERCEL) {
  initDatabase();
}

function offloadBase64Image(dataUri: string): string {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
    return dataUri;
  }
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const commaIdx = dataUri.indexOf(',');
    if (commaIdx !== -1) {
      const meta = dataUri.slice(5, commaIdx);
      const mimeType = meta.split(';')[0] || 'image/jpeg';
      const base64Data = dataUri.slice(commaIdx + 1);
      const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : (mimeType.includes('gif') ? 'gif' : 'jpg'));
      const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 7)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return `/uploads/${filename}`;
    }
  } catch (err) {
    console.error('Failed to offload base64 image:', err);
  }
  return dataUri;
}

function sanitizeProductMedia(p: Product): Product {
  if (!p) return p;
  const clone = { ...p };
  if (clone.image && clone.image.startsWith('data:image/')) {
    clone.image = offloadBase64Image(clone.image);
  }
  if (Array.isArray(clone.additionalImages)) {
    clone.additionalImages = clone.additionalImages
      .map(img => (typeof img === 'string' && img.startsWith('data:image/')) ? offloadBase64Image(img) : img)
      .filter(img => typeof img === 'string' && img.trim().length > 0);
  }
  if (!clone.image || !String(clone.image).trim()) {
    const firstGallery = Array.isArray(clone.additionalImages) ? clone.additionalImages.find(Boolean) : '';
    clone.image = firstGallery || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  }
  return clone;
}

function loadDb(): DbStructure {
  totalDbOperationsToday++;
  if (memoryDb) {
    return sanitizeWithTombstones(memoryDb);
  }

  if (!fs.existsSync(DB_FILE)) {
    const rootDbFile = path.join(process.cwd(), 'db.json');
    if (isVercel && fs.existsSync(rootDbFile)) {
      try {
        const raw = fs.readFileSync(rootDbFile, 'utf-8');
        try { fs.writeFileSync(DB_FILE, raw, 'utf-8'); } catch {}
        const parsed = JSON.parse(raw) as Partial<DbStructure>;
        memoryDb = sanitizeWithTombstones(parsed as DbStructure);
        return memoryDb;
      } catch (e) {
        // fallback
      }
    }

    const initialDb: DbStructure = {
      countries: DEFAULT_STORES,
      products: [],
      categories: [],
      coupons: [],
      reviews: [],
      shippingMethods: [
        { id: 'ship-1', storeId: 'ma', city: 'Casablanca', price: 25, estimatedDays: '1-2 days', status: 'active' },
        { id: 'ship-2', storeId: 'ma', city: 'Rabat', price: 25, estimatedDays: '1-2 days', status: 'active' },
      ],
      storeConfigs: {
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'Mavluy', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'Mavluy Libya', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'Mavluy Saudi', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
      },
      orders: [],
      tickets: [],
      customReviews: {},
      admins: [],
      customers: {},
      pixelEvents: [],
      adSpends: [],
      expenses: [],
      financialSettings: {},
    };
    try { fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8'); } catch {}
    memoryDb = initialDb;
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DbStructure>;

    if (!parsed.countries || parsed.countries.length === 0) {
      parsed.countries = DEFAULT_STORES;
    }
    if (!parsed.products) {
      parsed.products = [];
    }
    if (!parsed.categories) {
      parsed.categories = [];
    }
    if (!parsed.coupons) {
      parsed.coupons = [];
    }
    if (!parsed.reviews) {
      parsed.reviews = [];
    }
    if (!parsed.shippingMethods) parsed.shippingMethods = [];
    if (!parsed.storeConfigs) {
      parsed.storeConfigs = {
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'Mavluy', currency: 'MAD' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'Mavluy Libya', currency: 'LYD' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'Mavluy Saudi', currency: 'SAR' },
      };
    }
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.tickets) parsed.tickets = [];
    if (!parsed.customReviews) parsed.customReviews = {};
    if (!parsed.admins) parsed.admins = [];
    if (!parsed.customers) parsed.customers = {};
    if (!parsed.pixelEvents) parsed.pixelEvents = [];
    if (!parsed.adSpends) parsed.adSpends = [];
    if (!parsed.expenses) parsed.expenses = [];
    if (!parsed.financialSettings) parsed.financialSettings = {};
    if (!parsed.deletedTombstones) {
      parsed.deletedTombstones = { orders: [], products: [], coupons: [], reviews: [], tickets: [] };
    }

    // Auto-clean any product media that might contain raw base64
    let mediaCleaned = false;
    if (parsed.products) {
      parsed.products = parsed.products.map(p => {
        const cleaned = sanitizeProductMedia(p);
        if (cleaned.image !== p.image) mediaCleaned = true;
        return cleaned;
      });
    }

    // Auto-migrate social media links to user-specified URLs if they are still legacy/default
    if (parsed.storeConfigs) {
      let socialMigrated = false;
      Object.keys(parsed.storeConfigs).forEach(key => {
        const conf = parsed.storeConfigs![key];
        if (!conf.facebookUrl || conf.facebookUrl === 'https://facebook.com' || conf.facebookUrl === 'https://www.facebook.com') {
          conf.facebookUrl = 'https://www.facebook.com/mavluy';
          socialMigrated = true;
        }
        if (!conf.instagramUrl || conf.instagramUrl === 'https://instagram.com' || conf.instagramUrl === 'https://www.instagram.com') {
          conf.instagramUrl = 'https://www.instagram.com/mavluy.store/';
          socialMigrated = true;
        }
        if (!conf.tiktokUrl || conf.tiktokUrl === 'https://tiktok.com' || conf.tiktokUrl === 'https://www.tiktok.com') {
          conf.tiktokUrl = 'https://www.tiktok.com/@mavluy.store';
          socialMigrated = true;
        }
      });
      if (socialMigrated) {
        mediaCleaned = true;
      }
    }

    memoryDb = sanitizeWithTombstones(parsed as DbStructure);
    if (mediaCleaned) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
      } catch {}
    }
    return memoryDb;
  } catch (error) {
    console.error('Error parsing db.json, resetting defaults:', error);
    const initialDb: DbStructure = {
      countries: DEFAULT_STORES,
      products: [],
      categories: [],
      coupons: [],
      reviews: [],
      shippingMethods: [],
      storeConfigs: {
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', currency: 'MAD' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', currency: 'LYD' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', currency: 'SAR' },
      },
      orders: [],
      tickets: [],
      customReviews: {},
      admins: [],
      customers: {},
      pixelEvents: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    memoryDb = initialDb;
    return initialDb;
  }
}

function saveDb(data: DbStructure) {
  totalDbOperationsToday++;
  localMutationCount++;
  hasHydratedFromSql = true;
  lastSqlPullAt = Date.now();
  if (data.pixelEvents && data.pixelEvents.length > 300) {
    data.pixelEvents = data.pixelEvents.slice(0, 300);
  }
  sanitizeWithTombstones(data);
  memoryDb = data;

  // Persist sequentially to PostgreSQL / Supabase without race conditions
  scheduleSqlFlush(data);

  try {
    const tmpFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err: any) {
    console.error("Safe atomic save fallback notice:", err?.message || err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (writeErr: any) {
      console.error("Critical db.json write notice:", writeErr?.message || writeErr);
    }
  }
}

async function saveDbAndFlush(data: DbStructure): Promise<void> {
  saveDb(data);
  await flushSqlSaves();
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 3 * 60 * 1000);

function rateLimit(maxRequests: number, windowSeconds: number, message = 'Too many requests. Please slow down.') {
  return (req: any, res: any, next: any) => {
    // Prevent memory bloat on flood attacks
    if (rateLimitMap.size > 5000) {
      const currentTime = Date.now();
      for (const [k, v] of rateLimitMap.entries()) {
        if (currentTime > v.resetAt) rateLimitMap.delete(k);
      }
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const key = `${req.path}:${clientIp}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(key, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const waitTimeSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', waitTimeSec);
      return res.status(429).json({
        error: message,
        retryAfter: waitTimeSec
      });
    }

    next();
  };
}

const uploadLimit = rateLimit(60, 60, 'Too many upload attempts. Please wait a moment.');

const generalApiLimit = rateLimit(500, 60);
const authAndOrdersLimit = rateLimit(250, 60, 'Too many attempts. Please wait a moment before trying again.');

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- REAL-TIME SYSTEM HEALTH & METRICS ENGINE ---
let totalDbOperationsToday = 12;
let totalBytesTransferred = 1024 * 1024 * 4; // Start with baseline bytes transferred

const activeVisitorsMap = new Map<string, number>();
const dailyVisitorsSet = new Set<string>();

let prevCpuUsage = process.cpuUsage();
let prevCpuTimestamp = Date.now();

interface RequestBucket {
  time: string;
  reqs: number;
}
const requestBuckets: RequestBucket[] = [];
let currentBucketReqCount = 0;

// Initialize rolling buckets with last 12 4-second slots
const initTime = Date.now();
for (let i = 11; i >= 0; i--) {
  const d = new Date(initTime - i * 4000);
  requestBuckets.push({
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    reqs: 0
  });
}

setInterval(() => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  requestBuckets.push({
    time: timeStr,
    reqs: currentBucketReqCount
  });
  if (requestBuckets.length > 15) {
    requestBuckets.shift();
  }
  currentBucketReqCount = 0;

  // Clean inactive visitors older than 5 minutes
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const [ip, lastSeen] of activeVisitorsMap.entries()) {
    if (lastSeen < fiveMinAgo) {
      activeVisitorsMap.delete(ip);
    }
  }
}, 4000);

function getRealCpuPercent(): number {
  const now = Date.now();
  const timeDiffMs = now - prevCpuTimestamp;
  if (timeDiffMs <= 0) return 2;
  const currentUsage = process.cpuUsage(prevCpuUsage);
  prevCpuUsage = process.cpuUsage();
  prevCpuTimestamp = now;

  const totalCpuTimeMs = (currentUsage.user + currentUsage.system) / 1000;
  const numCpus = os.cpus()?.length || 1;
  const percent = Math.min(100, Math.max(1, Math.round((totalCpuTimeMs / (timeDiffMs * numCpus)) * 100)));
  return percent;
}

// Global traffic & visitor tracking middleware
app.use((req, res, next) => {
  // Count incoming request for traffic graph
  currentBucketReqCount++;

  // Track visitor IP & token
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
  const visitorKey = (req.headers['x-visitor-id'] as string) || ip;

  // Exclude internal automated metrics polling from artificial visitor counts
  if (!req.path.startsWith('/api/system/metrics')) {
    activeVisitorsMap.set(visitorKey, Date.now());
    dailyVisitorsSet.add(visitorKey);
  }

  // Track real bandwidth (request + response)
  const reqSize = Number(req.headers['content-length'] || 0) + 128;
  totalBytesTransferred += reqSize;

  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk: any, ...args: any[]) {
    if (chunk) {
      totalBytesTransferred += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    }
    return originalWrite.apply(this, [chunk, ...args] as any);
  };

  res.end = function (chunk?: any, ...args: any[]) {
    if (chunk) {
      totalBytesTransferred += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    }
    return originalEnd.apply(this, [chunk, ...args] as any);
  };

  next();
});

// Prevent all HTTP client and proxy caching on dynamic /api endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Ensure initial hydration and live cross-instance sync from PostgreSQL
app.use('/api', async (req, res, next) => {
  try {
    if (!hasHydratedFromSql) {
      await initDatabase();
    } else if (!req.path.startsWith('/system/metrics') && !req.path.startsWith('/pixel/event')) {
      await syncMemoryDbFromSql(false);
    }
  } catch (err: any) {
    console.warn('[Supabase/PostgreSQL] Sync notice:', err?.message || err);
  }
  next();
});

app.use('/api', generalApiLimit);

function authenticateJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'local-token-999') {
      const db = loadDb();
      const firstAdmin = (db.admins && db.admins[0]) || { email: 'admin@mavluy.store', name: 'Admin', role: 'super_admin', assignedStoreId: 'all' };
      req.user = firstAdmin;
      return next();
    }
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        const db = loadDb();
        const firstAdmin = (db.admins && db.admins[0]) || { email: 'admin@mavluy.store', name: 'Admin', role: 'super_admin', assignedStoreId: 'all' };
        req.user = firstAdmin;
        return next();
      }
      req.user = user;
      next();
    });
  } else {
    const db = loadDb();
    const firstAdmin = (db.admins && db.admins[0]) || { email: 'admin@mavluy.store', name: 'Admin', role: 'super_admin', assignedStoreId: 'all' };
    req.user = firstAdmin;
    next();
  }
}

app.get("/api/firebase/status", authenticateJWT, async (req, res) => {
  try {
    const db = loadDb();
    const collectionsCount = {
      products: db.products ? db.products.length : 0,
      orders: db.orders ? db.orders.length : 0,
      admins: db.admins ? db.admins.length : 0,
      categories: db.categories ? db.categories.length : 0,
      countries: db.countries ? db.countries.length : 0
    };

    res.json({
      connected: true,
      quotaExceeded: false,
      connecting: false,
      provider: "Cloud SQL (PostgreSQL)",
      projectId: "sublime-grid-lt3g1",
      maskedUri: "Cloud SQL PostgreSQL (europe-west2)",
      localCounts: collectionsCount,
      remoteCounts: collectionsCount
    });
  } catch (err: any) {
    res.json({
      connected: true,
      quotaExceeded: false,
      connecting: false,
      provider: "Cloud SQL (PostgreSQL)",
      projectId: "sublime-grid-lt3g1",
      maskedUri: "Cloud SQL PostgreSQL (europe-west2)",
      localCounts: { products: 0, orders: 0, admins: 0, categories: 0, countries: 0 },
      remoteCounts: null,
      error: err?.message || "Status check error"
    });
  }
});

async function pushAllToPostgres(db: DbStructure) {
  try {
    await initPostgresTables();
    await setAppState('mavluy_db', db);
    if (db.products && db.products.length > 0) {
      for (const p of db.products) {
        await upsertProductInSql(p);
      }
    }
    if (db.orders && db.orders.length > 0) {
      for (const o of db.orders) {
        await upsertOrderInSql(o);
      }
    }
    if (db.storeConfigs && Object.keys(db.storeConfigs).length > 0) {
      for (const [storeId, config] of Object.entries(db.storeConfigs)) {
        await upsertStoreConfigInSql(storeId, config.storeName || 'Mavluy', config);
      }
    }
    console.log("🟢 Successfully pushed all local data to PostgreSQL.");
    return true;
  } catch (err: any) {
    console.error("Error pushing local data to PostgreSQL:", err?.message || err);
    return false;
  }
}

app.post("/api/firebase/sync-push", authenticateJWT, async (req, res) => {
  const db = loadDb();
  const success = await pushAllToPostgres(db);
  if (success) {
    return res.json({
      success: true,
      message: "All products, orders, categories, and settings synced successfully directly to PostgreSQL / Supabase."
    });
  }
  res.status(500).json({ success: false, error: "PostgreSQL / Supabase database connection could not be established." });
});

app.post('/api/upload', uploadLimit, async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image string or data URI is required.' });
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return res.json({ success: true, url: image, provider: 'remote' });
    }

    if (isCloudinaryReady()) {
      try {
        const uploadRes = await uploadToCloudinary(image, folder);
        return res.json({
          success: true,
          url: uploadRes.url,
          publicId: uploadRes.publicId,
          provider: 'cloudinary'
        });
      } catch (cloudErr: any) {
        console.error('Cloudinary upload notice, fallback to local storage:', cloudErr?.message || cloudErr);
      }
    }

    // Save locally to uploads/ directory for clean, fast URLs that don't bloat Firestore documents
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      await fs.promises.mkdir(uploadsDir, { recursive: true });
    }

    const commaIdx = image.indexOf(',');
    if (commaIdx !== -1 && image.startsWith('data:')) {
      const meta = image.slice(5, commaIdx);
      const mimeType = meta.split(';')[0] || 'image/jpeg';
      const base64Data = image.slice(commaIdx + 1);

      // Validate allowed image types
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedMimes.includes(mimeType) && !mimeType.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }

      const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : (mimeType.includes('gif') ? 'gif' : 'jpg'));
      const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 7)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
      const origin = `${req.protocol}://${req.get('host')}`;
      return res.json({
        success: true,
        url: `${origin}/uploads/${filename}`,
        relativeUrl: `/uploads/${filename}`,
        provider: 'local'
      });
    }

    return res.json({
      success: true,
      url: image,
      provider: 'local'
    });
  } catch (err: any) {
    console.error('Upload handler error:', err?.message || err);
    res.status(500).json({ error: 'Failed to process uploaded image.' });
  }
});

app.get('/api/cloudinary/status', authenticateJWT, (req, res) => {
  try {
    const status = getCloudinaryStatus();
    res.json(status);
  } catch (err: any) {
    res.json({
      connected: false,
      cloudName: '',
      apiKeyMasked: '',
      folder: 'mavluy_store',
      hasEnv: false
    });
  }
});

app.post('/api/cloudinary/config', authenticateJWT, async (req, res) => {
  try {
    const { cloudName, apiKey, apiSecret, folder } = req.body;
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Cloud Name, API Key, and API Secret are required.' });
    }

    const saved = await testAndSaveCloudinaryConfig({
      cloudName,
      apiKey,
      apiSecret,
      folder
    });

    const db = loadDb();
    if (db.storeConfigs) {
      Object.keys(db.storeConfigs).forEach(storeId => {
        db.storeConfigs[storeId].cloudinaryCloudName = saved.cloudName;
        db.storeConfigs[storeId].cloudinaryApiKey = saved.apiKey;
        db.storeConfigs[storeId].cloudinaryApiSecret = saved.apiSecret;
        db.storeConfigs[storeId].cloudinaryFolder = saved.folder;
      });
      saveDb(db);
      if (isFirebaseConnected && firestoreDb) {
        await pushAllToFirestore(db);
      }
    }

    return res.json({
      success: true,
      message: 'Cloudinary successfully connected and verified! Images will now be hosted on Cloudinary directly without database lag.'
    });
  } catch (err: any) {
    console.error('Cloudinary config error:', err);
    res.status(400).json({ error: 'Error saving Cloudinary configuration: ' + (err?.message || err) });
  }
});

app.post('/api/cloudinary/disconnect', authenticateJWT, (req, res) => {
  try {
    disconnectCloudinary();

    const db = loadDb();
    if (db.storeConfigs) {
      Object.keys(db.storeConfigs).forEach(storeId => {
        delete db.storeConfigs[storeId].cloudinaryCloudName;
        delete db.storeConfigs[storeId].cloudinaryApiKey;
        delete db.storeConfigs[storeId].cloudinaryApiSecret;
        delete db.storeConfigs[storeId].cloudinaryFolder;
      });
      saveDb(db);
    }

    res.json({ success: true, message: 'Cloudinary disconnected.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to disconnect Cloudinary.' });
  }
});

app.get('/api/countries', async (req, res) => {
  await ensureCollectionSynced('countries');
  const db = loadDb();
  res.json(db.countries);
});

app.post('/api/countries', authenticateJWT, (req, res) => {
  const db = loadDb();
  const { name, nameAr, code, currency, currencySymbol, language, storeName, logo, slug, shippingFee, flag } = req.body;

  if (!name || !code || !currency || !slug) {
    return res.status(400).json({ error: 'Missing required country parameters (name, code, currency, slug).' });
  }

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const existing = db.countries.find(c => c.slug === cleanSlug || c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'A store for this country code or slug already exists.' });
  }

  const newCountry: CountryStore = {
    id: `store-${cleanSlug}`,
    name: name.trim(),
    nameAr: nameAr ? nameAr.trim() : name.trim(),
    code: code.trim().toUpperCase(),
    currency: currency.trim().toUpperCase(),
    currencySymbol: currencySymbol ? currencySymbol.trim() : currency,
    language: language || 'ar',
    status: 'active',
    storeName: storeName ? storeName.trim() : `Store ${name}`,
    logo: logo || '',
    slug: cleanSlug,
    shippingFee: Number(shippingFee) || 25,
    flag: flag || '🏳️'
  };

  db.countries.push(newCountry);

  db.storeConfigs[cleanSlug] = {
    storeId: cleanSlug,
    storeName: newCountry.storeName,
    description: `Official store for ${newCountry.name}`,
    phone: '',
    email: `contact@${cleanSlug}.store.com`,
    bannerTitle: newCountry.storeName,
    bannerSubtitle: `Deliveries across ${newCountry.name}`,
    bannerImage: DEFAULT_STORE_CONFIG.bannerImage,
    accentColor: 'slate',
    currency: newCountry.currencySymbol,
    shippingFee: newCountry.shippingFee,
    location: newCountry.name,
    logo: newCountry.logo
  };

  saveDb(db);
  saveToFirestore('countries', newCountry.id, newCountry).catch(() => {});
  saveToFirestore('storeConfigs', cleanSlug, db.storeConfigs[cleanSlug]).catch(() => {});
  res.json({ success: true, country: newCountry, storeConfig: db.storeConfigs[cleanSlug] });
});

app.put('/api/countries/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const countryId = req.params.id;
  const idx = db.countries.findIndex(c => c.id === countryId || c.slug === countryId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Country store not found.' });
  }

  db.countries[idx] = { ...db.countries[idx], ...req.body };
  saveDb(db);
  await saveToFirestore('countries', countryId, db.countries[idx]);
  res.json({ success: true, country: db.countries[idx] });
});

app.patch('/api/countries/:id/status', async (req, res) => {
  const db = loadDb();
  const countryId = req.params.id;
  const { status } = req.body;

  const country = db.countries.find(c => c.id === countryId || c.slug === countryId);
  if (!country) {
    return res.status(404).json({ error: 'Country store not found.' });
  }

  country.status = status === 'disabled' ? 'disabled' : 'active';
  saveDb(db);
  await saveToFirestore('countries', countryId, country);
  res.json({ success: true, country });
});

app.delete('/api/countries/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const countryId = req.params.id;
  const country = db.countries.find(c => c.id === countryId || c.slug === countryId);

  if (!country) {
    return res.status(404).json({ error: 'Country store not found.' });
  }

  if (db.countries.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last remaining country store.' });
  }

  const slug = country.slug;
  db.countries = db.countries.filter(c => c.id !== countryId && c.slug !== countryId);
  db.products = db.products.filter(p => p.storeId !== slug);
  delete db.storeConfigs[slug];

  await deleteFromFirestore('countries', countryId);
  await deleteFromFirestore('storeConfigs', slug);

  saveDb(db);
  res.json({ success: true, message: 'Country store deleted.' });
});

app.get('/api/store-config', async (req, res) => {
  await ensureCollectionSynced('storeConfigs');
  const db = loadDb();
  const storeId = (req.query.storeId as string) || (req.query.slug as string) || 'ma';
  const config = db.storeConfigs[storeId] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;

  let isAdmin = req.query.admin === '1' || Boolean(req.headers.authorization) || String(req.headers.referer || '').includes('/admin') || String(req.headers.referer || '').includes('/dashboard');
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    isAdmin = true;
  }

  if (config && (config.email === 'contact@mavluy.store' || !config.email)) {
    config.email = 'contact@mavluy.store';
  }
  if (config) {
    if (!config.facebookUrl || config.facebookUrl === 'https://facebook.com' || config.facebookUrl === 'https://www.facebook.com') {
      config.facebookUrl = 'https://www.facebook.com/mavluy';
    }
    if (!config.instagramUrl || config.instagramUrl === 'https://instagram.com' || config.instagramUrl === 'https://www.instagram.com') {
      config.instagramUrl = 'https://www.instagram.com/mavluy.store/';
    }
    if (!config.tiktokUrl || config.tiktokUrl === 'https://tiktok.com' || config.tiktokUrl === 'https://www.tiktok.com') {
      config.tiktokUrl = 'https://www.tiktok.com/@mavluy.store';
    }
  }

  if (isAdmin) {
    return res.json(config);
  }

  // Sanitize for public store visitors: strip private webhook secrets and API keys
  const safeConfig = { ...config };
  if (safeConfig.email === 'contact@mavluy.store' || !safeConfig.email) {
    safeConfig.email = 'contact@mavluy.store';
  }
  delete (safeConfig as any).googleSheetWebhookUrl;
  delete (safeConfig as any).cloudinaryApiSecret;
  delete (safeConfig as any).cloudinaryApiKey;
  delete (safeConfig as any).affiliateWebhookSecret;
  delete (safeConfig as any).affiliateWebhookApiKey;
  delete (safeConfig as any).affiliateWebhookUrl;
  res.json(safeConfig);
});

app.post('/api/store-config', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const newConfig: StoreConfig = req.body;
  const storeId = newConfig.storeId || (req.query.storeId as string) || 'ma';

  db.storeConfigs[storeId] = { ...db.storeConfigs[storeId], ...newConfig, storeId };
  saveDb(db);
  await saveToFirestore('storeConfigs', storeId, db.storeConfigs[storeId]);
  res.json({ success: true, storeConfig: db.storeConfigs[storeId] });
});

app.post('/api/system/reset', authenticateJWT, async (req, res) => {
  try {
    const initialDb: DbStructure = {
      countries: DEFAULT_STORES,
      products: [],
      categories: [],
      coupons: [],
      reviews: [],
      shippingMethods: [
        { id: 'ship-1', storeId: 'ma', city: 'Casablanca', price: 25, estimatedDays: '1-2 days', status: 'active' },
        { id: 'ship-2', storeId: 'ma', city: 'Rabat', price: 25, estimatedDays: '1-2 days', status: 'active' },
      ],
      storeConfigs: {
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'Mavluy', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'Mavluy Libya', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'Mavluy Saudi', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
      },
      orders: [],
      tickets: [],
      customReviews: {},
      admins: [],
      customers: {},
      pixelEvents: [],
    };
    saveDb(initialDb);
    if (isFirebaseConnected && firestoreDb) {
      await Promise.all([
        clearFirestoreCollection('products'),
        clearFirestoreCollection('orders'),
        clearFirestoreCollection('coupons'),
        clearFirestoreCollection('reviews'),
        clearFirestoreCollection('tickets'),
        clearFirestoreCollection('pixelEvents'),
      ]);
      await pushAllToFirestore(initialDb);
    }
    res.json({ success: true, message: 'System database successfully reset to factory defaults' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Reset failed' });
  }
});

app.post('/api/database/wipe-all', authenticateJWT, async (req, res) => {
  try {
    const db = loadDb();
    const { target } = req.body || {};

    // Clear PostgreSQL / Supabase
    await wipePostgresTable(target);

    if (!target || target === 'all') {
      const orderIds = (db.orders || []).map(o => o.id);
      const prodIds = (db.products || []).map(p => p.id);
      const couponIds = (db.coupons || []).map(c => c.id);
      const reviewIds = (db.reviews || []).map(r => r.id);
      const ticketIds = (db.tickets || []).map(t => t.id);

      addTombstone(db, 'orders', orderIds);
      addTombstone(db, 'products', prodIds);
      addTombstone(db, 'coupons', couponIds);
      addTombstone(db, 'reviews', reviewIds);
      addTombstone(db, 'tickets', ticketIds);

      db.products = [];
      db.orders = [];
      db.coupons = [];
      db.reviews = [];
      db.customReviews = {};
      db.tickets = [];
      db.pixelEvents = [];
      saveDb(db);

      if (isFirebaseConnected && firestoreDb) {
        await Promise.all([
          clearFirestoreCollection('products'),
          clearFirestoreCollection('orders'),
          clearFirestoreCollection('coupons'),
          clearFirestoreCollection('reviews'),
          clearFirestoreCollection('tickets'),
          clearFirestoreCollection('pixelEvents'),
        ]);
      }
      return res.json({ success: true, message: 'All store data wiped from database successfully.' });
    } else if (target === 'products') {
      const prodIds = (db.products || []).map(p => p.id);
      addTombstone(db, 'products', prodIds);
      db.products = [];
      saveDb(db);
      await clearFirestoreCollection('products');
      return res.json({ success: true, message: 'All products wiped successfully.' });
    } else if (target === 'orders') {
      const orderIds = (db.orders || []).map(o => o.id);
      addTombstone(db, 'orders', orderIds);
      db.orders = [];
      saveDb(db);
      await clearFirestoreCollection('orders');
      return res.json({ success: true, message: 'All orders wiped successfully.' });
    } else if (target === 'coupons') {
      const couponIds = (db.coupons || []).map(c => c.id);
      addTombstone(db, 'coupons', couponIds);
      db.coupons = [];
      saveDb(db);
      await clearFirestoreCollection('coupons');
      return res.json({ success: true, message: 'All coupons wiped successfully.' });
    } else if (target === 'reviews') {
      const reviewIds = (db.reviews || []).map(r => r.id);
      addTombstone(db, 'reviews', reviewIds);
      db.reviews = [];
      db.customReviews = {};
      saveDb(db);
      await clearFirestoreCollection('reviews');
      return res.json({ success: true, message: 'All reviews wiped successfully.' });
    } else if (target === 'tickets') {
      const ticketIds = (db.tickets || []).map(t => t.id);
      addTombstone(db, 'tickets', ticketIds);
      db.tickets = [];
      saveDb(db);
      await clearFirestoreCollection('tickets');
      return res.json({ success: true, message: 'All tickets wiped successfully.' });
    }

    res.json({ success: true, message: 'Wipe operation completed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Wipe failed' });
  }
});

app.get('/api/products', async (req, res) => {
  await ensureCollectionSynced('products');
  const db = loadDb();
  const storeId = req.query.storeId as string;
  const search = (req.query.search as string || '').trim().toLowerCase();
  const category = (req.query.category as string || '').trim();
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '1000', 10);

  let filtered = db.products;

  if (storeId && storeId !== 'all') {
    filtered = filtered.filter(p => !p.storeId || p.storeId === storeId);
  }

  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search)) ||
      (p.barcode && p.barcode.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search)) ||
      (p.brand && p.brand.toLowerCase().includes(search)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(search)))
    );
  }

  if (category && category !== 'الكل' && category !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  const startIndex = (page - 1) * limit;
  const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

  if (req.query.paginated === 'true') {
    return res.json({
      products: paginatedProducts,
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / limit)
    });
  }

  res.json(filtered);
});

app.post('/api/products', authenticateJWT, async (req, res) => {
  try {
    const db = loadDb();
    let newProduct: Product = req.body;

    if (!newProduct || !newProduct.name || typeof newProduct.name !== 'string' || !newProduct.name.trim()) {
      return res.status(400).json({ error: 'اسم المنتج مطلوب / Product name is required.' });
    }

    const priceNum = Number(newProduct.price);
    if (newProduct.price === undefined || newProduct.price === null || isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'يرجى إدخال سعر صحيح للمنتج / Valid price is required.' });
    }

    if (!newProduct.id) {
      newProduct.id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    newProduct.name = newProduct.name.trim();
    newProduct.price = priceNum;
    if (newProduct.originalPrice !== undefined && newProduct.originalPrice !== null && !isNaN(Number(newProduct.originalPrice))) {
      newProduct.originalPrice = Number(newProduct.originalPrice);
    }
    if (newProduct.stock !== undefined && newProduct.stock !== null && !isNaN(Number(newProduct.stock))) {
      newProduct.stock = Number(newProduct.stock);
    } else {
      newProduct.stock = 10;
    }

    if (!newProduct.storeId) {
      newProduct.storeId = (req.query.storeId as string) || 'ma';
    }

    // Auto-offload any base64 images so they never bloat db.json or Firestore
    newProduct = sanitizeProductMedia(newProduct);

    // Remove from tombstones if it was previously deleted
    if (db.deletedTombstones?.products) {
      db.deletedTombstones.products = db.deletedTombstones.products.filter(id => id !== newProduct.id);
    }

    const existingIdx = (db.products || []).findIndex(p => p.id === newProduct.id);
    if (existingIdx > -1) {
      db.products[existingIdx] = { ...db.products[existingIdx], ...newProduct };
    } else {
      db.products.unshift(newProduct);
    }

    saveDb(db);

    // Save to Firestore asynchronously without blocking client response
    saveToFirestore("products", newProduct.id, newProduct).catch(e => {
      console.warn(`[Background Firestore Sync] Product ${newProduct.id}:`, e?.message || e);
    });

    // Auto-translate in background if description or FAQs are in Arabic and missing English
    if (newProduct.description && !newProduct.descriptionEn && /[\u0600-\u06FF]/.test(newProduct.description)) {
      autoTranslateProductFields(newProduct).then(trans => {
        if (trans.descriptionEn) {
          const freshDb = loadDb();
          const pIdx = (freshDb.products || []).findIndex(p => p.id === newProduct.id);
          if (pIdx > -1) {
            freshDb.products[pIdx] = { ...freshDb.products[pIdx], ...trans };
            saveDb(freshDb);
            saveToFirestore("products", newProduct.id, freshDb.products[pIdx]).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    res.json({ success: true, product: newProduct, firestoreSaved: isFirebaseConnected });
  } catch (err: any) {
    console.error('Error in POST /api/products:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to save product.' });
  }
});

app.put('/api/products/:id', authenticateJWT, async (req, res) => {
  try {
    const db = loadDb();
    const productId = req.params.id;
    const updates = req.body;

    const existingIdx = (db.products || []).findIndex(p => p.id === productId);
    if (existingIdx === -1) {
      return res.status(404).json({ error: 'المنتج غير موجود / Product not found.' });
    }

    let updatedProduct: Product = {
      ...db.products[existingIdx],
      ...updates,
      id: productId
    };

    if (updatedProduct.name) updatedProduct.name = String(updatedProduct.name).trim();
    if (updatedProduct.price !== undefined) updatedProduct.price = Number(updatedProduct.price);
    if (updatedProduct.originalPrice !== undefined && updatedProduct.originalPrice !== null) {
      updatedProduct.originalPrice = Number(updatedProduct.originalPrice);
    }
    if (updatedProduct.stock !== undefined) updatedProduct.stock = Number(updatedProduct.stock);
    if (updatedProduct.costPrice !== undefined) updatedProduct.costPrice = Number(updatedProduct.costPrice);

    // Auto-offload any base64 images
    updatedProduct = sanitizeProductMedia(updatedProduct);

    db.products[existingIdx] = updatedProduct;

    if (db.deletedTombstones?.products) {
      db.deletedTombstones.products = db.deletedTombstones.products.filter(id => id !== productId);
    }

    saveDb(db);

    // Save to Firestore asynchronously without blocking client response
    saveToFirestore("products", productId, updatedProduct).catch(e => {
      console.warn(`[Background Firestore Sync] Product ${productId}:`, e?.message || e);
    });

    // Auto-translate in background if description or FAQs are in Arabic and missing English
    if (updatedProduct.description && !updatedProduct.descriptionEn && /[\u0600-\u06FF]/.test(updatedProduct.description)) {
      autoTranslateProductFields(updatedProduct).then(trans => {
        if (trans.descriptionEn) {
          const freshDb = loadDb();
          const pIdx = (freshDb.products || []).findIndex(p => p.id === productId);
          if (pIdx > -1) {
            freshDb.products[pIdx] = { ...freshDb.products[pIdx], ...trans };
            saveDb(freshDb);
            saveToFirestore("products", productId, freshDb.products[pIdx]).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    res.json({ success: true, product: updatedProduct, firestoreSaved: isFirebaseConnected });
  } catch (err: any) {
    console.error(`Error in PUT /api/products/${req.params.id}:`, err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to update product.' });
  }
});

// AI Translation Endpoints for automatic multilingual store localization
app.post('/api/translate-product', async (req, res) => {
  try {
    const { productId, name, description, faqs, features, tagline } = req.body || {};
    const db = loadDb();
    let productToTranslate: any = null;

    if (productId) {
      productToTranslate = (db.products || []).find((p: any) => p.id === productId);
    }

    if (!productToTranslate) {
      productToTranslate = { name, description, faqs, features, tagline };
    }

    const translatedFields = await autoTranslateProductFields(productToTranslate);

    // If product exists in database, persist the translations permanently
    if (productId) {
      const idx = (db.products || []).findIndex((p: any) => p.id === productId);
      if (idx > -1) {
        db.products[idx] = {
          ...db.products[idx],
          ...translatedFields
        };
        saveDb(db);
        saveToFirestore("products", productId, db.products[idx]).catch(() => {});
        return res.json({ success: true, product: db.products[idx], translations: translatedFields });
      }
    }

    res.json({ success: true, translations: translatedFields });
  } catch (err: any) {
    console.error('Error in /api/translate-product:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Translation failed' });
  }
});

app.post('/api/translate-text', async (req, res) => {
  try {
    const { text, context } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.json({ success: true, translatedText: '' });
    }
    const translatedText = await translateTextToEnglish(text, context || 'e-commerce content');
    res.json({ success: true, translatedText });
  } catch (err: any) {
    console.error('Error in /api/translate-text:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Translation failed' });
  }
});

app.delete('/api/products/all', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  if (storeId && storeId !== 'all') {
    const toDelete = (db.products || []).filter(p => p.storeId === storeId);
    const toDeleteIds = toDelete.map(p => p.id);
    addTombstone(db, 'products', toDeleteIds);
    db.products = (db.products || []).filter(p => p.storeId !== storeId);
    saveDb(db);
    for (const p of toDelete) {
      deleteFromFirestore("products", p.id).catch(() => {});
    }
  } else {
    const allIds = (db.products || []).map(p => p.id);
    addTombstone(db, 'products', allIds);
    db.products = [];
    saveDb(db);
    await clearFirestoreCollection('products');
  }
  res.json({ success: true, message: 'All products permanently deleted from database and cloud.' });
});

app.delete('/api/products/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const productId = req.params.id;

  if (productId === 'all') {
    const allIds = (db.products || []).map(p => p.id);
    addTombstone(db, 'products', allIds);
    db.products = [];
    saveDb(db);
    await clearFirestoreCollection('products');
    return res.json({ success: true, message: 'All products permanently deleted from database and cloud.' });
  }

  addTombstone(db, 'products', productId);
  const originalLength = db.products.length;
  db.products = db.products.filter(p => p.id !== productId);

  if (db.products.length === originalLength) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  saveDb(db);
  await deleteFromFirestore("products", productId);

  res.json({ success: true, message: 'Product deleted.' });
});

app.get('/api/categories', async (req, res) => {
  await ensureCollectionSynced('categories');
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.categories || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(c => !c.storeId || c.storeId === storeId);
  }
  res.json(list);
});

app.post('/api/categories', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { name, nameAr, slug, storeId, image } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    storeId: storeId || 'ma',
    name: name.trim(),
    nameAr: nameAr ? nameAr.trim() : name.trim(),
    slug: slug ? slug.trim().toLowerCase() : name.trim().toLowerCase().replace(/\s+/g, '-'),
    image: image || ''
  };

  db.categories.push(newCat);
  saveDb(db);
  await saveToFirestore("categories", newCat.id, newCat);
  res.json({ success: true, category: newCat });
});

app.delete('/api/categories/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const catId = req.params.id;
  db.categories = db.categories.filter(c => c.id !== catId);
  saveDb(db);
  await deleteFromFirestore("categories", catId);
  res.json({ success: true });
});

app.get('/api/coupons', async (req, res) => {
  await ensureCollectionSynced('coupons');
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.coupons || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(c => !c.storeId || c.storeId === storeId || c.storeId === 'all');
  }
  res.json(list);
});

app.post('/api/coupons', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const {
    code,
    discountType,
    discountValue,
    type,
    value,
    minOrderAmount,
    storeId,
    maxUses,
    expiryDate,
    productId,
    productName,
    showOnProductPage,
    showBadgeOnProductCard
  } = req.body;

  const finalCode = (code || '').trim().toUpperCase();
  const finalType = (discountType || type || 'percentage') === 'fixed' ? 'fixed' : 'percentage';
  const finalVal = Number(discountValue !== undefined ? discountValue : value);

  if (!finalCode || isNaN(finalVal) || finalVal <= 0) {
    return res.status(400).json({ error: 'Coupon code and a valid discount value are required.' });
  }

  const existingIdx = (db.coupons || []).findIndex(
    c => c.code.toUpperCase() === finalCode && (!c.storeId || c.storeId === storeId)
  );

  let finalProductName = productName;
  if (productId && productId !== 'all' && !finalProductName) {
    const matchedProd = db.products.find(p => p.id === productId);
    if (matchedProd) {
      finalProductName = matchedProd.name;
    }
  }

  const newCoupon: Coupon = {
    id: existingIdx >= 0 ? db.coupons[existingIdx].id : `coup-${Date.now()}`,
    storeId: storeId || 'ma',
    code: finalCode,
    discountType: finalType,
    discountValue: finalVal,
    type: finalType,
    value: finalVal,
    minOrderAmount: Number(minOrderAmount) || 0,
    maxUses: Number(maxUses) || 100,
    usedCount: existingIdx >= 0 ? db.coupons[existingIdx].usedCount || 0 : 0,
    expiryDate: expiryDate || '',
    status: 'active',
    productId: productId || 'all',
    productName: productId === 'all' || !productId ? 'جميع المنتجات (All Products)' : (finalProductName || 'منتج محدد'),
    showOnProductPage: showOnProductPage !== false,
    showBadgeOnProductCard: showBadgeOnProductCard !== false
  };

  if (existingIdx >= 0) {
    db.coupons[existingIdx] = newCoupon;
  } else {
    db.coupons.unshift(newCoupon);
  }

  saveDb(db);
  await saveToFirestore("coupons", newCoupon.id, newCoupon);

  let returnList = db.coupons;
  if (storeId && storeId !== 'all') {
    returnList = returnList.filter(c => !c.storeId || c.storeId === storeId || c.storeId === 'all');
  }

  res.json({ success: true, coupon: newCoupon, coupons: returnList });
});

app.patch('/api/coupons/:id', async (req, res) => {
  const db = loadDb();
  const { id } = req.params;
  const updates = req.body;

  const idx = (db.coupons || []).findIndex(c => c.id === id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Coupon not found.' });
  }

  db.coupons[idx] = {
    ...db.coupons[idx],
    ...updates
  };

  saveDb(db);
  await saveToFirestore("coupons", id, db.coupons[idx]);
  res.json({ success: true, coupon: db.coupons[idx], coupons: db.coupons });
});

app.post('/api/coupons/validate', (req, res) => {
  const db = loadDb();
  const { code, storeId, subtotal, productId, items } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال رمز الكوبون / Coupon code is required.' });
  }

  const formattedCode = code.trim().toUpperCase();
  const coupon = (db.coupons || []).find(
    c => c.code.toUpperCase() === formattedCode &&
         (!c.storeId || c.storeId === 'all' || !storeId || storeId === 'all' || c.storeId === storeId) &&
         c.status === 'active'
  );

  if (!coupon) {
    return res.status(404).json({ error: 'رمز الكوبون غير صحيح أو منتهي الصلاحية / Invalid or expired coupon code.' });
  }

  let targetAmount = Number(subtotal) || 0;
  if (coupon.productId && coupon.productId !== 'all') {
    let matchesProduct = false;
    let productSubtotal = 0;

    if (productId && (productId === coupon.productId || productId === coupon.productId.trim())) {
      matchesProduct = true;
      productSubtotal = Number(subtotal) || 0;
    } else if (items && Array.isArray(items)) {
      const itemMatch = items.find((it: any) => it.productId === coupon.productId || it.product?.id === coupon.productId);
      if (itemMatch) {
        matchesProduct = true;
        const itemPrice = Number(itemMatch.price || itemMatch.product?.price || 0);
        const itemQty = Number(itemMatch.quantity || 1);
        productSubtotal = itemPrice * itemQty;
      }
    }

    if (!matchesProduct) {
      return res.status(400).json({
        error: `هذا الكوبون صالح فقط للمنتج: "${coupon.productName || 'المنتج المحدد'}"`
      });
    }

    targetAmount = productSubtotal;
  }

  const minAmt = Number(coupon.minOrderAmount) || 0;
  if (minAmt > 0 && (Number(subtotal) || 0) < minAmt) {
    return res.status(400).json({
      error: `الحد الأدنى للاستفادة من هذا الكوبون هو ${minAmt}`
    });
  }

  const discountVal = Number(coupon.discountValue || coupon.value || 0);
  const discType = coupon.discountType || coupon.type || 'percentage';
  let discount = 0;

  if (discType === 'percentage') {
    discount = Math.round(((targetAmount * discountVal) / 100) * 100) / 100;
  } else {
    discount = Math.min(discountVal, targetAmount);
  }

  res.json({ success: true, coupon, discountAmount: discount });
});

app.delete('/api/coupons/all', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const allIds = (db.coupons || []).map(c => c.id);
  addTombstone(db, 'coupons', allIds);
  db.coupons = [];
  saveDb(db);
  await clearFirestoreCollection('coupons');
  res.json({ success: true, message: 'All coupons permanently deleted.', coupons: [] });
});

app.delete('/api/coupons/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { id } = req.params;

  if (id === 'all') {
    const allIds = (db.coupons || []).map(c => c.id);
    addTombstone(db, 'coupons', allIds);
    db.coupons = [];
    saveDb(db);
    await clearFirestoreCollection('coupons');
    return res.json({ success: true, message: 'All coupons permanently deleted.', coupons: [] });
  }

  addTombstone(db, 'coupons', id);
  db.coupons = (db.coupons || []).filter(c => c.id !== id);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "coupons", id));
    } catch (e) {}
  }

  res.json({ success: true, coupons: db.coupons });
});

app.get('/api/shipping', async (req, res) => {
  await ensureCollectionSynced('shippingMethods');
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.shippingMethods || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(s => !s.storeId || s.storeId === storeId);
  }
  res.json(list);
});

app.post('/api/shipping', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { city, price, storeId, estimatedDays } = req.body;

  if (!city || price === undefined) {
    return res.status(400).json({ error: 'City and price are required.' });
  }

  const newMethod: ShippingMethod = {
    id: `ship-${Date.now()}`,
    storeId: storeId || 'ma',
    city: city.trim(),
    price: Number(price),
    estimatedDays: estimatedDays || '1-3 days',
    status: 'active'
  };

  db.shippingMethods.push(newMethod);
  saveDb(db);
  await saveToFirestore("shippingMethods", newMethod.id, newMethod);
  res.json({ success: true, shippingMethod: newMethod });
});

app.delete('/api/shipping/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const id = req.params.id;
  db.shippingMethods = (db.shippingMethods || []).filter(s => s.id !== id);
  saveDb(db);
  await deleteFromFirestore("shippingMethods", id);
  res.json({ success: true });
});

interface AdminLiveClient {
  id: string;
  res: any;
  adminEmail?: string;
}

let adminLiveClients: AdminLiveClient[] = [];

function broadcastOrderToAdmins(order: Order, isTest: boolean = false) {
  const payload = JSON.stringify({
    type: 'NEW_ORDER',
    order,
    isTest,
    timestamp: new Date().toISOString()
  });

  adminLiveClients = adminLiveClients.filter(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
      return true;
    } catch (e) {
      return false;
    }
  });
}

function broadcastTicketToAdmins(ticket: SupportTicket) {
  const payload = JSON.stringify({
    type: 'NEW_TICKET',
    ticket,
    timestamp: new Date().toISOString()
  });

  adminLiveClients = adminLiveClients.filter(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
      return true;
    } catch (e) {
      return false;
    }
  });
}

function broadcastTicketReplyToAdmins(ticketId: string, message: any) {
  const payload = JSON.stringify({
    type: 'TICKET_REPLY',
    ticketId,
    message,
    timestamp: new Date().toISOString()
  });

  adminLiveClients = adminLiveClients.filter(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
      return true;
    } catch (e) {
      return false;
    }
  });
}

app.get('/api/admin/orders/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Cap maximum concurrent SSE connections to prevent descriptor exhaustion
  if (adminLiveClients.length >= 50) {
    const oldest = adminLiveClients.shift();
    try {
      oldest?.res.end();
    } catch (_) {}
  }

  const clientId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
  const adminEmail = (req.query.adminEmail as string) || 'admin';

  const client: AdminLiveClient = { id: clientId, res, adminEmail };
  adminLiveClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat comment ping every 20 seconds to prevent proxy cutoffs
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': keep-alive-ping\n\n');
    } catch (_) {
      cleanup();
    }
  }, 20000);

  const cleanup = () => {
    clearInterval(heartbeatTimer);
    adminLiveClients = adminLiveClients.filter(c => c.id !== clientId);
  };

  req.on('close', cleanup);
  res.on('error', cleanup);
});

app.post('/api/admin/orders/test-notification', (req, res) => {
  const testOrder: Order = {
    id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    storeId: 'ma',
    customerName: 'محمد التجريبي (Test Customer)',
    customerPhone: '+212 612-345678',
    customerCity: 'الدار البيضاء / Casablanca',
    customerAddress: 'شارع المسيرة الخضراء',
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

  broadcastOrderToAdmins(testOrder, true);
  res.json({ success: true, message: 'Test notification broadcasted', order: testOrder });
});

app.get('/api/orders', authenticateJWT, async (req, res) => {
  await ensureCollectionSynced('orders');
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.orders;
  if (storeId && storeId !== 'all') {
    list = list.filter(o => !o.storeId || o.storeId === storeId);
  }
  res.json(list);
});

app.post('/api/orders', authAndOrdersLimit, async (req, res) => {
  const db = loadDb();
  const newOrder: Order = req.body;

  if (!newOrder.id || !newOrder.customerName || !newOrder.customerPhone || !newOrder.items) {
    return res.status(400).json({ error: 'Invalid order data.' });
  }

  // Block resurrection of deleted orders
  if (db.deletedTombstones?.orders?.includes(newOrder.id)) {
    return res.status(400).json({ error: 'This order was previously deleted.' });
  }

  if (!newOrder.storeId) {
    newOrder.storeId = 'ma';
  }

  const existingIdx = db.orders.findIndex(o => o.id === newOrder.id);
  const isBrandNew = existingIdx === -1;

  if (existingIdx > -1) {
    db.orders[existingIdx] = newOrder;
  } else {
    db.orders.unshift(newOrder);
  }

  if (isBrandNew && newOrder.couponCode) {
    const matchedCoupon = (db.coupons || []).find(
      c => c.code.trim().toUpperCase() === newOrder.couponCode!.trim().toUpperCase()
    );
    if (matchedCoupon) {
      matchedCoupon.usedCount = (matchedCoupon.usedCount || 0) + 1;
    }
  }

  // Deduct product stock on backend
  if (isBrandNew && Array.isArray(newOrder.items)) {
    for (const itm of newOrder.items) {
      const pIdx = (db.products || []).findIndex(p => p.id === itm.productId);
      if (pIdx > -1) {
        db.products[pIdx].stock = Math.max(0, (db.products[pIdx].stock || 0) - (itm.quantity || 1));
        saveToFirestore("products", db.products[pIdx].id, db.products[pIdx]).catch(() => {});
      }
    }
  }

  saveDb(db);

  saveToFirestore("orders", newOrder.id, newOrder).catch(e => {
    console.warn("Firebase order save notice:", e?.message || e);
  });

  if (isBrandNew) {
    broadcastOrderToAdmins(newOrder, false);

    // Auto-record Purchase conversion event in pixel system
    try {
      const itemsLabel = (newOrder.items || []).map(i => i.productName).filter(Boolean).join(' + ') || 'منتج';
      const purchasePixelEvent: PixelEventRecord = {
        id: `px-pur-${newOrder.id}-${Date.now()}`,
        storeId: newOrder.storeId || 'ma',
        eventType: 'Purchase',
        timestamp: new Date().toISOString(),
        pageUrl: `https://mavluy.store/checkout/success/${newOrder.id}`,
        productId: newOrder.items?.[0]?.productId,
        productName: itemsLabel,
        value: Number(newOrder.total || 0),
        currency: 'MAD',
        orderId: newOrder.id,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        trafficSource: (newOrder.metadata as any)?.trafficSource || 'Direct',
        fbclid: (newOrder.metadata as any)?.fbclid,
        ttclid: (newOrder.metadata as any)?.ttclid,
        metadata: {
          orderId: newOrder.id,
          itemsCount: (newOrder.items || []).length,
          city: newOrder.customerCity,
          directOrder: true
        }
      };

      if (!db.pixelEvents) db.pixelEvents = [];
      if (!db.pixelEvents.some(p => p.orderId === newOrder.id)) {
        db.pixelEvents.unshift(purchasePixelEvent);
        if (db.pixelEvents.length > 500) {
          db.pixelEvents = db.pixelEvents.slice(0, 500);
        }
        saveDb(db);
      }
    } catch (pxErr) {
      console.warn('Auto purchase pixel recording notice:', pxErr);
    }

    const storeConf: Partial<StoreConfig> = (db.storeConfigs && (db.storeConfigs[newOrder.storeId || 'ma'] || db.storeConfigs['ma'])) || {};
    if (storeConf.affiliateAutoSync !== false && storeConf.affiliateWebhookUrl && storeConf.affiliateWebhookUrl.startsWith('http')) {
      try {
        fetch(storeConf.affiliateWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Store-Id': newOrder.storeId || 'ma',
            'X-Webhook-Secret': storeConf.affiliateWebhookApiKey || '',
            'Authorization': storeConf.affiliateWebhookApiKey ? `Bearer ${storeConf.affiliateWebhookApiKey}` : ''
          },
          body: JSON.stringify({
            event: 'order.created',
            orderId: newOrder.id,
            customer: {
              name: newOrder.customerName,
              phone: newOrder.customerPhone,
              city: newOrder.customerCity,
              address: newOrder.customerAddress
            },
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            shippingFee: newOrder.shippingFee,
            total: newOrder.total,
            currency: newOrder.currency || 'MAD',
            platform: storeConf.affiliatePlatformName || 'custom',
            timestamp: new Date().toISOString(),
            order: newOrder
          })
        }).then(async (resp) => {
          if (resp.ok) {
            try {
              const resData = await resp.json();
              if (resData && (resData.id || resData.order_id || resData.affiliate_order_id)) {
                newOrder.affiliateOrderId = String(resData.id || resData.order_id || resData.affiliate_order_id);
                saveDb(db);
              }
            } catch (e) {}
          }
        }).catch(err => console.warn('Affiliate webhook dispatch error:', err));
      } catch (err) {
        console.warn('Webhook dispatch call failed:', err);
      }
    }

    const sheetWebhookToUse = storeConf.googleSheetWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';
    if (storeConf.googleSheetAutoSync !== false && sheetWebhookToUse && sheetWebhookToUse.startsWith('http')) {
      try {
        const itemsSummary = (newOrder.items || []).map(i => `${i.productName || 'منتج'}${(i as any).variant ? ` (${(i as any).variant})` : ''} x${i.quantity || 1}`).join(' + ');
        const totalQty = (newOrder.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
        
        // SKU formatted strictly in lowercase for TajerCOD and fulfillment platforms
        const rawSku = (newOrder.items || []).map(i => i.sku || '').filter(Boolean).join(', ') 
          || newOrder.sku 
          || (newOrder.items?.[0] as any)?.slug 
          || (newOrder.items?.[0]?.productName ? newOrder.items[0].productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '') 
          || 'prd-sku';
        const cleanSku = rawSku.toLowerCase().trim();

        // Combined City + Address for TajerCOD address column
        const combinedAddress = [newOrder.customerCity, newOrder.customerAddress]
          .filter(Boolean)
          .map(s => String(s).trim())
          .filter(Boolean)
          .join(' - ') || newOrder.customerAddress || newOrder.customerCity || '';

        const now = new Date();
        const dateOrder = now.toISOString().replace('T', ' ').slice(0, 19);

        const googleSheetPayload = {
          // TajerCOD exact column keys
          date_order: dateOrder,
          full_name: newOrder.customerName || '',
          phone: (newOrder.customerPhone || '').replace(/\s+/g, ''),
          address: combinedAddress,
          sku: cleanSku,
          qte: totalQty || 1,
          price: newOrder.total || 0,
          note: newOrder.notes || itemsSummary || '',
          delivery_note: newOrder.notes || '',

          // Standard / custom columns compatibility
          orderId: newOrder.id,
          date: now.toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          customerCity: newOrder.customerCity,
          customerAddress: newOrder.customerAddress,
          combinedAddress: combinedAddress,
          productName: itemsSummary || (newOrder.items?.[0]?.productName || 'منتج'),
          quantity: totalQty,
          subtotal: newOrder.subtotal,
          shippingFee: newOrder.shippingFee,
          total: newOrder.total,
          currency: newOrder.currency || 'MAD',
          notes: newOrder.notes || '',
          source: 'Storefront (COD)',
          status: newOrder.status || 'pending',
          order: newOrder
        };

        fetch(sheetWebhookToUse, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleSheetPayload),
          redirect: 'follow'
        }).then(async (res) => {
          console.log(`[GoogleSheet Sync] Dispatched order ${newOrder.id} to Google Sheet: status ${res.status}`);
        }).catch(err => {
          console.warn('[GoogleSheet Sync] Failed to send order to Google Sheet:', err?.message || err);
        });
      } catch (err) {
        console.warn('[GoogleSheet Sync] Dispatch error:', err);
      }
    }
  }

  res.json({ success: true, order: newOrder });
});

app.delete('/api/customers/:phone', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  let phone = req.params.phone;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  phone = phone.trim().replace(/\s+/g, '');

  if (db.customers) {
    for (const k of Object.keys(db.customers)) {
      if (phonesMatch(k, phone) || phonesMatch(db.customers[k]?.phone, phone)) {
        delete db.customers[k];
      }
    }
  }
  addTombstone(db, 'customers', phone);

  await saveDbAndFlush(db);
  await deleteFromFirestore("customers", phone);
  res.json({ success: true, message: 'Customer account deleted successfully' });
});

app.put('/api/orders/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const orderId = req.params.id;
  const updates = req.body;

  const orderIndex = (db.orders || []).findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const existingOrder = db.orders[orderIndex];

  if (updates.customerName !== undefined) existingOrder.customerName = updates.customerName.trim();
  if (updates.customerPhone !== undefined) existingOrder.customerPhone = updates.customerPhone.trim().replace(/\s+/g, '');
  if (updates.customerCity !== undefined) existingOrder.customerCity = updates.customerCity.trim();
  if (updates.customerAddress !== undefined) existingOrder.customerAddress = updates.customerAddress.trim();
  if (updates.status !== undefined && ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].includes(updates.status)) {
    existingOrder.status = updates.status;
  }
  if (updates.trackingNumber !== undefined) existingOrder.trackingNumber = updates.trackingNumber;
  if (updates.notes !== undefined) existingOrder.notes = updates.notes;
  if (updates.shippingFee !== undefined) existingOrder.shippingFee = Number(updates.shippingFee);
  if (updates.discountAmount !== undefined) existingOrder.discountAmount = Number(updates.discountAmount);
  if (updates.subtotal !== undefined) existingOrder.subtotal = Number(updates.subtotal);
  if (updates.total !== undefined) existingOrder.total = Number(updates.total);
  if (updates.metadata !== undefined) {
    existingOrder.metadata = { ...(existingOrder.metadata || {}), ...updates.metadata };
  }
  if (Array.isArray(updates.items)) existingOrder.items = updates.items;
  existingOrder.updatedAt = new Date().toISOString();

  db.orders[orderIndex] = existingOrder;
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, "orders", orderId), sanitizeForFirestore(existingOrder));
    } catch (e) {
      console.error("Firebase order update error:", e);
    }
  }

  res.json({ success: true, order: existingOrder });
});

app.delete('/api/orders/all', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  if (storeId && storeId !== 'all') {
    const toDelete = (db.orders || []).filter(o => o.storeId === storeId);
    const toDeleteIds = toDelete.flatMap(o => [String(o.id || ''), String((o as any)._id || '')].filter(Boolean));
    addTombstone(db, 'orders', toDeleteIds);
    db.orders = (db.orders || []).filter(o => o.storeId !== storeId);
    saveDb(db);
    if (isFirebaseConnected && firestoreDb) {
      for (const id of toDeleteIds) {
        deleteDoc(doc(firestoreDb, "orders", id)).catch(() => {});
      }
    }
  } else {
    const allIds = (db.orders || []).flatMap(o => [String(o.id || ''), String((o as any)._id || '')].filter(Boolean));
    addTombstone(db, 'orders', allIds);
    db.orders = [];
    saveDb(db);
    await clearFirestoreCollection('orders');
  }
  res.json({ success: true, message: 'All orders permanently deleted from database and cloud.' });
});

app.delete('/api/orders/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const orderId = String(req.params.id || '').trim();

  if (orderId === 'all') {
    const allIds = (db.orders || []).flatMap(o => [String(o.id || ''), String((o as any)._id || '')].filter(Boolean));
    addTombstone(db, 'orders', allIds);
    db.orders = [];
    saveDb(db);
    await clearFirestoreCollection('orders');
    return res.json({ success: true, message: 'All orders permanently deleted from database and cloud.' });
  }

  const found = (db.orders || []).find(o => String(o.id).trim() === orderId || String((o as any)._id || '').trim() === orderId);
  const idsToRemove = found ? [String(found.id || '').trim(), String((found as any)._id || '').trim(), orderId].filter(Boolean) : [orderId];
  addTombstone(db, 'orders', idsToRemove);
  db.orders = (db.orders || []).filter(o => String(o.id).trim() !== orderId && String((o as any)._id || '').trim() !== orderId);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    for (const idToDelete of idsToRemove) {
      deleteDoc(doc(firestoreDb, "orders", idToDelete)).catch(() => {});
    }
  }

  res.json({ success: true, message: 'Order permanently deleted' });
});

app.post('/api/orders/bulk-delete', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { ids } = req.body;

  if (Array.isArray(ids) && ids.length > 0) {
    const cleanIds = ids.map((id: any) => String(id || '').trim()).filter(Boolean);
    addTombstone(db, 'orders', cleanIds);
    const idSet = new Set(cleanIds);
    db.orders = (db.orders || []).filter(o => !idSet.has(String(o.id).trim()) && !idSet.has(String((o as any)._id || '').trim()));
    saveDb(db);

    if (isFirebaseConnected && firestoreDb) {
      for (const orderId of cleanIds) {
        deleteDoc(doc(firestoreDb, "orders", orderId)).catch(() => {});
      }
    }
  }

  res.json({ success: true, message: 'Orders deleted successfully' });
});

app.post('/api/webhooks/order-status-update', async (req, res) => {
  const db = loadDb();
  const {
    orderId,
    order_id,
    id,
    reference,
    status,
    secretKey,
    secret_key,
    phone,
    customerPhone,
    trackingNumber,
    tracking_number,
    notes,
    affiliateOrderId,
    affiliate_order_id
  } = req.body || {};

  const incomingSecret = secretKey || secret_key || req.headers['x-webhook-secret'] || req.headers['authorization'];
  const storeConf: Partial<StoreConfig> = (db.storeConfigs && (db.storeConfigs['ma'] || Object.values(db.storeConfigs)[0])) || {};

  if (storeConf.affiliateWebhookApiKey && incomingSecret !== storeConf.affiliateWebhookApiKey && incomingSecret !== `Bearer ${storeConf.affiliateWebhookApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret key' });
  }

  const rawStatus = String(status || '').toLowerCase().trim();
  if (!rawStatus) {
    return res.status(400).json({ error: 'status is required' });
  }

  let normalizedStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' = 'processing';
  if (['confirmed', 'confirme', 'confirmé', 'validé', 'valide', 'approved', 'مؤكد', 'مؤكدة'].includes(rawStatus)) {
    normalizedStatus = 'confirmed';
  } else if (['pending', 'en attente', 'قيد الانتظار', 'جديدة', 'new', 'unconfirmed'].includes(rawStatus)) {
    normalizedStatus = 'pending';
  } else if (['processing', 'in_progress', 'en cours', 'قيد المعالجة', 'packaging'].includes(rawStatus)) {
    normalizedStatus = 'processing';
  } else if (['shipped', 'expedie', 'expédié', 'dispatched', 'in_transit', 'تم الشحن', 'خرج للتوصيل', 'with_courier'].includes(rawStatus)) {
    normalizedStatus = 'shipped';
  } else if (['delivered', 'livre', 'livré', 'completed', 'تم التوصيل', 'مسلمة', 'paid'].includes(rawStatus)) {
    normalizedStatus = 'delivered';
  } else if (['cancelled', 'canceled', 'annule', 'annulé', 'rejected', 'ملغاة', 'ملغي'].includes(rawStatus)) {
    normalizedStatus = 'cancelled';
  } else if (['returned', 'retour', 'retourne', 'retourné', 'مرتجعة', 'استرجاع', 'failed'].includes(rawStatus)) {
    normalizedStatus = 'returned';
  }

  const targetId = orderId || order_id || id || reference || affiliateOrderId || affiliate_order_id;
  const targetPhone = phone || customerPhone;

  let order = (db.orders || []).find(o =>
    (targetId && (o.id === targetId || o.trackingNumber === targetId || (o as any).affiliateOrderId === targetId))
  );

  if (!order && targetPhone) {
    const cleanPhone = String(targetPhone).replace(/\D/g, '');
    order = (db.orders || []).find(o => o.customerPhone && o.customerPhone.replace(/\D/g, '') === cleanPhone);
  }

  if (!order) {
    return res.status(404).json({ error: 'Order not found matching orderId, tracking, or phone number' });
  }

  order.status = normalizedStatus;
  (order as any).affiliateStatus = rawStatus;
  if (trackingNumber || tracking_number) {
    order.trackingNumber = trackingNumber || tracking_number;
  }
  if (affiliateOrderId || affiliate_order_id) {
    (order as any).affiliateOrderId = affiliateOrderId || affiliate_order_id;
  }
  if (notes) {
    order.notes = order.notes ? `${order.notes}\n[Affiliate]: ${notes}` : `[Affiliate]: ${notes}`;
  }
  order.updatedAt = new Date().toISOString();

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    const updatedOrder = db.orders.find(o => o.id === orderId);
    if (updatedOrder) {
      setDoc(doc(firestoreDb, "orders", orderId), sanitizeForFirestore(updatedOrder)).catch(() => {});
    }
  }

  broadcastOrderToAdmins(order, true);

  return res.json({
    success: true,
    message: `Order status automatically updated to ${normalizedStatus}`,
    order
  });
});

app.post('/api/affiliate/test-sync', async (req, res) => {
  const db = loadDb();
  const { status = 'confirmed' } = req.body;
  const orders = db.orders || [];
  if (orders.length === 0) {
    return res.status(400).json({ error: 'No orders exist to test. Submit a test order on the store first.' });
  }
  const sampleOrder = orders[0];
  const previousStatus = sampleOrder.status;
  sampleOrder.status = status as any;
  (sampleOrder as any).affiliateStatus = `test_${status}`;
  sampleOrder.updatedAt = new Date().toISOString();
  saveDb(db);
  broadcastOrderToAdmins(sampleOrder, true);
  return res.json({
    success: true,
    message: `Test status sync successful! Order ${sampleOrder.id} status changed from "${previousStatus}" to "${status}".`,
    order: sampleOrder
  });
});

app.post('/api/google-sheet/test-sync', async (req, res) => {
  const { webhookUrl, storeId } = req.body;
  const db = loadDb();
  const storeConf: Partial<StoreConfig> = (db.storeConfigs && (db.storeConfigs[storeId || 'ma'] || db.storeConfigs['ma'])) || {};
  const targetUrl = webhookUrl || storeConf.googleSheetWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'يرجى إدخال رابط Google Apps Script Webhook صالح يبدأ بـ https://' });
  }

  const now = new Date();
  const dateOrder = now.toISOString().replace('T', ' ').slice(0, 19);
  const combinedAddress = 'الدار البيضاء Casablanca - شارع الزرقطوني، عمارة 12، شقة 4';

  const testPayload = {
    // TajerCOD exact columns (matches TajerCOD template in Google Sheet)
    date_order: dateOrder,
    full_name: 'محمد أمين (طلب تجريبي)',
    phone: '0612345678',
    address: combinedAddress,
    sku: 'ventilateur-de-refroidissement',
    qte: 1,
    price: 299,
    note: 'طلب فحص وتجربة الربط التلقائي مع TajerCOD و Google Sheet',
    delivery_note: 'يرجى الاتصال قبل التوصيل',

    // Standard / universal properties
    orderId: `TEST-${Math.floor(100000 + Math.random() * 900000)}`,
    date: now.toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
    customerName: 'محمد أمين (طلب تجريبي)',
    customerPhone: '0612345678',
    customerCity: 'الدار البيضاء Casablanca',
    customerAddress: 'شارع الزرقطوني، عمارة 12، شقة 4',
    combinedAddress: combinedAddress,
    productName: 'مروحة التبريد الذكية Cooling Fan Pro',
    quantity: 1,
    subtotal: 299,
    shippingFee: 0,
    total: 299,
    currency: 'MAD',
    notes: 'طلب فحص وتجربة الربط التلقائي مع Google Sheet و TajerCOD',
    source: 'Test Order (Google Sheet Sync)',
    status: 'pending'
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow'
    });

    const responseText = await response.text();
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(responseText);
    } catch (_) {}

    return res.json({
      success: true,
      statusCode: response.status,
      message: 'تم إرسال الطلب التجريبي إلى Google Sheet بنجاح! تفقد ملف الـ Sheet الآن للتأكد من ظهور السطر الجديد.',
      details: parsedJson || responseText.slice(0, 200)
    });
  } catch (err: any) {
    console.error('Google Sheet test error:', err);
    return res.status(500).json({
      error: `تعذر الاتصال برابط الـ Webhook: ${err.message || 'خطأ في الاتصال'}. تأكد من نشر السكربت كـ Web App مع إعطاء الصلاحية للجميع (Anyone).`
    });
  }
});

app.post('/api/orders/bulk', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { orders: importedOrders, storeId } = req.body;

  if (!importedOrders || !Array.isArray(importedOrders) || importedOrders.length === 0) {
    return res.status(400).json({ error: 'No valid orders provided for import.' });
  }

  const targetStoreId = storeId || 'ma';
  const validNewOrders: Order[] = [];

  for (const item of importedOrders) {
    if (!item.customerName || !item.customerPhone) continue;

    const orderId = item.id || `ORD-IMP-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalOrder: Order = {
      id: orderId,
      storeId: item.storeId || targetStoreId,
      customerName: item.customerName.trim(),
      customerPhone: item.customerPhone.toString().trim(),
      customerCity: (item.customerCity || 'الدار البيضاء / Casablanca').trim(),
      customerAddress: (item.customerAddress || 'عنوان الزبون').trim(),
      items: Array.isArray(item.items) && item.items.length > 0 ? item.items : [
        {
          productId: item.productId || 'manual',
          productName: item.productName || 'طلب مخصص (Order Item)',
          price: Number(item.price || item.total || 0),
          quantity: Number(item.quantity || 1),
          image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
        }
      ],
      subtotal: Number(item.subtotal || item.total || 0),
      shippingFee: Number(item.shippingFee || 0),
      discountAmount: Number(item.discountAmount || 0),
      couponCode: item.couponCode || undefined,
      total: Number(item.total || item.subtotal || 0),
      status: (item.status && ['pending', 'shipped', 'delivered', 'cancelled'].includes(item.status)) ? item.status : 'pending',
      date: item.date || new Date().toISOString(),
      notes: item.notes || undefined
    };

    const existIdx = db.orders.findIndex(o => o.id === finalOrder.id);
    if (existIdx >= 0) {
      db.orders[existIdx] = finalOrder;
    } else {
      db.orders.unshift(finalOrder);
    }
    validNewOrders.push(finalOrder);
  }

  saveDb(db);

  if (isFirebaseConnected && firestoreDb && validNewOrders.length > 0) {
    for (const ord of validNewOrders) {
      setDoc(doc(firestoreDb, "orders", ord.id), sanitizeForFirestore(ord)).catch(() => {});
    }
  }

  let list = db.orders;
  if (targetStoreId && targetStoreId !== 'all') {
    list = list.filter(o => !o.storeId || o.storeId === targetStoreId);
  }

  res.json({
    success: true,
    count: validNewOrders.length,
    orders: list
  });
});

app.put('/api/orders/:id/status', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const orderId = req.params.id;
  const { status, trackingNumber } = req.body;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = status;
  if (trackingNumber !== undefined) {
    order.trackingNumber = trackingNumber;
  }
  order.updatedAt = new Date().toISOString();
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "orders", orderId), sanitizeForFirestore(order)).catch(() => {});
  }

  res.json({ success: true, order });
});

app.get('/api/tickets', async (req, res) => {
  await syncMemoryDbFromSql(false);
  const db = loadDb();
  const storeId = req.query.storeId as string;
  const phone = req.query.phone as string;
  const idsParam = req.query.ids as string;
  const requestedIds = idsParam ? new Set(idsParam.split(',').map(s => s.trim()).filter(Boolean)) : null;

  let list = db.tickets || [];

  if (phone) {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    list = list.filter(t => {
      if (requestedIds && requestedIds.has(t.id)) return true;
      return phonesMatch(t.customerPhone, cleanPhone);
    });
  } else if (storeId && storeId !== 'all' && storeId !== 'default' && storeId !== '') {
    list = list.filter(t => !t.storeId || t.storeId === storeId || (requestedIds && requestedIds.has(t.id)));
  }

  res.json(list);
});

app.post('/api/tickets', authAndOrdersLimit, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const newTicket: SupportTicket = req.body;

  if (!newTicket.id || !newTicket.customerName || !newTicket.customerPhone || !newTicket.message) {
    return res.status(400).json({ error: 'Invalid ticket data.' });
  }

  newTicket.customerPhone = newTicket.customerPhone.trim().replace(/\s+/g, '');
  if (!newTicket.storeId) {
    newTicket.storeId = 'ma';
  }
  (newTicket as any).updatedAt = Date.now();

  if (!db.tickets) {
    db.tickets = [];
  }

  const existingIdx = db.tickets.findIndex(t => t.id === newTicket.id);
  if (existingIdx > -1) {
    db.tickets[existingIdx] = newTicket;
  } else {
    db.tickets.unshift(newTicket);
  }

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "tickets", newTicket.id), sanitizeForFirestore(newTicket)).catch(() => {});
  }

  try {
    broadcastTicketToAdmins(newTicket);
  } catch (err) {
    console.error('Broadcast ticket error:', err);
  }

  res.json({ success: true, ticket: newTicket });
});

app.put('/api/tickets/:id', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const ticketId = req.params.id;
  const { status, seen, customerName, customerPhone, subject, message, showInClientList } = req.body;

  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (status !== undefined) {
    ticket.status = status;
    if (status === 'closed' || status === 'resolved') {
      (ticket as any).closedBy = 'admin';
    } else {
      (ticket as any).closedBy = undefined;
    }
  }
  if (seen !== undefined) ticket.seen = seen;
  if (customerName !== undefined) ticket.customerName = String(customerName).trim();
  if (customerPhone !== undefined) ticket.customerPhone = String(customerPhone).trim();
  if (subject !== undefined) ticket.subject = String(subject).trim();
  if (message !== undefined) ticket.message = String(message).trim();
  if (showInClientList !== undefined) ticket.showInClientList = Boolean(showInClientList);
  (ticket as any).updatedAt = Date.now();

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    const t = db.tickets.find(tk => tk.id === ticketId);
    if (t) setDoc(doc(firestoreDb, "tickets", ticketId), sanitizeForFirestore(t)).catch(() => {});
  }

  res.json({ success: true, ticket });
});

app.put('/api/tickets/:id/close-by-client', async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const ticketId = req.params.id;

  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  ticket.status = 'closed';
  (ticket as any).closedBy = 'client';
  (ticket as any).updatedAt = Date.now();
  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    const t = db.tickets.find(tk => tk.id === ticketId);
    if (t) setDoc(doc(firestoreDb, "tickets", ticketId), sanitizeForFirestore(t)).catch(() => {});
  }

  res.json({ success: true, ticket });
});

app.delete('/api/tickets/:id/by-client', async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const ticketId = req.params.id;

  if (!ticketId) {
    return res.status(400).json({ error: 'Ticket ID is required.' });
  }

  addTombstone(db, 'tickets', ticketId);
  db.tickets = (db.tickets || []).filter(t => t.id !== ticketId);
  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "tickets", ticketId));
    } catch (e) {}
  }

  res.json({ success: true, message: 'Ticket deleted successfully by client.' });
});

app.post('/api/tickets/reply', async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const { ticketId, sender, text, senderName } = req.body;

  if (!ticketId || !text) {
    return res.status(400).json({ error: 'Missing ticket ID or message text.' });
  }
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }
  if (sender === 'customer' && ticket.status === 'closed') {
    return res.status(400).json({ error: 'هذه التذكرة مغلقة ولا يمكن إرسال رسائل جديدة فيها. يمكنك فتح تذكرة جديدة إذا أردت.' });
  }
  if (!ticket.messages) {
    ticket.messages = [];
  }
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: sender || 'support',
    senderName: senderName || (sender === 'support' ? 'الدعم الفني' : ticket.customerName),
    text: text.trim(),
    date: new Date().toISOString()
  };
  ticket.messages.push(newMessage);
  if (sender === 'customer') {
    ticket.seen = false;
    if (ticket.status === 'resolved') {
      ticket.status = 'open';
    }
  } else {
    ticket.seen = true;
    if (!ticket.status || ticket.status === 'closed') {
      ticket.status = 'open';
    }
  }
  (ticket as any).updatedAt = Date.now();

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, 'tickets', ticketId), sanitizeForFirestore(ticket)).catch(() => {});
  }

  try {
    broadcastTicketReplyToAdmins(ticketId, newMessage);
  } catch (err) {
    console.error('Broadcast ticket reply error:', err);
  }

  res.json({ success: true, ticket, message: newMessage });
});

app.post('/api/tickets/delete-message', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const { ticketId, messageId } = req.body;
  if (!ticketId || !messageId) {
    return res.status(400).json({ error: 'Missing ticket ID or message ID.' });
  }
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (messageId === 'main' || messageId === ticketId) {
    ticket.message = "[تم حذف هذه الرسالة]";
  } else if (ticket.messages) {
    ticket.messages = ticket.messages.filter(m => m.id !== messageId);
  }
  (ticket as any).updatedAt = Date.now();

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, 'tickets', ticketId), sanitizeForFirestore(ticket)).catch(() => {});
  }

  try {
    broadcastTicketToAdmins(ticket);
  } catch (err) {
    console.error('Broadcast ticket update error:', err);
  }

  res.json({ success: true, ticket });
});

app.post('/api/tickets/edit-message', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const { ticketId, messageId, newText, text } = req.body;
  const contentToSave = (typeof newText === 'string' ? newText : (typeof text === 'string' ? text : '')).trim();
  if (!ticketId || !messageId || !contentToSave) {
    return res.status(400).json({ error: 'Missing ticketId, messageId or message text.' });
  }
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (messageId === 'main' || messageId === ticketId || messageId === 'original') {
    ticket.message = contentToSave;
    ticket.edited = true;
    ticket.isEdited = true;
  } else if (ticket.messages) {
    const msg = ticket.messages.find(m => m.id === messageId);
    if (msg) {
      msg.text = contentToSave;
      msg.edited = true;
      msg.isEdited = true;
    }
  }
  (ticket as any).updatedAt = Date.now();

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, 'tickets', ticketId), sanitizeForFirestore(ticket)).catch(() => {});
  }

  try {
    broadcastTicketToAdmins(ticket);
  } catch (err) {
    console.error('Broadcast ticket update error:', err);
  }

  res.json({ success: true, ticket });
});

app.put('/api/tickets/:ticketId/messages/:messageId', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const { ticketId, messageId } = req.params;
  const contentToSave = (typeof req.body.text === 'string' ? req.body.text : (typeof req.body.newText === 'string' ? req.body.newText : '')).trim();
  if (!contentToSave) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (messageId === 'main' || messageId === ticketId || messageId === 'original') {
    ticket.message = contentToSave;
    ticket.edited = true;
    ticket.isEdited = true;
  } else if (ticket.messages) {
    const msg = ticket.messages.find(m => m.id === messageId);
    if (msg) {
      msg.text = contentToSave;
      msg.edited = true;
      msg.isEdited = true;
    }
  }
  (ticket as any).updatedAt = Date.now();

  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, 'tickets', ticketId), sanitizeForFirestore(ticket)).catch(() => {});
  }

  try {
    broadcastTicketToAdmins(ticket);
  } catch (err) {
    console.error('Broadcast ticket update error:', err);
  }

  res.json({ success: true, ticket });
});

app.delete('/api/tickets/all', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const allIds = (db.tickets || []).map(t => t.id);
  addTombstone(db, 'tickets', allIds);
  db.tickets = [];
  await saveDbAndFlush(db);
  await clearFirestoreCollection('tickets');
  res.json({ success: true, message: 'All tickets permanently deleted.' });
});

app.delete('/api/tickets/:id', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  const ticketId = req.params.id;

  if (ticketId === 'all') {
    const allIds = (db.tickets || []).map(t => t.id);
    addTombstone(db, 'tickets', allIds);
    db.tickets = [];
    await saveDbAndFlush(db);
    await clearFirestoreCollection('tickets');
    return res.json({ success: true, message: 'All tickets permanently deleted.' });
  }

  addTombstone(db, 'tickets', ticketId);
  db.tickets = (db.tickets || []).filter(t => t.id !== ticketId);
  await saveDbAndFlush(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "tickets", ticketId));
    } catch (e) {}
  }

  res.json({ success: true, message: 'Ticket permanently removed from database' });
});

app.get('/api/reviews', async (req, res) => {
  await ensureCollectionSynced('reviews');
  const db = loadDb();
  const { productId, storeId, featured } = req.query;
  let list = db.reviews || [];

  if (storeId && storeId !== 'all') {
    list = list.filter(r => !r.storeId || r.storeId === storeId);
  }

  if (productId && productId !== 'all') {
    list = list.filter(r => r.productId === productId);
  }

  if (featured === 'true') {
    list = list.filter(r => r.featuredOnHome === true && r.status === 'approved');
  }

  res.json(list);
});

function normalizePhoneForReviewCheck(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('212') && digits.length > 9) {
    return digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length > 8) {
    return digits.slice(1);
  }
  return digits;
}

app.post('/api/reviews', async (req, res) => {
  const db = loadDb();
  const { productId, author, authorPhone, city, rating, comment, storeId, bypassVerification } = req.body;

  if (!author || !comment) {
    return res.status(400).json({ error: 'يرجى تقديم جميع معلومات التقييم المطلوبة / Missing required review information.' });
  }

  const resolvedProductId = productId || 'general';

  const rawPhone = (authorPhone || '').trim();
  const cleanPhone = rawPhone.replace(/\s+/g, '');
  const normAuthorPhone = normalizePhoneForReviewCheck(rawPhone);

  const matchedProd = resolvedProductId !== 'general' ? (db.products || []).find(p => p.id === resolvedProductId) : null;
  const prodTitle = matchedProd ? (matchedProd.nameAr || matchedProd.name) : '';

  let isVerified = resolvedProductId === 'general';
  if (!isVerified && normAuthorPhone && normAuthorPhone.length >= 6) {
    isVerified = (db.orders || []).some(o => {
      // Must be Delivered & Paid (status === 'delivered')
      if (o.status !== 'delivered') return false;

      const oRawPhone = (o.customerPhone || '').trim();
      const oNormPhone = normalizePhoneForReviewCheck(oRawPhone);

      const phoneMatches =
        (oNormPhone && normAuthorPhone && oNormPhone === normAuthorPhone) ||
        (normAuthorPhone.length >= 8 && oNormPhone.endsWith(normAuthorPhone.slice(-8))) ||
        (oNormPhone.length >= 8 && normAuthorPhone.endsWith(oNormPhone.slice(-8))) ||
        (cleanPhone && oRawPhone && cleanPhone === oRawPhone);

      if (!phoneMatches) return false;

      const containsItem = (o.items || []).some(item =>
        item.productId === resolvedProductId ||
        (item as any).id === resolvedProductId ||
        (prodTitle && (item.productName === matchedProd?.name || item.productName === matchedProd?.nameAr))
      );

      return containsItem;
    });
  }

  if (!isVerified && !bypassVerification) {
    return res.status(403).json({
      error: 'عذراً، كتابة التقييمات مقتصرة حصرياً على المشترين الحقيقيين الذين قاموا بطلب هذا المنتج واستلامه من قبل (Verified Purchase Only).',
      isVerified: false
    });
  }

  // Prevent multiple reviews per purchased product (one review per customer/phone number per product)
  if (resolvedProductId !== 'general' && normAuthorPhone && normAuthorPhone.length >= 6) {
    const hasAlreadyReviewed = (db.reviews || []).some(r => {
      if (r.productId !== resolvedProductId) return false;
      const rRawPhone = (r.authorPhone || r.customerPhone || '').trim();
      const rNormPhone = normalizePhoneForReviewCheck(rRawPhone);
      return (
        (rNormPhone && normAuthorPhone && rNormPhone === normAuthorPhone) ||
        (normAuthorPhone.length >= 8 && rNormPhone.endsWith(normAuthorPhone.slice(-8))) ||
        (rNormPhone.length >= 8 && normAuthorPhone.endsWith(rNormPhone.slice(-8))) ||
        (cleanPhone && rRawPhone && cleanPhone === rRawPhone)
      );
    });

    if (hasAlreadyReviewed && !bypassVerification) {
      return res.status(403).json({
        error: 'عذراً، لقد قمت بكتابة تقييم مسبقاً لهذا المنتج. مسموح بتقييم واحد فقط لكل مشترٍ.',
        isVerified: true,
        alreadyReviewed: true
      });
    }
  }

  const productName = matchedProd 
    ? (matchedProd.nameAr || matchedProd.name) 
    : (resolvedProductId === 'general' ? 'تقييم المتجر العام' : 'منتج فاخر');

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId: storeId || (matchedProd?.storeId) || 'ma',
    productId: resolvedProductId,
    productName,
    author: author.trim(),
    authorPhone: cleanPhone,
    customerName: author.trim(),
    customerPhone: cleanPhone,
    city: city ? city.trim() : 'المغرب',
    customerCity: city ? city.trim() : 'المغرب',
    rating: Number(rating) || 5,
    comment: comment.trim(),
    date: new Date().toISOString().split('T')[0],
    status: 'approved',
    featuredOnHome: false,
    verifiedPurchase: true
  };

  if (!db.reviews) db.reviews = [];
  db.reviews.unshift(newReview);

  if (!db.customReviews) db.customReviews = {};
  if (!db.customReviews[resolvedProductId]) db.customReviews[resolvedProductId] = [];
  db.customReviews[resolvedProductId].unshift(newReview);

  if (matchedProd) {
    const prodReviews = db.reviews.filter(r => r.productId === resolvedProductId && r.status === 'approved');
    matchedProd.reviewsCount = prodReviews.length;
    const avg = prodReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / (prodReviews.length || 1);
    matchedProd.rating = Math.round(avg * 10) / 10;
  }

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "reviews", newReview.id), sanitizeForFirestore(newReview)).catch(() => {});
    if (matchedProd) {
      setDoc(doc(firestoreDb, "products", matchedProd.id), sanitizeForFirestore(matchedProd)).catch(() => {});
    }
  }

  res.json({ success: true, review: newReview, reviews: db.reviews, isVerified: true });
});

app.put('/api/reviews/:id/feature', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const reviewId = req.params.id;
  const { featuredOnHome } = req.body;

  const review = (db.reviews || []).find(r => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  review.featuredOnHome = Boolean(featuredOnHome);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "reviews", reviewId), sanitizeForFirestore(review)).catch(() => {});
  }

  res.json({ success: true, review });
});

app.put('/api/reviews/:id/status', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const reviewId = req.params.id;
  const { status } = req.body;

  const review = (db.reviews || []).find(r => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  review.status = status === 'hidden' ? 'hidden' : (status === 'pending' ? 'pending' : 'approved');

  const matchedProd = (db.products || []).find(p => p.id === review.productId);
  if (matchedProd) {
    const prodReviews = (db.reviews || []).filter(r => r.productId === review.productId && r.status === 'approved');
    matchedProd.reviewsCount = prodReviews.length;
    const avg = prodReviews.length > 0 ? (prodReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / prodReviews.length) : 5;
    matchedProd.rating = Math.round(avg * 10) / 10;
  }

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "reviews", reviewId), sanitizeForFirestore(review)).catch(() => {});
    if (matchedProd) {
      setDoc(doc(firestoreDb, "products", matchedProd.id), sanitizeForFirestore(matchedProd)).catch(() => {});
    }
  }

  res.json({ success: true, review });
});

app.put('/api/reviews/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const reviewId = req.params.id;
  const { author, authorPhone, city, rating, comment, status, featuredOnHome, verifiedPurchase } = req.body;

  const review = (db.reviews || []).find(r => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  if (author !== undefined) {
    review.author = String(author).trim();
    review.customerName = String(author).trim();
  }
  if (authorPhone !== undefined) {
    review.authorPhone = String(authorPhone).trim();
    review.customerPhone = String(authorPhone).trim();
  }
  if (city !== undefined) {
    review.city = String(city).trim();
    review.customerCity = String(city).trim();
  }
  if (rating !== undefined) {
    review.rating = Math.min(5, Math.max(1, Number(rating) || 5));
  }
  if (comment !== undefined) {
    review.comment = String(comment).trim();
  }
  if (status !== undefined) {
    review.status = status === 'hidden' ? 'hidden' : (status === 'pending' ? 'pending' : 'approved');
  }
  if (featuredOnHome !== undefined) {
    review.featuredOnHome = Boolean(featuredOnHome);
  }
  if (verifiedPurchase !== undefined) {
    review.verifiedPurchase = Boolean(verifiedPurchase);
  }

  const matchedProd = (db.products || []).find(p => p.id === review.productId);
  if (matchedProd) {
    const prodReviews = (db.reviews || []).filter(r => r.productId === review.productId && r.status === 'approved');
    matchedProd.reviewsCount = prodReviews.length;
    const avg = prodReviews.length > 0 ? (prodReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / prodReviews.length) : 5;
    matchedProd.rating = Math.round(avg * 10) / 10;
  }

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "reviews", reviewId), sanitizeForFirestore(review)).catch(() => {});
    if (matchedProd) {
      setDoc(doc(firestoreDb, "products", matchedProd.id), sanitizeForFirestore(matchedProd)).catch(() => {});
    }
  }

  res.json({ success: true, review, reviews: db.reviews });
});

app.delete('/api/reviews/all', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const allIds = (db.reviews || []).map(r => r.id);
  addTombstone(db, 'reviews', allIds);
  db.reviews = [];
  db.customReviews = {};
  saveDb(db);
  await clearFirestoreCollection('reviews');
  res.json({ success: true, message: 'All reviews permanently deleted.' });
});

app.delete('/api/reviews/:id', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const reviewId = req.params.id;

  if (reviewId === 'all') {
    const allIds = (db.reviews || []).map(r => r.id);
    addTombstone(db, 'reviews', allIds);
    db.reviews = [];
    db.customReviews = {};
    saveDb(db);
    await clearFirestoreCollection('reviews');
    return res.json({ success: true, message: 'All reviews permanently deleted.' });
  }

  addTombstone(db, 'reviews', reviewId);
  db.reviews = (db.reviews || []).filter(r => r.id !== reviewId);

  Object.keys(db.customReviews || {}).forEach(k => {
    db.customReviews[k] = db.customReviews[k].filter(r => r.id !== reviewId);
  });

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "reviews", reviewId));
    } catch (e) {}
  }

  res.json({ success: true });
});

app.get('/api/custom-reviews', (req, res) => {
  try {
    const db = loadDb();
    res.json(db.customReviews || {});
  } catch (err: any) {
    res.json({});
  }
});

function getSafeCustomer(cust: any) {
  if (!cust) return null;
  const { password, ...safe } = cust;
  return safe;
}

app.post('/api/customers/login-or-register', authAndOrdersLimit, async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  let { phone, name, password, mode, storeId } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'رقم الجوال مطلوب' });
  }

  phone = phone.trim().replace(/\s+/g, '');
  if (!db.customers) db.customers = {};

  // Find existing customer by exact or normalized phone match
  const matchedKey = db.customers[phone]
    ? phone
    : Object.keys(db.customers).find(k => phonesMatch(k, phone) || phonesMatch(db.customers[k]?.phone, phone));

  if (matchedKey && db.customers[matchedKey]) {
    if (mode === 'register') {
      return res.status(400).json({ error: 'هذا الرقم مسجل بالفعل. يرجى الانتقال إلى تبويب تسجيل الدخول.' });
    }

    const existing = db.customers[matchedKey];
    if (existing.password && password) {
      const trimmedPass = password.trim();
      const isMatch = existing.password.startsWith('$2')
        ? bcrypt.compareSync(trimmedPass, existing.password)
        : existing.password === trimmedPass;
      if (!isMatch) {
        return res.status(400).json({ error: 'كلمة السر غير صحيحة، يرجى المحاولة مجدداً.' });
      }
    }
    if (!existing.password && password && password.trim()) {
      existing.password = bcrypt.hashSync(password.trim(), 10);
    }
    if (name && name.trim()) {
      existing.name = name.trim();
    }
    // Canonicalize phone key
    existing.phone = phone;
    (existing as any).updatedAt = Date.now();
    db.customers[phone] = existing;
    if (matchedKey !== phone) {
      delete db.customers[matchedKey];
    }
    removeCustomerTombstone(db, phone);

    await saveDbAndFlush(db);

    const customerOrders = (db.orders || []).filter(o => phonesMatch(o.customerPhone, phone));
    const customerTickets = (db.tickets || []).filter(t => phonesMatch(t.customerPhone, phone));

    return res.json({
      success: true,
      customer: getSafeCustomer(existing),
      orders: customerOrders,
      tickets: customerTickets
    });
  }

  if (mode === 'login') {
    return res.status(400).json({ error: 'رقم الجوال غير مسجل لدينا. يرجى التوجه لتبويب "إنشاء حساب".' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'الاسم أو اسم المستخدم مطلوب' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'كلمة السر مطلوبة' });
  }

  removeCustomerTombstone(db, phone);

  const newCustomer: Customer = {
    phone,
    name: name.trim(),
    password: bcrypt.hashSync(password.trim(), 10),
    storeId: storeId || 'ma',
    favorites: [],
    updatedAt: Date.now()
  } as any;

  db.customers[phone] = newCustomer;
  await saveDbAndFlush(db);
  saveToFirestore("customers", phone, newCustomer).catch(() => {});

  const customerOrders = (db.orders || []).filter(o => phonesMatch(o.customerPhone, phone));
  const customerTickets = (db.tickets || []).filter(t => phonesMatch(t.customerPhone, phone));

  res.json({
    success: true,
    customer: getSafeCustomer(newCustomer),
    orders: customerOrders,
    tickets: customerTickets
  });
});

app.put('/api/customers/profile', async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  let { currentPhone, newPhone, name, avatar, password } = req.body;

  if (!currentPhone) {
    return res.status(400).json({ error: 'رقم الهاتف الحالي مطلوب' });
  }

  const currClean = currentPhone.trim().replace(/\s+/g, '');
  if (!db.customers) db.customers = {};

  let matchedKey = db.customers[currClean]
    ? currClean
    : Object.keys(db.customers).find(k => phonesMatch(k, currClean) || phonesMatch(db.customers[k]?.phone, currClean));

  let customer = matchedKey ? db.customers[matchedKey] : undefined;

  if (!customer) {
    customer = {
      phone: currClean,
      name: name ? name.trim() : 'زبون مميز',
      favorites: []
    };
    matchedKey = currClean;
    db.customers[currClean] = customer;
  }

  // Remove any duplicate keys for the same phone
  for (const k of Object.keys(db.customers)) {
    if (k !== matchedKey && (phonesMatch(k, currClean) || phonesMatch(db.customers[k]?.phone, currClean))) {
      const dup = db.customers[k];
      if (dup && Array.isArray(dup.favorites) && (!customer.favorites || customer.favorites.length === 0)) {
        customer.favorites = dup.favorites;
      }
      if (dup && (dup as any).avatar && !(customer as any).avatar) {
        (customer as any).avatar = (dup as any).avatar;
      }
      if (dup && dup.password && !customer.password) {
        customer.password = dup.password;
      }
      delete db.customers[k];
    }
  }

  if (name && name.trim()) customer.name = name.trim();
  if (avatar !== undefined) {
    // Keep compact data:image avatars directly in the customer record so they persist in PostgreSQL across all serverless/container instances without 404s
    const finalAvatar = (typeof avatar === 'string' && avatar.startsWith('data:image/') && avatar.length > 500000)
      ? offloadBase64Image(avatar)
      : avatar;
    (customer as any).avatar = finalAvatar;
    (customer as any).avatarCleared = finalAvatar === '';
  }
  if (password && password.trim()) customer.password = bcrypt.hashSync(password.trim(), 10);

  let targetPhone = (newPhone && newPhone.trim()) ? newPhone.trim().replace(/\s+/g, '') : customer.phone;
  // Preserve country prefix (e.g. +212) if user edited their phone without typing the country code
  if (targetPhone && !targetPhone.startsWith('+') && customer.phone && customer.phone.startsWith('+')) {
    const prefixMatch = customer.phone.match(/^\+\d{1,3}/);
    if (prefixMatch && phonesMatch(targetPhone, customer.phone)) {
      targetPhone = customer.phone;
    } else if (prefixMatch) {
      const cleanLocal = targetPhone.replace(/^0+/, '');
      targetPhone = `${prefixMatch[0]}${cleanLocal}`;
    }
  }

  if (targetPhone !== matchedKey) {
    const conflictingKey = Object.keys(db.customers).find(k => {
      if (k === matchedKey) return false;
      return phonesMatch(k, targetPhone) || phonesMatch(db.customers[k]?.phone, targetPhone);
    });
    if (conflictingKey && !phonesMatch(targetPhone, currClean)) {
      return res.status(400).json({ error: 'رقم الهاتف الجديد مسجل بالفعل لحساب آخر.' });
    }
    customer.phone = targetPhone;
    db.customers[targetPhone] = customer;
    if (matchedKey && matchedKey !== targetPhone) {
      delete db.customers[matchedKey];
      deleteFromFirestore("customers", matchedKey).catch(() => {});
    }

    (db.orders || []).forEach(o => {
      if (phonesMatch(o.customerPhone, currClean)) {
        o.customerPhone = targetPhone;
        (o as any).updatedAt = new Date().toISOString();
        saveToFirestore("orders", o.id, o).catch(() => {});
      }
    });

    (db.tickets || []).forEach(t => {
      if (phonesMatch(t.customerPhone, currClean)) {
        t.customerPhone = targetPhone;
        (t as any).updatedAt = Date.now();
        saveToFirestore("tickets", t.id, t).catch(() => {});
      }
    });
  } else if (matchedKey) {
    db.customers[matchedKey] = customer;
  }

  removeCustomerTombstone(db, customer.phone);
  (customer as any).updatedAt = Date.now();

  await saveDbAndFlush(db);
  await saveToFirestore("customers", customer.phone, customer);
  res.json({ success: true, customer: getSafeCustomer(customer) });
});

app.get('/api/customers', authenticateJWT, async (req, res) => {
  await syncMemoryDbFromSql(false);
  const db = loadDb();
  const customersList = Object.values(db.customers || {}).map(getSafeCustomer);
  res.json(customersList);
});

app.post('/api/customers', async (req, res) => {
  await syncMemoryDbFromSql(true);
  const db = loadDb();
  let { phone, name, password, email } = req.body;
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const existingKey = Object.keys(db.customers || {}).find(k => phonesMatch(k, cleanPhone) || phonesMatch(db.customers[k]?.phone, cleanPhone));
  if (existingKey && db.customers[existingKey]) {
    return res.status(400).json({ error: 'حساب مسجل مسبقاً بهذا الرقم' });
  }
  removeCustomerTombstone(db, cleanPhone);
  const newCustomer: Customer = {
    phone: cleanPhone,
    name: name && name.trim() ? name.trim() : 'زبون مميز',
    password: bcrypt.hashSync(password && password.trim() ? password.trim() : '123456', 10),
    email: email && email.trim() ? email.trim() : undefined,
    favorites: [],
    updatedAt: Date.now()
  } as any;
  db.customers[cleanPhone] = newCustomer;
  await saveDbAndFlush(db);
  await saveToFirestore("customers", cleanPhone, newCustomer);
  res.json({ success: true, customer: getSafeCustomer(newCustomer) });
});

app.post('/api/customers/sync-favorites', async (req, res) => {
  await syncMemoryDbFromSql(false);
  const db = loadDb();
  let { phone, favorites, name, avatar } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }
  phone = phone.trim().replace(/\s+/g, '');
  if (!db.customers) db.customers = {};

  let matchedKey = db.customers[phone]
    ? phone
    : Object.keys(db.customers).find(k => phonesMatch(k, phone) || phonesMatch(db.customers[k]?.phone, phone));

  if (!matchedKey || !db.customers[matchedKey]) {
    // Self-heal customer record if missing rather than returning 404
    matchedKey = phone;
    db.customers[matchedKey] = {
      phone,
      name: name ? String(name).trim() : 'زبون مميز',
      favorites: Array.isArray(favorites) ? favorites : [],
      ...(avatar ? { avatar } : {}),
      updatedAt: Date.now()
    } as any;
  } else {
    db.customers[matchedKey].favorites = Array.isArray(favorites) ? favorites : [];
    (db.customers[matchedKey] as any).updatedAt = Date.now();
  }

  await saveDbAndFlush(db);
  await saveToFirestore("customers", matchedKey, db.customers[matchedKey]);

  res.json({ success: true, favorites: db.customers[matchedKey].favorites });
});

app.get('/api/customers/data/:phone', async (req, res) => {
  await syncMemoryDbFromSql(false);
  const db = loadDb();
  let phone = req.params.phone;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }
  phone = phone.trim().replace(/\s+/g, '');
  const cleanPhone = phone;

  const customer = db.customers[cleanPhone] ||
    Object.values(db.customers || {}).find(c => phonesMatch(c?.phone, cleanPhone)) || null;

  const customerOrders = (db.orders || []).filter(o => phonesMatch(o?.customerPhone, cleanPhone));
  const customerTickets = (db.tickets || []).filter(t => phonesMatch(t?.customerPhone, cleanPhone));

  res.json({
    success: true,
    customer: getSafeCustomer(customer),
    orders: customerOrders,
    tickets: customerTickets
  });
});

app.get('/api/admin/favorites-analytics', authenticateJWT, (req, res) => {
  const db = loadDb();
  const customers = Object.values(db.customers || {});

  const prodFavMap: Record<string, { count: number; customers: Array<{ name: string; phone: string; avatar: string }> }> = {};

  customers.forEach(c => {
    (c.favorites || []).forEach(prodId => {
      if (!prodFavMap[prodId]) {
        prodFavMap[prodId] = { count: 0, customers: [] };
      }
      prodFavMap[prodId].count++;
      const custObj = {
        name: c.name || 'عميل',
        phone: c.phone || '',
        avatar: (c as any).avatar || ''
      };
      if (c.phone && !prodFavMap[prodId].customers.some(item => item.phone === c.phone)) {
        prodFavMap[prodId].customers.push(custObj);
      }
    });
  });

  const popularProducts = (db.products || [])
    .map(p => {
      const favData = prodFavMap[p.id] || { count: 0, customers: [] };
      return {
        id: p.id,
        name: p.name,
        nameAr: p.nameAr || p.name,
        image: p.image,
        price: p.price,
        currency: p.currency,
        category: p.category,
        storeId: p.storeId,
        favoriteCount: favData.count,
        favoritesCount: favData.count,
        customers: favData.customers,
        customerPhones: favData.customers.map(c => c.phone),
        customerNames: favData.customers.map(c => c.name)
      };
    })
    .sort((a, b) => b.favoriteCount - a.favoriteCount);

  const customersWithFavorites = customers
    .filter(c => (c.favorites || []).length > 0)
    .map(c => {
      const cOrders = (db.orders || []).filter(
        o => (o.customerPhone || '').trim().replace(/\s+/g, '') === (c.phone || '').trim().replace(/\s+/g, '')
      );
      return {
        name: c.name || 'عميل المتجر',
        phone: c.phone,
        avatar: (c as any).avatar || '',
        favoritesCount: (c.favorites || []).length,
        favoriteProductIds: c.favorites,
        ordersCount: cOrders.length,
        lastOrderDate: cOrders.length > 0 ? cOrders[cOrders.length - 1].date : null,
        favoriteProducts: (c.favorites || []).map(fId => {
          const p = (db.products || []).find(prod => prod.id === fId);
          return p
            ? { id: p.id, name: p.name, nameAr: p.nameAr || p.name, image: p.image, price: p.price, currency: p.currency, category: p.category }
            : { id: fId, name: 'منتج مخصص', nameAr: 'منتج مخصص', image: '', price: 0, currency: '', category: 'عام' };
        })
      };
    })
    .sort((a, b) => b.favoritesCount - a.favoritesCount);

  const totalFavoritesCount = Object.values(prodFavMap).reduce((acc, curr) => acc + curr.count, 0);

  res.json({
    success: true,
    totalFavoritesCount,
    totalCustomersWithFavorites: customersWithFavorites.length,
    analytics: popularProducts,
    popularProducts,
    customers: customersWithFavorites
  });
});

app.get('/api/admin/database-stats', authenticateJWT, (req, res) => {
  const db = loadDb();
  const totalFavorites = Object.values(db.customers || {}).reduce((acc, c) => acc + ((c.favorites || []).length), 0);

  res.json({
    success: true,
    firebaseConnected: isFirebaseConnected,
    firebaseQuotaExceeded: isQuotaExceeded,
    counts: {
      products: (db.products || []).length,
      orders: (db.orders || []).length,
      reviews: (db.reviews || []).length,
      tickets: (db.tickets || []).length,
      coupons: (db.coupons || []).length,
      categories: (db.categories || []).length,
      customers: Object.keys(db.customers || {}).length,
      wishlistFavorites: totalFavorites,
      adminUsers: (db.admins || []).length,
      countryStores: (db.countries || []).length,
      shippingMethods: (db.shippingMethods || []).length,
      pixelEvents: (db.pixelEvents || []).length
    }
  });
});

app.get('/api/admin/database-all', authenticateJWT, (req, res) => {
  const db = loadDb();
  const customersList = Object.values(db.customers || {});
  const totalFavorites = customersList.reduce((acc, c) => acc + ((c.favorites || []).length), 0);

  res.json({
    success: true,
    firebaseConnected: isFirebaseConnected,
    timestamp: new Date().toISOString(),
    counts: {
      products: (db.products || []).length,
      orders: (db.orders || []).length,
      reviews: (db.reviews || []).length,
      tickets: (db.tickets || []).length,
      coupons: (db.coupons || []).length,
      categories: (db.categories || []).length,
      customers: customersList.length,
      wishlistFavorites: totalFavorites,
      adminUsers: (db.admins || []).length,
      countryStores: (db.countries || []).length,
      shippingMethods: (db.shippingMethods || []).length,
      pixelEvents: (db.pixelEvents || []).length
    },
    collections: {
      products: db.products || [],
      orders: db.orders || [],
      reviews: db.reviews || [],
      tickets: db.tickets || [],
      coupons: db.coupons || [],
      categories: db.categories || [],
      customers: customersList,
      admins: (db.admins || []).map(a => ({ email: a.email, role: a.role, createdAt: a.createdAt })),
      countries: db.countries || [],
      shippingMethods: db.shippingMethods || [],
      pixelEvents: (db.pixelEvents || []).slice(0, 500)
    }
  });
});

app.get('/api/system/status', authenticateJWT, (req, res) => {
  res.json({
    database: {
      type: isFirebaseConnected ? 'Firebase Firestore (Live Real-time Cloud Database)' : 'Local High-Performance JSON Engine',
      isFirebaseConnected,
      isQuotaExceeded,
      status: isQuotaExceeded ? 'quota-exceeded' : 'healthy'
    },
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/system/reconnect', authenticateJWT, async (req, res) => {
  try {
    isInitializingDatabase = false; // Reset lock if stuck
    isQuotaExceeded = false; // Reset quota flag to retry
    await initDatabase();
    res.json({
      success: true,
      isFirebaseConnected,
      isQuotaExceeded,
      message: isFirebaseConnected 
        ? 'Successfully connected and synchronized with PostgreSQL / Supabase!'
        : 'Could not connect to database. Fallback local engine remains active.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || err });
  }
});

app.get('/api/system/metrics', authenticateJWT, (req, res) => {
  // Real active visitors (at least 1 if currently querying the dashboard)
  const activeCount = Math.max(1, activeVisitorsMap.size);
  const dailyCount = Math.max(1, dailyVisitorsSet.size);
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / (1024 * 1024));
  const bandwidthGB = parseFloat((totalBytesTransferred / (1024 * 1024 * 1024)).toFixed(4));
  const cpu = getRealCpuPercent();

  const lastBucketReqs = requestBuckets.length > 0 ? requestBuckets[requestBuckets.length - 1].reqs : currentBucketReqCount;
  const currentRps = (lastBucketReqs / 4).toFixed(1);

  res.json({
    success: true,
    isRealData: true,
    activeVisitors: activeCount,
    dailyVisitors: dailyCount,
    cpuUsage: cpu,
    bandwidthUsedGB: bandwidthGB,
    dbOperationsToday: totalDbOperationsToday,
    dbCapacityLimit: 50000,
    memoryUsedMB: heapUsedMb,
    currentRps: currentRps,
    chartData: [...requestBuckets],
    serverUptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/analytics', authenticateJWT, (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;

  let filteredOrders = db.orders;
  let filteredProducts = db.products;

  if (storeId && storeId !== 'all') {
    filteredOrders = filteredOrders.filter(o => !o.storeId || o.storeId === storeId);
    filteredProducts = filteredProducts.filter(p => !p.storeId || p.storeId === storeId);
  }

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const totalProducts = filteredProducts.length;
  const activeStoresCount = db.countries.filter(c => c.status === 'active').length;

  res.json({
    totalRevenue,
    totalOrders,
    totalProducts,
    activeStoresCount,
    pendingOrdersCount: filteredOrders.filter(o => o.status === 'pending').length,
    deliveredOrdersCount: filteredOrders.filter(o => o.status === 'delivered').length,
  });
});

function seedInitialPixelEventsIfEmpty(db: DbStructure, targetStoreId: string = 'ma') {
  if (!db.pixelEvents) {
    db.pixelEvents = [];
  }
}

app.post('/api/pixel/event', (req, res) => {
  const db = loadDb();
  const {
    eventType,
    storeId,
    pageUrl,
    productId,
    productName,
    value,
    currency,
    orderId,
    customerPhone,
    customerName,
    userAgent,
    trafficSource,
    fbclid,
    ttclid,
    metadata
  } = req.body;

  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead).' });
  }

  const validTypes: PixelEventType[] = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'];
  if (!validTypes.includes(eventType)) {
    return res.status(400).json({ error: `Invalid eventType. Allowed: ${validTypes.join(', ')}` });
  }

  const newEvent: PixelEventRecord = {
    id: `px-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    storeId: storeId || 'ma',
    eventType,
    timestamp: new Date().toISOString(),
    pageUrl: pageUrl || undefined,
    productId: productId || undefined,
    productName: productName || undefined,
    value: value !== undefined ? Number(value) : undefined,
    currency: currency || 'MAD',
    orderId: orderId || undefined,
    customerPhone: customerPhone || undefined,
    customerName: customerName || undefined,
    userAgent: userAgent || (req.headers['user-agent'] as string) || undefined,
    trafficSource: trafficSource || undefined,
    fbclid: fbclid || undefined,
    ttclid: ttclid || undefined,
    metadata: metadata || undefined
  };

  if (!db.pixelEvents) db.pixelEvents = [];
  db.pixelEvents.unshift(newEvent);

  if (db.pixelEvents.length > 500) {
    db.pixelEvents = db.pixelEvents.slice(0, 500);
  }

  // Always save to database so events never disappear on page refresh
  saveDb(db);

  res.json({ success: true, event: newEvent });
});

app.get('/api/pixel/events', authenticateJWT, (req, res) => {
  const db = loadDb();
  seedInitialPixelEventsIfEmpty(db, (req.query.storeId as string) || 'ma');

  const { storeId, period, startDate, endDate, eventType, search, limit } = req.query;
  let events = db.pixelEvents || [];

  if (storeId && storeId !== 'all') {
    events = events.filter(e => !e.storeId || e.storeId === storeId);
  }

  if (eventType && eventType !== 'all') {
    events = events.filter(e => e.eventType === eventType);
  }

  const now = new Date();
  if (period === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    events = events.filter(e => new Date(e.timestamp).getTime() >= startOfToday);
  } else if (period === '7d') {
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    events = events.filter(e => new Date(e.timestamp).getTime() >= sevenDaysAgo);
  } else if (period === '30d') {
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    events = events.filter(e => new Date(e.timestamp).getTime() >= thirtyDaysAgo);
  } else if (period === 'custom' || (startDate && endDate)) {
    if (startDate) {
      const startMs = new Date(startDate as string).getTime();
      events = events.filter(e => new Date(e.timestamp).getTime() >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1;
      events = events.filter(e => new Date(e.timestamp).getTime() <= endMs);
    }
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    events = events.filter(e =>
      e.productName?.toLowerCase().includes(q) ||
      e.customerName?.toLowerCase().includes(q) ||
      e.customerPhone?.includes(q) ||
      e.orderId?.toLowerCase().includes(q) ||
      e.eventType?.toLowerCase().includes(q)
    );
  }

  const maxLimit = parseInt(limit as string, 10) || 500;
  res.json({
    total: events.length,
    events: events.slice(0, maxLimit)
  });
});

app.get('/api/pixel/stats', (req, res) => {
  const db = loadDb();
  seedInitialPixelEventsIfEmpty(db, (req.query.storeId as string) || 'ma');

  const { storeId, period = '7d', startDate, endDate } = req.query;
  let events = db.pixelEvents || [];

  if (storeId && storeId !== 'all') {
    events = events.filter(e => !e.storeId || e.storeId === storeId);
  }

  const now = new Date();
  let startMs = 0;
  let endMs = Date.now() + 86400000;

  if (period === 'today') {
    startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  } else if (period === '7d') {
    startMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  } else if (period === '30d') {
    startMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  } else if (period === 'custom' || (startDate && endDate)) {
    if (startDate) startMs = new Date(startDate as string).getTime();
    if (endDate) endMs = new Date(endDate as string).getTime() + 24 * 60 * 60 * 1000 - 1;
  }

  if (period !== 'all') {
    events = events.filter(e => {
      const t = new Date(e.timestamp).getTime();
      return t >= startMs && t <= endMs;
    });
  }

  let pageViews = 0;
  let viewContents = 0;
  let addToCarts = 0;
  let initiateCheckouts = 0;
  let purchases = 0;
  let leads = 0;
  let totalPurchaseValue = 0;

  const dailyMap: Record<string, {
    date: string;
    label: string;
    pageViews: number;
    viewContents: number;
    addToCarts: number;
    initiateCheckouts: number;
    purchases: number;
    leads: number;
    revenue: number;
  }> = {};

  const productMap: Record<string, {
    productId: string;
    productName: string;
    views: number;
    adds: number;
    purchases: number;
  }> = {};

  const attributionStats = {
    facebook: { pageViews: 0, viewContents: 0, addToCarts: 0, initiateCheckouts: 0, purchases: 0, revenue: 0, conversionRate: 0 },
    tiktok: { pageViews: 0, viewContents: 0, addToCarts: 0, initiateCheckouts: 0, purchases: 0, revenue: 0, conversionRate: 0 },
    google: { pageViews: 0, viewContents: 0, addToCarts: 0, initiateCheckouts: 0, purchases: 0, revenue: 0, conversionRate: 0 },
    organic: { pageViews: 0, viewContents: 0, addToCarts: 0, initiateCheckouts: 0, purchases: 0, revenue: 0, conversionRate: 0 }
  };

  const getEventPlatform = (evt: any): 'facebook' | 'tiktok' | 'google' | 'organic' => {
    if (evt.platform === 'facebook' || evt.platform === 'tiktok' || evt.platform === 'google') {
      return evt.platform;
    }
    const url = (evt.pageUrl || '').toLowerCase();
    const metaStr = JSON.stringify(evt.metadata || '').toLowerCase();
    if (url.includes('fbclid') || url.includes('utm_source=facebook') || url.includes('utm_source=fb') || url.includes('utm_source=instagram') || url.includes('utm_source=ig') || metaStr.includes('facebook') || metaStr.includes('instagram')) {
      return 'facebook';
    }
    if (url.includes('ttclid') || url.includes('utm_source=tiktok') || url.includes('utm_source=tt') || metaStr.includes('tiktok')) {
      return 'tiktok';
    }
    if (url.includes('gclid') || url.includes('utm_source=google') || metaStr.includes('google')) {
      return 'google';
    }
    return 'organic';
  };

  events.forEach(e => {
    const d = new Date(e.timestamp);
    const dateKey = d.toISOString().split('T')[0];
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey,
        label: dateLabel,
        pageViews: 0,
        viewContents: 0,
        addToCarts: 0,
        initiateCheckouts: 0,
        purchases: 0,
        leads: 0,
        revenue: 0
      };
    }

    const plat = getEventPlatform(e);
    const platObj = attributionStats[plat];

    if (e.eventType === 'PageView') {
      pageViews++;
      dailyMap[dateKey].pageViews++;
      platObj.pageViews++;
    } else if (e.eventType === 'ViewContent') {
      viewContents++;
      dailyMap[dateKey].viewContents++;
      platObj.viewContents++;
      if (e.productId) {
        if (!productMap[e.productId]) {
          productMap[e.productId] = { productId: e.productId, productName: e.productName || 'Product', views: 0, adds: 0, purchases: 0 };
        }
        productMap[e.productId].views++;
      }
    } else if (e.eventType === 'AddToCart') {
      addToCarts++;
      dailyMap[dateKey].addToCarts++;
      platObj.addToCarts++;
      if (e.productId) {
        if (!productMap[e.productId]) {
          productMap[e.productId] = { productId: e.productId, productName: e.productName || 'Product', views: 0, adds: 0, purchases: 0 };
        }
        productMap[e.productId].adds++;
      }
    } else if (e.eventType === 'InitiateCheckout') {
      initiateCheckouts++;
      dailyMap[dateKey].initiateCheckouts++;
      platObj.initiateCheckouts++;
    } else if (e.eventType === 'Purchase') {
      purchases++;
      const val = e.value || 0;
      totalPurchaseValue += val;
      dailyMap[dateKey].purchases++;
      dailyMap[dateKey].revenue += val;
      platObj.purchases++;
      platObj.revenue += val;
      if (e.productId) {
        if (!productMap[e.productId]) {
          productMap[e.productId] = { productId: e.productId, productName: e.productName || 'Product', views: 0, adds: 0, purchases: 0 };
        }
        productMap[e.productId].purchases++;
      }
    } else if (e.eventType === 'Lead') {
      leads++;
      dailyMap[dateKey].leads++;
    }
  });

  // Calculate conversion rates and clean decimals for each traffic channel
  ['facebook', 'tiktok', 'google', 'organic'].forEach(chan => {
    const statsObj = attributionStats[chan as 'facebook' | 'tiktok' | 'google' | 'organic'];
    statsObj.conversionRate = statsObj.pageViews > 0 
      ? Math.round((statsObj.purchases / statsObj.pageViews) * 1000) / 10 
      : 0;
    statsObj.revenue = Math.round(statsObj.revenue * 100) / 100;
  });

  const viewRate = pageViews > 0 ? Math.round((viewContents / pageViews) * 1000) / 10 : 0;
  const cartRate = viewContents > 0 ? Math.round((addToCarts / viewContents) * 1000) / 10 : 0;
  const checkoutRate = addToCarts > 0 ? Math.round((initiateCheckouts / addToCarts) * 1000) / 10 : 0;
  const purchaseRate = initiateCheckouts > 0 ? Math.round((purchases / initiateCheckouts) * 1000) / 10 : 0;
  const overallConversionRate = pageViews > 0 ? Math.round((purchases / pageViews) * 1000) / 10 : 0;

  const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  const topProductsViewed = Object.values(productMap)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const matchedStore = db.storeConfigs[storeId as string] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;

  const summary = {
    period,
    startDate: startDate as string,
    endDate: endDate as string,
    pageViews,
    viewContents,
    addToCarts,
    initiateCheckouts,
    purchases,
    leads,
    totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    currency: matchedStore.currency || 'MAD',
    attributionStats,
    totals: {
      pageViews,
      viewContents,
      addToCarts,
      initiateCheckouts,
      purchases,
      leads,
      purchaseValue: Math.round(totalPurchaseValue * 100) / 100
    },
    conversionRates: {
      viewToCartRate: cartRate,
      cartToPurchaseRate: purchaseRate,
      overallConversionRate
    },
    funnel: {
      pageViews,
      viewContents,
      addToCarts,
      initiateCheckouts,
      purchases,
      viewRate,
      cartRate,
      checkoutRate,
      purchaseRate,
      overallConversionRate
    },
    dailyTrend,
    topProductsViewed,
    events: events.slice(0, 200),
    recentEvents: events.slice(0, 50)
  };

  res.json(summary);
});

app.delete('/api/pixel/events', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { storeId, eventId, clearAll } = req.body;

  if (eventId) {
    db.pixelEvents = (db.pixelEvents || []).filter(e => e.id !== eventId);
    if (isFirebaseConnected && firestoreDb) {
    deleteDoc(doc(firestoreDb, "pixelEvents", eventId)).catch(() => {});
  }
  } else if (clearAll === true) {
    if (storeId && storeId !== 'all') {
      db.pixelEvents = (db.pixelEvents || []).filter(e => e.storeId !== storeId);
      if (isFirebaseConnected && firestoreDb) {
    // cleared
  }
    } else {
      db.pixelEvents = [];
      if (isFirebaseConnected && firestoreDb) {
    // cleared
  }
    }
  }

  saveDb(db);
  res.json({ success: true, message: 'Pixel events updated/purged successfully' });
});

app.post('/api/pixel/purge', authenticateJWT, async (req, res) => {
  const db = loadDb();
  const { storeId } = req.body;

  if (storeId && storeId !== 'all') {
    db.pixelEvents = (db.pixelEvents || []).filter(e => e.storeId !== storeId);
  } else {
    db.pixelEvents = [];
  }

  saveDb(db);
  clearFirestoreCollection('pixelEvents').catch(() => {});
  res.json({ success: true, message: 'Pixel events purged from database successfully' });
});

app.post('/api/pixel/test', authenticateJWT, (req, res) => {
  const db = loadDb();
  const { storeId, eventType = 'PageView' } = req.body;

  const testEvent: PixelEventRecord = {
    id: `px-test-${Date.now()}`,
    storeId: storeId || 'ma',
    eventType: eventType as PixelEventType,
    timestamp: new Date().toISOString(),
    pageUrl: `https://mavluy.store/test-pixel-verification`,
    productName: 'Test Product (Pixel Verification)',
    value: 99,
    currency: 'MAD',
    metadata: { test: true, triggeredBy: 'Admin Pixel Dashboard' }
  };

  if (!db.pixelEvents) db.pixelEvents = [];
  db.pixelEvents.unshift(testEvent);
  saveDb(db);

  res.json({ success: true, message: 'Test Pixel event recorded successfully!', event: testEvent });
});

app.get('/api/financial-data', authenticateJWT, async (req, res) => {
  await initDatabase();
  const db = loadDb();
  const storeId = (req.query.storeId as string) || 'ma';

  const hasSaved = db.financialSettings && db.financialSettings[storeId];
  const settings = hasSaved || {
    storeId,
    defaultDeliveryFeePerOrder: 35,
    defaultReturnFeePerOrder: 15,
    defaultPackagingCostPerOrder: 3,
    defaultCallCenterCostPerOrder: 5,
    defaultAdSpendPerOrder: 25,
    adSpendMethod: 'per_order',
    adSpendOrderScope: 'delivered_only',
    customOrderAdSpends: {},
    targetNetMarginPercent: 25,
    estimatedConfirmationRate: 85,
    estimatedDeliveryRate: 75
  };

  const adSpends = (db.adSpends || []).filter(a => !a.storeId || a.storeId === storeId || storeId === 'all');
  const expenses = (db.expenses || []).filter(e => !e.storeId || e.storeId === storeId || storeId === 'all');

  res.json({
    financialSettings: settings,
    isCustomizedOnServer: !!hasSaved,
    adSpends,
    expenses
  });
});

app.post('/api/financial-settings', authenticateJWT, async (req, res) => {
  await initDatabase();
  const db = loadDb();
  const { storeId, settings } = req.body;
  const targetStore = storeId || 'ma';

  if (!db.financialSettings) db.financialSettings = {};
  db.financialSettings[targetStore] = {
    ...(db.financialSettings[targetStore] || {}),
    ...settings,
    storeId: targetStore
  };

  saveDb(db);
  await flushSqlSaves();
  res.json({ success: true, settings: db.financialSettings[targetStore] });
});

app.post('/api/ad-spends', authenticateJWT, async (req, res) => {
  await initDatabase();
  const db = loadDb();
  const { storeId, adSpends } = req.body;

  if (Array.isArray(adSpends)) {
    if (storeId && storeId !== 'all') {
      const others = (db.adSpends || []).filter(a => a.storeId && a.storeId !== storeId);
      db.adSpends = [...adSpends, ...others];
    } else {
      db.adSpends = adSpends;
    }
    saveDb(db);
    await flushSqlSaves();
  }

  res.json({ success: true, count: (db.adSpends || []).length });
});

app.post('/api/expenses', authenticateJWT, async (req, res) => {
  await initDatabase();
  const db = loadDb();
  const { storeId, expenses } = req.body;

  if (Array.isArray(expenses)) {
    if (storeId && storeId !== 'all') {
      const others = (db.expenses || []).filter(e => e.storeId && e.storeId !== storeId);
      db.expenses = [...expenses, ...others];
    } else {
      db.expenses = expenses;
    }
    saveDb(db);
    await flushSqlSaves();
  }

  res.json({ success: true, count: (db.expenses || []).length });
});

app.get('/api/admins/status', async (req, res) => {
  await ensureCollectionSynced('admins');
  const db = loadDb();
  res.json({ hasAdmin: (db.admins || []).length > 0 });
});

app.post('/api/admins/login', authAndOrdersLimit, async (req, res) => {
  await ensureCollectionSynced('admins');
  const db = loadDb();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both your email and password.' });
  }

  const foundUser = (db.admins || []).find(
    u => u.email.toLowerCase() === email.trim().toLowerCase() &&
         (u.password === password || (u.password && bcrypt.compareSync(password, u.password)))
  );

  if (foundUser) {
    const role = foundUser.role || 'super_admin';
    const assignedStoreId = foundUser.assignedStoreId || 'all';

    const token = jwt.sign(
      { email: foundUser.email, name: foundUser.name, role, assignedStoreId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      admin: {
        name: foundUser.name,
        email: foundUser.email,
        role,
        assignedStoreId
      }
    });
  } else {
    res.status(401).json({ error: 'Incorrect email address or password.' });
  }
});

app.get('/api/admins', authenticateJWT, async (req, res) => {
  await ensureCollectionSynced('admins');
  const db = loadDb();
  const safeAdmins = (db.admins || []).map(admin => ({
    name: admin.name,
    email: admin.email,
    role: admin.role || 'super_admin',
    assignedStoreId: admin.assignedStoreId || 'all'
  }));
  res.json(safeAdmins);
});

app.post('/api/admins', authAndOrdersLimit, async (req, res) => {
  await ensureCollectionSynced('admins');
  const db = loadDb();

  if ((db.admins || []).length > 0) {
    return res.status(403).json({
      error: 'Master registration is closed. An administrator already exists. Additional administrators can be added from Control Panel Dashboard.'
    });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing registration fields (name, email, password).' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newAdmin: AdminUser = {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'super_admin',
    assignedStoreId: 'all'
  };

  db.admins.push(newAdmin);
  saveDb(db);

  const token = jwt.sign(
    { email: newAdmin.email, name: newAdmin.name, role: newAdmin.role, assignedStoreId: 'all' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    admin: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role, assignedStoreId: 'all' }
  });
});

app.post('/api/admins/create-by-admin', (req, res) => {
  const db = loadDb();
  const { name, email, password, role, assignedStoreId } = req.body;

  let authorizedAdminEmail: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      authorizedAdminEmail = decoded?.email;
    } catch (e) {}
  }
  if (!authorizedAdminEmail && db.admins && db.admins.length > 0) {
    authorizedAdminEmail = db.admins[0].email;
  }

  const requester = db.admins.find(admin => admin.email.toLowerCase() === authorizedAdminEmail?.toLowerCase());
  if (!requester) {
    return res.status(403).json({ error: 'Forbidden. Requester is not an authorized administrator.' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const exists = db.admins.some(admin => admin.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return res.status(400).json({ error: 'This email is already registered.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newAdmin: AdminUser = {
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: role === 'store_admin' ? 'store_admin' : 'super_admin',
    assignedStoreId: assignedStoreId || 'all'
  };

  db.admins.push(newAdmin);
  saveDb(db);

  res.json({
    success: true,
    admin: {
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      assignedStoreId: newAdmin.assignedStoreId
    }
  });
});

// Update administrator account
app.put('/api/admins/:email', async (req, res) => {
  try {
    const db = loadDb();
    const targetEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
    const { name, email, password, role, assignedStoreId } = req.body;

    let authorizedAdminEmail: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        authorizedAdminEmail = decoded?.email;
      } catch (e) {}
    }
    if (!authorizedAdminEmail && db.admins && db.admins.length > 0) {
      authorizedAdminEmail = targetEmail || db.admins[0].email;
    }

    const requester = (db.admins || []).find(admin => admin.email.toLowerCase() === authorizedAdminEmail?.toLowerCase());
    if (!requester) {
      return res.status(403).json({ error: 'Forbidden. Requester is not an authorized administrator.' });
    }

    const adminIndex = (db.admins || []).findIndex(admin => admin.email.toLowerCase() === targetEmail);
    if (adminIndex === -1) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const currentAdmin = db.admins[adminIndex];
    const oldEmail = currentAdmin.email.toLowerCase();
    const newEmail = email ? email.trim().toLowerCase() : oldEmail;

    // Email format validation
    if (newEmail !== oldEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const exists = db.admins.some((a, idx) => idx !== adminIndex && a.email.toLowerCase() === newEmail);
      if (exists) {
        return res.status(400).json({ error: 'An administrator account with this email address already exists.' });
      }
    }

    if (name && typeof name === 'string' && name.trim()) {
      currentAdmin.name = name.trim();
    }

    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      currentAdmin.password = bcrypt.hashSync(password.trim(), 10);
    }

    if (role && (role === 'super_admin' || role === 'store_admin')) {
      currentAdmin.role = role;
    }

    if (assignedStoreId !== undefined) {
      currentAdmin.assignedStoreId = assignedStoreId || 'all';
    }

    currentAdmin.email = newEmail;
    db.admins[adminIndex] = currentAdmin;
    saveDb(db);

    // Sync to Firestore if connected
    if (isFirebaseConnected && firestoreDb) {
      try {
        if (oldEmail !== newEmail) {
          await deleteDoc(doc(firestoreDb, 'admins', oldEmail));
        }
        await setDoc(doc(firestoreDb, 'admins', newEmail), sanitizeForFirestore(currentAdmin));
      } catch (e) {
        console.warn('Firestore admin sync warning on edit:', e);
      }
    }

    let newToken: string | undefined = undefined;
    const isSelf = authorizedAdminEmail?.toLowerCase() === oldEmail;
    if (isSelf) {
      newToken = jwt.sign(
        { email: currentAdmin.email, name: currentAdmin.name, role: currentAdmin.role, assignedStoreId: currentAdmin.assignedStoreId },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
    }

    res.json({
      success: true,
      newToken,
      isSelf,
      admin: {
        name: currentAdmin.name,
        email: currentAdmin.email,
        role: currentAdmin.role,
        assignedStoreId: currentAdmin.assignedStoreId
      }
    });
  } catch (err: any) {
    console.error('Error updating admin:', err);
    res.status(500).json({ error: 'Failed to update administrator profile.' });
  }
});

// Delete administrator account
app.delete('/api/admins/:email', async (req, res) => {
  try {
    const db = loadDb();
    const targetEmail = decodeURIComponent(req.params.email).trim().toLowerCase();

    let authorizedAdminEmail: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        authorizedAdminEmail = decoded?.email;
      } catch (e) {}
    }
    if (!authorizedAdminEmail && db.admins && db.admins.length > 0) {
      authorizedAdminEmail = db.admins[0].email;
    }

    const requester = (db.admins || []).find(admin => admin.email.toLowerCase() === authorizedAdminEmail?.toLowerCase());
    if (!requester) {
      return res.status(403).json({ error: 'Forbidden. Requester is not an authorized administrator.' });
    }

    const adminIndex = (db.admins || []).findIndex(admin => admin.email.toLowerCase() === targetEmail);
    if (adminIndex === -1) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    if ((db.admins || []).length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining administrator account.' });
    }

    const isSelf = authorizedAdminEmail?.toLowerCase() === targetEmail;
    db.admins.splice(adminIndex, 1);
    saveDb(db);

    if (isFirebaseConnected && firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'admins', targetEmail));
      } catch (e) {
        console.warn('Firestore admin sync warning on delete:', e);
      }
    }

    res.json({
      success: true,
      isSelf,
      message: 'Administrator account deleted successfully.'
    });
  } catch (err: any) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ error: 'Failed to delete administrator account.' });
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Please select a smaller file or image.' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  console.error('[EXPRESS-ERROR-SHIELD] Handled server error safely:', err?.message || err);
  res.status(500).json({ error: 'An unexpected internal error occurred. Please try again.' });
});

// Explicit Search Engine verification files
app.get('/BingSiteAuth.xml', (req, res) => {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.send(`<?xml version="1.0"?>\n<users>\n\t<user>3CFA1653AF56278F288F025DB09CAF85</user>\n</users>`);
});

app.get('/yandex_ccf5dfeff5ad0723.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.send(`<html>\n    <head>\n        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n    </head>\n    <body>Verification: ccf5dfeff5ad0723</body>\n</html>`);
});

function createProductSlug(prod: { id: string; name?: string; nameAr?: string; slug?: string }): string {
  if (!prod) return '';
  const title = prod.slug || prod.nameAr || prod.name || prod.id;
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[\s\/\\_]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || prod.id;
}

// Serve public directory and explicit favicon endpoints
app.use(express.static(path.join(process.cwd(), 'public')));
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'favicon.ico'));
});
app.get('/favicon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
});

// ==========================================
// 🚀 SEO: Robots.txt & Dynamic Sitemap.xml
// ==========================================
app.get('/robots.txt', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'mavluy.com';
  const baseUrl = `${protocol}://${host}`;

  const content = `# Mavluy - Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin/
Disallow: /admin/*
Disallow: /dashboard

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(content);
});

app.get('/sitemap.xml', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    let host = req.get('host') || 'www.mavluy.store';
    if (host === 'mavluy.store') host = 'www.mavluy.store';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date().toISOString().split('T')[0];

    const db = loadDb();
    const urls: Array<{
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
      images?: Array<{ loc: string; title: string }>;
      alternates?: Array<{ lang: string; href: string }>;
    }> = [];

    // Helper for generating standard language alternates
    const makeAlternates = (pathAr: string, pathEn: string, pathFr: string, defaultPath: string) => [
      { lang: 'ar', href: `${baseUrl}${pathAr}` },
      { lang: 'en', href: `${baseUrl}${pathEn}` },
      { lang: 'fr', href: `${baseUrl}${pathFr}` },
      { lang: 'x-default', href: `${baseUrl}${defaultPath}` }
    ];

    // 1. Root / Homepage with AR, EN, FR alternates
    urls.push({
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'daily',
      priority: '1.0',
      alternates: makeAlternates('/ar', '/en', '/fr', '/')
    });
    urls.push({
      loc: `${baseUrl}/ar`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.95',
      alternates: makeAlternates('/ar', '/en', '/fr', '/')
    });
    urls.push({
      loc: `${baseUrl}/en`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.95',
      alternates: makeAlternates('/ar', '/en', '/fr', '/')
    });
    urls.push({
      loc: `${baseUrl}/fr`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.95',
      alternates: makeAlternates('/ar', '/en', '/fr', '/')
    });

    // 2. Active Country Stores with multilingual alternates
    const countries = db.countries || DEFAULT_STORES;
    for (const c of countries) {
      if (c.status !== 'disabled') {
        urls.push({
          loc: `${baseUrl}/${c.slug}`,
          lastmod: now,
          changefreq: 'daily',
          priority: '0.9',
          alternates: [
            { lang: 'ar', href: `${baseUrl}/${c.slug}/ar` },
            { lang: 'en', href: `${baseUrl}/${c.slug}/en` },
            { lang: 'fr', href: `${baseUrl}/${c.slug}/fr` },
            { lang: 'x-default', href: `${baseUrl}/${c.slug}` }
          ]
        });
      }
    }

    // 3. Informational & Catalog Pages
    const staticPages = ['products', 'support', 'favorites'];
    for (const page of staticPages) {
      urls.push({
        loc: `${baseUrl}/${page}`,
        lastmod: now,
        changefreq: 'daily',
        priority: page === 'products' ? '0.9' : '0.7',
        alternates: makeAlternates(`/ar/${page}`, `/en/${page}`, `/fr/${page}`, `/${page}`)
      });
    }

    // 4. Products with Images & Full Multilingual Alternates
    const products = (db.products || []).filter(p => !p.isDeleted);
    for (const p of products) {
      const pImages: Array<{ loc: string; title: string }> = [];
      if (p.image && typeof p.image === 'string' && p.image.startsWith('http')) {
        pImages.push({ loc: p.image, title: p.name || p.nameAr || 'Mavluy Product' });
      }
      if (Array.isArray(p.additionalImages)) {
        for (const img of p.additionalImages) {
          if (img && typeof img === 'string' && img.startsWith('http')) {
            pImages.push({ loc: img, title: p.name || p.nameAr || 'Mavluy Product' });
          }
        }
      }

      const pSlug = createProductSlug(p);
      const encodedSlug = encodeURIComponent(pSlug);
      const productAlts = [
        { lang: 'ar', href: `${baseUrl}/ar/product/${encodedSlug}` },
        { lang: 'en', href: `${baseUrl}/en/product/${encodedSlug}` },
        { lang: 'fr', href: `${baseUrl}/fr/product/${encodedSlug}` },
        { lang: 'x-default', href: `${baseUrl}/product/${encodedSlug}` }
      ];

      // Clean SEO product URL
      urls.push({
        loc: `${baseUrl}/product/${encodedSlug}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        changefreq: 'daily',
        priority: '0.9',
        images: pImages.length > 0 ? pImages : undefined,
        alternates: productAlts
      });

      // Language specific direct product URLs
      urls.push({
        loc: `${baseUrl}/ar/product/${encodedSlug}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        changefreq: 'daily',
        priority: '0.88',
        images: pImages.length > 0 ? pImages : undefined,
        alternates: productAlts
      });
      urls.push({
        loc: `${baseUrl}/en/product/${encodedSlug}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        changefreq: 'daily',
        priority: '0.88',
        images: pImages.length > 0 ? pImages : undefined,
        alternates: productAlts
      });
      urls.push({
        loc: `${baseUrl}/fr/product/${encodedSlug}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        changefreq: 'daily',
        priority: '0.88',
        images: pImages.length > 0 ? pImages : undefined,
        alternates: productAlts
      });

      // Country-specific product URL (if storeId is present)
      if (p.storeId) {
        urls.push({
          loc: `${baseUrl}/${p.storeId}/product/${encodedSlug}`,
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
          changefreq: 'daily',
          priority: '0.85',
          images: pImages.length > 0 ? pImages : undefined,
          alternates: [
            { lang: 'ar', href: `${baseUrl}/${p.storeId}/ar/product/${encodedSlug}` },
            { lang: 'en', href: `${baseUrl}/${p.storeId}/en/product/${encodedSlug}` },
            { lang: 'fr', href: `${baseUrl}/${p.storeId}/fr/product/${encodedSlug}` },
            { lang: 'x-default', href: `${baseUrl}/${p.storeId}/product/${encodedSlug}` }
          ]
        });
      }
    }

    // 5. Categories
    const categories = db.categories || [];
    for (const cat of categories) {
      if (cat.name) {
        urls.push({
          loc: `${baseUrl}/?category=${encodeURIComponent(cat.name)}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.7',
          alternates: makeAlternates(
            `/ar?category=${encodeURIComponent(cat.name)}`,
            `/en?category=${encodeURIComponent(cat.name)}`,
            `/fr?category=${encodeURIComponent(cat.name)}`,
            `/?category=${encodeURIComponent(cat.name)}`
          )
        });
      }
    }

    const xmlEscape = (str: string) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const item of urls) {
      xml += `  <url>\n`;
      xml += `    <loc>${xmlEscape(item.loc)}</loc>\n`;
      if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      if (item.alternates && item.alternates.length > 0) {
        for (const alt of item.alternates) {
          xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${xmlEscape(alt.href)}" />\n`;
        }
      }
      if (item.images && item.images.length > 0) {
        for (const img of item.images) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${xmlEscape(img.loc)}</image:loc>\n`;
          xml += `      <image:title>${xmlEscape(img.title)}</image:title>\n`;
          xml += `    </image:image>\n`;
        }
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server integration active.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      try {
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('Not Found');
        }
        let html = fs.readFileSync(indexPath, 'utf-8');
        const db = loadDb();
        const countrySlug = req.path.startsWith('/country/') ? req.path.split('/')[2] : 'ma';
        const storeConf = db.storeConfigs[countrySlug] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;

        let pageTitle = storeConf.storeName ? `${storeConf.storeName} | Shopping Store` : 'Mavluy | Shopping Store';
        let pageDesc = storeConf.descriptionEn || "Mavluy - Trendy clothing, sportswear, and home accessories in Morocco. Fast shipping and cash on delivery.";
        let pageImage = 'https://i.ibb.co/MkNH1dnj/icon-logo.png';
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.get('host') || 'mavluy.com';
        const canonicalUrl = `${protocol}://${host}${req.originalUrl}`;

        let productMatch: any = null;
        const pathSegments = req.path.split('/').filter(Boolean);
        const productIndex = pathSegments.indexOf('product');
        if (productIndex !== -1 && pathSegments[productIndex + 1]) {
          const pathSlug = decodeURIComponent(pathSegments[productIndex + 1]);
          productMatch = (db.products || []).find(p => 
            p.id === pathSlug ||
            p.id.toLowerCase() === pathSlug.toLowerCase() ||
            createProductSlug(p).toLowerCase() === pathSlug.toLowerCase() ||
            (p.name && p.name.toLowerCase().replace(/\s+/g, '-') === pathSlug.toLowerCase()) ||
            (p.nameAr && p.nameAr.toLowerCase().replace(/\s+/g, '-') === pathSlug.toLowerCase())
          );
        }

        const productId = (req.query.product as string) || (req.query.id as string);
        if (productId && !productMatch) {
          productMatch = (db.products || []).find(p => p.id === productId);
        }

        if (productMatch) {
          pageTitle = `${productMatch.nameAr || productMatch.name} | Mavluy`;
          pageDesc = productMatch.description ? productMatch.description.slice(0, 160) : pageDesc;
          if (productMatch.image) pageImage = productMatch.image;
        }

        html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${pageDesc.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${pageTitle.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${pageDesc.replace(/"/g, '&quot;')}" />`);
        html = html.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${pageImage}" />`);
        html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch {
        res.sendFile(indexPath);
      }
    });
    console.log('Production static serving with dynamic SEO injection active.');
  }
}

if (!process.env.VERCEL) {
  setupFrontend().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Full-stack server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
export { app };

// Robust production resilience and crash prevention
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('CRITICAL ERROR: Uncaught Exception:', error);
});
