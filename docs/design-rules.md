# Design Rules

Conventions for building UIs on top of this CSS library. Applies to any app consuming the shared stylesheets.

## 1. Design tokens (mandatory)

- Use `--color-*`, `--font-*`, `--radius*`, `--shadow*` custom properties from `theme.css`.
- Never hardcode colors in component CSS — add to the theme file or use an existing token.
- New projects: symlink this library into `web/css/shared/`, and load stylesheets in order: `theme.css → reset.css → layout.css → components.css → project-theme.css → app.css`.

## 2. Dark mode (mandatory)

Three-block pattern, all three blocks defining the same variable set:

```css
:root { /* light default */ }
[data-theme="dark"] { /* explicit dark override */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* auto dark */ }
}
```

Project palette overrides go in a `project-theme.css` that loads **after** the shared `theme.css`.

## 3. Build step

- Default: no build step. Vanilla CSS + the shared library.
- Tailwind is allowed only when justified by the project (simplechat pattern). If used, commit the compiled output.

## 4. Typography

- Atkinson Hyperlegible with system-ui fallback chain (accessibility choice — don't swap without reason).
- Serve fonts locally from `web/fonts/`, use `font-display: swap`.

## 5. Accessibility floor

- Semantic HTML first; ARIA only when semantics aren't enough.
- Focus styles must be visible — never `outline: none` without a visible replacement.
- Color contrast: WCAG AA minimum.

## 6. PHP web-page patterns

- All URLs go through `basePath()` — never hardcode paths (apps may live under a subdirectory).
- Inline scripts must include the CSP nonce via `$_cspNonce` (set in `auth_bootstrap()`).
- Every authenticated page starts with `auth_require()`.
- Write endpoints require `csrf_verify()`; logout must be POST + CSRF (never a plain `<a>` link).
- Whitelist MIME types from the database before setting `Content-Type`.

## 7. Component hygiene

- Prefer the shared `components.css` library (buttons, forms, alerts, cards, modals, dropdowns, badges, tables, pagination, spinners) over bespoke variants.
- App-specific components live in the project's `app.css`, not in shared.

## 7.1 Button color hierarchy (mandatory)

The shared `.btn` is intentionally a neutral outlined button (transparent background, body-text foreground, `--color-border` outline). Action emphasis is opt-in via modifier classes — pick the modifier that matches the action's role, not its prominence. Three tiers:

| Tier | Use for | Class |
|---|---|---|
| **Neutral / default** | Cancel, Close, Filter, Search, Edit, "Bearbeiten", page-level navigation, any non-special action | bare `.btn` (no modifier) — outlined grey border, body-text foreground |
| **Constructive (outline)** | Create / add / send / save — anything that *adds* state ("+ Benutzer anlegen", "Anlegen & einladen", "Speichern", "Bestätigungslink senden") | `.btn-outline-success` — green border, transparent fill, fills on hover |
| **Reversible destructive (outline)** | Form / filter / draft reset — clears state the user entered, but recoverable by re-typing ("Zurücksetzen" in filter bars, "Abbrechen eines Entwurfs") | `.btn-outline-danger` — red border + red text, fills red on hover |
| **Destructive (solid)** | Permanent removal or hard reset — anything irrevocable ("Löschen", "DB leeren") | `.btn-danger` — solid red background, white text |

- **Brand action (`.btn-primary`)** — solid CI red, reserved for the *single* primary action on standalone marketing/onboarding surfaces (login submit, password-reset submit, landing-page CTA). Do **not** use it inside admin tables, modals, or dashboards — those use the tiered neutral / outline-success / danger system above.
- **Reversible state toggles** (Aktivieren / Deaktivieren, Passwort-Reset, 2FA widerrufen, Reset Invalid Logins) → bare `.btn` (neutral). They alter state but don't destroy data.
- Never put two solid colored buttons next to each other in the same toolbar/row. If a row has a destructive action, every other action in the row stays neutral or outlined.
- Modal footers: cancel = bare `.btn`, primary action = `.btn-outline-success` (constructive) or `.btn-danger` (destructive confirm). Never `.btn-primary` in admin modals.

## 8. Known pitfalls

- **Do not use `<details>` for sidebar/drawer toggles.** The UA stylesheet hides non-summary children when `[open]` is absent and this cannot be reliably overridden with CSS. Use a plain `<div>` with JavaScript `classList.toggle("open")`.
- Deploy with `rsync --copy-links` so symlinked `shared/` is resolved into real files at the destination.
- macOS permissions quirk on files synced from another account: fix with `chown -R erikr /path/to/repo/` before rsync.

## 9. Anti-generic-AI-look

- No default Bootstrap blue everywhere — use the project accent.
- The shared `theme.css` sets `--color-primary` to the Jardyx CI red `#e2001a` (dark-mode variant `#ff3347` for contrast). Projects may override in `project-theme.css`, but this is the default — never fall back to Bootstrap blue.
- No unjustified gradients, no purple-to-pink hero sections.
- Spacing rhythm comes from design tokens, not random rem values.
- One accent color per app, not three.

## 10. What NOT to do

- Don't introduce a CSS framework into a no-build project.
- Don't duplicate shared components into project CSS — extend them via override.
- Don't inline styles without the CSP nonce.

## 11. Shared assets (central repository)

- `~/Git/css/icons/` is the central asset repository, symlinked into project `web/` directories alongside `shared/`.
- `jardyx.svg` — canonical Jardyx logo. Use this file, don't re-export per project.
- Include the full favicon set in every project's HTML head and PWA manifest:
  - `favicon.ico`
  - `favicon-16x16.png`
  - `favicon-32x32.png`
  - `apple-touch-icon.png`
  - `web-app-manifest-192x192.png`
  - `web-app-manifest-512x512.png`
- Projects that need a different brand mark may override locally, but the default is `jardyx.svg`.

## 12. Fixed header structure (mandatory layout)

```
┌───────────────────────────────────────────────────────────────────┐
│ [Logo] [AppName] [optional search / select]    [AppMenu] [User ▾] │
└───────────────────────────────────────────────────────────────────┘
```

- Header is `position: fixed` at the top, full width, above content. Use the shared `.app-header` class from `layout.css`.
- **Markup:** wrap the two clusters in `.header-left` and `.header-right` (both provided by shared `layout.css`). `.app-header` uses `justify-content: space-between`, so exactly two direct children is the expected shape.
- **Left cluster** (left-aligned): Logo → AppName → optional search box or select. Use `.brand` + `.header-logo` + `.header-appname` for the logo/name pair.
- **Right cluster** (right-aligned): AppMenu (app-specific navigation) → User area. Use `.header-nav` for the app menu and `.user-menu` for the user dropdown trigger.
- **User area:** `{UserName} {Avatar} {Chevron}` as a single clickable `.user-btn` dropdown trigger (username first, avatar second, chevron last). The avatar image comes from the shared `erikr/auth` library (the same source used everywhere — never re-upload or cache per app). **Avatar fallback is always the grey-guy SVG** served by `\Erikr\Chrome\Avatar::serveGreyGuy()` — any time the user's `img_blob` cannot be displayed (missing, empty, anonymous caller, DB error), show the grey-guy silhouette. Never substitute initials-in-a-circle or any other per-app fallback. Each app's `web/avatar.php` is a 2-line stub calling `\Erikr\Chrome\Avatar::serve($con)`; do not hand-roll the endpoint. Clicking opens a `.user-dropdown` aligned to the right edge of the avatar (opening downward, menu panel extending to the left) containing these items in order:
  1. User preferences (`.dropdown-link-btn` or `<a class="user-dropdown">`) — UI/display preferences only (accent colour, language, theme, etc.)
  2. Password & 2FA (`.dropdown-link-btn`) — security settings as a **separate** entry; never merged with preferences
  3. Admin (`.dropdown-link-btn`) — only if the user has admin rights; links to the app's admin screen (see section 15)
  4. Help (`.dropdown-link-btn`) — app-specific help / documentation entry point
  5. Logout — POST + CSRF form, rendered as `<button class="dropdown-link-btn">` inside a `<form method="post">`, never a plain link

**User preferences and Password & 2FA are always two distinct menu items linking to two distinct pages.** Preferences covers display/UX choices (including the theme switcher — Light / Dark / Auto); Password & 2FA covers account security. Do not combine them into a single "settings" page.
- Body content must have `padding-top: var(--app-header-height)` (the shared library no longer reserves this via `sticky`; the custom property is declared on `:root` in shared `layout.css`, see §12a).
- On mobile (`≤767px`), the search/select and AppMenu may collapse into a hamburger or drawer; the user area stays visible.

## 12a. Full-viewport app shells (mandatory when applicable)

§12 and §13 describe a **scrolling-document** layout: body is taller than the viewport, `padding-top`/`padding-bottom` reserve space for fixed chrome, the user scrolls. That pattern is correct for most pages (preferences, admin, help, reading content).

It is wrong for **full-viewport app shells** — chat windows, kiosk screens (ampel, easy, live dashboards) — where nothing sits below the fold, internal regions scroll independently, and the shell must fit the viewport exactly. A shell with `height: 100vh` ignores body padding and overlaps fixed chrome. Do not chase this with `calc(100vh - …)` — use the opt-in pattern below.

**Pick one mode per page.** Scrolling document or full-viewport shell; not a spectrum.

### Shared tokens (layout.css)

Shared `layout.css` exposes two custom properties that chrome height depends on:

```css
:root {
  --app-header-height: 60px;
  --app-footer-height: 48px;
}
```

Apps may override them in `project-theme.css` when their chrome is taller or shorter. Never hardcode `60px`/`48px` in app CSS — reference the props.

### Scrolling pages (default, no opt-in needed)

Body carries the padding, per §12 and §13:

```css
body {
  padding-top:    var(--app-header-height);
  padding-bottom: var(--app-footer-height);
}
```

### Shell pages (opt-in via body class)

Add `body.app-shell` on pages that are full-viewport shells. Shared `layout.css` then:

```css
body.app-shell {
  padding: 0;
  overflow: hidden;
}
body.app-shell .app-shell-root {
  position: fixed;
  inset: var(--app-header-height) 0 var(--app-footer-height) 0;
  display: flex;
  flex-direction: column;
}
```

The shell element (`.app-shell-root` — a `<main>` or `<div>` inside `<body>`) owns the space between fixed header and fixed footer via `inset`. No `100vh` math, no padding coupling. Internal regions inside the shell flex-grow and own their own scroll via `overflow: auto` on the scrolling child.

### Mobile URL-bar collapse

The `inset`-based shell naturally follows the visual viewport (the browser resizes the fixed element when the URL bar hides/shows). No `dvh` hack needed.

If an app legitimately needs to compute a height manually (e.g. a vertically centered auth card inside a shell), prefer `100dvh` over `100vh` — `dvh` accounts for mobile URL-bar collapse while `vh` freezes at the initial viewport. But reach for `dvh` only after confirming the `inset` pattern doesn't already solve it.

### Classification examples

| App / page | Mode |
|---|---|
| simplechat `index.php` | shell |
| wlmonitor `index.php` (live monitor) | shell |
| wlmonitor `preferences.php` / `admin.php` / `help.php` | scrolling |
| zeiterfassung `ampel.php`, `easy.php` | shell |
| zeiterfassung `index.php`, `admin.php`, `preferences.php` | scrolling |
| Energie dashboard with internal-scroll charts | shell |
| suche start page | scrolling |

## 13. Fixed footer structure (mandatory layout)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Impressum]           © YYYY Erik R. Huemer           Major.Minor.Build STAGE   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- Footer is `position: fixed` at the bottom, full width, above content. Use the shared `.app-footer` class from `layout.css`.
- The shared `.app-footer` uses `display: flex; justify-content: center`, which must be overridden in each app's `app.css` with `display: grid; grid-template-columns: 1fr auto 1fr` for true three-column centering.
- **Left:** Impressum link (required — legal obligation).
- **Center:** Copyright notice (e.g. `© 2026 Erik R. Huemer`).
- **Right:** Version string `Major.Minor.Build STAGE` — **must be rendered dynamically** from constants, never hardcoded into markup. Every page in every app (including the Impressum page itself) is **mandatory PHP** so the footer can read `APP_VERSION`, `APP_BUILD`, and `APP_ENV` from `inc/initialize.php` and render via `\Erikr\Chrome\Footer::render()`. Static `.html` pages that ship their own footer markup are forbidden — convert them to `.php` and include the shared header/footer.
- **Version format:** `Major.Minor.Build STAGE` — e.g. `3.0.27 PROD` or `1.2.4 DEV`.
  - **Major / Minor** — semantic version, bumped for releases.
  - **Build** — integer, incremented on every **major update** to the app. It is **not** a date and is **not** auto-incremented per session. Bump it manually when cutting a meaningful release.
  - **STAGE** — exactly two values: `DEV` (local development / staging) or `PROD` (live deployment). Derived from `APP_ENV` (`local`, `akadbrain`, `world4you`, …) by the app's config generator: anything that isn't the live production target maps to `DEV`; the live target maps to `PROD`. Uppercase in the footer.
- Body content must have `padding-bottom: var(--app-footer-height)` (in addition to the `padding-top` for the header; see §12a for the custom-property source and for the shell opt-out).
- On mobile, the three elements stay on one line if they fit; otherwise collapse to stacked rows in order (Impressum → Copyright → Version).


## 14. Impressum link

Every app has its own `impressum.php` (PHP, not `.html` — see §13 on dynamic footers) in its web root. The Impressum link in the footer points to that local file — never an external URL.

Its content is:

```
Impressum

Erik R. Accart-Huemer
Böckhgasse 9/6/74
1120 Wien, Österreich

E-Mail: contact@eriks.cloud

Angaben gemäß § 5 ECG
```

## 15. Admin screen structure & interaction pattern (mandatory)

Every app's admin screen (`web/admin.php`, linked from the User Menu's "Admin" entry, visible only to users with admin rights) is a **three-tab layout**:

