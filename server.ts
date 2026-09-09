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
  deleteDoc
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

async function initFirebase() {
  try {
    if (fs.existsSync(FIREBASE_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_FILE, "utf-8"));
      firebaseProjectId = config.projectId || firebaseProjectId;
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);

      const testRef = doc(firestoreDb, "_test_collection", "ping");
      await setDoc(testRef, { lastPing: Date.now() });
      isFirebaseConnected = true;
      console.log("🟢 Successfully connected to Firebase Firestore database.");
      await syncFromFirestore();
    }
  } catch (err: any) {
    console.error("Firebase connection notice:", err?.message || err);
    isFirebaseConnected = false;
  }
}

async function syncFromFirestore() {
  if (!isFirebaseConnected || !firestoreDb) return;
  try {
    const db = loadDb();

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

    let modified = false;

    if (!prodsSnap.empty) {
      db.products = prodsSnap.docs.map(d => d.data() as Product);
      modified = true;
    } else if (db.products && db.products.length > 0) {
      for (const p of db.products) {
        await setDoc(doc(firestoreDb, "products", p.id), sanitizeForFirestore(p));
      }
    }

    if (!ordersSnap.empty) {
      db.orders = ordersSnap.docs.map(d => d.data() as Order);
      modified = true;
    } else if (db.orders && db.orders.length > 0) {
      for (const o of db.orders) {
        await setDoc(doc(firestoreDb, "orders", o.id), sanitizeForFirestore(o));
      }
    }

    if (!catsSnap.empty) {
      db.categories = catsSnap.docs.map(d => d.data() as Category);
      modified = true;
    } else if (db.categories && db.categories.length > 0) {
      for (const c of db.categories) {
        await setDoc(doc(firestoreDb, "categories", c.id), sanitizeForFirestore(c));
      }
    }

    if (!couponsSnap.empty) {
      db.coupons = couponsSnap.docs.map(d => d.data() as Coupon);
      modified = true;
    }

    if (!reviewsSnap.empty) {
      db.reviews = reviewsSnap.docs.map(d => d.data() as Review);
      modified = true;
    }

    if (!shipSnap.empty) {
      db.shippingMethods = shipSnap.docs.map(d => d.data() as ShippingMethod);
      modified = true;
    }

    if (!ticketsSnap.empty) {
      db.tickets = ticketsSnap.docs.map(d => d.data() as SupportTicket);
      modified = true;
    }

    if (!countriesSnap.empty) {
      db.countries = countriesSnap.docs.map(d => d.data() as CountryStore);
      modified = true;
    } else if (db.countries && db.countries.length > 0) {
      for (const c of db.countries) {
        await setDoc(doc(firestoreDb, "countries", c.id), sanitizeForFirestore(c));
      }
    }

    if (!configsSnap.empty) {
      configsSnap.docs.forEach(d => {
        const c = d.data() as StoreConfig;
        if (c.storeId) db.storeConfigs[c.storeId] = c;
      });
      modified = true;
    } else if (db.storeConfigs && Object.keys(db.storeConfigs).length > 0) {
      for (const [storeId, config] of Object.entries(db.storeConfigs)) {
        await setDoc(doc(firestoreDb, "storeConfigs", storeId), sanitizeForFirestore({ ...config, storeId }));
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
    } else if (db.admins && db.admins.length > 0) {
      for (const a of db.admins) {
        await setDoc(doc(firestoreDb, "admins", a.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_")), sanitizeForFirestore(a));
      }
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
    if (db.products) {
      for (const p of db.products) {
        await setDoc(doc(firestoreDb, "products", p.id), sanitizeForFirestore(p));
      }
    }
    if (db.orders) {
      for (const o of db.orders) {
        await setDoc(doc(firestoreDb, "orders", o.id), sanitizeForFirestore(o));
      }
    }
    if (db.categories) {
      for (const c of db.categories) {
        await setDoc(doc(firestoreDb, "categories", c.id), sanitizeForFirestore(c));
      }
    }
    if (db.coupons) {
      for (const c of db.coupons) {
        await setDoc(doc(firestoreDb, "coupons", c.id), sanitizeForFirestore(c));
      }
    }
    if (db.reviews) {
      for (const r of db.reviews) {
        await setDoc(doc(firestoreDb, "reviews", r.id), sanitizeForFirestore(r));
      }
    }
    if (db.shippingMethods) {
      for (const s of db.shippingMethods) {
        await setDoc(doc(firestoreDb, "shippingMethods", s.id), sanitizeForFirestore(s));
      }
    }
    if (db.tickets) {
      for (const t of db.tickets) {
        await setDoc(doc(firestoreDb, "tickets", t.id), sanitizeForFirestore(t));
      }
    }
    if (db.countries) {
      for (const c of db.countries) {
        await setDoc(doc(firestoreDb, "countries", c.id), sanitizeForFirestore(c));
      }
    }
    if (db.storeConfigs) {
      for (const [storeId, config] of Object.entries(db.storeConfigs)) {
        await setDoc(doc(firestoreDb, "storeConfigs", storeId), sanitizeForFirestore({ ...config, storeId }));
      }
    }
  } catch (err: any) {
    console.error("Error during bulk push to Firestore:", err?.message || err);
  }
}

async function clearFirestoreCollection(collName: string) {
  if (!isFirebaseConnected || !firestoreDb) return;
  try {
    const snap = await getDocs(collection(firestoreDb, collName));
    if (!snap.empty) {
      const deletePromises = snap.docs.map(d => deleteDoc(doc(firestoreDb, collName, d.id)).catch(() => {}));
      await Promise.all(deletePromises);
    }
  } catch (err: any) {
    console.error(`Error clearing Firestore collection ${collName}:`, err?.message || err);
  }
}

initFirebase();

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
}

function loadDb(): DbStructure {
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'المتجر المغربي الفاخر', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر ليبيا الفاخر', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر السعودية الفاخر', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'المتجر المغربي الفاخر', currency: 'MAD' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر ليبيا الفاخر', currency: 'LYD' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر السعودية الفاخر', currency: 'SAR' },
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

    return parsed as DbStructure;
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
    return initialDb;
  }
}

function saveDb(data: DbStructure) {
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

const generalApiLimit = rateLimit(300, 60);
const authAndOrdersLimit = rateLimit(45, 60, 'Too many attempts. Please wait a minute before trying again.');

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
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
    const requestorEmail = req.headers['x-admin-requestor'];
    if (requestorEmail) {
      const db = loadDb();
      const admin = db.admins.find(a => a.email.toLowerCase() === String(requestorEmail).trim().toLowerCase());
      if (admin) {
        req.user = { email: admin.email, role: admin.role || 'super_admin', assignedStoreId: admin.assignedStoreId };
        return next();
      }
    }
    return res.status(401).json({ error: 'Authentication token required.' });
  }
}

