(function () {
  const tbodyArtistes = document.getElementById('tbody-artistes');
  const tbodySorties = document.getElementById('tbody-sorties');
  const tbodyContrats = document.getElementById('tbody-contrats');
  const formArtiste = document.getElementById('form-artiste');
  const formSortie = document.getElementById('form-sortie');
  const formContrat = document.getElementById('form-contrat');
  const selectArtisteSortie = document.getElementById('artiste-sortie');
  const selectContratArtiste = document.getElementById('contrat-artiste');

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

  function fillArtisteSelects() {
    const artistes = getStorage(STORAGE_KEYS.artistes, []);
    const options = artistes.map((a, i) => `<option value="${i}">${escapeHtml(a.nom || 'Sans nom')}</option>`).join('');
    const baseSortie = '<option value="">— Sélectionner —</option>' + options;
    const baseContrat = '<option value="">— Sélectionner —</option>' + options;
    if (selectArtisteSortie) selectArtisteSortie.innerHTML = baseSortie;
    if (selectContratArtiste) selectContratArtiste.innerHTML = baseContrat;
  }

  function renderArtistes() {
    const artistes = getStorage(STORAGE_KEYS.artistes, []);
    if (artistes.length === 0) {
      tbodyArtistes.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun artiste pour le moment.</td></tr>';
      fillArtisteSelects();
      return;
    }
    tbodyArtistes.innerHTML = artistes.map((a, i) => `
      <tr data-id="${i}">
        <td>${escapeHtml(a.nom || '—')}</td>
        <td>${escapeHtml(a.genre || '—')}</td>
        <td>${escapeHtml(a.telephone || '—')}</td>
        <td>${escapeHtml(a.iban || '—')}</td>
        <td><button type="button" class="btn btn-secondary btn-sm delete-artiste">Suppr.</button></td>
      </tr>
    `).join('');
    tbodyArtistes.querySelectorAll('.delete-artiste').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.closest('tr').dataset.id, 10);
        const list = getStorage(STORAGE_KEYS.artistes, []);
        list.splice(id, 1);
        setStorage(STORAGE_KEYS.artistes, list);
        renderArtistes();
        renderSorties();
        renderContrats();
      });
    });
    fillArtisteSelects();
  }

  function renderSorties() {
    const sorties = getStorage(STORAGE_KEYS.sorties, []);
    const artistes = getStorage(STORAGE_KEYS.artistes, []);
    if (sorties.length === 0) {
      tbodySorties.innerHTML = '<tr><td colspan="5" class="empty-state">Aucune sortie enregistrée.</td></tr>';
      return;
    }
    const sorted = [...sorties].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    tbodySorties.innerHTML = sorted.map((s, i) => {
      const artisteIdx = s.artisteId != null ? parseInt(s.artisteId, 10) : -1;
      const nomArtiste = artistes[artisteIdx] ? artistes[artisteIdx].nom : '—';
      return `
      <tr data-id="${i}">
        <td>${escapeHtml(s.titre || '—')}</td>
        <td>${escapeHtml(nomArtiste)}</td>
        <td>${escapeHtml(s.type || 'single')}</td>
        <td>${formatDate(s.date)}</td>
        <td><button type="button" class="btn btn-secondary btn-sm delete-sortie">Suppr.</button></td>
      </tr>
    `;
    }).join('');
    tbodySorties.querySelectorAll('.delete-sortie').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.closest('tr').dataset.id, 10);
        const list = getStorage(STORAGE_KEYS.sorties, []);
        list.splice(id, 1);
        setStorage(STORAGE_KEYS.sorties, list);
        renderSorties();
      });
    });
  }

  function renderContrats() {
    const contrats = getStorage(STORAGE_KEYS.contrats, []);
    const artistes = getStorage(STORAGE_KEYS.artistes, []);
    if (contrats.length === 0) {
      tbodyContrats.innerHTML = '<tr><td colspan="6" class="empty-state">Aucun contrat enregistré.</td></tr>';
      return;
    }
    tbodyContrats.innerHTML = contrats.map((c, i) => {
      const nomArtiste = artistes[c.artisteId] ? artistes[c.artisteId].nom : '—';
      const pctLabel = c.pctLabel != null ? Number(c.pctLabel) : 50;
      const pctArtiste = c.pctArtiste != null ? Number(c.pctArtiste) : 50;
      const repartition = `${pctLabel} % label / ${pctArtiste} % artiste`;
      return `
      <tr data-id="${i}">
        <td>${escapeHtml(nomArtiste)}</td>
        <td>${escapeHtml(c.type || '—')}</td>
        <td>${escapeHtml(repartition)}</td>
        <td>${formatDate(c.dateDebut)}</td>
        <td>${formatDate(c.dateFin)}</td>
        <td><button type="button" class="btn btn-secondary btn-sm delete-contrat">Suppr.</button></td>
      </tr>
    `;
    }).join('');
    tbodyContrats.querySelectorAll('.delete-contrat').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.closest('tr').dataset.id, 10);
        const list = getStorage(STORAGE_KEYS.contrats, []);
        list.splice(id, 1);
        setStorage(STORAGE_KEYS.contrats, list);
        renderContrats();
      });
    });
  }

  if (formArtiste) {
    formArtiste.addEventListener('submit', (e) => {
      e.preventDefault();
      const nom = document.getElementById('nom-artiste').value.trim();
      const genre = document.getElementById('genre-artiste').value.trim();
      const telephone = document.getElementById('tel-artiste').value.trim();
      const iban = document.getElementById('iban-artiste').value.trim();
      const list = getStorage(STORAGE_KEYS.artistes, []);
      list.push({ nom, genre, telephone, iban });
      setStorage(STORAGE_KEYS.artistes, list);
      formArtiste.reset();
      renderArtistes();
      renderSorties();
      renderContrats();
    });
  }

  if (formSortie) {
    const dateSortie = document.getElementById('date-sortie');
    if (dateSortie && !dateSortie.value) dateSortie.value = new Date().toISOString().slice(0, 10);

    formSortie.addEventListener('submit', (e) => {
      e.preventDefault();
      const titre = document.getElementById('titre-sortie').value.trim();
      const artisteId = document.getElementById('artiste-sortie').value;
      const type = document.getElementById('type-sortie').value;
      const date = document.getElementById('date-sortie').value;
      const list = getStorage(STORAGE_KEYS.sorties, []);
      list.push({ titre, artisteId: artisteId === '' ? null : artisteId, type, date });
      setStorage(STORAGE_KEYS.sorties, list);
      formSortie.reset();
      if (dateSortie) dateSortie.value = new Date().toISOString().slice(0, 10);
      fillArtisteSelects();
      renderSorties();
    });
  }

  if (formContrat) {
    const pctLabelEl = document.getElementById('pct-label');
    const pctArtisteEl = document.getElementById('pct-artiste');
    formContrat.addEventListener('submit', (e) => {
      e.preventDefault();
      const artisteId = document.getElementById('contrat-artiste').value;
      const type = document.getElementById('type-contrat').value;
      const pctLabel = Math.min(100, Math.max(0, parseInt(pctLabelEl?.value || '50', 10) || 50));
      const pctArtiste = Math.min(100, Math.max(0, parseInt(pctArtisteEl?.value || '50', 10) || 50));
      const dateDebut = document.getElementById('date-debut').value;
      const dateFin = document.getElementById('date-fin').value || null;
      if (!artisteId) return;
      const list = getStorage(STORAGE_KEYS.contrats, []);
      list.push({ artisteId, type, pctLabel, pctArtiste, dateDebut, dateFin });
      setStorage(STORAGE_KEYS.contrats, list);
      formContrat.reset();
      if (pctLabelEl) pctLabelEl.value = 50;
      if (pctArtisteEl) pctArtisteEl.value = 50;
      renderContrats();
    });
  }

  renderArtistes();
  renderSorties();
  renderContrats();
})();
