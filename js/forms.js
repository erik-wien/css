/* ~/Git/css_library/js/forms.js
 *
 * Progressive-enhancement clear (⊗) button for every eligible input/textarea.
 * Loaded automatically by Chrome Header::render() — no per-app include needed.
 *
 * Skips:
 *   - type hidden / checkbox / radio / file / submit / button / reset
 *   - readonly or disabled inputs
 *   - inputs already inside .input-group (have their own trailing button)
 *   - inputs or their enclosing form with data-no-clear
 *
 * The clear button is shown/hidden purely via CSS (:has + :placeholder-shown),
 * so each input must have a placeholder attribute. When data-placeholder-fallback
 * is set, a single-space placeholder is injected as a fallback.
 */
(function () {
  'use strict';

  var SKIP_TYPES = new Set([
    'hidden', 'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'range', 'color'
  ]);

  function isEligible(input) {
    if (SKIP_TYPES.has(input.type)) return false;
    if (input.readOnly || input.disabled) return false;
    if (input.closest('.input-group')) return false;
    if (input.closest('[data-no-clear]')) return false;
    if (input.dataset.noClear !== undefined) return false;
    if (input.closest('.input-clear-wrap')) return false;
    return true;
  }

  function wrap(input) {
    if (!isEligible(input)) return;

    /* Ensure placeholder exists so :placeholder-shown works */
    if (!input.placeholder) {
      if (input.dataset.placeholderFallback !== undefined) {
        input.placeholder = ' ';
      } else {
        return;
      }
    }

    var span = document.createElement('span');
    span.className = 'input-clear-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'input-clear-btn';
    btn.setAttribute('aria-label', 'Feld leeren');
    btn.setAttribute('tabindex', '-1');
    btn.textContent = '⊗';

    btn.addEventListener('click', function () {
      input.value = '';
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    var parent = input.parentNode;
    parent.insertBefore(span, input);
    span.appendChild(input);
    span.appendChild(btn);
  }

  function processNode(root) {
    var inputs = root.querySelectorAll
      ? root.querySelectorAll('input, textarea')
      : [];
    Array.from(inputs).forEach(function (el) {
      if (!el.closest('.input-clear-wrap')) wrap(el);
    });
    if ((root.tagName === 'INPUT' || root.tagName === 'TEXTAREA') &&
        !root.closest('.input-clear-wrap')) {
      wrap(root);
    }
  }

  function init() {
    processNode(document.body);

    var debounceTimer;
    var observer = new MutationObserver(function (mutations) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            processNode(node);
          });
        });
      }, 50);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
