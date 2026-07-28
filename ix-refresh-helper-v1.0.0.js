(function () {
  window.IxRefresh = window.IxRefresh || {};
  window.IxRefresh.wire = function (btn, fetchFn) {
    if (!btn || btn.__ixRefreshWired) return;
    btn.__ixRefreshWired = true;
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add('is-spinning');
      Promise.resolve()
        .then(fetchFn)
        .catch(function (err) { console.error('[IxRefresh]', err); })
        .then(function () {
          btn.disabled = false;
          btn.classList.remove('is-spinning');
        });
    });
  };
})();
