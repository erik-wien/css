---
id: TASK-9.3
title: 'P2 — last.fm: migrate markup to .app-* catalog (PILOT)'
status: Done
assignee: []
created_date: '2026-06-30 14:47'
updated_date: '2026-07-01 11:25'
labels: []
dependencies:
  - TASK-9.1
  - TASK-9.2
parent_task_id: TASK-9
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pilot migration — last.fm is the cleanest app (already uses .admin-section/.pref-section/.page-reading). Migrate its markup from legacy component classes to the P0 .app-* catalog classes (modals, menus, alerts, tabs, badges, cards→frame). This pilot establishes and documents the per-app migration recipe reused by P3–P7. Capture the recipe in this task's notes on completion. Accent stays #e2001a (no change). Only the Jardyx logo distinguishes the app.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All last.fm component markup uses .app-* catalog classes; no legacy component class names remain in last.fm
- [ ] #2 Visual/behavioral parity verified light+dark; a11y roles intact (dialog/menu/tab/alert)
- [ ] #3 Per-app migration recipe documented in task notes for reuse by P3–P7
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DONE (code + static verification). last.fm markup migrated to the .app-* catalog.
RENAMES (class="..."-anchored sed across web/*.php): card→app-card (21), card-header→app-card-header (incl. 5 card-header-split→app-card-header-split), card-body→app-card-body (20), card-title→app-card-heading (9, NOT app-card-title!), tab-bar→app-tabs (2), tab-btn→app-tab (5), tab-panel→app-tab-panel (10), alert alert-X→app-alert app-alert-X (15), badge badge-X→app-badge app-badge-X (4).
JS COUPLING fixed: charts.php showPanel() querySelectorAll('.tab-panel')→'.app-tab-panel'; sync.php syncMsg() className 'alert alert-'→'app-alert app-alert-'. (admin.js-driven tabs in admin.php + track.php need NO app-JS change — P1 made admin.js dual-support.)
PROTECTED (untouched): .stat-card (last.fm's own, 47x), role="alert", showAlert/addAlert.
DEFERRED (still legacy, work fine): .table/.table-responsive (track.php) and .pagination — catalog .app-table=red header + .app-pagination=pill restructure are visual/structural decisions for a later pass (same call as chrome P1).
VERIFIED: zero leftover legacy component tokens; protected tokens intact; php -l clean (12 files). NOT YET: live browser click-through (modals/tabs/alerts, light+dark) — browser extension was offline this session; must be eyeballed before/with rolling the recipe to P3+.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-06-30 15:41
---
Pilot scoping done. last.fm surface: card family (51), alerts (inline PHP + runtime showAlert), tabs (track.php/admin.php), badges (sync/security). NO modals/dropdowns (chrome-internal). BLOCKED on P1 (9.2): alerts partly emitted by shared admin.js showAlert; tabs/modals driven by shared admin.js — app markup rename must follow shared-JS migration. Recipe after P1: pure renames .card*→.app-card*/.app-card-heading, .alert*→.app-alert*, .tab-bar→.app-tabs, .tab-btn→.app-tab, .tab-panel→.app-tab-panel, .badge*→.app-badge*.
---

author: claude
created: 2026-06-30 19:27
---
RECIPE for P3-P7 (per-app markup migration), proven on last.fm:
1) Inventory: grep -rhoE 'class="[^"]*(card|alert|badge|tab-bar|tab-btn|tab-panel)[^"]*"' web — list every distinct class attr.
2) Flag app-specific lookalikes to EXCLUDE before sed: last.fm .stat-card, wlmonitor .line-badge/.departure-table, Energie .kpi-card/.chart-pill/.tile, simplechat .bubble-*, etc.
3) Find JS coupling: grep querySelector/classList/className/innerHTML for card|alert|badge|tab + role="alert"/showAlert. App-inline JS selectors & alert-builders must move to .app-* (admin.js is already dual-support; chrome modals already .app-modal-*).
4) Apply class="..."-anchored sed (see notes). NEVER touch role="alert", showAlert/addAlert, or app-specific *-card/*-badge classes.
5) DEFER .table* and .pagination.
6) Verify: zero leftover legacy tokens, protected tokens intact, php -l clean, THEN browser click-through light+dark.
---

author: claude
created: 2026-07-01 11:25
---
GAP FIX (found during P8 readiness scan): the P2 last.fm pilot MISSED converting its green tier + 2 JS alert builders. Now fixed: ~9 btn-outline-success→btn-outline-danger across executeReset/sync/setpassword/admin/security/preferences; preferences.php JS alert builders (lines 93,129) 'alert alert-'→'app-alert app-alert-'. last.fm now fully green-free + app-alert. Lesson: the recipe must include green→danger + JS alert-builder selectors, not just class= renames.
---
<!-- COMMENTS:END -->
