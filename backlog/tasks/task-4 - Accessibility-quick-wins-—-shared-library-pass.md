---
id: TASK-4
title: Accessibility quick wins — shared library pass
status: Done
assignee: []
created_date: '2026-04-18 10:35'
updated_date: '2026-04-18 17:47'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit run on 2026-04-18 across css_library, chrome, and sample app files. Ecosystem already meets most of UI §5 (semantic HTML, `lang="de"` on html, visible focus replacement, `.visually-hidden` utility present) but there are concrete quick wins that can ship with library-level changes and benefit every app at once. Out of scope: deep WCAG compliance, per-app audits, multilingual accessibility.

## Findings (all verified against the current tree)

### 1. No skip-to-content link anywhere

No `.skip-link` / "Zum Inhalt springen" in any consumer or in chrome — keyboard and screen-reader users tab through the whole fixed header + hamburger on every page load.

**Fix (chrome/src/Header.php + css_library/layout.css):**
- Header emits `<a class="skip-link" href="#main-content">Zum Inhalt springen</a>` as the first child of `<body>` context (i.e. first thing Header::render() outputs, before `.app-header`).
- CSS: `.skip-link` is `.visually-hidden` by default but becomes visible on `:focus` — standard pattern (reveals a bright CI-red button fixed top-left on Tab).
- Apps add `id="main-content"` to their top-level `<main>` element. Six apps, one-line change each — can land in the same task or follow up per app.

### 2. Modal focus management is incomplete

`css_library/js/admin.js` `openModal()` toggles `.show` and sets `aria-hidden=false`, but:

- Focus is not moved into the modal — keyboard user remains where they clicked.
- Focus is not trapped — Tab escapes the modal back into the page behind.
- Focus is not restored to the trigger on close.
- `.modal` dialog has no `role="dialog"` / `aria-modal="true"` / `aria-labelledby` binding to `.modal-header` text.

**Fix (admin.js + chrome UserModals + CSS docs):**
- `openModal(id)`: remember `document.activeElement` as `previouslyFocused`, move focus to first focusable element inside the modal (or the modal-dialog itself), install a keydown trap that cycles Tab / Shift-Tab inside the modal until close.
- `closeModal(id)`: restore focus to `previouslyFocused`.
- Chrome `UserModals` adds `role="dialog" aria-modal="true" aria-labelledby="<modalId>-title"` to `.modal-dialog`, and an `id="<modalId>-title"` on the `.modal-header` headline.

### 3. Alerts are not announced to screen readers

Six+ apps emit `<div class="alert alert-danger">…</div>` for form errors, flash messages, confirmations. None of them have `role="alert"` or `aria-live`, so a screen reader user who submits a form and receives an error never hears about it.

**Fix (css_library/components.css + docs):**
- `.alert { ... }` stays visual-only. Add documented pattern: authors should mark assertive alerts (errors, destructive confirmations) with `role="alert"` and non-urgent ones with `aria-live="polite"`.
- `showAlert()` helper in admin.js: the injected `.alert` gets `role="alert"` automatically so XHR errors are announced.
- Static PHP-rendered alerts: follow-up task per app to add `role` — library can only provide the template.

### 4. User-menu trigger lacks ARIA wiring

`chrome/src/Header.php:117` emits `<button class="user-btn" type="button">` — no `aria-label`, no `aria-expanded`, no `aria-haspopup`, no `aria-controls` targeting the `.user-dropdown`.

**Fix (Header.php):**
- Add `aria-haspopup="menu"` and dynamic `aria-expanded` (JS toggles between `"true"` and `"false"` alongside `.open`).
- Add `aria-controls="<generated-id>"` pointing to the `.user-dropdown` element, which gets the matching `id`.
- Ties in with chrome TASK-1 (collapse AppMenu into dropdown) — once nav lives in the dropdown too, this ARIA wiring is even more important. Either task lands first; keep them coordinated.

### 5. `prefers-reduced-motion` not respected in shared CSS

Zero matches in css_library. Transitions on buttons, alerts, modals, dropdowns, tab switches all animate unconditionally. Vestibular-sensitive users on "Reduce motion" OS setting still see everything move.

**Fix (layout.css — top of file, after the import ordering note):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Single block, ships to every app.

### 6. `outline: none` on form focus uses box-shadow ring — fine, but `:focus-visible` is better

`components.css:370` and `:400` replace `outline: none` with a 0.2rem box-shadow ring tinted `--color-primary`. That satisfies §5 (visible replacement) but applies the ring on mouse clicks too. Keyboard-only users would benefit from the ring being ON only for keyboard focus.

