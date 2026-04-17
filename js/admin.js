/* ~/Git/css/js/admin.js
 *
 * Shared client-side helpers for admin screens. Required by Rule §15.5.
 *
 * Exposes on window: adminPost, showAlert, openModal, closeModal, activateTab.
 *
 * The consuming page must:
 *   - Set `window.CSRF = "<?= $csrfToken ?>"` before this script loads.
 *   - Provide `<div id="adminAlerts"></div>` somewhere near the top of <main>.
 *   - Provide tab buttons with `class="tab-btn" data-tab="<name>"` and matching
 *     panels with `id="panel-<name>" class="tab-panel"`.
 *   - Wire its own click handlers for [data-modal-open], [data-modal-close],
 *     and form submits (using adminPost + showAlert).
 */
(function () {
  'use strict';

  /* ── Alerts ──────────────────────────────────────────────────────────────── */

  function showAlert(msg, type, containerId) {
    const box = document.getElementById(containerId || 'adminAlerts');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'alert alert-' + (type || 'info');
    div.textContent = msg;
    box.appendChild(div);
    setTimeout(function () { div.remove(); }, 5000);
  }

  function clearAlerts(containerId) {
    const box = document.getElementById(containerId || 'adminAlerts');
    if (box) box.replaceChildren();
  }

  /* ── API POST ────────────────────────────────────────────────────────────── */

  async function adminPost(action, params) {
    const fd = new FormData();
    fd.append('csrf_token', window.CSRF || '');
    if (params && typeof params === 'object') {
      for (const k of Object.keys(params)) {
        const v = params[k];
        if (v !== undefined && v !== null) fd.append(k, v);
      }
    }
    const url = 'api.php?action=' + encodeURIComponent(action);
    const res = await fetch(url, { method: 'POST', body: fd });
    try {
      return await res.json();
    } catch (_) {
      return { ok: false, error: 'Ungültige Serverantwort.' };
    }
  }

  /* ── Modals ──────────────────────────────────────────────────────────────── */

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('show');
    m.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  }

  function wireModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.dataset.modalOpen); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const m = btn.closest('.modal');
        if (m) closeModal(m.id);
      });
    });
    document.querySelectorAll('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m) closeModal(m.id);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal.show').forEach(function (m) { closeModal(m.id); });
    });
  }

  /* ── Tabs ────────────────────────────────────────────────────────────────── */

  function activateTab(name) {
    const buttons = document.querySelectorAll('.tab-btn');
    if (!buttons.length) return;

    const valid = Array.from(buttons).map(function (b) { return b.dataset.tab; });
    if (valid.indexOf(name) === -1) name = valid[0];

    buttons.forEach(function (btn) {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('is-active', active);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-panel').forEach(function (p) {
      const active = p.id === 'panel-' + name;
      p.classList.toggle('is-active', active);
      p.classList.toggle('hidden', !active);
      if (active) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    });

    try {
      if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    } catch (_) { /* ignore */ }
  }

  function wireTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { activateTab(btn.dataset.tab); });
    });
    window.addEventListener('hashchange', function () {
      activateTab((location.hash || '').replace('#', ''));
    });
    const initial = (location.hash || '').replace('#', '');
    if (initial) activateTab(initial);
  }

  /* ── Bootstrap ───────────────────────────────────────────────────────────── */

  function init() {
    wireModals();
    wireTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.adminPost   = adminPost;
  window.showAlert   = showAlert;
  window.clearAlerts = clearAlerts;
  window.openModal   = openModal;
  window.closeModal  = closeModal;
  window.activateTab = activateTab;
})();
