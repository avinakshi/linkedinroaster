/**
 * PostgreSQL-backed key-value store.
 * Drop-in replacement for Redis get/set/setex/incr/del/expire/ttl operations.
 * Expired rows are cleaned lazily on read + periodically via cleanup().
 */
import { query } from '../db';

/** Get a value (returns null if missing or expired) */
export async function kvGet(key: string): Promise<string | null> {
  const r = await query(
    `DELETE FROM kv_store WHERE key=$1 AND expires_at IS NOT NULL AND expires_at < NOW() RETURNING key`,
    [key],
  );
  if (r.rowCount && r.rowCount > 0) return null; // was expired

  const res = await query(`SELECT value FROM kv_store WHERE key=$1`, [key]);
  return res.rows[0]?.value ?? null;
}

/** Set a value (no expiry) */
export async function kvSet(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO kv_store (key, value, expires_at) VALUES ($1, $2, NULL)
     ON CONFLICT (key) DO UPDATE SET value=$2, expires_at=NULL`,
    [key, value],
  );
}

/** Set a value with TTL in seconds */
export async function kvSetex(key: string, ttlSeconds: number, value: string): Promise<void> {
  await query(
    `INSERT INTO kv_store (key, value, expires_at) VALUES ($1, $2, NOW() + $3 * INTERVAL '1 second')
     ON CONFLICT (key) DO UPDATE SET value=$2, expires_at=NOW() + $3 * INTERVAL '1 second'`,
    [key, value, ttlSeconds],
  );
}

/** Increment a numeric value, returns the new count */
export async function kvIncr(key: string): Promise<number> {
  // Clean if expired
  await query(
    `DELETE FROM kv_store WHERE key=$1 AND expires_at IS NOT NULL AND expires_at < NOW()`,
    [key],
  );
  const res = await query(
    `INSERT INTO kv_store (key, value) VALUES ($1, '1')
     ON CONFLICT (key) DO UPDATE SET value = (COALESCE(kv_store.value,'0')::int + 1)::text
     RETURNING value`,
    [key],
  );
  return parseInt(res.rows[0].value, 10);
}

/** Set expiry on an existing key (seconds) */
export async function kvExpire(key: string, ttlSeconds: number): Promise<void> {
  await query(
    `UPDATE kv_store SET expires_at = NOW() + $2 * INTERVAL '1 second' WHERE key=$1`,
    [key, ttlSeconds],
  );
}

/** Get TTL of a key in seconds (-1 if no expiry, -2 if key missing) */
export async function kvTtl(key: string): Promise<number> {
  const res = await query(
    `SELECT expires_at FROM kv_store WHERE key=$1`,
    [key],
  );
  if (!res.rows[0]) return -2;
  if (!res.rows[0].expires_at) return -1;
  const remaining = Math.ceil((new Date(res.rows[0].expires_at).getTime() - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
}

/** Delete a key */
export async function kvDel(key: string): Promise<void> {
  await query(`DELETE FROM kv_store WHERE key=$1`, [key]);
}

/** Periodic cleanup of expired rows — call on startup interval */
export function startKvCleanup(intervalMs = 60_000) {
  const run = () => {
    query(`DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at < NOW()`)
      .catch((e) => console.error('kv cleanup error:', e.message));
  };
  run();
  return setInterval(run, intervalMs);
}
