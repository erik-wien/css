---
id: TASK-7
title: Clarify "Angemeldet bleiben" label to reflect cross-app SSO
status: Done
assignee: []
created_date: '2026-04-19 05:12'
updated_date: '2026-04-19 12:24'
labels: []
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The login-form checkbox currently reads "Angemeldet bleiben (8 Tage)". Technically correct, but hides that checking it on one app silently logs the user into every other `*.eriks.cloud` app via the shared `auth_remember` cookie. Worth one line of copy.

**Scope** — per-app login forms (no shared partial today). Files:

- `wlmonitor/web/login.php`
- `Energie/web/login.php`
- `zeiterfassung/web/login.php`
- `suche/web/login.php`
- `simplechat/web/login.php`

**Proposed copy** (next to or below the checkbox, `.form-text` or `text-muted small`):

> Gilt für alle Apps auf eriks.cloud (Chat, WL Monitor, Energie, Zeiterfassung, Suche).

Or shorter:

> Meldet Sie auch auf den anderen Apps auf eriks.cloud an.

Exact wording is a stylistic choice — pick one and use it in all 5 apps for consistency.

**Out of scope** — extracting the login form into a shared Chrome partial. That's a separate (and much larger) refactor; for now, duplicate the one line across the 5 files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All 5 app login forms (wlmonitor, Energie, zeiterfassung, suche, simplechat) carry identical explanatory copy below the "Angemeldet bleiben" checkbox.
- [x] #2 Copy uses `.form-text` (or equivalent muted-small styling from components.css) so it's visually secondary to the checkbox label.
- [x] #3 Copy is German (matches the rest of the UI).
- [x] #4 No behaviour change — purely a label edit.
<!-- AC:END -->
