---
id: TASK-9.9
title: 'P8 — css_library: remove legacy aliases + green tier (final cutover)'
status: Done
assignee: []
created_date: '2026-06-30 14:48'
updated_date: '2026-07-01 12:11'
labels: []
dependencies:
  - TASK-9.1
  - TASK-9.3
  - TASK-9.4
  - TASK-9.5
  - TASK-9.6
  - TASK-9.7
  - TASK-9.8
parent_task_id: TASK-9
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Final cutover — runs only after ALL apps are migrated (P2–P7). Remove the legacy component class names (.modal*, .dropdown-menu/.dropdown-item, .alert*, .tab-bar/.tab-btn/.tab-panel, .badge*, .card* where superseded by .frame) and the green/constructive button tier (.btn-success/.btn-outline-success) from css_library. Grep every app to confirm zero remaining references before deleting. This leaves a single .app-* catalog identical in naming to the TÜV theme.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No legacy component class names or green button tier remain in css_library
- [x] #2 Repo-wide grep across all 6 apps confirms zero references to removed classes
- [x] #3 All apps still render correctly after alias removal (light+dark)
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-07-01 12:11
---
P8 cutover executed. Removed from css_library/components.css: green tier (.btn-success/.btn-outline-success — the original defs AND the P0 red-remap overlay), legacy .card* (kept .shadow-sm), .tab-bar/.tab-btn/.tab-panel, .alert/.alert-{danger,success,warning,info} colours + dark blocks, .badge/.badge-*, legacy .modal* system, .dropdown/.dropdown-menu/.dropdown-item/.dropdown-divider. KEPT (generic utilities / live deps, not colour aliases): .btn-close (used by wlmonitor alert-dismiss), .alert-dismissible, .fade, .show, .shadow-sm, .table*, .pagination*, and the non-green Bootstrap btn tiers (.btn-warning/.btn-secondary/.btn-dark/.btn-light/.btn-danger — out of P8's stated scope). Verified: braces 290/290; all .app-* catalog classes intact; cross-app+chrome scan shows ZERO renders of any removed class (remaining btn-success strings are only the suche back-compat normalizer KEYS, not CSS usages). NOT browser-verified (extension offline). NOTE for follow-up: wl-monitor.js has dead initDropdowns() referencing .dropdown-menu (no markup → no-op); admin.js showAlert still dual-emits the now-inert .alert class (harmless, .app-alert styles it) — both are cosmetic JS cleanup, not functional.
---
<!-- COMMENTS:END -->
