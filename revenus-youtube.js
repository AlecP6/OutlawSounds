/**
 * Revenus YouTube — récupération des vues (API YouTube Data v3) et calcul des revenus
 * Tarifs : 350 $/vue (vidéo sans clip), 500 $/vue (vidéo avec clip)
 */

const YOUTUBE_SONS_KEY = 'label_rp_youtube_sons';
const YOUTUBE_API_KEY_STORAGE = 'label_rp_youtube_api_key';
/** Clé API YouTube partagée pour le label (utilisée si aucune clé n’est enregistrée dans le navigateur). */
const DEFAULT_API_KEY = 'AIzaSyDYwbWTOg0WQyhELhdy-GBqnZwGiXiI2Nc';

const TARIFS = { prixSansClip: 350, prixAvecClip: 500 };

function getApiKey() {
  return localStorage.getItem(YOUTUBE_API_KEY_STORAGE) || DEFAULT_API_KEY;
}

function getSons() {
  try {
    const raw = localStorage.getItem(YOUTUBE_SONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSons(sons) {
  localStorage.setItem(YOUTUBE_SONS_KEY, JSON.stringify(sons));
}

function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const matchYoutube = u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return matchYoutube ? matchYoutube[1] : null;
}

function formatDollars(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/** Calcule le revenu d'un son : vues × (500 si clip, 350 si sans clip) */
function calculerRevenusSon(views, typePublication) {
  const v = Number(views) || 0;
  const prix = typePublication === 'clip' ? TARIFS.prixAvecClip : TARIFS.prixSansClip;
  const total = v * prix;
  return { total, prixParVue: prix };
}

/** Appel API YouTube pour récupérer titre + vues */
async function fetchVideoStats(videoId, apiKey) {
  if (!apiKey) throw new Error('Clé API non renseignée.');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.error?.code === 403 && err.error?.errors?.[0]?.reason === 'quotaExceeded')
      throw new Error('Quota API YouTube dépassé. Réessaie demain.');
    throw new Error(err.error?.message || 'Erreur API YouTube');
  }
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error('Vidéo introuvable.');
  const viewCount = parseInt(item.statistics?.viewCount || '0', 10);
  const title = item.snippet?.title || 'Sans titre';
  return { viewCount, title };
}

const tbody = document.getElementById('tbody-sons');
const form = document.getElementById('form-son');
const btnRefreshAll = document.getElementById('btn-refresh-all');

function fillArtisteSelect() {
  const sel = document.getElementById('artiste-son');
  if (!sel) return;
  const artistes = typeof getStorage === 'function' ? getStorage(STORAGE_KEYS.artistes, []) : [];
  const options = artistes.map((a, i) => `<option value="${i}">${escapeHtml(a.nom || 'Sans nom')}</option>`).join('');
  sel.innerHTML = '<option value="">— Aucun —</option>' + options;
}

function renderSons() {
  const sons = getSons();
  const artistes = typeof getStorage === 'function' ? getStorage(STORAGE_KEYS.artistes, []) : [];
  const elTotalLabel = document.getElementById('total-youtube');
  const elTotalArtistes = document.getElementById('total-youtube-artistes');
  let totalLabel = 0;
  let totalArtistes = 0;

  fillArtisteSelect();

  if (sons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty-state">Aucun son. Ajoute un lien YouTube ci-dessus.</td></tr>';
    if (elTotalLabel) elTotalLabel.textContent = formatDollars(0);
    if (elTotalArtistes) elTotalArtistes.textContent = formatDollars(0);
    return;
  }

  tbody.innerHTML = sons.map((son, i) => {
    const partLabel = typeof getYouTubeLabelPart === 'function' ? getYouTubeLabelPart(son) : 0;
    const partArtiste = typeof getYouTubeArtistPart === 'function' ? getYouTubeArtistPart(son) : 0;
    totalLabel += partLabel;
    totalArtistes += partArtiste;
    const totalSon = (typeof getYouTubeSonAmount === 'function' ? getYouTubeSonAmount(son) : 0);

    const nomArtiste = (son.artisteId != null && son.artisteId !== '') && artistes[son.artisteId]
      ? artistes[son.artisteId].nom
      : '—';
    const typeLabel = (son.typePublication === 'clip') ? 'Avec clip (500 $/vue)' : 'Sans clip (350 $/vue)';
    const linkHtml = son.videoId
      ? `<a href="https://www.youtube.com/watch?v=${escapeHtml(son.videoId)}" target="_blank" rel="noopener" class="nav-link">Voir</a>`
      : '—';
    const views = son.views != null ? son.views : null;
    const viewsText = views != null ? views.toLocaleString('fr-FR') : (son.loading ? '…' : (son.error || '—'));
    const datePub = son.datePublication ? new Date(son.datePublication).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

    return `
      <tr data-id="${i}">
        <td>${escapeHtml(son.title || '—')}</td>
        <td>${datePub}</td>
        <td>${escapeHtml(nomArtiste)}</td>
        <td>${typeLabel}</td>
        <td>${linkHtml}</td>
        <td>${viewsText}</td>
        <td class="amount-positive">${formatDollars(partLabel)}</td>
        <td>${formatDollars(partArtiste)}</td>
        <td class="amount-positive">${formatDollars(totalSon)}</td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm btn-refresh-one" title="Actualiser les vues">Actualiser</button>
          <button type="button" class="btn btn-secondary btn-sm btn-delete-son" title="Supprimer">Suppr.</button>
        </td>
      </tr>
    `;
  }).join('');

  if (elTotalLabel) elTotalLabel.textContent = formatDollars(totalLabel);
  if (elTotalArtistes) elTotalArtistes.textContent = formatDollars(totalArtistes);

  tbody.querySelectorAll('.btn-refresh-one').forEach((btn) => {
    btn.addEventListener('click', () => refreshOne(parseInt(btn.closest('tr').dataset.id, 10)));
  });
  tbody.querySelectorAll('.btn-delete-son').forEach((btn) => {
    btn.addEventListener('click', () => deleteSon(parseInt(btn.closest('tr').dataset.id, 10)));
  });
}

async function refreshOne(index) {
  const sons = getSons();
  const son = sons[index];
  if (!son?.videoId) return;
  son.loading = true;
  son.error = null;
  setSons(sons);
  renderSons();
  const apiKey = getApiKey();
  try {
    const { viewCount, title } = await fetchVideoStats(son.videoId, apiKey);
    son.views = viewCount;
    son.title = title;
    son.loading = false;
    son.error = null;
  } catch (e) {
    son.loading = false;
    son.error = e.message || 'Erreur';
  }
  setSons(sons);
  renderSons();
}

async function refreshAll() {
  const sons = getSons();
  const apiKey = getApiKey();
  if (!apiKey) {
    alert('Enregistre d’abord ta clé API YouTube.');
    return;
  }
  for (let i = 0; i < sons.length; i++) {
    const son = sons[i];
    if (!son.videoId) continue;
    son.loading = true;
    son.error = null;
  }
  setSons(sons);
  renderSons();
  for (let i = 0; i < sons.length; i++) {
    const son = sons[i];
    if (!son.videoId) continue;
    try {
      const { viewCount, title } = await fetchVideoStats(son.videoId, apiKey);
      son.views = viewCount;
      son.title = title;
      son.error = null;
    } catch (e) {
      son.error = e.message || 'Erreur';
    }
    son.loading = false;
    setSons(sons);
    renderSons();
  }
}

function deleteSon(index) {
  const sons = getSons();
  sons.splice(index, 1);
  setSons(sons);
  renderSons();
}

async function addSon(url, typePublication) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    alert('Lien YouTube invalide. Utilise un lien du type youtube.com/watch?v=... ou youtu.be/...');
    return;
  }
  const apiKey = getApiKey();
  const sons = getSons();
  const existing = sons.find((s) => s.videoId === videoId);
  if (existing) {
    alert('Ce son est déjà dans la liste.');
    return;
  }
  const datePublication = document.getElementById('date-publication')?.value || new Date().toISOString().slice(0, 10);
  const artisteSel = document.getElementById('artiste-son');
  const artisteId = (artisteSel && artisteSel.value !== '') ? artisteSel.value : null;
  const son = { videoId, url, typePublication: typePublication || 'musique', datePublication, artisteId, title: '', views: null, loading: true, error: null };
  sons.push(son);
  setSons(sons);
  renderSons();
  if (apiKey) {
    try {
      const { viewCount, title } = await fetchVideoStats(videoId, apiKey);
      son.views = viewCount;
      son.title = title;
      son.error = null;
    } catch (e) {
      son.error = e.message || 'Erreur';
    }
    son.loading = false;
  } else {
    son.loading = false;
    son.error = 'Clé API non renseignée';
  }
  setSons(sons);
  renderSons();
}

if (form) {
  const datePubInput = document.getElementById('date-publication');
  if (datePubInput && !datePubInput.value) datePubInput.value = new Date().toISOString().slice(0, 10);
  fillArtisteSelect();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('url-youtube').value.trim();
    const type = document.getElementById('type-publication').value;
    if (!url) {
      alert('Indique un lien YouTube.');
      return;
    }
    addSon(url, type);
    form.reset();
    if (datePubInput) datePubInput.value = new Date().toISOString().slice(0, 10);
    fillArtisteSelect();
  });
}

if (btnRefreshAll) {
  btnRefreshAll.addEventListener('click', () => refreshAll());
}

renderSons();
