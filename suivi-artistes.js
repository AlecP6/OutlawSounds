(function () {
  const container = document.getElementById('fiches-artistes');

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    const artistes = getStorage(STORAGE_KEYS.artistes, []);
    const contrats = getStorage(STORAGE_KEYS.contrats, []);
    const sorties = getStorage(STORAGE_KEYS.sorties, []);

    const elNbArtistes = document.getElementById('nb-artistes-suivi');
    const elNbContrats = document.getElementById('nb-contrats-suivi');
    const elNbSorties = document.getElementById('nb-sorties-suivi');
    if (elNbArtistes) elNbArtistes.textContent = artistes.length;
    if (elNbContrats) elNbContrats.textContent = contrats.length;
    if (elNbSorties) elNbSorties.textContent = sorties.length;

    if (artistes.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun artiste. <a href="gestion.html">Ajouter des artistes dans Gestion</a>.</p>';
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    container.innerHTML = artistes.map((artiste, artisteId) => {
      const contratsArtiste = contrats.filter((c) => String(c.artisteId) === String(artisteId));
      const sortiesArtiste = sorties.filter((s) => String(s.artisteId) === String(artisteId));

      const contratsList = contratsArtiste.length === 0
        ? '<p class="empty-state">Aucun contrat.</p>'
        : '<ul class="list-simple">' + contratsArtiste.map((c) => {
            const pctLabel = c.pctLabel != null ? Number(c.pctLabel) : 50;
            const pctArtiste = c.pctArtiste != null ? Number(c.pctArtiste) : 50;
            return `<li>${escapeHtml(c.type || '—')} — du ${formatDate(c.dateDebut)} au ${formatDate(c.dateFin) || '—'} — ${pctLabel} % label / ${pctArtiste} % artiste</li>`;
          }).join('') + '</ul>';

      const sortiesList = sortiesArtiste.length === 0
        ? '<p class="empty-state">Aucune sortie.</p>'
        : '<ul class="list-simple">' + sortiesArtiste
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .map((s) => `<li>${escapeHtml(s.titre || '—')} (${escapeHtml(s.type || 'single')}) — ${formatDate(s.date)}</li>`)
            .join('') + '</ul>';

      const telStr = artiste.telephone ? `Tél. ${escapeHtml(artiste.telephone)}` : '';
      const ibanStr = artiste.iban ? `IBAN ${escapeHtml(artiste.iban)}` : '';
      const coordonnees = [telStr, ibanStr].filter(Boolean).join(' · ') || '—';
      return `
        <div class="fiche-artiste">
          <h3 class="fiche-artiste-nom">${escapeHtml(artiste.nom || 'Sans nom')}</h3>
          <p class="fiche-artiste-genre">${escapeHtml(artiste.genre || '—')}</p>
          <p class="fiche-artiste-coord">${coordonnees}</p>
          <div class="fiche-artiste-blocks">
            <div class="fiche-block">
              <strong>Contrats</strong>
              ${contratsList}
            </div>
            <div class="fiche-block">
              <strong>Sorties</strong>
              ${sortiesList}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  render();
})();
