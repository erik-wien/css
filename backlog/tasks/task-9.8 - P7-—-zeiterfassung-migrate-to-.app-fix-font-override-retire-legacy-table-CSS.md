---
id: TASK-9.8
title: >-
  P7 — zeiterfassung: migrate to .app-* + fix font override + retire legacy
  table CSS
status: Done
assignee: []
created_date: '2026-06-30 14:48'
updated_date: '2026-07-01 11:49'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LOWEST priority (per Erik) and the largest cleanup. Migrate zeiterfassung markup to the P0 .app-* catalog (recipe from P2 pilot). Ride-along: (a) the body rule in zeit-app.css hardcodes a system font stack, bypassing --font-sans/Atkinson — remove it so the shared font applies; (b) retire/replace the 2005-era legacy table CSS (#calendar, #tagesbuchungen, #userlist, .hell/.dunkel) and inline styles in favor of the catalog .app-table and utility classes. KEEP the .btn-kommen/.btn-gehen action buttons (review their tier against reconciliation.md). Accent #e2001a.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 zeiterfassung component markup uses .app-* catalog classes
- [x] #2 body uses --font-sans (Atkinson); no system-font override remains
- [ ] #3 Legacy table/calendar CSS retired or migrated to .app-table + utilities; inline styles reduced
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-07-01 11:25
---
AC#1 ✓ + AC#2 ✓ done. Markup→.app-* (card/card-hdr→app-card-header/card-body; tabs; alert incl interpolated+concat forms; badge-info). zeit's LOCAL .card/.alert CSS renamed in lockstep to .app-* (look preserved — was already 'shared legacy + zeit override'). alert-tray + bespoke .badge-admin/user/active/blocked kept. AC#2: removed the -apple-system body font override → inherits shared --font-sans (Atkinson). Tabs: admin.php via shared admin.js (dual) + fixed inline .tab-btn[data-tab] JS selector; preferences.php tab JS is ID-based (no change). FIXED A PRE-EXISTING PARSE ERROR: preferences.php had a redundant 2nd <?php at line 164 (double-open, no ?> between) — present in HEAD, php 8.5 rejects; removed the stray tag. AC#3 (retire 2005 #calendar/.hell/.dunkel tables → .app-table) DEFERRED — large visual redesign, needs a mockup (UI §19), and does NOT block P8 (those are zeit-local classes, not css_library aliases).
---
<!-- COMMENTS:END -->
