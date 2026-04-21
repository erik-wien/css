---
id: TASK-MEDIUM.3
title: 'Accessibility sweep: #main-content, :focus-visible rings'
status: Done
assignee: []
created_date: '2026-04-21 05:44'
updated_date: '2026-04-21 08:15'
labels: []
dependencies: []
parent_task_id: TASK-MEDIUM
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit 2026-04-20 ui-rules §5 violations across all 5 apps: no <main id="main-content"> anywhere in web/*.php (only in error/*.html), so the skip-link target Chrome Header emits is broken in every app. Also outline:none paired with bare :focus (not :focus-visible) at: simplechat/web/css/app.css:167,403; zeiterfassung/web/css/zeit-app.css:200; wlmonitor/web/css/app/wl-monitor.css:148; Energie/web/styles/energie.css:295,325,373; suche/web/css/app.css:191,284. Fix: (a) add id="main-content" to <main> wherever Chrome Layout or per-app templates render it; (b) add a shared .focus-ring utility to css_library/components.css, replace :focus+outline:none with :focus-visible+outline.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 <main id="main-content"> in every app (verify via grep)
- [x] #2 Shared :focus-visible rule in components.css; bare :focus+outline:none removed app-side
- [x] #3 Keyboard navigation: Tab into skip-link then Enter jumps to main content on every app
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Two-part fix; do in this order so the shared primitives exist before app-side cleanup.

Part A — Shared library (css_library):
1. Add a `.focus-ring` utility in `components.css` using `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` (pick a token that reads on both themes).
2. Audit `layout.css` and `components.css` for any bare `:focus { outline: none }` — replace with `:focus-visible` or remove entirely if the browser default is acceptable.

Part B — Per-app sweep (5 apps in parallel — independent files):
1. For each app, grep `grep -n 'outline: none\|outline:none' web/css/**/*.css` and replace `:focus` → `:focus-visible`. Exact sites listed in the task description.
2. Add `id="main-content"` to the `<main>` element in:
   - Chrome library renderings (if Chrome emits `<main>` it should set the id by default — verify in `chrome/src/Header.php` or wherever the shell is rendered; otherwise add it at the first `<main>` after the Chrome header call in each page).
   - Any per-app templates that still render their own `<main>` (per-app header partials).
3. Verify Chrome header's skip-link anchor (`<a class="skip-link" href="#main-content">`) is unchanged.

Verification:
- Grep: `grep -rn 'id="main-content"' web/` returns at least one hit per app entry point.
- Keyboard test on one page per app: Tab once → skip-link visible → Enter → focus on `<main>`.
- Screenshot/diff nothing visual changed outside focus rings.
<!-- SECTION:PLAN:END -->
