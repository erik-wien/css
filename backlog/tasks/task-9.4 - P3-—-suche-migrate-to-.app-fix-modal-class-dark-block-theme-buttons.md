---
id: TASK-9.4
title: 'P3 — suche: migrate to .app-* + fix modal class, dark-block, theme buttons'
status: Done
assignee: []
created_date: '2026-06-30 14:47'
updated_date: '2026-07-01 05:56'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate suche markup to the P0 .app-* catalog (follow the recipe from the P2 pilot). Ride-along fixes specific to suche found in the 2026-06-30 survey: (a) suche toggles .modal.open instead of the shared .modal.show — switch to the .app-modal mechanism; (b) its third dark-mode block deviates from the canonical pattern — align to reconciliation.md §2 (:root / [data-theme=dark] / @media prefers-color-scheme:dark :root:not([data-theme=light])); (c) header theme-switch buttons appear unwired (no POST handler from the dropdown) — verify/wire to the change_theme endpoint. Accent stays #e2001a.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 suche component markup uses .app-* catalog classes; no legacy component class names remain
- [ ] #2 Modal uses the canonical .app-modal mechanism (no bespoke .modal.open)
- [ ] #3 Dark-mode three-block matches reconciliation.md §2; theme switch in header works
<!-- AC:END -->
