(function () {
  const tbody = document.getElementById('tbody-subventions');
  const form = document.getElementById('form-subvention');
  const dateInput = document.getElementById('date-sub');

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

  function getTotal() {
    const list = getStorage(STORAGE_KEYS.subventions, []);
    return list.reduce((sum, s) => sum + (Number(s.montant) || 0), 0);
  }

  function render() {
    const list = getStorage(STORAGE_KEYS.subventions, []);
    const sorted = [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const elTotal = document.getElementById('total-subventions');
    if (elTotal) elTotal.textContent = formatMoney(getTotal());

    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucune subvention enregistrée.</td></tr>';
      return;
    }

    tbody.innerHTML = sorted.map((s, i) => `
      <tr data-id="${i}">
        <td>${formatDate(s.date)}</td>
        <td>${escapeHtml(s.libelle || '—')}</td>
        <td class="amount-positive">${formatMoney(s.montant)}</td>
        <td>${escapeHtml(s.notes || '—')}</td>
        <td><button type="button" class="btn btn-secondary btn-sm delete-sub">Suppr.</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.delete-sub').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.closest('tr').dataset.id, 10);
        const list = getStorage(STORAGE_KEYS.subventions, []);
        list.splice(id, 1);
        setStorage(STORAGE_KEYS.subventions, list);
        render();
      });
    });
  }

  if (form) {
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const libelle = document.getElementById('libelle-sub').value.trim();
      const montant = parseFloat(document.getElementById('montant-sub').value) || 0;
      const date = document.getElementById('date-sub').value;
      const notes = document.getElementById('notes-sub').value.trim();
      const list = getStorage(STORAGE_KEYS.subventions, []);
      list.push({ libelle, montant, date, notes });
      setStorage(STORAGE_KEYS.subventions, list);
      form.reset();
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      render();
    });
  }

  render();
})();
