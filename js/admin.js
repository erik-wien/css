/* ~/Git/css_library/js/admin.js
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
    div.setAttribute('role', 'alert');
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

  var _previouslyFocused = null;

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return !el.closest('[hidden]') && el.offsetParent !== null;
    });
  }

  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    _previouslyFocused = document.activeElement;
    m.classList.add('show');
    m.setAttribute('aria-hidden', 'false');
    var focusable = getFocusable(m);
    var target = focusable.length ? focusable[0] : m.querySelector('.modal-dialog');
    if (target) target.focus();
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
    if (_previouslyFocused && typeof _previouslyFocused.focus === 'function') {
      _previouslyFocused.focus();
      _previouslyFocused = null;
    }
  }

  function wireModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.dataset.modalOpen); });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.closest('.modal');
        if (m) closeModal(m.id);
      });
    });
    document.querySelectorAll('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m) closeModal(m.id);
      });
      m.addEventListener('keydown', function (e) {
        if (!m.classList.contains('show') || e.key !== 'Tab') return;
        var focusable = getFocusable(m);
        if (!focusable.length) return;
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
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

  /* ── Reset-password preview → confirm modal ─────────────────────────────── */

  function wireResetPreview() {
    // Only intercept .btn-reset clicks when the confirmation modal is present.
    // Apps that have not yet added renderResetPasswordModal() keep their existing
    // inline handler untouched — no double-POST regression.
    var modal = document.getElementById('resetPasswordModal');
    if (!modal) return;

    document.querySelectorAll('.btn-reset').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.dataset.id;
        if (!id) return;

        var data = await adminPost('admin_user_reset_preview', { id: id });
        if (!data.ok) {
          showAlert(data.error || 'Vorschau nicht verfügbar.', 'danger');
          return;
        }

        document.getElementById('resetPwId').value              = id;
        document.getElementById('resetPwUsername').textContent  = data.username || '?';
        document.getElementById('resetPwEmail').textContent     = data.email    || '?';
        var ipsEl = document.getElementById('resetPwIps');
        ipsEl.textContent = (data.ips && data.ips.length) ? data.ips.join(', ') : 'keine';

        clearAlerts('resetPasswordAlerts');
        openModal('resetPasswordModal');
      });
    });

    var confirmBtn = document.getElementById('resetPwConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async function () {
        var id = document.getElementById('resetPwId').value;
        if (!id) return;
        confirmBtn.disabled = true;
        var r = await adminPost('admin_user_reset', { id: id });
        confirmBtn.disabled = false;
        if (r.ok) {
          closeModal('resetPasswordModal');
          var msg = 'Passwort-Reset versendet.';
          if (r.unblocked_ips && r.unblocked_ips.length) {
            msg += ' IPs entsperrt: ' + r.unblocked_ips.join(', ');
          }
          showAlert(msg, 'success');
        } else {
          showAlert(r.error || 'Fehler beim Reset.', 'danger', 'resetPasswordAlerts');
        }
      });
    }
  }

  /* ── Bootstrap ───────────────────────────────────────────────────────────── */

  function init() {
    wireModals();
    wireTabs();
    wireResetPreview();
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
