---
id: TASK-3
title: 'Inputs: universal ⊗ clear button + placeholder polish'
status: Done
assignee: []
created_date: '2026-04-18 10:26'
updated_date: '2026-04-19 05:42'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every text-like input in every app should show a small ⊗ button on the right side when the field is non-empty; clicking it clears the field and restores focus. At the same time, every input should carry a \`placeholder\` attribute that describes what is expected. This task covers the mechanical library-level work; the content of per-field placeholders is a per-app follow-up (see *Out of scope*).

## Approach: progressive enhancement, no consumer markup changes

A single new stylesheet block in \`components.css\` + a new \`js/forms.js\` file ship with css_library. Every page in every app that loads the shared chrome already pulls in the shared CSS/JS; no app-code edits required.

### 1. JS (css_library/js/forms.js)

- On DOMContentLoaded, walk every \`input\` (types: text, email, search, url, tel, password, number, date, time) and every \`textarea\` that does NOT opt out via \`data-no-clear\`.
- For each: wrap in a \`<span class="input-clear-wrap">\`, append \`<button type="button" class="input-clear-btn" aria-label="Feld leeren" tabindex="-1">⊗</button>\` as a sibling.
- Keep the original form-control class on the input — do not rewrap in \`.input-group\` (would collide with existing prepend/append patterns).
- Delegate click: clearing sets \`input.value = ""\`, re-focuses the input, and dispatches a bubbling \`input\` event so any listening handlers (filter-as-you-type, validators) react correctly.
- MutationObserver on \`document.body\` so dynamically injected inputs (e.g. modals rendered after page load, JS-inserted rows) also get wrapped. Debounce at 50ms.
- Skip: \`type="hidden"\`, \`type="checkbox"\`, \`type="radio"\`, \`type="file"\`, \`type="submit"\`, \`type="button"\`, anything with \`readonly\` or \`disabled\`, and anything inside a \`<form data-no-clear>\` scope (escape hatch for edge cases like password-change forms that deliberately want no clearing affordance).
- No framework; plain ES2020 (matches existing admin.js style).

### 2. CSS (css_library/components.css, new block near the .form-control rules)

```css
.input-clear-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.input-clear-wrap > .form-control {
  padding-right: 2rem;  /* reserve space for the button */
}

.input-clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: none;               /* hidden by default */
  background: none;
  border: 0;
  padding: 0 0.25rem;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}

.input-clear-btn:hover {
  color: var(--color-text);
}

/* show only when the field has content */
.input-clear-wrap:has(> .form-control:not(:placeholder-shown):not([readonly]):not([disabled])) > .input-clear-btn {
  display: inline-block;
}
```

`:has()` + `:placeholder-shown` means the button toggles purely via CSS — no JS listener on every `input` event. Requires a non-empty `placeholder` attribute on the input for `:placeholder-shown` to work (which is exactly what we want — see *Placeholders* below).

### 3. Placeholder styling

Existing `.form-control::placeholder` already uses `var(--color-muted)` — keep it. Confirm contrast meets WCAG AA on both light and dark themes (adjust `--color-muted` in theme.css only if it fails).

**Do not italicise placeholders.** Italic reduces legibility for dyslexic and low-vision readers and conflicts with the Atkinson Hyperlegible accessibility choice (§4). Placeholder distinction comes from colour + the `.form-control` visual context, not type style.

```css
.form-control::placeholder {
  color: var(--color-muted);
  opacity: 1;
}
```

### 4. Search inputs

Browsers render their own ⊗ on `<input type="search">` in some chromes (WebKit). Hide it to avoid double-button:

```css
input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
```

## Placeholders — content is per-app, this task delivers the mechanism

The `:has(:not(:placeholder-shown))` selector does nothing unless each input has a placeholder. Two deliveries:

**In this task (library-level):**
- Every `.form-control` styling supports placeholders cleanly.
- `data-placeholder-fallback` optional attribute: when a consumer cannot set a real placeholder (e.g. for layout reasons), setting this attribute makes the JS inject a single-space placeholder so the clear button still appears — accepted opt-in but discouraged.

**Not in this task (filed per app separately):**
- Auditing every existing form in every app and adding meaningful placeholder text. Each app files its own follow-up task; the css_library gives them the mechanism but cannot invent copy for "Rechnungsnummer" vs. "E-Mail-Adresse" etc.

After this task merges, file per-app tasks titled e.g. *"Forms audit: add placeholders to all input fields"* in each of Energie / wlmonitor / zeiterfassung / simplechat / suche backlogs. Not blocking — the clear button works on any field that already has a placeholder; new placeholders appear as each app lands its audit.

## Accessibility

- Clear button is \`tabindex="-1"\` so Tab order skips it (primary keyboard flow stays input → next field). Users can still reach it with mouse/touch; keyboard users clear with Ctrl/Cmd+A → Delete.
- \`aria-label="Feld leeren"\` so screen readers announce it meaningfully.
- Focus returns to the input after click — screen reader context preserved.
- Button has \`type="button"\` — never submits the enclosing form.

## Out of scope

- Per-app placeholder content (see above).
- Clear affordance for selects, checkboxes, radios, file inputs — different UX pattern (e.g. "Reset" button), not this task.
- Multi-select tag removers, date-range clears — have their own component, excluded.
- Redesigning \`.form-control\` beyond adding the clear slot.

## Risk / migration

- Fields currently using \`.input-group\` with a trailing button (e.g. search form with "Suchen" appended) — the auto-wrap must detect this and skip (check \`input.closest(".input-group")\` and dont wrap). AC covers this.
- Password fields: do we want the ⊗ on password inputs? Yes — useful for correcting typos. Tested pattern everywhere.
- Autofilled fields (browser autofill doesnt fire \`input\`): \`:placeholder-shown\` still works with autofill since the value is present, so the button appears — OK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 css_library/js/forms.js added: progressive-enhancement wrapper that injects ⊗ buttons for every eligible input/textarea on load and via MutationObserver
- [x] #2 Wrapper skips hidden/checkbox/radio/file/submit/button, readonly/disabled, any input inside .input-group, and any input/form with data-no-clear
- [x] #3 Clicking ⊗ clears the value, refocuses the input, and dispatches a bubbling "input" event
- [x] #4 components.css adds .input-clear-wrap / .input-clear-btn styles using :has() + :placeholder-shown so the button is visible only when the field is non-empty
- [x] #5 Browser-supplied ⊗ on input[type=search] is suppressed to prevent double-button
- [x] #6 Placeholder colour confirmed legible and WCAG AA on both light and dark themes; no italic styling applied (accessibility)
- [x] #7 forms.js is loaded by the shared script bundle used by every app — no per-app script include required
- [x] #8 Verified in every app (Energie, wlmonitor, zeiterfassung, simplechat, suche): existing populated text inputs show the ⊗; empty ones dont; clearing works and triggers any filter-on-input behaviour
- [x] #9 Verified no regression on .input-group search bars or password change forms (data-no-clear / .input-group exclusion works)
<!-- AC:END -->
