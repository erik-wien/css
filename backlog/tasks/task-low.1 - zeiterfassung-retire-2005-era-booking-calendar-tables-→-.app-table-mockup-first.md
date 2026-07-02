---
id: TASK-LOW.1
title: >-
  zeiterfassung: retire 2005-era booking/calendar tables → .app-table
  (mockup-first)
status: Done
assignee: []
created_date: '2026-07-01 11:49'
updated_date: '2026-07-02 04:46'
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
- [x] #1 Booking/calendar/userlist tables use .app-table + utilities; legacy #calendar/.hell/.dunkel CSS retired
- [x] #2 Mockup approved before implementation
- [x] #3 Light+dark parity; booking interactions intact
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-07-02 04:46
---
Implemented (mockup approved 2026-07-02): #calendar + #tagesbuchungen floats → .zeit-cols flex row (wraps/stacks on narrow); #userlist fixed 775px+clear:both → min-width:775px inside .app-table-wrap (scrolls on narrow) + class=app-table; tokenised the hardcoded calendar/table hex (#ffbb00 day-header→warning-mix, #cccccc summary/work-day→surface-alt, #99ccff selected→accent-mix, #ff0000 today→accent border, #eeeeee weeknum→surface-alt). Calendar kept as a compact tokenised grid (date-picker, not a data table). tr.hell/.dunkel already token-based. lint clean, braces 161/161. Deployed to akadbrain (zeit is akadbrain-only). NOTE: .corr/.status-never/.month-export hex left (error/status/print, outside this task).
---
<!-- COMMENTS:END -->
