import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  uploadToCloudinary,
  isCloudinaryReady,
  getCloudinaryStatus,
  testAndSaveCloudinaryConfig,
  disconnectCloudinary,
  CLOUDINARY_CONFIG_FILE
} from './src/utils/cloudinaryServer';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_STORE_CONFIG,
  DEFAULT_ORDERS,
  DEFAULT_TICKETS,
  DEFAULT_STORES,
  DEFAULT_COUPONS,
  DEFAULT_REVIEWS
} from './src/data';
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
} from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'ecom_platform_super_secret_jwt_key_2026';

process.on('uncaughtException', (err: any) => {
  console.error('[CRASH-SHIELD] Handled uncaught exception safely:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[CRASH-SHIELD] Handled unhandled promise rejection safely:', reason?.message || reason);
});

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'confident-psyche-153bd',
  appId: '1:717588455945:web:f3c7f86b717fe856290ed8',
  apiKey: 'AIzaSyCJsRm116xN1Uxwt0koaxbKvBu7vDthm18',
  authDomain: 'confident-psyche-153bd.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-remixmoroccaneco-38a3aa37-c197-4bb7-9edb-a7603ea87816',
  storageBucket: 'confident-psyche-153bd.firebasestorage.app',
  messagingSenderId: '717588455945',
  measurementId: '',
  oAuthClientId: '717588455945-hlf08i7srlj77vtlkdg1joerimlifspq.apps.googleusercontent.com',
  recaptchaSiteKey: ''
};

const FIREBASE_CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let firestoreDb: any = null;
let isFirebaseConnected = false;
let firebaseProjectId = "confident-psyche-153bd";

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    return value;
  }));
}

async function saveToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  if (!firestoreDb) {
    initFirebase().catch(() => {});
    return false;
  }
  try {
    const cleanData = sanitizeForFirestore(data);
    const savePromise = setDoc(doc(firestoreDb, collectionName, String(docId)), cleanData);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout (6s) saving ${collectionName}/${docId}`)), 6000)
    );
    await Promise.race([savePromise, timeoutPromise]);
    isFirebaseConnected = true;
    return true;
  } catch (err: any) {
    console.warn(`[Firestore Warning] Failed saving ${collectionName}/${docId}:`, err?.message || err);
    if (err?.code === 'unavailable' || err?.message?.includes('timeout') || err?.message?.includes('network')) {
      isFirebaseConnected = false;
      initFirebase().catch(() => {});
    }
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
  };
}

let memoryDb: DbStructure | null = null;

function sanitizeWithTombstones(db: DbStructure): DbStructure {
  if (!db) return db;
  if (!db.deletedTombstones) {
    db.deletedTombstones = { orders: [], products: [], coupons: [], reviews: [], tickets: [] };
  }
  const tomb = db.deletedTombstones;
  const delOrders = new Set((tomb.orders || []).map(id => String(id).trim()));
  const delProds = new Set((tomb.products || []).map(id => String(id).trim()));
  const delCoupons = new Set((tomb.coupons || []).map(id => String(id).trim()));
  const delReviews = new Set((tomb.reviews || []).map(id => String(id).trim()));
  const delTickets = new Set((tomb.tickets || []).map(id => String(id).trim()));

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
  return db;
}

async function persistTombstonesToFirestore(db: DbStructure) {
  if (!isFirebaseConnected || !firestoreDb || !db.deletedTombstones) return;
  try {
    await setDoc(doc(firestoreDb, "_system", "tombstones"), {
      ...db.deletedTombstones,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    // silent
  }
}

function addTombstone(db: DbStructure, collectionName: 'orders' | 'products' | 'coupons' | 'reviews' | 'tickets', id: string | string[]) {
  if (!db.deletedTombstones) {
    db.deletedTombstones = { orders: [], products: [], coupons: [], reviews: [], tickets: [] };
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

async function deleteFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  if (!firestoreDb) {
    initFirebase().catch(() => {});
    return false;
  }
  try {
    const delPromise = deleteDoc(doc(firestoreDb, collectionName, String(docId)));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout (6s) deleting ${collectionName}/${docId}`)), 6000)
    );
    await Promise.race([delPromise, timeoutPromise]);
    isFirebaseConnected = true;
    return true;
  } catch (err: any) {
    console.warn(`[Firestore Warning] Failed deleting ${collectionName}/${docId}:`, err?.message || err);
    return false;
  }
}

let isInitializingFirebase = false;

