(function () {
  const tbodyRevenus = document.getElementById('tbody-revenus');
  const tbodyDepenses = document.getElementById('tbody-depenses');
  const form = document.getElementById('form-mouvement');

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function renderRevenus() {
    const revenusRaw = getStorage(STORAGE_KEYS.revenus, []);
    const revenus = revenusRaw.map((r, i) => ({ ...r, _source: 'manual', _index: i }));
    const youtubeRevenus = typeof getYouTubeRevenusEntries === 'function' ? getYouTubeRevenusEntries() : [];
    const subventions = getStorage(STORAGE_KEYS.subventions, []).map((s) => ({
      date: s.date,
      libelle: s.libelle || 'Subvention',
      montant: Number(s.montant) || 0,
      _source: 'subvention',
    }));
    const merged = [...revenus, ...youtubeRevenus, ...subventions];
    if (merged.length === 0) {
      tbodyRevenus.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun revenu enregistré.</td></tr>';
      return;
    }
    const sorted = merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    tbodyRevenus.innerHTML = sorted.slice(0, 30).map((r) => {
      const isYoutube = r._source === 'youtube';
      const isSubvention = r._source === 'subvention';
      let actionBtn;
      if (isYoutube) actionBtn = '<a href="revenus-youtube.html" class="btn btn-secondary btn-sm">Gérer</a>';
      else if (isSubvention) actionBtn = '<a href="suivi-subventions.html" class="btn btn-secondary btn-sm">Gérer</a>';
      else actionBtn = `<button type="button" class="btn btn-secondary btn-sm delete-mouvement" data-id="${r._index}">Suppr.</button>`;
      return `
      <tr data-type="revenu" data-id="${r._index != null ? r._index : ''}" data-source="${r._source || 'manual'}">
        <td>${formatDate(r.date)}</td>
        <td>${escapeHtml(r.libelle || '—')}</td>
        <td class="amount-positive">${formatMoney(r.montant)}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
    }).join('');
    tbodyRevenus.querySelectorAll('.delete-mouvement').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id !== null && id !== '') deleteMouvement('revenu', id);
      });
    });
  }

  function renderDepenses() {
    const depenses = getStorage(STORAGE_KEYS.depenses, []);
    if (depenses.length === 0) {
      tbodyDepenses.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune dépense enregistrée.</td></tr>';
      return;
    }
    const sorted = [...depenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    tbodyDepenses.innerHTML = sorted.slice(0, 20).map((d, i) => `
      <tr data-id="${i}" data-type="depense">
        <td>${formatDate(d.date)}</td>
        <td>${escapeHtml(d.libelle || '—')}</td>
        <td class="amount-negative">${formatMoney(d.montant)}</td>
        <td><button type="button" class="btn btn-secondary btn-sm delete-mouvement">Suppr.</button></td>
      </tr>
    `).join('');
    tbodyDepenses.querySelectorAll('.delete-mouvement').forEach((btn) => {
      btn.addEventListener('click', () => deleteMouvement('depense', btn.closest('tr').dataset.id));
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function deleteMouvement(type, idStr) {
    const key = type === 'revenu' ? STORAGE_KEYS.revenus : STORAGE_KEYS.depenses;
    const list = getStorage(key, []);
    const id = parseInt(idStr, 10);
    if (isNaN(id) || id < 0 || id >= list.length) return;
    list.splice(id, 1);
    setStorage(key, list);
    if (type === 'revenu') renderRevenus(); else renderDepenses();
    updateBilan();
  }

  function updateBilan() {
    const { start, end } = getCurrentWeekRange();
    const revenus = getStorage(STORAGE_KEYS.revenus, []);
    const depenses = getStorage(STORAGE_KEYS.depenses, []);
    const rManuels = getWeekTotal(revenus, start, end);
    const rSubventions = typeof getSubventionsTotalForWeek === 'function' ? getSubventionsTotalForWeek(start, end) : 0;
    const rYouTube = typeof getYouTubeTotalForWeek === 'function' ? getYouTubeTotalForWeek(start, end) : 0;
    const totalR = Number(rManuels) + Number(rSubventions) + Number(rYouTube);
    const totalD = getWeekTotal(depenses, start, end);
    const solde = totalR - totalD;

    const elR = document.getElementById('total-revenus');
    const elD = document.getElementById('total-depenses');
    const elS = document.getElementById('solde-mois');
    if (elR) elR.textContent = formatMoney(totalR);
    if (elD) elD.textContent = formatMoney(totalD);
    if (elS) {
      elS.textContent = formatMoney(solde);
      elS.className = 'stat-value ' + (solde >= 0 ? 'amount-positive' : 'amount-negative');
    }
  }

  if (form) {
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const libelle = document.getElementById('libelle').value.trim();
      const montant = parseFloat(document.getElementById('montant').value) || 0;
      const date = document.getElementById('date').value;

      const list = getStorage(STORAGE_KEYS.depenses, []);
      list.push({ libelle, montant: Math.abs(montant), date });
      setStorage(STORAGE_KEYS.depenses, list);

      form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      renderRevenus();
      renderDepenses();
      updateBilan();
    });
  }

  renderRevenus();
  renderDepenses();
  updateBilan();
})();
