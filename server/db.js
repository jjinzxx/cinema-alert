// server/db.js
// Optional PostgreSQL storage layer (Neon, Supabase, Render Postgres)
// Falls back gracefully to local files if DATABASE_URL is not set.

import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function isDbEnabled() {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function initDb() {
  if (!isDbEnabled()) return false;
  try {
    const p = getPool();
    await p.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ PostgreSQL Cloud Database connected successfully!');
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL:', err.message);
    return false;
  }
}

export async function getDbValue(key, defaultValue = null) {
  if (!isDbEnabled()) return defaultValue;
  try {
    const p = getPool();
    const res = await p.query('SELECT value FROM kv_store WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from DB:`, err.message);
    return defaultValue;
  }
}

export async function setDbValue(key, value) {
  if (!isDbEnabled()) return;
  try {
    const p = getPool();
    await p.query(
      `INSERT INTO kv_store (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  } catch (err) {
    console.error(`Error saving ${key} to DB:`, err.message);
  }
}