async function initFirebase() {
  if (isInitializingFirebase) return;
  isInitializingFirebase = true;
  try {
    let config = DEFAULT_FIREBASE_CONFIG;
    if (fs.existsSync(FIREBASE_CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(FIREBASE_CONFIG_FILE, "utf-8").trim();
        if (raw.length > 0) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.projectId) {
            config = parsed;
          } else {
            fs.writeFileSync(FIREBASE_CONFIG_FILE, JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
          }
        } else {
          fs.writeFileSync(FIREBASE_CONFIG_FILE, JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
        }
      } catch {
        fs.writeFileSync(FIREBASE_CONFIG_FILE, JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
      }
    } else {
      fs.writeFileSync(FIREBASE_CONFIG_FILE, JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
    }

    firebaseProjectId = config.projectId || firebaseProjectId;
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);

    const testRef = doc(firestoreDb, "_test_collection", "ping");
    const pingPromise = setDoc(testRef, { lastPing: Date.now() });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase ping timeout after 7s")), 7000)
    );
    await Promise.race([pingPromise, timeoutPromise]);

    isFirebaseConnected = true;
    console.log("🟢 Successfully connected to Firebase Firestore database.");

    // Isolate sync so any sync issues never disconnect Firebase
    try {
      await syncFromFirestore();
    } catch (syncErr: any) {
      console.warn("⚠️ Firestore background sync note:", syncErr?.message || syncErr);
    }
  } catch (err: any) {
    console.warn("Firebase connection notice:", err?.message || err);
    isFirebaseConnected = false;
  } finally {
    isInitializingFirebase = false;
  }
}

// Background Keep-Alive Heartbeat: Keeps gRPC/HTTP2 socket alive every 45s
setInterval(async () => {
  if (firestoreDb && isFirebaseConnected) {
    try {
      const testRef = doc(firestoreDb, "_test_collection", "ping");
      await setDoc(testRef, { lastPing: Date.now() });
    } catch (e: any) {
      console.warn("⚠️ Firebase heartbeat ping dropped, triggering reconnect:", e?.message || e);
      isFirebaseConnected = false;
      initFirebase().catch(() => {});
    }
  } else if (!isFirebaseConnected) {
    initFirebase().catch(() => {});
  }
}, 45000);

async function syncFromFirestore() {
  if (!isFirebaseConnected || !firestoreDb) return;
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
  if (!isFirebaseConnected || !firestoreDb) return;
  try {
    while (true) {
      const snap = await getDocs(collection(firestoreDb, collName));
      if (snap.empty) break;
      const batch = writeBatch(firestoreDb);
      let count = 0;
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count >= 400) break;
      }
      await batch.commit();
      if (count < 400) break;
    }
    console.log(`[FIRESTORE-PURGE] Cleaned collection completely: ${collName}`);
  } catch (err: any) {
    console.error(`Error clearing Firestore collection ${collName}:`, err?.message || err);
  }
}

initFirebase();

function offloadBase64Image(dataUri: string): string {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
    return dataUri;
  }
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : 'jpg');
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
    clone.additionalImages = clone.additionalImages.map(img => (typeof img === 'string' && img.startsWith('data:image/')) ? offloadBase64Image(img) : img);
  }
  return clone;
}

function loadDb(): DbStructure {
  if (memoryDb) {
    return sanitizeWithTombstones(memoryDb);
  }

  if (!fs.existsSync(DB_FILE)) {
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'متجر مافلوي | Mavluy', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر مافلوي ليبيا | Mavluy', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر مافلوي السعودية | Mavluy', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
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
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'متجر مافلوي | Mavluy', currency: 'MAD' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر مافلوي ليبيا | Mavluy', currency: 'LYD' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر مافلوي السعودية | Mavluy', currency: 'SAR' },
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

    memoryDb = sanitizeWithTombstones(parsed as DbStructure);
    if (mediaCleaned) {
      saveDb(memoryDb);
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
  sanitizeWithTombstones(data);
  memoryDb = data;
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

const generalApiLimit = rateLimit(500, 60);
const authAndOrdersLimit = rateLimit(250, 60, 'Too many attempts. Please wait a moment before trying again.');

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Prevent all HTTP client and proxy caching on dynamic /api endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use('/api', generalApiLimit);

function authenticateJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ error: 'Authentication token required.' });
  }
}

app.get("/api/firebase/status", async (req, res) => {
  try {
    if (!isFirebaseConnected) {
      await initFirebase();
    }
    const db = loadDb();
    const collectionsCount = {
      products: db.products ? db.products.length : 0,
      orders: db.orders ? db.orders.length : 0,
      admins: db.admins ? db.admins.length : 0,
      categories: db.categories ? db.categories.length : 0,
      countries: db.countries ? db.countries.length : 0
    };

    res.json({
      connected: isFirebaseConnected,
      connecting: false,
      projectId: firebaseProjectId,
      maskedUri: `Firebase (${firebaseProjectId})`,
      localCounts: collectionsCount,
      remoteCounts: collectionsCount
    });
  } catch (err: any) {
    res.json({
      connected: isFirebaseConnected,
      connecting: false,
      projectId: firebaseProjectId,
      maskedUri: `Firebase (${firebaseProjectId})`,
      localCounts: { products: 0, orders: 0, admins: 0, categories: 0, countries: 0 },
      remoteCounts: null,
      error: err?.message || "Status check error"
    });
  }
});