1. **App parameters** — app-specific settings (tariff config, API credentials, cron toggles, import paths, etc.). Content varies per app.
2. **User administration** — a single-table listing of all accounts in `auth_accounts`, with per-row actions:
   - **Edit** — open the user's profile for editing (username, email, display name, rights)
   - **Deactivate / Reactivate** — toggle the `active` flag; deactivated users cannot log in but are not deleted
   - **Delete** — permanent removal (with a confirmation prompt; destructive action, CSRF-protected POST)
   - **Reset password** — force a password reset (either send reset email or set a temporary password)
   - **Revoke 2FA** — clear the user's TOTP secret so they can re-enroll from scratch
3. **Log** — read-only view of the shared `auth_log` table (the same table every `erikr/auth`-using app writes to via `appendLog()`). Required columns in the listing:
   - **Zeit** (`logTime`) — timestamp of the entry
   - **App** (`origin`) — which app wrote the entry; lets an operator view one app's activity from another app's admin screen when they share an auth DB
   - **Kontext** (`context`) — short category (e.g. `login`, `prefs`, `import`, `admin`)
   - **Benutzer** (`username`) — account that triggered the entry, or `—` for anonymous
   - **IP** — remote address recorded at the time
   - **Aktivität** (`activity`) — the free-text message

   Required filter controls above the table (all optional, combinable):
   - **App** — dropdown populated from distinct `origin` values
   - **Kontext** — dropdown populated from distinct `context` values
   - **Benutzer** — free-text username match
   - **Von / Bis** — date range (`YYYY-MM-DD`)
   - **Suche in Aktivität** — free-text search in the activity column
   - **nur Fehler** — checkbox to show only failure entries

   The log tab uses the shared `.table` component, paginates (default 50 rows/page) via the shared `.pagination` component, and is read-only — no write actions, no delete.

