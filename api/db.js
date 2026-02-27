import { neon } from '@neondatabase/serverless';

const sql = process.env.POSTGRES_URL
  ? neon(process.env.POSTGRES_URL)
  : null;

export async function getStore() {
  if (!sql) return null;
  const rows = await sql`SELECT key, data FROM sync_store`;
  const out = {};
  for (const r of rows) {
    out[r.key] = r.data;
  }
  return out;
}

export async function setStoreKey(key, data) {
  if (!sql) return false;
  await sql`INSERT INTO sync_store (key, data) VALUES (${key}, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`;
  return true;
}
