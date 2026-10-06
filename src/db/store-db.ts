import { db } from './index.js';
import { products, orders, storeConfigs, appState, users } from './schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Safe query helpers with robust two-layer error handling
 */

export async function getAppState(key: string): Promise<any | null> {
  try {
    const records = await db.select().from(appState).where(eq(appState.key, key));
    if (records.length > 0) {
      return records[0].value;
    }
    return null;
  } catch (err) {
    console.error(`[CloudSQL] Error fetching appState for key "${key}":`, err);
    return null;
  }
}

export async function setAppState(key: string, value: any): Promise<boolean> {
  try {
    await db
      .insert(appState)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appState.key,
        set: { value, updatedAt: new Date() }
      });
    return true;
  } catch (err) {
    console.error(`[CloudSQL] Error saving appState for key "${key}":`, err);
    return false;
  }
}

export async function getAllProductsFromSql(): Promise<any[]> {
  try {
    const rows = await db.select().from(products).where(eq(products.isDeleted, false));
    return rows.map(r => ({
      ...((r.data as any) || {}),
      id: r.id,
      name: r.name,
      price: r.price,
      category: r.category || '',
      stock: r.stock ?? 0,
      inStock: r.inStock ?? true,
      isDeleted: false,
    }));
  } catch (err) {
    console.error('[CloudSQL] Error fetching products:', err);
    return [];
  }
}

export async function upsertProductInSql(product: any): Promise<boolean> {
  try {
    const id = String(product.id);
    const name = String(product.name || 'Unnamed Product');
    const price = Number(product.price) || 0;
    const category = product.category ? String(product.category) : '';
    const stock = typeof product.stock === 'number' ? product.stock : 0;
    const inStock = product.inStock !== false;
    const isDeleted = Boolean(product.isDeleted);

    await db
      .insert(products)
      .values({
        id,
        name,
        price,
        category,
        stock,
        inStock,
        isDeleted,
        data: product,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name,
          price,
          category,
          stock,
          inStock,
          isDeleted,
          data: product,
          updatedAt: new Date()
        }
      });
    return true;
  } catch (err) {
    console.error(`[CloudSQL] Error upserting product ${product.id}:`, err);
    return false;
  }
}

export async function getAllOrdersFromSql(): Promise<any[]> {
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return rows.map(r => ({
      ...((r.data as any) || {}),
      id: r.id,
      orderNumber: r.orderNumber || r.id,
      name: r.customerName,
      phone: r.customerPhone,
      city: r.city || '',
      total: r.total,
      status: r.status || 'pending',
    }));
  } catch (err) {
    console.error('[CloudSQL] Error fetching orders:', err);
    return [];
  }
}

export async function upsertOrderInSql(order: any): Promise<boolean> {
  try {
    const id = String(order.id);
    const orderNumber = order.orderNumber ? String(order.orderNumber) : id;
    const customerName = String(order.name || order.customerName || 'Anonymous');
    const customerPhone = String(order.phone || order.customerPhone || '');
    const city = String(order.city || '');
    const total = Number(order.total) || 0;
    const status = String(order.status || 'pending');

    await db
      .insert(orders)
      .values({
        id,
        orderNumber,
        customerName,
        customerPhone,
        city,
        total,
        status,
        data: order,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: orders.id,
        set: {
          orderNumber,
          customerName,
          customerPhone,
          city,
          total,
          status,
          data: order,
          updatedAt: new Date()
        }
      });
    return true;
  } catch (err) {
    console.error(`[CloudSQL] Error saving order ${order.id}:`, err);
    return false;
  }
}

export async function getStoreConfigsFromSql(): Promise<Record<string, any>> {
  try {
    const rows = await db.select().from(storeConfigs);
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.storeId] = {
        ...((r.data as any) || {}),
        storeId: r.storeId,
        storeName: r.storeName
      };
    }
    return map;
  } catch (err) {
    console.error('[CloudSQL] Error fetching storeConfigs:', err);
    return {};
  }
}

export async function upsertStoreConfigInSql(storeId: string, storeName: string, data: any): Promise<boolean> {
  try {
    await db
      .insert(storeConfigs)
      .values({
        storeId,
        storeName,
        data,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: storeConfigs.storeId,
        set: {
          storeName,
          data,
          updatedAt: new Date()
        }
      });
    return true;
  } catch (err) {
    console.error(`[CloudSQL] Error saving storeConfig ${storeId}:`, err);
    return false;
  }
}

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({ uid, email })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('[CloudSQL] Error in getOrCreateUser:', error);
    throw new Error('Database user sync failed', { cause: error });
  }
}

export async function deleteProductFromSql(productId: string): Promise<boolean> {
  try {
    await db.update(products).set({ isDeleted: true, updatedAt: new Date() }).where(eq(products.id, productId));
    return true;
  } catch (err) {
    console.error(`[Postgres/Supabase] Error deleting product ${productId}:`, err);
    return false;
  }
}

export async function deleteOrderFromSql(orderId: string): Promise<boolean> {
  try {
    await db.delete(orders).where(eq(orders.id, orderId));
    return true;
  } catch (err) {
    console.error(`[Postgres/Supabase] Error deleting order ${orderId}:`, err);
    return false;
  }
}

export async function initPostgresTables(): Promise<boolean> {
  try {
    const { createPool } = await import('./index.js');
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "app_state" (
        "key" text PRIMARY KEY NOT NULL,
        "value" jsonb NOT NULL,
        "updated_at" timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "products" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "price" double precision NOT NULL,
        "category" text,
        "stock" integer DEFAULT 0,
        "in_stock" boolean DEFAULT true,
        "is_deleted" boolean DEFAULT false,
        "data" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" text PRIMARY KEY NOT NULL,
        "order_number" text,
        "customer_name" text NOT NULL,
        "customer_phone" text NOT NULL,
        "city" text,
        "total" double precision NOT NULL,
        "status" text DEFAULT 'pending',
        "data" jsonb NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "store_configs" (
        "store_id" text PRIMARY KEY NOT NULL,
        "store_name" text NOT NULL,
        "data" jsonb NOT NULL,
        "updated_at" timestamp DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "uid" text UNIQUE NOT NULL,
        "email" text NOT NULL,
        "role" text DEFAULT 'user',
        "created_at" timestamp DEFAULT now()
      );
    `);
    console.log("🟢 [Postgres/Supabase] Tables verified and ready.");
    return true;
  } catch (err: any) {
    console.warn("⚠️ [Postgres/Supabase] Table initialization notice:", err?.message || err);
    return false;
  }
}

export async function wipePostgresTable(target: string): Promise<boolean> {
  try {
    const { isSqlConfigured } = await import('./index.js');
    if (!isSqlConfigured()) return true;

    if (!target || target === 'all') {
      await db.delete(products);
      await db.delete(orders);
      await db.delete(storeConfigs);
      await db.delete(appState);
    } else if (target === 'products') {
      await db.delete(products);
    } else if (target === 'orders') {
      await db.delete(orders);
    }
    return true;
  } catch (err) {
    console.error(`[Postgres/Supabase] Error wiping table ${target}:`, err);
    return false;
  }
}