### 15.1 Interaction model — AJAX, not form POSTs

All admin mutations (create / edit / delete / password reset / 2FA revoke / disable / app-specific actions) go through **`api.php?action=admin_<verb>`**, POST + CSRF, returning JSON `{ok: bool, error?: string, …}`.

- **No inline edit forms** on `admin.php`. The page renders once; CRUD happens via JS.
- **No full page reloads** after a successful action. On success, update the DOM (or `location.reload()` only if the table is complex). On failure, show an alert and leave the modal open.
- **Log tab filters and pagination** also go through AJAX (`api.php?action=admin_log_list` returning `{ok, rows, total, apps, contexts}`). No `?log_page=` query-param reloads.
- **Rationale:** consistent feedback via toast alerts, no double-submits, no flash-of-stale-state, and the `admin.php` file stays a thin render layer.

### 15.2 Create / edit via modals

- **Create** and **Edit** are always `.modal` dialogs, never inline forms or separate pages.
- Trigger attributes: `data-modal-open="editModal"` on the button. Close via `data-modal-close`, backdrop click, or Escape.
- Modal markup uses shared `.modal` / `.modal-dialog` / `.modal-content` / `.modal-header` / `.modal-body` / `.modal-footer` classes from `~/Git/css/components.css`.
- Edit buttons pre-populate the modal via `data-*` attributes read in the click handler — no per-row URLs.