app.post("/api/firebase/sync-push", async (req, res) => {
  if (!isFirebaseConnected) {
    await initFirebase();
  }
  const db = loadDb();
  if (isFirebaseConnected && firestoreDb) {
    await pushAllToFirestore(db);
    return res.json({ success: true, message: "All products, orders, categories, and settings synced to Firebase Firestore." });
  }
  res.status(500).json({ success: false, error: "Firebase connection could not be established." });
});

app.post('/api/upload', async (req, res) => {
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
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.includes('webp') ? 'webp' : (mimeType.includes('png') ? 'png' : 'jpg');
      const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 7)}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return res.json({
        success: true,
        url: `/uploads/${filename}`,
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
    res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

app.get('/api/cloudinary/status', (req, res) => {
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

app.post('/api/cloudinary/config', async (req, res) => {
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

app.post('/api/cloudinary/disconnect', (req, res) => {
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

app.get('/api/countries', (req, res) => {
  const db = loadDb();
  res.json(db.countries);
});

app.post('/api/countries', (req, res) => {
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

app.put('/api/countries/:id', async (req, res) => {
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

app.delete('/api/countries/:id', async (req, res) => {
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

app.get('/api/store-config', (req, res) => {
  const db = loadDb();
  const storeId = (req.query.storeId as string) || (req.query.slug as string) || 'ma';
  const config = db.storeConfigs[storeId] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;

  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      isAdmin = true;
    } catch {
      isAdmin = false;
    }
  }

  if (isAdmin) {
    return res.json(config);
  }

  // Sanitize for public store visitors: strip private webhook secrets and API keys
  const safeConfig = { ...config };
  delete (safeConfig as any).googleSheetWebhookUrl;
  delete (safeConfig as any).cloudinaryApiSecret;
  delete (safeConfig as any).affiliateWebhookSecret;
  res.json(safeConfig);
});

app.post('/api/store-config', async (req, res) => {
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'متجر مافلوي | Mavluy', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر مافلوي ليبيا | Mavluy', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر مافلوي السعودية | Mavluy', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
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
      return res.json({ success: true, message: 'All store data wiped from Firestore and database successfully.' });
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

app.get('/api/products', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=15');
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

app.post('/api/products', async (req, res) => {
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

    res.json({ success: true, product: newProduct, firestoreSaved: isFirebaseConnected });
  } catch (err: any) {
    console.error('Error in POST /api/products:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to save product.' });
  }
});

app.put('/api/products/:id', async (req, res) => {
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

    res.json({ success: true, product: updatedProduct, firestoreSaved: isFirebaseConnected });
  } catch (err: any) {
    console.error(`Error in PUT /api/products/${req.params.id}:`, err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to update product.' });
  }
});

app.delete('/api/products/all', async (req, res) => {
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

app.delete('/api/products/:id', async (req, res) => {
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

app.get('/api/categories', (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.categories || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(c => !c.storeId || c.storeId === storeId);
  }
  res.json(list);
});

app.post('/api/categories', async (req, res) => {
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

app.delete('/api/categories/:id', async (req, res) => {
  const db = loadDb();
  const catId = req.params.id;
  db.categories = db.categories.filter(c => c.id !== catId);
  saveDb(db);
  await deleteFromFirestore("categories", catId);
  res.json({ success: true });
});

app.get('/api/coupons', (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.coupons || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(c => !c.storeId || c.storeId === storeId || c.storeId === 'all');
  }
  res.json(list);
});

app.post('/api/coupons', async (req, res) => {
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

app.delete('/api/coupons/all', async (req, res) => {
  const db = loadDb();
  const allIds = (db.coupons || []).map(c => c.id);
  addTombstone(db, 'coupons', allIds);
  db.coupons = [];
  saveDb(db);
  await clearFirestoreCollection('coupons');
  res.json({ success: true, message: 'All coupons permanently deleted.', coupons: [] });
});

app.delete('/api/coupons/:id', async (req, res) => {
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

app.get('/api/shipping', (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  let list = db.shippingMethods || [];
  if (storeId && storeId !== 'all') {
    list = list.filter(s => !s.storeId || s.storeId === storeId);
  }
  res.json(list);
});

app.post('/api/shipping', async (req, res) => {
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

app.delete('/api/shipping/:id', async (req, res) => {
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

  const clientId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
  const adminEmail = (req.query.adminEmail as string) || 'admin';

  const client: AdminLiveClient = { id: clientId, res, adminEmail };
  adminLiveClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    adminLiveClients = adminLiveClients.filter(c => c.id !== clientId);
  });
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

app.get('/api/orders', (req, res) => {
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
        const skuSummary = (newOrder.items || []).map(i => i.sku || '').filter(Boolean).join(', ') || newOrder.sku || '';

        const googleSheetPayload = {
          orderId: newOrder.id,
          date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          customerCity: newOrder.customerCity,
          customerAddress: newOrder.customerAddress,
          productName: itemsSummary || (newOrder.items?.[0]?.productName || 'منتج'),
          sku: skuSummary,
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
  const db = loadDb();
  let phone = req.params.phone;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  phone = phone.trim().replace(/\s+/g, '');

  if (db.customers && db.customers[phone]) {
    delete db.customers[phone];
  }

  saveDb(db);
  await deleteFromFirestore("customers", phone);
  res.json({ success: true, message: 'Customer account deleted successfully' });
});

app.put('/api/orders/:id', async (req, res) => {
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

app.delete('/api/orders/all', async (req, res) => {
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

app.delete('/api/orders/:id', async (req, res) => {
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

app.post('/api/orders/bulk-delete', async (req, res) => {
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

  const testPayload = {
    orderId: `TEST-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
    customerName: 'محمد أمين (طلب تجريبي)',
    customerPhone: '6xxxxxxxx',
    customerCity: 'الدار البيضاء Casablanca',
    customerAddress: 'شارع الزرقطوني، عمارة 12، شقة 4',
    productName: 'سماعات بلوتوث الذكية Pro x1',
    quantity: 1,
    subtotal: 299,
    shippingFee: 0,
    total: 299,
    currency: 'MAD',
    notes: 'طلب فحص وتجربة الربط التلقائي مع Google Sheet',
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

app.post('/api/orders/bulk', async (req, res) => {
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

app.put('/api/orders/:id/status', async (req, res) => {
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

app.get('/api/tickets', (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  const phone = req.query.phone as string;
  let list = db.tickets || [];

  if (phone) {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    list = list.filter(t => (t.customerPhone || '').replace(/\s+/g, '').includes(cleanPhone));
  } else if (storeId && storeId !== 'all' && storeId !== 'default' && storeId !== '') {
    list = list.filter(t => !t.storeId || t.storeId === storeId);
  }

  res.json(list);
});

app.post('/api/tickets', authAndOrdersLimit, async (req, res) => {
  const db = loadDb();
  const newTicket: SupportTicket = req.body;

  if (!newTicket.id || !newTicket.customerName || !newTicket.customerPhone || !newTicket.message) {
    return res.status(400).json({ error: 'Invalid ticket data.' });
  }

  const cleanPhone = newTicket.customerPhone.trim().replace(/\s+/g, '');

  const existingActive = (db.tickets || []).find(
    t => t.id !== newTicket.id &&
         t.customerPhone.trim().replace(/\s+/g, '') === cleanPhone &&
         t.status !== 'resolved'
  );

  if (existingActive) {
    return res.status(400).json({
      error: 'لديك تذكرة دعم نشطة قيد المتابعة بالفعل. يمكنك إكمال المحادثة فيها أو الانتظار حتى يتم إغلاقها لفتح تذكرة جديدة.',
      activeTicketId: existingActive.id
    });
  }

  if (!newTicket.storeId) {
    newTicket.storeId = 'ma';
  }

  if (!db.tickets) {
    db.tickets = [];
  }

  const existingIdx = db.tickets.findIndex(t => t.id === newTicket.id);
  if (existingIdx > -1) {
    db.tickets[existingIdx] = newTicket;
  } else {
    db.tickets.unshift(newTicket);
  }

  saveDb(db);

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

app.put('/api/tickets/:id', async (req, res) => {
  const db = loadDb();
  const ticketId = req.params.id;
  const { status, seen } = req.body;

  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (status !== undefined) ticket.status = status;
  if (seen !== undefined) ticket.seen = seen;

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    const t = db.tickets.find(tk => tk.id === ticketId);
    if (t) setDoc(doc(firestoreDb, "tickets", ticketId), sanitizeForFirestore(t)).catch(() => {});
  }

  res.json({ success: true, ticket });
});

app.put('/api/tickets/:id/close-by-client', async (req, res) => {
  const db = loadDb();
  const ticketId = req.params.id;

  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  ticket.status = 'resolved';
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    const t = db.tickets.find(tk => tk.id === ticketId);
    if (t) setDoc(doc(firestoreDb, "tickets", ticketId), sanitizeForFirestore(t)).catch(() => {});
  }

  res.json({ success: true, ticket });
});

app.post('/api/tickets/reply', async (req, res) => {
  const db = loadDb();
  const { ticketId, sender, text, senderName } = req.body;
  if (!ticketId || !text) {
    return res.status(400).json({ error: 'Missing ticket ID or message text.' });
  }
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
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
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'open';
    }
  } else {
    ticket.seen = true;
    if (!ticket.status || ticket.status === 'closed') {
      ticket.status = 'open';
    }
  }

  saveDb(db);

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

app.delete('/api/tickets/all', async (req, res) => {
  const db = loadDb();
  const allIds = (db.tickets || []).map(t => t.id);
  addTombstone(db, 'tickets', allIds);
  db.tickets = [];
  saveDb(db);
  await clearFirestoreCollection('tickets');
  res.json({ success: true, message: 'All tickets permanently deleted.' });
});

app.delete('/api/tickets/:id', async (req, res) => {
  const db = loadDb();
  const ticketId = req.params.id;

  if (ticketId === 'all') {
    const allIds = (db.tickets || []).map(t => t.id);
    addTombstone(db, 'tickets', allIds);
    db.tickets = [];
    saveDb(db);
    await clearFirestoreCollection('tickets');
    return res.json({ success: true, message: 'All tickets permanently deleted.' });
  }

  addTombstone(db, 'tickets', ticketId);
  db.tickets = (db.tickets || []).filter(t => t.id !== ticketId);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "tickets", ticketId));
    } catch (e) {}
  }

  res.json({ success: true, message: 'Ticket permanently removed from database' });
});

app.put('/api/tickets/:id/close-by-client', async (req, res) => {
  const db = loadDb();
  const ticketId = req.params.id;
  const ticket = (db.tickets || []).find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  ticket.status = 'resolved';
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    const t = db.tickets.find(tk => tk.id === ticketId);
    if (t) setDoc(doc(firestoreDb, "tickets", ticketId), sanitizeForFirestore(t)).catch(() => {});
  }

  res.json({ success: true, ticket });
});

app.get('/api/reviews', (req, res) => {
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

  if (!productId || !author || !comment) {
    return res.status(400).json({ error: 'يرجى تقديم جميع معلومات التقييم المطلوبة / Missing required review information.' });
  }

  const rawPhone = (authorPhone || '').trim();
  const cleanPhone = rawPhone.replace(/\s+/g, '');
  const normAuthorPhone = normalizePhoneForReviewCheck(rawPhone);

  const matchedProd = (db.products || []).find(p => p.id === productId);
  const prodTitle = matchedProd ? (matchedProd.nameAr || matchedProd.name) : '';

  let isVerified = false;
  if (normAuthorPhone && normAuthorPhone.length >= 6) {
    isVerified = (db.orders || []).some(o => {
      const oRawPhone = (o.customerPhone || '').trim();
      const oNormPhone = normalizePhoneForReviewCheck(oRawPhone);

      const phoneMatches =
        (oNormPhone && normAuthorPhone && oNormPhone === normAuthorPhone) ||
        (normAuthorPhone.length >= 8 && oNormPhone.endsWith(normAuthorPhone.slice(-8))) ||
        (oNormPhone.length >= 8 && normAuthorPhone.endsWith(oNormPhone.slice(-8))) ||
        (cleanPhone && oRawPhone && cleanPhone === oRawPhone);

      if (!phoneMatches) return false;

      const containsItem = (o.items || []).some(item =>
        item.productId === productId ||
        (item as any).id === productId ||
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

  const productName = matchedProd ? (matchedProd.nameAr || matchedProd.name) : 'منتج فاخر';

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    storeId: storeId || (matchedProd?.storeId) || 'ma',
    productId,
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
  if (!db.customReviews[productId]) db.customReviews[productId] = [];
  db.customReviews[productId].unshift(newReview);

  if (matchedProd) {
    const prodReviews = db.reviews.filter(r => r.productId === productId && r.status === 'approved');
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

app.put('/api/reviews/:id/feature', async (req, res) => {
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

app.put('/api/reviews/:id/status', async (req, res) => {
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

app.put('/api/reviews/:id', async (req, res) => {
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

app.delete('/api/reviews/all', async (req, res) => {
  const db = loadDb();
  const allIds = (db.reviews || []).map(r => r.id);
  addTombstone(db, 'reviews', allIds);
  db.reviews = [];
  db.customReviews = {};
  saveDb(db);
  await clearFirestoreCollection('reviews');
  res.json({ success: true, message: 'All reviews permanently deleted.' });
});

app.delete('/api/reviews/:id', async (req, res) => {
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

app.post('/api/customers/login-or-register', authAndOrdersLimit, (req, res) => {
  const db = loadDb();
  let { phone, name, password, mode, storeId } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'رقم الجوال مطلوب' });
  }

  phone = phone.trim().replace(/\s+/g, '');

  if (db.customers[phone]) {
    if (mode === 'register') {
      return res.status(400).json({ error: 'هذا الرقم مسجل بالفعل. يرجى الانتقال إلى تبويب تسجيل الدخول.' });
    }

    const existing = db.customers[phone];
    if (existing.password && password && existing.password !== password.trim()) {
      return res.status(400).json({ error: 'كلمة السر غير صحيحة، يرجى المحاولة مجدداً.' });
    }
    if (!existing.password && password && password.trim()) {
      existing.password = password.trim();
    }
    if (name && name.trim()) {
      existing.name = name.trim();
    }
    saveDb(db);
    return res.json({ success: true, customer: getSafeCustomer(existing) });
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

  const newCustomer: Customer = {
    phone,
    name: name.trim(),
    password: password.trim(),
    storeId: storeId || 'ma',
    favorites: []
  };

    db.customers[phone] = newCustomer;
    saveDb(db);
    saveToFirestore("customers", phone, newCustomer).catch(() => {});

    res.json({ success: true, customer: getSafeCustomer(newCustomer) });
  });

  app.put('/api/customers/profile', async (req, res) => {
    const db = loadDb();
    let { currentPhone, newPhone, name, avatar, password } = req.body;

    if (!currentPhone) {
      return res.status(400).json({ error: 'رقم الهاتف الحالي مطلوب' });
    }

    const currClean = currentPhone.trim().replace(/\s+/g, '');
    let customer = db.customers[currClean];

    if (!customer) {
      customer = {
        phone: currClean,
        name: name ? name.trim() : 'زبون مميز',
        favorites: []
      };
      db.customers[currClean] = customer;
    }

    if (name && name.trim()) customer.name = name.trim();
    if (avatar !== undefined) (customer as any).avatar = avatar;
    if (password && password.trim()) customer.password = password.trim();

    if (newPhone && newPhone.trim()) {
      const newClean = newPhone.trim().replace(/\s+/g, '');
      if (newClean !== currClean) {
        if (db.customers[newClean]) {
          return res.status(400).json({ error: 'رقم الهاتف الجديد مسجل بالفعل لحساب آخر.' });
        }
        customer.phone = newClean;
        db.customers[newClean] = customer;
        delete db.customers[currClean];
        deleteFromFirestore("customers", currClean).catch(() => {});

        (db.orders || []).forEach(o => {
          if ((o.customerPhone || '').trim().replace(/\s+/g, '') === currClean) {
            o.customerPhone = newClean;
            saveToFirestore("orders", o.id, o).catch(() => {});
          }
        });

        (db.tickets || []).forEach(t => {
          if ((t.customerPhone || '').trim().replace(/\s+/g, '') === currClean) {
            t.customerPhone = newClean;
            saveToFirestore("tickets", t.id, t).catch(() => {});
          }
        });
      }
    }

    saveDb(db);
    await saveToFirestore("customers", customer.phone, customer);
    res.json({ success: true, customer: getSafeCustomer(customer) });
  });

  app.get('/api/customers', (req, res) => {
    const db = loadDb();
    const customersList = Object.values(db.customers || {}).map(getSafeCustomer);
    res.json(customersList);
  });

  app.post('/api/customers', async (req, res) => {
    const db = loadDb();
    let { phone, name, password, email } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (db.customers[cleanPhone]) {
      return res.status(400).json({ error: 'حساب مسجل مسبقاً بهذا الرقم' });
    }
    const newCustomer: Customer = {
      phone: cleanPhone,
      name: name && name.trim() ? name.trim() : 'زبون مميز',
      password: password && password.trim() ? password.trim() : '123456',
      email: email && email.trim() ? email.trim() : undefined,
      favorites: []
    };
    db.customers[cleanPhone] = newCustomer;
    saveDb(db);
    await saveToFirestore("customers", cleanPhone, newCustomer);
    res.json({ success: true, customer: getSafeCustomer(newCustomer) });
  });

  app.post('/api/customers/sync-favorites', async (req, res) => {
    const db = loadDb();
    let { phone, favorites } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    phone = phone.trim().replace(/\s+/g, '');

    if (!db.customers[phone]) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    db.customers[phone].favorites = favorites || [];
    saveDb(db);
    await saveToFirestore("customers", phone, db.customers[phone]);

    res.json({ success: true, favorites: db.customers[phone].favorites });
  });

app.get('/api/customers/data/:phone', (req, res) => {
  const db = loadDb();
  let phone = req.params.phone;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }
  phone = phone.trim().replace(/\s+/g, '');
  const cleanPhone = phone;
  const normPhone = normalizePhoneForReviewCheck(phone);

  const customer = db.customers[phone] ||
    Object.values(db.customers || {}).find(c => {
      const cPhone = (c.phone || '').trim().replace(/\s+/g, '');
      return cPhone === cleanPhone || (normPhone && normalizePhoneForReviewCheck(cPhone) === normPhone);
    }) || null;

  const customerOrders = (db.orders || []).filter(o => {
    const oPhone = (o.customerPhone || '').trim().replace(/\s+/g, '');
    if (oPhone === cleanPhone) return true;
    if (normPhone && normalizePhoneForReviewCheck(oPhone) === normPhone) return true;
    if (normPhone.length >= 8 && oPhone.replace(/\D/g, '').endsWith(normPhone.slice(-8))) return true;
    return false;
  });

  const customerTickets = (db.tickets || []).filter(t => {
    const tPhone = (t.customerPhone || '').trim().replace(/\s+/g, '');
    if (tPhone === cleanPhone) return true;
    if (normPhone && normalizePhoneForReviewCheck(tPhone) === normPhone) return true;
    if (normPhone.length >= 8 && tPhone.replace(/\D/g, '').endsWith(normPhone.slice(-8))) return true;
    return false;
  });

  res.json({
    success: true,
    customer: getSafeCustomer(customer),
    orders: customerOrders,
    tickets: customerTickets
  });
});

app.get('/api/admin/favorites-analytics', (req, res) => {
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

app.get('/api/admin/database-stats', (req, res) => {
  const db = loadDb();
  const totalFavorites = Object.values(db.customers || {}).reduce((acc, c) => acc + ((c.favorites || []).length), 0);

  res.json({
    success: true,
    firebaseConnected: isFirebaseConnected,
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

app.get('/api/admin/database-all', (req, res) => {
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

app.get('/api/system/status', (req, res) => {
  res.json({
    database: {
      type: isFirebaseConnected ? 'Firebase Firestore (Live Real-time Cloud Database)' : 'Local High-Performance JSON Engine',
      isFirebaseConnected,
      status: 'healthy'
    },
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/analytics', (req, res) => {
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
    saveDb(db);
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
    metadata: metadata || undefined
  };

  if (!db.pixelEvents) db.pixelEvents = [];
  db.pixelEvents.unshift(newEvent);

  if (db.pixelEvents.length > 10000) {
    db.pixelEvents = db.pixelEvents.slice(0, 10000);
  }

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    setDoc(doc(firestoreDb, "pixelEvents", newEvent.id), sanitizeForFirestore(newEvent)).catch(() => {});
  }

  res.json({ success: true, event: newEvent });
});

app.get('/api/pixel/events', (req, res) => {
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

    if (e.eventType === 'PageView') {
      pageViews++;
      dailyMap[dateKey].pageViews++;
    } else if (e.eventType === 'ViewContent') {
      viewContents++;
      dailyMap[dateKey].viewContents++;
      if (e.productId) {
        if (!productMap[e.productId]) {
          productMap[e.productId] = { productId: e.productId, productName: e.productName || 'Product', views: 0, adds: 0, purchases: 0 };
        }
        productMap[e.productId].views++;
      }
    } else if (e.eventType === 'AddToCart') {
      addToCarts++;
      dailyMap[dateKey].addToCarts++;
      if (e.productId) {
        if (!productMap[e.productId]) {
          productMap[e.productId] = { productId: e.productId, productName: e.productName || 'Product', views: 0, adds: 0, purchases: 0 };
        }
        productMap[e.productId].adds++;
      }
    } else if (e.eventType === 'InitiateCheckout') {
      initiateCheckouts++;
      dailyMap[dateKey].initiateCheckouts++;
    } else if (e.eventType === 'Purchase') {
      purchases++;
      const val = e.value || 0;
      totalPurchaseValue += val;
      dailyMap[dateKey].purchases++;
      dailyMap[dateKey].revenue += val;
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

app.delete('/api/pixel/events', async (req, res) => {
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

app.post('/api/pixel/test', (req, res) => {
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

app.get('/api/financial-data', (req, res) => {
  const db = loadDb();
  const storeId = (req.query.storeId as string) || 'ma';

  const settings = (db.financialSettings && db.financialSettings[storeId]) || {
    storeId,
    defaultDeliveryFeePerOrder: 35,
    defaultReturnFeePerOrder: 15,
    defaultPackagingCostPerOrder: 3,
    defaultCallCenterCostPerOrder: 5,
    targetNetMarginPercent: 25,
    estimatedConfirmationRate: 85,
    estimatedDeliveryRate: 75
  };

  const adSpends = (db.adSpends || []).filter(a => !a.storeId || a.storeId === storeId || storeId === 'all');
  const expenses = (db.expenses || []).filter(e => !e.storeId || e.storeId === storeId || storeId === 'all');

  res.json({
    financialSettings: settings,
    adSpends,
    expenses
  });
});

app.post('/api/financial-settings', (req, res) => {
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
  res.json({ success: true, settings: db.financialSettings[targetStore] });
});

app.post('/api/ad-spends', (req, res) => {
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
  }

  res.json({ success: true, count: (db.adSpends || []).length });
});

app.post('/api/expenses', (req, res) => {
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
  }

  res.json({ success: true, count: (db.expenses || []).length });
});

app.get('/api/admins/status', (req, res) => {
  const db = loadDb();
  res.json({ hasAdmin: (db.admins || []).length > 0 });
});

app.post('/api/admins/login', authAndOrdersLimit, (req, res) => {
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

app.get('/api/admins', (req, res) => {
  const db = loadDb();
  const safeAdmins = (db.admins || []).map(admin => ({
    name: admin.name,
    email: admin.email,
    role: admin.role || 'super_admin',
    assignedStoreId: admin.assignedStoreId || 'all'
  }));
  res.json(safeAdmins);
});

app.post('/api/admins', authAndOrdersLimit, (req, res) => {
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

  if (!authorizedAdminEmail) {
    return res.status(401).json({ error: 'Unauthorized. Only logged-in administrators can create new admin profiles.' });
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

  const content = `# Mavluy Store - Robots.txt
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
    const host = req.get('host') || 'mavluy.com';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date().toISOString().split('T')[0];

    const db = loadDb();
    const urls: Array<{
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
      images?: Array<{ loc: string; title: string }>;
    }> = [];

    // 1. Root / Homepage
    urls.push({
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'daily',
      priority: '1.0',
    });

    // 2. Active Country Stores
    const countries = db.countries || DEFAULT_STORES;
    for (const c of countries) {
      if (c.status !== 'disabled') {
        urls.push({
          loc: `${baseUrl}/country/${c.slug}`,
          lastmod: now,
          changefreq: 'daily',
          priority: '0.9',
        });
      }
    }

    // 3. Informational & Legal Pages
    const staticPages = ['products', 'support', 'favorites'];
    for (const page of staticPages) {
      urls.push({
        loc: `${baseUrl}/${page}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.6',
      });
    }

    // 4. Products with Images
    const products = (db.products || []).filter(p => !p.isDeleted);
    for (const p of products) {
      const pImages: Array<{ loc: string; title: string }> = [];
      if (p.image && typeof p.image === 'string' && p.image.startsWith('http')) {
        pImages.push({ loc: p.image, title: p.name || 'Mavluy Product' });
      }
      if (Array.isArray(p.additionalImages)) {
        for (const img of p.additionalImages) {
          if (img && typeof img === 'string' && img.startsWith('http')) {
            pImages.push({ loc: img, title: p.name || 'Mavluy Product' });
          }
        }
      }

      // Root store product URL
      urls.push({
        loc: `${baseUrl}/?product=${encodeURIComponent(p.id)}`,
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
        changefreq: 'daily',
        priority: '0.85',
        images: pImages.length > 0 ? pImages : undefined,
      });

      // Country-specific product URL
      if (p.storeId) {
        urls.push({
          loc: `${baseUrl}/country/${p.storeId}?product=${encodeURIComponent(p.id)}`,
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now,
          changefreq: 'daily',
          priority: '0.8',
          images: pImages.length > 0 ? pImages : undefined,
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
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const item of urls) {
      xml += `  <url>\n`;
      xml += `    <loc>${xmlEscape(item.loc)}</loc>\n`;
      if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
        const productId = (req.query.product as string) || (req.query.id as string);
        const countrySlug = req.path.startsWith('/country/') ? req.path.split('/')[2] : 'ma';
        const storeConf = db.storeConfigs[countrySlug] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;

        let pageTitle = `${storeConf.storeName || 'Mavluy'} | متجر مافلوي للتسوق الفاخر`;
        let pageDesc = storeConf.description || 'متجر مافلوي للتسوق الراقي والموثوق مع الدفع عند الاستلام والتوصيل السريع.';
        let pageImage = storeConf.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop';
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.get('host') || 'mavluy.com';
        const canonicalUrl = `${protocol}://${host}${req.originalUrl}`;

        if (productId) {
          const product = (db.products || []).find(p => p.id === productId);
          if (product) {
            pageTitle = `${product.name} | Mavluy - متجر مافلوي`;
            pageDesc = product.description ? product.description.slice(0, 160) : pageDesc;
            if (product.image) pageImage = product.image;
          }
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

setupFrontend().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-stack server running on http://localhost:${PORT}`);
  });
});
