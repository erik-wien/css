---
id: TASK-LOW.1
title: >-
  zeiterfassung: retire 2005-era booking/calendar tables → .app-table
  (mockup-first)
status: To Do
assignee: []
created_date: '2026-07-01 11:49'
labels: []
dependencies: []
parent_task_id: TASK-LOW
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deferred AC#3 from TASK-9.8. Migrate zeiterfassung's legacy #calendar/#tagesbuchungen/#userlist tables and .hell/.dunkel row classes (29 refs in zeit-app.css) plus inline styles to the catalog .app-table + utilities. Visual redesign of the core time-tracking UI — produce an ASCII mockup first (UI §19), wait for approval, then implement. Not a P8 blocker (these are zeit-local classes, not css_library aliases).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Booking/calendar/userlist tables use .app-table + utilities; legacy #calendar/.hell/.dunkel CSS retired
- [ ] #2 Mockup approved before implementation
- [ ] #3 Light+dark parity; booking interactions intact
<!-- AC:END -->
