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
    /* Catalog alert classes (the legacy .alert tier was removed in P8). */
    const t = type || 'info';
    div.className = 'app-alert app-alert-' + t;
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

  /* Class-agnostic modal handling: supports BOTH the legacy modal (.modal,
     hidden by default, shown by adding .show) and the catalog modal
     (.app-modal-backdrop, display:flex by default, hidden via the [hidden]
     attribute). They use opposite toggle mechanisms, so route through these
     helpers rather than touching .show / [hidden] directly. */
  var MODAL_SEL  = '.modal, .app-modal-backdrop';
  var DIALOG_SEL = '.modal-dialog, .app-modal-dialog';

  function isAppModal(m)  { return m.classList.contains('app-modal-backdrop'); }
  function isModalOpen(m) { return isAppModal(m) ? !m.hasAttribute('hidden') : m.classList.contains('show'); }
  function setModalOpen(m, open) {
    if (isAppModal(m)) {
      if (open) m.removeAttribute('hidden'); else m.setAttribute('hidden', '');
    } else {
      m.classList.toggle('show', open);
    }
  }

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
    setModalOpen(m, true);
    m.setAttribute('aria-hidden', 'false');
    var focusable = getFocusable(m);
    var target = focusable.length ? focusable[0] : m.querySelector(DIALOG_SEL);
    if (target) target.focus();
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    setModalOpen(m, false);
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
        var m = btn.closest(MODAL_SEL);
        if (m) closeModal(m.id);
      });
    });
    document.querySelectorAll(MODAL_SEL).forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m) closeModal(m.id);
      });
      m.addEventListener('keydown', function (e) {
        if (!isModalOpen(m) || e.key !== 'Tab') return;
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
      document.querySelectorAll(MODAL_SEL).forEach(function (m) { if (isModalOpen(m)) closeModal(m.id); });
    });
  }

  /* ── Tabs ────────────────────────────────────────────────────────────────── */

  /* Tabs: support both legacy (.tab-btn/.tab-panel) and catalog
     (.app-tab/.app-tab-panel). Panels of either kind hide via the [hidden]
     attribute (legacy .tab-panel[hidden] and catalog .app-tab-panel[hidden]
     both resolve to display:none). */
  var TABBTN_SEL   = '.tab-btn, .app-tab';
  var TABPANEL_SEL = '.tab-panel, .app-tab-panel';

  function activateTab(name) {
    const buttons = document.querySelectorAll(TABBTN_SEL);
    if (!buttons.length) return;

    const valid = Array.from(buttons).map(function (b) { return b.dataset.tab; });
    if (valid.indexOf(name) === -1) name = valid[0];

    buttons.forEach(function (btn) {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('is-active', active);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    document.querySelectorAll(TABPANEL_SEL).forEach(function (p) {
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
    document.querySelectorAll(TABBTN_SEL).forEach(function (btn) {
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

  /* ── Log tab: AJAX load, filter, paginate ───────────────────────────────── */

  /* Shared "Log" admin tab (erikr/chrome §15.1), generalised from the
     bug-fixed biblio reference (~/Git/biblio/web/admin.php). Apps call this
     explicitly — it is NOT wired by init() — because it needs a per-app
     endpoint + CSRF token:

       initLogTab({
         endpoint:    '<?= $base ?>/api.php',   // required
         csrfToken:   <?= json_encode($csrfToken) ?>, // required
         perPage:     50,                       // optional, default 50 (matches the server-side admin_log_list default)
         tabSelector: undefined,                // optional override
       });

     Operates on the same markup/IDs as biblio's inline block: #logFilterForm,
     #logTbody, #logPagination, #logTotal, #log_app, #log_context, #log_user,
     #log_from, #log_to, #log_q, #log_fail, #logReset. Does not invent new
     markup — apps must already render this (erikr/chrome LogTab partial). */

  async function postLog(endpoint, csrfToken, action, params) {
    const fd = new FormData();
    fd.append('csrf_token', csrfToken || '');
    if (params && typeof params === 'object') {
      for (const k of Object.keys(params)) {
        const v = params[k];
        if (v !== undefined && v !== null) fd.append(k, v);
      }
    }
    const sep = endpoint.indexOf('?') === -1 ? '?' : '&';
    const url = endpoint + sep + 'action=' + encodeURIComponent(action);
    const res = await fetch(url, { method: 'POST', body: fd });
    try {
      return await res.json();
    } catch (_) {
      return { ok: false, error: 'Ungültige Serverantwort.' };
    }
  }

  function initLogTab(cfg) {
    cfg = cfg || {};
    var endpoint    = cfg.endpoint;
    var csrfToken   = cfg.csrfToken;
    var perPage     = cfg.perPage || 50;
    var tabSelector = cfg.tabSelector || '.app-tab[data-tab="log"], .tab-btn[data-tab="log"]';

    if (!endpoint || !csrfToken) {
      console.error('initLogTab: cfg.endpoint and cfg.csrfToken are required.');
      return;
    }

    function run() {
      const form      = document.getElementById('logFilterForm');
      const tbody     = document.getElementById('logTbody');
      const paginate  = document.getElementById('logPagination');
      const totalEl   = document.getElementById('logTotal');
      const appSel    = document.getElementById('log_app');
      const ctxSel    = document.getElementById('log_context');
      const fromInput = document.getElementById('log_from');
      const toInput   = document.getElementById('log_to');
      const resetBtn  = document.getElementById('logReset');
      if (!form) return;

      let filtersInitialised = false;
      let loaded             = false;

      const today   = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const ymd = d => d.toISOString().slice(0, 10);

      fromInput.value = ymd(weekAgo);
      toInput.value   = ymd(today);

      if (window.flatpickr) {
        flatpickr(fromInput, { dateFormat: 'Y-m-d' });
        flatpickr(toInput,   { dateFormat: 'Y-m-d' });
      }

      function addOption(sel, value) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        sel.appendChild(opt);
      }

      function populateFilters(apps, contexts) {
        if (filtersInitialised) return;
        filtersInitialised = true;
        (apps     || []).forEach(a => addOption(appSel, a));
        (contexts || []).forEach(c => addOption(ctxSel, c));
      }

      function currentFilters() {
        return {
          app:     appSel.value,
          context: ctxSel.value,
          user:    document.getElementById('log_user').value.trim(),
          from:    fromInput.value.trim(),
          to:      toInput.value.trim(),
          q:       document.getElementById('log_q').value.trim(),
          fail:    document.getElementById('log_fail').checked ? '1' : '',
        };
      }

      function setPlaceholderRow(text) {
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'text-muted';
        td.textContent = text;
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      function renderRows(rows) {
        tbody.replaceChildren();
        if (!rows.length) {
          setPlaceholderRow('Keine Einträge gefunden.');
          return;
        }
        for (const r of rows) {
          const tr = document.createElement('tr');

          const tdTime = document.createElement('td');
          tdTime.className = 'log-time';
          tdTime.textContent = r.logTime ?? '';
          tr.appendChild(tdTime);

          const tdOrigin = document.createElement('td');
          tdOrigin.textContent = r.origin ?? '';
          tr.appendChild(tdOrigin);

          const tdCtx = document.createElement('td');
          tdCtx.textContent = r.context ?? '';
          tr.appendChild(tdCtx);

          const tdUser = document.createElement('td');
          if (r.username !== null && r.username !== undefined) {
            tdUser.textContent = r.username;
          } else {
            const sp = document.createElement('span');
            sp.className = 'text-muted';
            sp.textContent = '—';
            tdUser.appendChild(sp);
          }
          tr.appendChild(tdUser);

          const tdIp = document.createElement('td');
          if (r.ip !== null && r.ip !== undefined) {
            tdIp.textContent = r.ip;
          } else {
            const sp = document.createElement('span');
            sp.className = 'text-muted';
            sp.textContent = '—';
            tdIp.appendChild(sp);
          }
          tr.appendChild(tdIp);

          const tdAct = document.createElement('td');
          tdAct.className = 'log-activity';
          tdAct.textContent = r.activity ?? '';
          tr.appendChild(tdAct);

          tbody.appendChild(tr);
        }
      }

      function renderPagination(page, total, perPageResp, onClick) {
        paginate.replaceChildren();
        const lastPage = Math.max(1, Math.ceil(total / perPageResp));
        if (lastPage <= 1) return;
        for (let p = 1; p <= lastPage; p++) {
          const a = document.createElement('a');
          a.className = 'page-link' + (p === page ? ' active' : '');
          a.href = '#log';
          a.textContent = String(p);
          a.addEventListener('click', e => { e.preventDefault(); onClick(p); });
          paginate.appendChild(a);
        }
      }

      async function loadPage(page) {
        setPlaceholderRow('Lade…');
        const res = await postLog(endpoint, csrfToken, 'admin_log_list', {
          page,
          per_page: perPage,
          ...currentFilters(),
        });
        if (!res.ok) {
          setPlaceholderRow('Fehler beim Laden.');
          showAlert(res.error || 'Log konnte nicht geladen werden.', 'danger');
          return;
        }
        populateFilters(res.apps, res.contexts);
        totalEl.textContent = String(res.total);
        renderRows(res.rows || []);
        renderPagination(res.page, res.total, res.per_page || perPage, loadPage);
      }

      form.addEventListener('submit', e => { e.preventDefault(); loadPage(1); });

      resetBtn.addEventListener('click', e => {
        e.preventDefault();
        appSel.value = '';
        ctxSel.value = '';
        document.getElementById('log_user').value   = '';
        document.getElementById('log_q').value      = '';
        document.getElementById('log_fail').checked = false;
        fromInput.value = ymd(weekAgo);
        toInput.value   = ymd(today);
        loadPage(1);
      });

      function maybeLoad() {
        if (loaded) return;
        if (location.hash === '#log') {
          loaded = true;
          loadPage(1);
        }
      }
      // Katalog-Markup nutzt .app-tab (nicht das Legacy .tab-btn); der Log-Tab lud
      // sonst auf Klick nie, weil activateTab per replaceState kein hashchange feuert
      // (Audit 2026-07-12, TASK-15). Beide Klassen abdecken für Alt-Markup-Sicherheit.
      document.querySelectorAll(tabSelector).forEach(btn =>
        btn.addEventListener('click', () => { if (!loaded) { loaded = true; loadPage(1); } })
      );
      window.addEventListener('hashchange', maybeLoad);
      maybeLoad();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
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
  window.initLogTab  = initLogTab;
})();
