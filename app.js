/**
 * Label RP — Données en localStorage pour le roleplay
 */

const STORAGE_KEYS = {
  revenus: 'label_rp_revenus',
  depenses: 'label_rp_depenses',
  artistes: 'label_rp_artistes',
  contrats: 'label_rp_contrats',
  sorties: 'label_rp_sorties',
  subventions: 'label_rp_subventions',
};

/** 350 $/vue sans clip, 500 $/vue avec clip */
const YOUTUBE_PRIX_PAR_VUE = { musique: 350, clip: 500 };

function getStorage(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthTotal(items, monthKey) {
  return items
    .filter((item) => (item.date || '').startsWith(monthKey))
    .reduce((sum, item) => sum + (Number(item.montant) || 0), 0);
}

/** Début et fin de la semaine ISO en cours (lundi–dimanche) */
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // lundi
  const lundi = new Date(now);
  lundi.setDate(diff);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  return {
    start: lundi.toISOString().slice(0, 10),
    end: dimanche.toISOString().slice(0, 10),
  };
}

function getWeekTotal(items, weekStart, weekEnd) {
  return items
    .filter((item) => {
      const d = item.date || '';
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((sum, item) => sum + (Number(item.montant) || 0), 0);
}

/** Liste des plages de semaines (semaine en cours + n semaines passées) pour les filtres */
function getWeekRanges(count = 14) {
  const ranges = [];
  const { start, end } = getCurrentWeekRange();
  let lundi = new Date(start);
  for (let i = 0; i < count; i++) {
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    ranges.push({
      start: lundi.toISOString().slice(0, 10),
      end: dimanche.toISOString().slice(0, 10),
      label: i === 0 ? 'Semaine en cours' : `Semaine du ${lundi.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au ${dimanche.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
    });
    lundi.setDate(lundi.getDate() - 7);
  }
  return ranges;
}

function getTotalAllTime(items) {
  return items.reduce((sum, item) => sum + (Number(item.montant) || 0), 0);
}

/** Montant calculé pour un son YouTube : 350 $/vue (sans clip) ou 500 $/vue (avec clip) */
function getYouTubeSonAmount(s) {
  const v = Number(s.views) || 0;
  const prix = YOUTUBE_PRIX_PAR_VUE[s.typePublication === 'clip' ? 'clip' : 'musique'] || 350;
  return v * prix;
}

/** Contrat actif pour un artiste à une date donnée (datePublication) */
function getContratForArtisteAtDate(artisteId, dateStr) {
  if (artisteId == null || artisteId === '' || !dateStr) return null;
  const contrats = getStorage(STORAGE_KEYS.contrats, []);
  const candidats = contrats
    .filter((c) => String(c.artisteId) === String(artisteId))
    .filter((c) => (c.dateDebut || '') <= dateStr && (!c.dateFin || c.dateFin >= dateStr))
    .sort((a, b) => (b.dateDebut || '').localeCompare(a.dateDebut || ''));
  return candidats[0] || null;
}

/** Pourcentages label / artiste pour un artiste à une date (définis par le contrat) */
function getContractPercentages(artisteId, dateStr) {
  const c = getContratForArtisteAtDate(artisteId, dateStr);
  if (!c) return { pctLabel: 100, pctArtiste: 0 };
  const pctLabel = Math.min(100, Math.max(0, Number(c.pctLabel) || 50));
  const pctArtiste = Math.min(100, Math.max(0, Number(c.pctArtiste) || 50));
  return { pctLabel, pctArtiste };
}

/** Part revenus YouTube revenant au label (selon contrat artiste) */
function getYouTubeLabelPart(s) {
  const total = getYouTubeSonAmount(s);
  if (s.artisteId == null || s.artisteId === '') return total;
  const { pctLabel } = getContractPercentages(s.artisteId, s.datePublication || '');
  return Math.round(total * pctLabel / 100);
}

/** Part revenus YouTube revenant à l'artiste (selon contrat) */
function getYouTubeArtistPart(s) {
  const total = getYouTubeSonAmount(s);
  if (s.artisteId == null || s.artisteId === '') return 0;
  const { pctArtiste } = getContractPercentages(s.artisteId, s.datePublication || '');
  return Math.round(total * pctArtiste / 100);
}

/** Total des revenus YouTube pour le label (part label uniquement) */
function getYouTubeTotal() {
  const sons = getStorage('label_rp_youtube_sons', []);
  return sons.reduce((sum, s) => sum + getYouTubeLabelPart(s), 0);
}

/** Total revenus YouTube (part label) pour une semaine (selon date de publication) */
function getYouTubeTotalForWeek(weekStart, weekEnd) {
  const sons = getStorage('label_rp_youtube_sons', []);
  return sons
    .filter((s) => s.datePublication && s.datePublication >= weekStart && s.datePublication <= weekEnd)
    .reduce((sum, s) => sum + getYouTubeLabelPart(s), 0);
}

/** Total revenus YouTube (part label) pour une année (selon date de publication) */
function getYouTubeTotalForYear(yearKey) {
  const sons = getStorage('label_rp_youtube_sons', []);
  return sons
    .filter((s) => (s.datePublication || '').startsWith(yearKey))
    .reduce((sum, s) => sum + getYouTubeLabelPart(s), 0);
}

/** Liste des revenus YouTube pour affichage compta (montant = part label) */
function getYouTubeRevenusEntries() {
  const sons = getStorage('label_rp_youtube_sons', []);
  return sons
    .filter((s) => s.datePublication)
    .map((s) => ({
      date: s.datePublication,
      libelle: (s.title || 'YouTube') + ' (YouTube)',
      montant: getYouTubeLabelPart(s),
      _source: 'youtube',
    }));
}

/** Total subventions sur une semaine */
function getSubventionsTotalForWeek(weekStart, weekEnd) {
  const sub = getStorage(STORAGE_KEYS.subventions, []);
  return getWeekTotal(sub, weekStart, weekEnd);
}

/** Total subventions sur l'année */
function getSubventionsTotalForYear(yearKey) {
  const sub = getStorage(STORAGE_KEYS.subventions, []);
  return sub.filter((s) => (s.date || '').startsWith(yearKey)).reduce((sum, s) => sum + (Number(s.montant) || 0), 0);
}

/** Total subventions tout */
function getSubventionsTotalAll() {
  return getTotalAllTime(getStorage(STORAGE_KEYS.subventions, []));
}

/** Mise à jour des stats sur le tableau de bord (par semaine) */
function updateDashboardStats() {
  const revenus = getStorage(STORAGE_KEYS.revenus);
  const depenses = getStorage(STORAGE_KEYS.depenses);
  const artistes = getStorage(STORAGE_KEYS.artistes);
  const { start, end } = getCurrentWeekRange();

  const revenusEl = document.getElementById('revenus-mois');
  const depensesEl = document.getElementById('depenses-mois');
  const artistesEl = document.getElementById('nb-artistes');

  const revenusSemaine = getWeekTotal(revenus, start, end) + getSubventionsTotalForWeek(start, end) + getYouTubeTotalForWeek(start, end);
  if (revenusEl) revenusEl.textContent = formatMoney(revenusSemaine);
  if (depensesEl) depensesEl.textContent = formatMoney(getWeekTotal(depenses, start, end));
  if (artistesEl) artistesEl.textContent = artistes.length;
}

function formatMoney(value) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Active le lien de nav correspondant à la page courante */
function setActiveNav() {
  const path = window.location.pathname || '';
  const page = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

/** Menu burger : ouverture / fermeture */
function initBurgerMenu() {
  const btn = document.getElementById('burger-btn');
  const overlay = document.querySelector('.nav-overlay');
  const nav = document.querySelector('.main-nav');
  if (btn) {
    btn.addEventListener('click', () => document.body.classList.toggle('nav-open'));
  }
  if (overlay) {
    overlay.addEventListener('click', () => document.body.classList.remove('nav-open'));
  }
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target === nav || (e.target.closest && !e.target.closest('.nav-link'))) {
        document.body.classList.remove('nav-open');
      }
    });
  }
  document.querySelectorAll('.main-nav .nav-link').forEach((link) => {
    link.addEventListener('click', () => document.body.classList.remove('nav-open'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  updateDashboardStats();
  initBurgerMenu();
});
