---
id: TASK-2
title: 'Responsive: hide .header-nav and show dropdown nav-section on mobile'
status: Done
assignee: []
created_date: '2026-04-18 10:19'
updated_date: '2026-04-18 16:45'
labels: []
dependencies:
  - TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Companion to chrome TASK-1 ("Header: collapse AppMenu into user dropdown on mobile"). Chrome emits the AppMenu items twice — once in `.header-nav` (desktop layout) and once in a new `.dropdown-nav-section` inside `.user-dropdown` (mobile). This task adds the CSS that decides which one is visible and how the dropdown section looks.

Place these rules in `layout.css` near the existing header rules (line ~72-90 is where the current mobile block lives).

## Rules to add

### 1. Responsive visibility swap

```css
/* desktop: keep horizontal nav, hide the dropdown duplicate */
@media (min-width: 768px) {
  .user-dropdown .dropdown-nav-section,
  .user-dropdown .dropdown-nav-section + .dropdown-divider {
    display: none;
  }
}

/* mobile: hide the horizontal nav, show the dropdown duplicate */
@media (max-width: 767px) {
  .app-header .header-nav { display: none; }
}
```

Mobile-only change to `.header-nav` — nothing else in the header shifts (§12 user area stays visible).

### 2. Dropdown-nav-section styling

```css
.dropdown-nav-section {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.dropdown-section-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding: 0.35rem 0.75rem 0.25rem;
}

.dropdown-nav-section .dropdown-link-btn.active {
  color: var(--color-primary);
  font-weight: 600;
}

/* optional: leading accent bar on the active row */
.dropdown-nav-section .dropdown-link-btn.active::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 1em;
  background: var(--color-primary);
  margin-right: 0.5rem;
  vertical-align: middle;
  border-radius: 2px;
}
```

### 3. Hamburger hint on the avatar trigger (mobile only)

So the avatar reads as "menu" and not just "account" when it carries nav items, add three horizontal lines next to the chevron on ≤767px when the dropdown is non-empty. Chrome always renders the chevron; CSS can stack a small hamburger glyph via `::before` on the `.chevron`, or we add a dedicated `.user-btn-hamburger` icon. Simplest:

```css
@media (max-width: 767px) {
  .user-btn .chevron { display: none; }  /* replace chevron with hamburger */
  .user-btn::after {
    content: '';
    width: 16px;
    height: 12px;
    background-image: linear-gradient(
      to bottom,
      currentColor 0 2px,
      transparent 2px 5px,
      currentColor 5px 7px,
      transparent 7px 10px,
      currentColor 10px 12px
    );
    display: inline-block;
    margin-left: 0.3rem;
  }
}
```

(Implementation may prefer an inline SVG icon instead of the gradient trick — either is fine. Goal is a recognisable three-bar glyph on mobile, chevron on desktop.)

### 4. Dropdown height cap

Prevents overflow on phones with lots of nav entries:

```css
.user-dropdown {
  max-height: min(80dvh, 480px);
  overflow-y: auto;
}
```

`dvh` per §12a handles mobile URL-bar collapse (don't use `vh`).

## What NOT to do

- Don't add a JS resize listener. CSS media queries own the swap.
- Don't hide `.header-nav` at xs only (≤575px) — the issue starts at sm, so the breakpoint is 767px.
- Don't change `.user-btn` positioning on mobile — it stays anchored right in the fixed header.
- Don't extend the existing `.dropdown-divider` rule; chrome inserts the divider after the nav section on its own.

## Dependency

Blocks on chrome TASK-1 emitting `.dropdown-nav-section` and the hamburger/chevron markup. Ship both together.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 layout.css: @media (max-width: 767px) { .header-nav { display: none; } } added
- [ ] #2 layout.css: @media (min-width: 768px) hides .dropdown-nav-section + its following divider on desktop
- [ ] #3 layout.css: .dropdown-nav-section / .dropdown-section-label / .active styling present and uses design tokens, no hardcoded colors
- [ ] #4 layout.css: user-btn shows a three-bar hamburger glyph on ≤767px in place of the chevron
- [ ] #5 layout.css: .user-dropdown has a height cap with min(80dvh, 480px) + overflow-y: auto
- [ ] #6 Visual check at xs (≤575px), sm (576–767px), md (≥768px): appMenu appears only in the correct place for each viewport
- [ ] #7 Tested in all consuming apps (Energie with nav; wlmonitor/zeiterfassung/simplechat/suche without) — no regression
<!-- AC:END -->
