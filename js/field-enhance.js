/* field-enhance.js — progressive enhancement for form inputs, shared across all
 * Jardyx / eriks.cloud apps.
 *
 *   • Password-reveal: every <input type="password"> gets an eye toggle inside the
 *     field (show/hide). Opt out with data-no-reveal on the input.
 *   • Clear-×: every <input type="search"> and any input with [data-clearable] gets
 *     an × that appears when the field has text and clears it on click.
 *
 * Pure DOM, no dependencies. Idempotent (safe to run once on DOMContentLoaded).
 * CSS lives in css_library/components.css (.pw-wrap/.pw-reveal, .clear-wrap/.field-clear).
 */
(function () {
  'use strict';

  var EYE_SVG =
    '<svg class="pw-icon pw-icon-show" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="pw-icon pw-icon-hide" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 102.8 2.8"/>' +
    '<path d="M16.7 16.7A10 10 0 0112 18C5.5 18 2 12 2 12a18 18 0 014.4-5"/>' +
    '<path d="M9.5 6.2A10 10 0 0112 6c6.5 0 10 6 10 6a18 18 0 01-2.6 3.4"/></svg>';

  var X_SVG =
    '<svg class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // Wrap `input` in a <span class=wrapCls>, append `btn` after it. Returns the wrapper.
  function wrap(input, wrapCls, btn) {
    var span = document.createElement('span');
    span.className = wrapCls;
    input.parentNode.insertBefore(span, input);
    span.appendChild(input);
    span.appendChild(btn);
    return span;
  }

  function enhance(root) {
    root = root || document;

    // ── Password reveal ──────────────────────────────────────────────────────
    root.querySelectorAll('input[type="password"]').forEach(function (inp) {
      if (inp.dataset.noReveal !== undefined || inp.closest('.pw-wrap')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pw-reveal';
      btn.tabIndex = -1;
      btn.setAttribute('aria-label', 'Passwort anzeigen');
      btn.innerHTML = EYE_SVG;
      wrap(inp, 'pw-wrap', btn);
    });

    // ── Clear-× ──────────────────────────────────────────────────────────────
    root.querySelectorAll('input[type="search"], input[data-clearable]').forEach(function (inp) {
      if (inp.closest('.clear-wrap')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'field-clear';
      btn.tabIndex = -1;
      btn.setAttribute('aria-label', 'Eingabe löschen');
      btn.innerHTML = X_SVG;
      var span = wrap(inp, 'clear-wrap', btn);
      var sync = function () { span.classList.toggle('has-content', inp.value.length > 0); };
      inp.addEventListener('input', sync);
      sync();
    });
  }

  // Delegated handlers (survive dynamically-added fields).
  document.addEventListener('click', function (ev) {
    var reveal = ev.target.closest('.pw-reveal');
    if (reveal) {
      var pinp = reveal.parentElement.querySelector('input');
      if (!pinp) return;
      var show = pinp.type === 'password';
      pinp.type = show ? 'text' : 'password';
      reveal.classList.toggle('shown', show);
      reveal.setAttribute('aria-label', show ? 'Passwort verbergen' : 'Passwort anzeigen');
      return;
    }
    var clear = ev.target.closest('.field-clear');
    if (clear) {
      var cinp = clear.parentElement.querySelector('input');
      if (!cinp) return;
      cinp.value = '';
      cinp.dispatchEvent(new Event('input', { bubbles: true }));
      cinp.focus();
      clear.parentElement.classList.remove('has-content');
    }
  });

  // Expose for apps that inject fields after load (e.g. modals).
  window.fieldEnhance = enhance;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  } else {
    enhance(document);
  }
})();