### 15.3 Card layout with split header

- Each tab panel is structured as one or more `.card` blocks.
- Cards that have a primary action (e.g. "Benutzer anlegen") use `.card-header-split`: title left, action button right.
- Tables live inside `.card-body`, wrapped in `.table-responsive`, using `.table.table-sm.table-hover`.

### 15.4 Client-side tab switching via URL hash

- Tabs use shared `.tab-bar` + `.tab-btn` + `.tab-panel` components.
- Active tab is stored in `location.hash` (`#users`, `#log`, `#colors`, …) so any remaining reload path remembers which panel to show.
- Tab buttons carry `role="tab"`, `aria-controls`, `aria-selected`; panels carry `role="tabpanel"`, `aria-labelledby`, and `hidden` on inactive panels.

### 15.5 Shared JS helpers (mandatory)

Every admin page loads `~/Git/css/js/admin.js` (via the same symlinked `shared/` directory used for CSS). It exposes:

```js
adminPost(action, params)   // POST form-data to api.php?action=…, returns parsed JSON
showAlert(msg, type)        // inject a .alert into #adminAlerts, auto-dismiss after 5s
openModal(id) / closeModal(id)
activateTab(name)           // hash-synced tab switcher, wires [data-tab] buttons automatically
```

The page's own inline `<script nonce>` wires the specific handlers (`.btn-edit` → open modal, `createForm` submit → `adminPost('admin_user_create', …)`, etc.) using these helpers. Do not re-implement these primitives per app.

