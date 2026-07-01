---
id: TASK-9.5
title: 'P4 — wlmonitor: migrate to .app-* + tokenize monitor-card colors'
status: Done
assignee: []
created_date: '2026-06-30 14:47'
updated_date: '2026-07-01 09:40'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate wlmonitor markup to the P0 .app-* catalog (recipe from P2 pilot). Ride-along: tokenize the hardcoded monitor-card greens (#404d40/#f4f7f4 light, #2a342a/#141814 dark) onto semantic tokens instead of literals. KEEP the Wiener-Linien transit line-badge colors hardcoded — those are non-negotiable transit branding (domain data-viz, not accent). Accent stays #e2001a.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 wlmonitor component markup uses .app-* catalog classes; no legacy component class names remain
- [x] #2 Monitor-card colors use semantic tokens (no hardcoded hex); transit line badges unchanged
- [x] #3 Parity verified light+dark; station search/departure UI intact
<!-- AC:END -->
