---
id: TASK-MEDIUM.2
title: Symlink icons/ into every app's web root; align favicon set
status: Done
assignee: []
created_date: '2026-04-21 05:44'
updated_date: '2026-04-21 06:34'
labels: []
dependencies: []
parent_task_id: TASK-MEDIUM
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit 2026-04-20 ui-rules §11 violations: simplechat, wlmonitor, zeiterfassung ship zero favicon files. Energie uses legacy favicon.svg+favicon-96x96.png. Only suche is close to compliant. Root cause: css_library/icons/ is not symlinked into any app's web root, so each app has to hand-place favicons. Either (a) symlink css_library/icons/* into each app's web/ directory, or (b) document explicit copy step in mcp/deploy.py. Same for jardyx.svg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decision: symlink vs copy documented
- [ ] #2 All 5 apps have the 6 canonical favicon files + jardyx.svg accessible from web root
- [ ] #3 HTML head in each app's base layout references the shared set
<!-- AC:END -->