### 15.6 Invariants (apply to every tab)

- Tab switching is **client-side only** — no page reload, no `?tab=` query param.
- All write actions are **POST + CSRF** — never GET links, never `<a href>` for destructive operations.
- Admin rights check: `admin_require()` (from `erikr/auth`) at the top of `admin.php`. Non-admins get redirected to the dashboard, not shown a 403.
- Apps that don't need app-specific parameters may show only the user administration and log tabs, but the three-tab shell stays (the first tab can display a placeholder or be hidden).
- The log tab is **mandatory** for every app — even apps without user-facing state need an audit trail of logins, admin actions, and errors.

### 15.7 Reference implementation

- **Canonical users-tab pattern:** `wlmonitor/web/admin.php` (modals, AJAX, card-header-split).
- **Canonical log-tab data shape:** Energie `inc/admin_log.php` (`admin_log_list()`, `admin_log_distinct_apps()`, `admin_log_distinct_contexts()`) — convert to AJAX per 15.1.

## 16. Main content width is page-type driven (mandatory)

Width caps belong on inner wrappers keyed to page type, not on `<main>` itself.

- `<main>` is full-width with horizontal padding (e.g. `padding: 1.5rem 2rem`). No global `max-width`, no `margin: 0 auto` on the element itself.
- Each page declares the width it wants via an inner wrapper with a dedicated class:
  - Dashboard / charts / admin tables → no inner cap; let the content span the viewport (use `.admin-section` or equivalent).
  - Settings forms / preferences → narrow reading cap (~520px) via e.g. `.pref-section`.
  - Long-form text / help → medium reading cap (~720px) via a `.page-reading` wrapper.
- **Why:** on 14"+ laptops and external monitors, a single global `max-width: 1100px` on `main` leaves hundreds of dead pixels on each side of legitimately wide content (dashboards, tables). Letting page-types declare their own width matches content to viewport appropriately.
- Anti-pattern: stacking a body-class override (`body.admin-page main { max-width: none }`) on top of a global cap. If you're reaching for that, the global cap is wrong — delete it and let the page wrapper own the width.
- Pages that want a genuine reading-width ceiling at huge viewports may apply it *inside* the inner wrapper (e.g. a 1600px ceiling on a chart grid), not on `<main>`.

## 17. HTTP error pages (mandatory)

Every app ships branded HTTP error pages. The server-default pages (Apache/Nginx stock white-on-grey) are unacceptable in production.

### 17.1 Required pages

