import { integer, pgTable, serial, text, timestamp, jsonb, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Define the 'users' table (linked to Firebase Auth UID).
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
  category: text('category'),
  stock: integer('stock').default(0),
  inStock: boolean('in_stock').default(true),
  isDeleted: boolean('is_deleted').default(false),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  city: text('city'),
  total: doublePrecision('total').notNull(),
  status: text('status').default('pending'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Store configurations table
export const storeConfigs = pgTable('store_configs', {
  storeId: text('store_id').primaryKey(),
  storeName: text('store_name').notNull(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// App state key-value table
export const appState = pgTable('app_state', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
