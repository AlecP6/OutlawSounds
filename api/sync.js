import { getStore, setStoreKey } from './db.js';

const ALLOWED_KEYS = new Set([
  'label_rp_revenus',
  'label_rp_depenses',
  'label_rp_artistes',
  'label_rp_contrats',
  'label_rp_sorties',
  'label_rp_subventions',
  'label_rp_youtube_sons',
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      const store = await getStore();
      if (store && store.__error) {
        const hint = store.__error === 'NO_URL'
          ? 'Add POSTGRES_URL in Vercel → Settings → Environment Variables (Production)'
          : 'Check connection string (copy from Neon dashboard, no psql wrapper). Host typo?';
        return res.status(503).json({
          error: 'Database not configured',
          detail: store.__error === 'NO_URL' ? undefined : store.__error,
          hint,
        });
      }
      if (!store || typeof store !== 'object') {
        return res.status(503).json({ error: 'Database not configured', hint: 'Redeploy Production after setting POSTGRES_URL' });
      }
      return res.status(200).json(store);
    }

    if (req.method === 'POST') {
      const { key, data } = req.body || {};
      if (!key || !ALLOWED_KEYS.has(key)) {
        return res.status(400).json({ error: 'Invalid or missing key' });
      }
      const payload = Array.isArray(data) ? data : (data != null ? [data] : []);
      await setStoreKey(key, payload);
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