Each app's `web/error/` directory contains at minimum:

```
400.html  401.html  403.html  404.html
500.html  502.html  503.html  504.html
```

Apps that terminate their own TLS or sit behind CDNs with additional error codes may add them (`501.html`, `520.html`, `521.html`, …), but never drop from the required eight.

### 17.2 Self-contained HTML (mandatory)

Error pages must render **without PHP, without the database, without external CSS, and without external JS**. A 500 triggered because `inc/initialize.php` crashed still has to show a branded page. This means:

- Inline `<style>` block in the page `<head>` — no `<link rel="stylesheet" href="…">`.
- Inline `<svg>` for the logo — no `<img src="…">`.
- `@font-face` declarations inline, loading Atkinson Hyperlegible from `/fonts/` (the one external dependency that's acceptable because the shared font directory is static).
- No `<script>` tags.
- No `var(--…)` references to `theme.css` — use literal color values (`#e2001a` brand red, `#111118` dark surface, `#e2e8f0` text). The inline style must survive even when `theme.css` 404s.

### 17.3 Layout & content

```
┌─────────────────────────────────────────┐
│                                         │
│              [Jardyx logo]              │
│                                         │
│                 404                     │  ← brand-red, display-size
│             Not Found                   │  ← uppercase small subtitle
│           Hier ist nichts.              │  ← human title, German
│                                         │
│   Die Seite, die du suchst, …           │  ← one sentence, light sarcasm
│                                         │
│       [← zurück zur Startseite]         │  ← single button, links to "/"
│                                         │
├─────────────────────────────────────────┤
│              [Impressum]                │  ← footer with legal link only
└─────────────────────────────────────────┘
```

- **Dark palette only.** Error pages are always dark — no light/auto mode. Simpler to author, uniformly readable, and signals "exceptional state" vs. normal app chrome.
- **German primary copy** to match the rest of the UI. One-sentence explanation per code, written with a light human touch ("Hier ist nichts.", "Das tut uns leid.", "Zu viele auf einmal."). Do not copy stock English templates.
- **Single back link** to `/` — no nav, no search, no "report this error" links.
- **Footer**: Impressum link only (pointing at the app's `impressum.php` per §14). No copyright, no version — the app may be broken when the page renders, so rendering `APP_BUILD` is unreliable.
- Brand red `#e2001a` for the HTTP code, focus outline, and accent. Everything else greyscale on dark.
- `<meta name="robots" content="noindex">` on every error page — these must not be indexed.

### 17.4 Wiring

Error pages are served by the web server, not the app:

- **Apache:** `ErrorDocument 404 /error/404.html` (one line per code) lives in `web/.htaccess`.
- **Nginx:** `error_page 404 /error/404.html;` with `location = /error/404.html { internal; }` for each code. Each app ships a reusable snippet at `web/error/nginx.conf` — the akadbrain vhost `include`s it (e.g. `include /Library/WebServer/Documents/chat/web/error/nginx.conf;`).

Both environments (local dev and production) get the directives so behavior matches. When an app lives under a subdirectory (e.g. simplechat at `/chat`), the `.htaccess` paths must be absolute from the server root (`/chat/error/404.html`) — the nginx snippet uses root-relative `/error/...` because each app has its own vhost root on akadbrain.

### 17.5 Canonical reference

**`wlmonitor/web/error/`** is the reference implementation. When building a new app's error pages, copy the wlmonitor set and edit:

- `<title>` — include the app name (`"404 — Not Found · wlmonitor"` style)
- the sassy sentence, if a better app-specific line fits
- `<a href="/">` — leave as `/` (root of the app on its own subdomain/prefix)

Do not diverge on layout, palette, or footer structure. Updates to the pattern go to `wlmonitor/web/error/` first, then propagate by copy.

### 17.6 What NOT to do

- Don't pull in `AndiDittrich/HttpErrorPages` or any other third-party template — the copy is English, the palette clashes with the CI, and the `mailto:webmaster@…` link is off-brand.
- Don't serve dynamic PHP error pages (`error.php?code=404`). They break when PHP itself is the cause.
- Don't rely on the shared CSS library. A 500 caused by a PHP fatal before `<head>` is emitted cannot reach `theme.css`.
- Don't embed an app footer / app header. Error pages are standalone, no chrome.

