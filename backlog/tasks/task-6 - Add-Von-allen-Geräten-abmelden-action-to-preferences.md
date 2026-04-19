---
id: TASK-6
title: Add "Von allen Geräten abmelden" action to preferences
status: Done
assignee: []
created_date: '2026-04-19 05:12'
updated_date: '2026-04-19 15:16'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose `auth_remember_delete_all()` as a user action so users can revoke every remember-me token at once (lost laptop, shared browser, "paranoid logout") without having to change their password.

**Context** — `auth_remember_delete_all($con, $userId)` already exists in `~/Git/auth/src/remember.php` and is invoked on password change. There's no UI path to it today; users who want to nuke all SSO tokens have to reset their password.

**Scope** — this is the core library piece plus a single wiring change per app:

1. **Library** (`~/Git/auth/`): add a small wrapper (e.g. `auth_remember_revoke_all($con)`) that reads `$_SESSION['id']`, calls `auth_remember_delete_all()`, writes an `appendLog($con, 'sec', '...')` entry, and clears the current remember cookie. Expose as public API.
2. **Chrome / preferences page**: add a "Sicherheit" card row in each app's `preferences.php` (next to the existing 2FA/password section — section id `#sicherheit`). Contains a `<form method="post">` with CSRF + a single `.btn-danger` labelled "Von allen Geräten abmelden". The submit handler hits a small endpoint (e.g. `preferences.php?action=revoke_all_devices`) that does CSRF + call the library + flash alert + redirect.
3. **Per-app rollout**: wire the form into each app's preferences page (wlmonitor, Energie, zeiterfassung, suche, simplechat — 5 apps). The form markup itself can be added as a shared Chrome partial so it stays consistent.

**UX detail** — the confirmation copy must say: "Aktive Sitzungen auf anderen Apps bleiben bis zu 4 Tage bestehen; um sie sofort zu beenden, ändern Sie Ihr Passwort." This is honest about the PHP session cookie's 4-day lifetime.

**Out of scope** — per-device revoke (that's task-8). This task revokes ALL or nothing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Library exposes a public function `auth_remember_revoke_all($con)` that deletes every remember-me token for the current user, clears the current cookie, and writes an `auth_log` entry with context `sec`.
- [x] #2 `preferences.php` in all 4 apps (wlmonitor, Energie, zeiterfassung, suche) has a "Von allen Geräten abmelden" button under the existing #sicherheit section. (simplechat has no preferences page and is out of scope.)
- [x] #3 Submit flow is POST + CSRF-verified; on success flashes an alert ("Alle Sitzungen wurden beendet.") and redirects back to preferences.
- [x] #4 Confirmation copy explicitly states that active PHP sessions on other apps may persist up to 4 days until their cookie expires.
- [x] #5 After clicking, the user stays logged in on the current app (only the remember-me tokens are cleared, not the local session).
- [x] #6 Action is logged to `auth_log` via `appendLog()` with the originating app's `APP_CODE`.
- [x] #7 Unit test covers the no-session guard (`auth_remember_revoke_all` returns false when `$_SESSION['id']` is empty, no DB calls made).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Plan

### Scope correction
simplechat has **no** `preferences.php` — the task's "5 apps" is wrong. Actual surface is **4 apps**: wlmonitor, Energie, zeiterfassung, suche. Acceptance criterion #2 will be updated to reflect this once the plan is approved.

### 1. Library (`~/Git/auth/src/remember.php`)

Add one public function:

```php
function auth_remember_revoke_all(mysqli $con): bool
```

Behaviour:
- Reads `$_SESSION['id']`; returns `false` if no active session (defensive — never deletes anonymously).
- Calls existing `auth_remember_delete_all($con, $userId)` (already deletes every row for that user).
- Clears the current request's `auth_remember` cookie via `_auth_remember_setcookie('', time() - 3600)` so the browser doesn't keep sending the (now invalid) token.
- Writes `appendLog($con, 'sec', 'Revoked all remember-me tokens.')` — library's own log call, origin defaults to caller's `APP_CODE`.
- Returns `true` on success.

Does **not** touch the local PHP session. The user stays logged in on the current app (AC #5).

### 2. Per-app wiring (wlmonitor → canonical, then replicate)

Each app's `preferences.php` has an existing `#sicherheit` tab with "Kennwort ändern" and "2FA" cards. Add a third card **after** 2FA:

```html
<div class="card mb-3">
  <div class="card-header"><?= icon("shield-off", "me-1") ?> Aktive Sitzungen</div>
  <div class="card-body">
    <p>Meldet Sie auf allen Geräten und allen Apps auf eriks.cloud ab.</p>
    <p class="text-muted small">Aktive Sitzungen auf anderen Apps bleiben bis zu 4 Tage bestehen; um sie sofort zu beenden, ändern Sie Ihr Kennwort.</p>
    <form method="post" action="preferences.php"
          onsubmit="return confirm('Wirklich von allen Geräten abmelden?')">
      <?= csrf_input() ?>
      <input type="hidden" name="action" value="revoke_all_devices">
      <button type="submit" class="btn btn-outline-danger">Von allen Geräten abmelden</button>
    </form>
  </div>
</div>
```

Action handler (same POST dispatch pattern as `change_password`):

```php
if ($action === 'revoke_all_devices') {
    if (auth_remember_revoke_all($con)) {
        addAlert('success', 'Alle Sitzungen wurden beendet.');
    } else {
        addAlert('danger', 'Konnte Sitzungen nicht beenden.');
    }
    header('Location: preferences.php#sicherheit'); exit;
}
```

Also extend the `$action ... 'sicherheit'` tab-routing switch (wlmonitor line 46) to include `'revoke_all_devices'` so the flash lands on the right tab.

### 3. Per-app rollout order

1. wlmonitor (canonical — verify flow end-to-end first).
2. Energie, zeiterfassung, suche — copy the same markup + handler.

Acceptance criteria translate identically across all four; tab IDs (`panel-sicherheit`) and the `#sicherheit` anchor match across apps (already checked in Energie/zeiterfassung preferences during previous work).

### 4. Test

- `auth/tests/Unit/` has no existing remember-me test. Add a Unit test for the guard: `auth_remember_revoke_all()` returns `false` when `$_SESSION['id']` is empty, and doesn't call the DB. (The "real delete" path goes through `auth_remember_delete_all()` which hits the DB — covered by manual testing since there's no Integration harness here.)
- Manual: log in on wlmonitor + energie + zeiterfassung with "Angemeldet bleiben"; click "Von allen Geräten abmelden" on wlmonitor; verify that reopening chat.eriks.cloud / energie / zeiterfassung in a fresh private window shows the login page (no silent restore) while the current wlmonitor tab stays logged in.

### 5. Out of scope (confirm before starting)

- Shared Chrome partial for the form markup — the 4 apps already duplicate the password/2FA cards; adding a fifth duplicated card for now matches the current pattern. Extracting to Chrome is a separate refactor.
- Changes to simplechat (no preferences page).
- Per-device revoke UI (TASK-8).
<!-- SECTION:PLAN:END -->