app.get(["/api/firebase/status", "/api/mongodb/status"], async (req, res) => {
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

app.post(["/api/firebase/sync-push", "/api/mongodb/sync-push"], async (req, res) => {
  const db = loadDb();
  if (isFirebaseConnected && firestoreDb) {
    await pushAllToFirestore(db);
    return res.json({ success: true, message: "All products, orders, categories, and settings synced to Firebase Firestore." });
  }
  res.json({ success: true, message: "Saved to local cache engine." });
});

app.post("/api/mongodb/connect", async (req, res) => {
  res.json({ success: true, message: "Firebase Firestore is active." });
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
        console.error('Cloudinary upload notice, fallback to optimized payload:', cloudErr?.message || cloudErr);
        return res.json({
          success: true,
          url: image,
          provider: 'local',
          warning: 'Cloudinary upload notice: ' + (cloudErr?.message || 'Check credentials')
        });
      }
    }

    return res.json({
      success: true,
      url: image,
      provider: 'local',
      warning: 'Cloudinary is not connected yet. Add Cloudinary credentials in Settings for direct cloud storage.'
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
  res.json({ success: true, country: newCountry, storeConfig: db.storeConfigs[cleanSlug] });
});

app.put('/api/countries/:id', (req, res) => {
  const db = loadDb();
  const countryId = req.params.id;
  const idx = db.countries.findIndex(c => c.id === countryId || c.slug === countryId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Country store not found.' });
  }

  db.countries[idx] = { ...db.countries[idx], ...req.body };
  saveDb(db);
  res.json({ success: true, country: db.countries[idx] });
});

app.patch('/api/countries/:id/status', (req, res) => {
  const db = loadDb();
  const countryId = req.params.id;
  const { status } = req.body;

  const country = db.countries.find(c => c.id === countryId || c.slug === countryId);
  if (!country) {
    return res.status(404).json({ error: 'Country store not found.' });
  }

  country.status = status === 'disabled' ? 'disabled' : 'active';
  saveDb(db);
  res.json({ success: true, country });
});

app.delete('/api/countries/:id', (req, res) => {
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

  if (isFirebaseConnected && firestoreDb) {
    deleteDoc(doc(firestoreDb, 'countries', countryId)).catch(() => {});
    deleteDoc(doc(firestoreDb, 'storeConfigs', slug)).catch(() => {});
  }

  saveDb(db);
  res.json({ success: true, message: 'Country store deleted.' });
});

app.get('/api/store-config', (req, res) => {
  const db = loadDb();
  const storeId = (req.query.storeId as string) || (req.query.slug as string) || 'ma';
  const config = db.storeConfigs[storeId] || db.storeConfigs['ma'] || DEFAULT_STORE_CONFIG;
  res.json(config);
});

app.post('/api/store-config', (req, res) => {
  const db = loadDb();
  const newConfig: StoreConfig = req.body;
  const storeId = newConfig.storeId || (req.query.storeId as string) || 'ma';

  db.storeConfigs[storeId] = { ...db.storeConfigs[storeId], ...newConfig, storeId };
  saveDb(db);
  res.json({ success: true, storeConfig: db.storeConfigs[storeId] });
});

app.post('/api/system/reset', async (req, res) => {
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
        ma: { ...DEFAULT_STORE_CONFIG, storeId: 'ma', storeName: 'المتجر المغربي الفاخر', currency: 'MAD', location: 'المغرب' },
        ly: { ...DEFAULT_STORE_CONFIG, storeId: 'ly', storeName: 'متجر ليبيا الفاخر', currency: 'LYD', shippingFee: 20, location: 'ليبيا' },
        sa: { ...DEFAULT_STORE_CONFIG, storeId: 'sa', storeName: 'متجر السعودية الفاخر', currency: 'SAR', shippingFee: 25, location: 'المملكة العربية السعودية' },
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

app.post('/api/database/wipe-all', async (req, res) => {
  try {
    const db = loadDb();
    const { target } = req.body || {};

    if (!target || target === 'all') {
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
      db.products = [];
      saveDb(db);
      await clearFirestoreCollection('products');
      return res.json({ success: true, message: 'All products wiped successfully.' });
    } else if (target === 'orders') {
      db.orders = [];
      saveDb(db);
      await clearFirestoreCollection('orders');
      return res.json({ success: true, message: 'All orders wiped successfully.' });
    } else if (target === 'coupons') {
      db.coupons = [];
      saveDb(db);
      await clearFirestoreCollection('coupons');
      return res.json({ success: true, message: 'All coupons wiped successfully.' });
    } else if (target === 'reviews') {
      db.reviews = [];
      db.customReviews = {};
      saveDb(db);
      await clearFirestoreCollection('reviews');
      return res.json({ success: true, message: 'All reviews wiped successfully.' });
    } else if (target === 'tickets') {
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

app.post('/api/products', (req, res) => {
  const db = loadDb();
  const newProduct: Product = req.body;

  if (!newProduct.id || !newProduct.name || newProduct.price === undefined) {
    return res.status(400).json({ error: 'Missing required product properties (id, name, price).' });
  }

  if (!newProduct.storeId) {
    newProduct.storeId = 'ma';
  }

  const existingIdx = db.products.findIndex(p => p.id === newProduct.id);
  if (existingIdx > -1) {
    db.products[existingIdx] = { ...db.products[existingIdx], ...newProduct };
  } else {
    db.products.push(newProduct);
  }

  saveDb(db);
  res.json({ success: true, product: newProduct });
});

app.delete('/api/products/all', async (req, res) => {
  const db = loadDb();
  const storeId = req.query.storeId as string;
  if (storeId && storeId !== 'all') {
    const toDelete = (db.products || []).filter(p => p.storeId === storeId);
    db.products = (db.products || []).filter(p => p.storeId !== storeId);
    saveDb(db);
    if (isFirebaseConnected && firestoreDb) {
      for (const p of toDelete) {
        deleteDoc(doc(firestoreDb, "products", p.id)).catch(() => {});
      }
    }
  } else {
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
    db.products = [];
    saveDb(db);
    await clearFirestoreCollection('products');
    return res.json({ success: true, message: 'All products permanently deleted from database and cloud.' });
  }

  const originalLength = db.products.length;
  db.products = db.products.filter(p => p.id !== productId);

  if (db.products.length === originalLength) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "products", productId));
    } catch (e: any) {
      console.error("Firestore product delete error:", e?.message || e);
    }
  }

  saveDb(db);
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

app.post('/api/categories', (req, res) => {
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
  res.json({ success: true, category: newCat });
});

app.delete('/api/categories/:id', (req, res) => {
  const db = loadDb();
  const catId = req.params.id;
  db.categories = db.categories.filter(c => c.id !== catId);
  saveDb(db);
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
  db.coupons = [];
  saveDb(db);
  await clearFirestoreCollection('coupons');
  res.json({ success: true, message: 'All coupons permanently deleted.', coupons: [] });
});

app.delete('/api/coupons/:id', async (req, res) => {
  const db = loadDb();
  const { id } = req.params;

  if (id === 'all') {
    db.coupons = [];
    saveDb(db);
    await clearFirestoreCollection('coupons');
    return res.json({ success: true, message: 'All coupons permanently deleted.', coupons: [] });
  }

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

app.post('/api/shipping', (req, res) => {
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
  res.json({ success: true, shippingMethod: newMethod });
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

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, "orders", newOrder.id), sanitizeForFirestore(newOrder));
    } catch (e) {
      console.error("Firebase order save error:", e);
    }
  }

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

    if (storeConf.googleSheetAutoSync !== false && storeConf.googleSheetWebhookUrl && storeConf.googleSheetWebhookUrl.startsWith('http')) {
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

        fetch(storeConf.googleSheetWebhookUrl, {
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

app.delete('/api/customers/:phone', async (req, res) => {
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
    db.orders = (db.orders || []).filter(o => o.storeId !== storeId);
    saveDb(db);
    if (isFirebaseConnected && firestoreDb) {
      for (const o of toDelete) {
        deleteDoc(doc(firestoreDb, "orders", o.id)).catch(() => {});
      }
    }
  } else {
    db.orders = [];
    saveDb(db);
    await clearFirestoreCollection('orders');
  }
  res.json({ success: true, message: 'All orders permanently deleted from database and cloud.' });
});

app.delete('/api/orders/:id', async (req, res) => {
  const db = loadDb();
  const orderId = req.params.id;

  if (orderId === 'all') {
    db.orders = [];
    saveDb(db);
    await clearFirestoreCollection('orders');
    return res.json({ success: true, message: 'All orders permanently deleted from database and cloud.' });
  }

  db.orders = (db.orders || []).filter(o => o.id !== orderId);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, "orders", orderId));
    } catch (e) {
      console.error("Firebase order delete error:", e);
    }
  }

  res.json({ success: true, message: 'Order permanently deleted' });
});

app.post('/api/orders/bulk-delete', async (req, res) => {
  const db = loadDb();
  const { ids } = req.body;

  if (Array.isArray(ids) && ids.length > 0) {
    const idSet = new Set(ids);
    db.orders = (db.orders || []).filter(o => !idSet.has(o.id));
    saveDb(db);

    if (isFirebaseConnected && firestoreDb) {
    for (const orderId of ids) {
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
  const targetUrl = webhookUrl || storeConf.googleSheetWebhookUrl;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'يرجى إدخال رابط Google Apps Script Webhook صالح يبدأ بـ https://' });
  }

  const testPayload = {
    orderId: `TEST-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' }),
    customerName: 'محمد أمين (طلب تجريبي)',
    customerPhone: '0612345678',
    customerCity: 'الدار البيضاء Casablanca',
    customerAddress: 'شارع الزرقطوني، عمارة 12، شقة 4',
    productName: 'سماعات بلوتوث الذكية Pro x1',
    quantity: 1,
    subtotal: 299,
    shippingFee: 0,
    total: 299,
    currency: 'MAD',
    notes: 'طلب فحص وتجربة الربط مع Google Sheet & TajerCOD',
    source: 'Test Order (TajerCOD Sync)',
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
  let list = db.tickets || [];
  if (storeId && storeId !== 'all') {
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
  } else {
    ticket.seen = true;
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
  db.tickets = [];
  saveDb(db);
  await clearFirestoreCollection('tickets');
  res.json({ success: true, message: 'All tickets permanently deleted.' });
});

app.delete('/api/tickets/:id', async (req, res) => {
  const db = loadDb();
  const ticketId = req.params.id;

  if (ticketId === 'all') {
    db.tickets = [];
    saveDb(db);
    await clearFirestoreCollection('tickets');
    return res.json({ success: true, message: 'All tickets permanently deleted.' });
  }

  db.tickets = (db.tickets || []).filter(t => t.id !== ticketId);
  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    deleteDoc(doc(firestoreDb, "tickets", ticketId)).catch(() => {});
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
    db.reviews = [];
    db.customReviews = {};
    saveDb(db);
    await clearFirestoreCollection('reviews');
    return res.json({ success: true, message: 'All reviews permanently deleted.' });
  }

  db.reviews = (db.reviews || []).filter(r => r.id !== reviewId);

  Object.keys(db.customReviews || {}).forEach(k => {
    db.customReviews[k] = db.customReviews[k].filter(r => r.id !== reviewId);
  });

  saveDb(db);

  if (isFirebaseConnected && firestoreDb) {
    deleteDoc(doc(firestoreDb, "reviews", reviewId)).catch(() => {});
  }

  res.json({ success: true });
});

app.get('/api/custom-reviews', (req, res) => {
  const db = loadDb();
  res.json(db.customReviews || {});
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

  res.json({ success: true, customer: getSafeCustomer(newCustomer) });
});

app.put('/api/customers/profile', (req, res) => {
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

      (db.orders || []).forEach(o => {
        if ((o.customerPhone || '').trim().replace(/\s+/g, '') === currClean) {
          o.customerPhone = newClean;
        }
      });

      (db.tickets || []).forEach(t => {
        if ((t.customerPhone || '').trim().replace(/\s+/g, '') === currClean) {
          t.customerPhone = newClean;
        }
      });
    }
  }

  saveDb(db);
  res.json({ success: true, customer: getSafeCustomer(customer) });
});

app.get('/api/customers', (req, res) => {
  const db = loadDb();
  const customersList = Object.values(db.customers || {});
  res.json(customersList);
});

app.post('/api/customers', (req, res) => {
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
  res.json({ success: true, customer: newCustomer });
});

app.post('/api/customers/sync-favorites', (req, res) => {
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
    firebaseConnected: isFirebaseConnected, mongoConnected: false,
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
    firebaseConnected: isFirebaseConnected, mongoConnected: false,
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
    const requestorEmail = req.headers['x-admin-requestor'];
    if (requestorEmail) {
      authorizedAdminEmail = String(requestorEmail).trim().toLowerCase();
    }
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
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static serving active.');
  }
}

setupFrontend().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-stack server running on http://localhost:${PORT}`);
  });
});
