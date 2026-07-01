---
id: TASK-9.6
title: 'P5 — Energie: migrate to .app-* + accent #e94560→#e2001a + icon consolidation'
status: Done
assignee: []
created_date: '2026-06-30 14:47'
updated_date: '2026-07-01 11:06'
labels: []
dependencies:
  - TASK-9.3
parent_task_id: TASK-9
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate Energie markup to the P0 .app-* catalog (recipe from P2 pilot). Ride-along: (a) Energie is the ONLY app whose accent diverges — change --color-accent #e94560 (salmon) to the canonical Jardyx red #e2001a and remove the override from energie-theme.css; (b) consolidate Energie's triple icon system (inline SVG sprite + .ui-icon mask + inline info-circle) toward the catalog .icon mask system. KEEP bespoke domain components (.tile/.kpi/.chart-*/scrubber) and chart green/blue data-viz colors. Only the Jardyx logo distinguishes the app.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Energie component markup uses .app-* catalog classes; bespoke .tile/.kpi/.chart-* retained
- [x] #2 --color-accent is #e2001a; no salmon #e94560 override remains in energie-theme.css
- [x] #3 Icon usage consolidated onto the catalog .icon mask system
<!-- AC:END -->
