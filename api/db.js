function getConnectionUrl() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export async function getStore() {
  const url = getConnectionUrl();
  if (!url) return null;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql`SELECT key, data FROM sync_store`;
    const out = {};
    for (const r of rows) {
      out[r.key] = r.data;
    }
    return out;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function setStoreKey(key, data) {
  const url = getConnectionUrl();
  if (!url) return false;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    await sql`INSERT INTO sync_store (key, data) VALUES (${key}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
