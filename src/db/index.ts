import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isSqlConfigured = () => {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SQL_HOST);
};

export const createPool = () => {
  if (!isSqlConfigured()) {
    return {
      query: async () => ({ rows: [] }),
      connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
      on: () => {},
    } as unknown as Pool;
  }

  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (connectionString) {
      const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
      global._postgresPool = new Pool({
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      const isLocalhost = !process.env.SQL_HOST || process.env.SQL_HOST.includes('localhost') || process.env.SQL_HOST.includes('127.0.0.1');
      const useSsl = process.env.SQL_SSL === 'true' || (!isLocalhost && process.env.SQL_SSL !== 'false');

      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

let db: ReturnType<typeof drizzle>;
try {
  if (!isSqlConfigured()) {
    throw new Error('Database not configured');
  }
  const pool = createPool();
  db = drizzle(pool, { schema });
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const chainable: any = new Proxy(() => chainable, {
    get: (_target, prop) => {
      if (prop === 'then') {
        return (resolve: any) => resolve([]);
      }
      if (prop === 'query') {
        return new Proxy({}, { get: () => noOp });
      }
      return () => chainable;
    },
  });
  db = chainable;
}

export { db };
