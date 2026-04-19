---
id: TASK-8
title: Active-session viewer with per-device revoke in preferences
status: Done
assignee: []
created_date: '2026-04-19 05:13'
updated_date: '2026-04-19 18:15'
labels: []
dependencies:
  - TASK-6
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show a list of the user's active remember-me sessions (one row per `auth_remember_tokens` entry) with UA/IP/issued-at, and a "Abmelden" button per row that revokes that single token.

**Depends on** task-6 (which adds the "revoke all" pattern and any shared partials).

**Context** — `auth_remember_tokens` already stores `selector`, `user_agent`, `ip`, `expires_at`, so the data is there. Today no UI surfaces it. A per-device revoke gives users the "forgot to log out on my old phone" workflow without nuking every session.

**Scope** — this is a bigger change than task-6:

1. **Library**: add `auth_remember_list_for_user($con, int $userId): array` returning rows with sanitised UA (truncated, HTML-safe) and masked IP (optional — e.g. `/24` mask for v4), plus `auth_remember_revoke_one($con, int $userId, string $selector)` that refuses to delete tokens belonging to other users (important: the selector is a client-supplied value).
2. **Preferences UI**: a new "Aktive Sitzungen" card showing a table with columns: Browser/OS (parsed UA or raw), IP, Ausgestellt am, Läuft ab, [Abmelden]. Each row submits a POST with the selector.
3. **Per-app rollout**: wire into all 5 apps.

**Open questions to resolve before implementation**:

- Do we show the raw IP or a masked form? Privacy-for-self vs. utility if the user is investigating.
- Do we parse the User-Agent into a friendly "Chrome on macOS" string, or show the raw UA with a `<code>` wrap?
- Is the current session highlighted / marked so the user doesn't accidentally log themselves out of the device they're using?

**Why this is low priority** — for a personal-scale toolset, "log out of all devices" (task-6) covers the 90% case. A per-device UI is polish, not a gap. Only pick this up if task-6 lands and you actually want the visibility.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Library exposes `auth_remember_list_for_user()` and `auth_remember_revoke_one()` with the latter hard-enforcing that the passed selector belongs to the requesting user (no IDOR).
- [x] #2 Preferences page in all 5 apps shows a "Aktive Sitzungen" card/table with Browser/OS, IP, issued-at, expires-at, and a per-row revoke button.
- [x] #3 Current session is visually flagged (e.g. badge "Diese Sitzung") and the revoke button on it warns before nuking the user's own current remember token.
- [x] #4 Revoke action is POST + CSRF, logged via `appendLog()` with context `sec`.
- [x] #5 Decision recorded (in task description or decisions/) on IP masking and UA parsing before implementation.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Decisions (AC#5)**:
- IP: shown raw (`<code>`). Personal toolset — utility wins over privacy theatre.
- UA: light parser `auth_remember_parse_ua()` returns "Chrome auf macOS" style; raw UA surfaced on hover via inline info-icon SVG (blue filled circle, italic "i" in Times New Roman, `<title>` for tooltip).
- Current session: `badge badge-info` "Diese Sitzung" + upgraded `onsubmit` confirm.
- Scope: AC#2 says "all 5 apps"; simplechat has no preferences page and was excluded per TASK-6. Rolled out to wlmonitor (preferences.php), Energie + zeiterfassung (security.php), suche (password.php).

**Implementation**:
- Library: `auth_remember_list_for_user()`, `auth_remember_revoke_one()` (IDOR-safe: both user_id and selector in WHERE clause), `auth_remember_parse_ua()` in `~/Git/auth/src/remember.php`.
- Tests: `tests/Unit/RememberListRevokeOneTest.php` (13 tests). Full suite 133 passing.
- Shared icon: `~/Git/css_library/icons/info-circle.svg` + `.icon-info-circle` class in `components.css`.
<!-- SECTION:NOTES:END -->
