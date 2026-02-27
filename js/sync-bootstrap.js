/**
 * Au premier chargement sur le site déployé : récupère les données depuis l’API
 * et remplit le localStorage, puis recharge la page une fois.
 */
(function () {
  if (sessionStorage.getItem('outlaw_sync_done')) return;
  fetch('/api/sync')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || typeof data !== 'object') return;
      var keys = ['label_rp_revenus', 'label_rp_depenses', 'label_rp_artistes', 'label_rp_contrats', 'label_rp_sorties', 'label_rp_subventions', 'label_rp_youtube_sons'];
      for (var i = 0; i < keys.length; i++) {
        if (data[keys[i]] !== undefined) {
          try { localStorage.setItem(keys[i], JSON.stringify(data[keys[i]])); } catch (e) {}
        }
      }
      sessionStorage.setItem('outlaw_sync_done', '1');
      location.reload();
    })
    .catch(function () {});
})();
