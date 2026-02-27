(function () {
  const tbody = document.getElementById('tbody-historique');
  const selectWeek = document.getElementById('filter-week');
  const btnReset = document.getElementById('btn-reset-filter');

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

  function fillWeekFilter() {
    const ranges = getWeekRanges(14);
    selectWeek.innerHTML = '<option value="">Toutes les semaines</option>' +
      ranges.map((r) => `<option value="${r.start},${r.end}">${escapeHtml(r.label)}</option>`).join('');
  }

  function render() {
    const revenus = getStorage(STORAGE_KEYS.revenus, []);
    const depenses = getStorage(STORAGE_KEYS.depenses, []);
    const weekValue = selectWeek ? selectWeek.value : '';
    let weekStart = '', weekEnd = '';
    if (weekValue) {
      const parts = weekValue.split(',');
      weekStart = parts[0] || '';
      weekEnd = parts[1] || '';
    }

    const subventions = getStorage(STORAGE_KEYS.subventions, []).map((s) => ({ ...s, type: 'Subvention' }));
    const youtubeRevenus = typeof getYouTubeRevenusEntries === 'function' ? getYouTubeRevenusEntries() : [];
    const youtubeAsMouvements = youtubeRevenus.map((e) => ({ ...e, type: 'YouTube' }));
    const mouvements = [
      ...revenus.map((r) => ({ ...r, type: 'Revenu' })),
      ...depenses.map((d) => ({ ...d, type: 'Dépense', montant: -Math.abs(Number(d.montant) || 0) })),
      ...subventions,
      ...youtubeAsMouvements,
    ]
      .filter((m) => {
        if (!m.date) return false;
        if (weekStart && weekEnd) {
          if (m.date < weekStart || m.date > weekEnd) return false;
        }
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (mouvements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun mouvement pour cette semaine.</td></tr>';
      return;
    }

    tbody.innerHTML = mouvements.map((m) => `
      <tr>
        <td>${formatDate(m.date)}</td>
        <td>${escapeHtml(m.type)}</td>
        <td>${escapeHtml(m.libelle || '—')}</td>
        <td class="${m.montant >= 0 ? 'amount-positive' : 'amount-negative'}">${formatMoney(m.montant)}</td>
      </tr>
    `).join('');
  }

  if (selectWeek) selectWeek.addEventListener('change', render);
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      selectWeek.value = '';
      render();
    });
  }

  fillWeekFilter();
  render();
})();
