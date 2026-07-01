---
id: TASK-9.7
title: 'P6 — simplechat: migrate to .app-* + remove green .btn-outline-success'
status: Done
assignee: []
created_date: '2026-06-30 14:48'
updated_date: '2026-07-01 11:13'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LOWEST priority (per Erik). Migrate simplechat markup to the P0 .app-* catalog (recipe from P2 pilot). Ride-along: replace the deprecated green .btn-outline-success on the auth pages with the data-changing red tier (.btn-outline-danger) per reconciliation.md §1. KEEP chat-specific bespoke UI (sidebar, message bubbles, input bar lock icon) and the per-user accent feature — but ensure the per-user override still resolves to a token, with the default being #e2001a. Only the Jardyx logo distinguishes the app.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 simplechat component markup uses .app-* catalog classes; chat-specific bespoke UI retained
- [x] #2 No green .btn-outline-success remains; auth submit uses the red tier
- [x] #3 Per-user accent still works; default accent is #e2001a
<!-- AC:END -->