**Fix (components.css):**
- Split rule: `.form-control:focus { outline: none; }` (suppress the UA dotted outline), `.form-control:focus-visible { box-shadow: ...; border-color: ...; }` (show the ring only for keyboard).
- Same for `.form-select`, `.btn`, `.dropdown-link-btn`, `.tab-btn`.

### 7. Decorative SVGs in the chrome header should carry `aria-hidden`

`Header.php:121` emits the chevron `<svg>` with no `aria-hidden="true"` / no `role="img"`. Most screen readers ignore inline SVG without text, so this is low-impact, but adding `aria-hidden="true"` is free and explicit.

**Fix (Header.php):** `<svg aria-hidden="true" ...>` on the chevron, the hamburger glyph (chrome TASK-1), and any decorative icon in Footer/Admin partials.

### 8. Search inputs without labels

Many apps emit `<input type="search" placeholder="Suchen…">` without a `<label>`. Placeholder is not a label (per §5 accessibility floor).

**Fix (per-app follow-up):** Wrap each search input with `<label class="visually-hidden" for="…">Suchen</label>`. Library-level: add a helper macro or document the pattern in the components.css header comment. Per-app audits file follow-ups.

### 9. Admin tables: sortable column headers lack `aria-sort`

`chrome/src/Admin/UsersTab.php` / `LogTab.php` render sortable headers. When sorted, there is no `aria-sort="ascending|descending"` so SR users hear "column header" with no sort state.

**Fix (chrome partials):** When a column is the current sort, set `aria-sort="ascending"` or `"descending"`. Low effort, single partial edit each.

## What is already OK (audit noise, not findings)

- `<html lang="de">` — present on every app page spot-checked (Energie verified; same pattern elsewhere).
- `.visually-hidden` utility — present at `layout.css:415`.
- `<img alt="">` on header logo + avatar — correct (decorative, username text carries meaning).
- Form focus has visible replacement (§5 requirement met, see finding #6 for the polish).
- `auth_log` table uses `<th scope="col">` per the admin rules — spot-checked OK.

## Out of scope (explicitly deferred)

- Full WCAG 2.2 AA audit (colour contrast across every dark/light combo, form error handling, ARIA live regions for the log tab, motion sensors on animated charts, etc.) — separate effort, not quick wins.
- Per-app placeholder content / search labels / alert roles in static markup — each app files a short follow-up audit after this ships.
- Automated a11y testing (axe-core, pa11y) in CI — would be valuable but needs infrastructure.
- Localisation / RTL support.

## Recommended order of implementation

1. Findings #1 (skip link), #5 (reduced motion), #7 (aria-hidden SVG), #9 (aria-sort) — pure additive, zero risk.
2. Finding #6 (`:focus-visible` refactor) — behaviour change but compliant with §5.
3. Findings #2 (modal focus trap), #3 (alert role), #4 (user-menu ARIA) — library JS + chrome markup, slightly larger diff.
4. Finding #8 — file per-app follow-ups after library side lands.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skip-to-content link emitted by Chrome Header; visible on focus via new .skip-link CSS; all six apps have id="main-content" on their top-level <main>
- [ ] #2 Modal focus flow: openModal moves focus into the dialog, Tab is trapped inside, closeModal restores focus to the previously-focused element
- [ ] #3 Modal markup carries role="dialog", aria-modal="true", aria-labelledby pointing at the modal title id (emitted by chrome UserModals)
- [ ] #4 css_library/js/admin.js showAlert() injects role="alert" on the .alert it creates
- [ ] #5 chrome Header user-btn has aria-haspopup, aria-controls, and dynamic aria-expanded synchronised with the .open class
- [ ] #6 layout.css adds a prefers-reduced-motion block that neutralises animations/transitions for opted-in users
- [ ] #7 .form-control / .form-select / .btn / .dropdown-link-btn / .tab-btn refactored to use :focus-visible for the ring; mouse-only focus no longer shows the ring
- [ ] #8 Decorative SVGs in Header.php and Footer.php carry aria-hidden="true"
- [ ] #9 chrome Admin partials emit aria-sort on the currently-sorted column header
- [ ] #10 ui-design-rules §5 updated to reference these new primitives so future pages inherit them
- [ ] #11 Findings #8 (search labels) filed as per-app follow-up tasks in each consumer backlog (not done in this task)
<!-- AC:END -->
