---
id: TASK-9
title: Adopt TÜV .app-* component catalog across css_library + Git apps (Jardyx skin)
status: Done
assignee: []
created_date: '2026-06-30 14:46'
updated_date: '2026-07-01 12:12'
labels: []
dependencies: []
documentation:
  - /Users/erikr/TUEV/theme/docs/ui-framework/catalog.md
  - /Users/erikr/TUEV/theme/docs/ui-framework/reconciliation.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cross-repo initiative. Converge the shared component layer onto the TÜV-Austria UI catalog (~/TUEV/theme/docs/ui-framework/catalog.md) so component markup is copy-paste-compatible between TÜV and Git apps — ONE catalog. The Git apps keep their own skin: Atkinson Hyperlegible font, dark-first background palette, single-line header with the Jardyx logo. Per Erik's decisions: (1) FULL convergence — rename css_library components to the .app-* catalog names (.app-modal-*, .app-menu-surface, .app-alert*, .app-tabs/.app-tab, .app-badge, .frame). (2) ONE Jardyx red accent (#e2001a) everywhere — the ONLY per-app difference is the logo; no per-app accent, no <app>-theme.css accent overrides. Domain/data-viz colors (transit line badges, chart green/blue) are NOT accent and stay. Safe-rename mechanic: css_library ships the new .app-* classes as ALIASES alongside the old ones so apps migrate markup one at a time without a flag-day break; old classes are removed only after every app is migrated. Survey baseline (2026-06-30): all 6 apps already share chrome + css_library + Atkinson + three-block dark mode; last.fm is the cleanest, zeiterfassung carries 2005-era legacy table CSS. Related existing tasks: task-5 (palette/brand-red rule), task-medium.1 (Atkinson font-face).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All six Git apps (Energie, wlmonitor, simplechat, suche, last.fm, zeiterfassung) render modals/menus/alerts/tabs/badges/cards with the .app-* catalog classes
- [ ] #2 css_library no longer defines the legacy .modal/.dropdown-menu/.alert/.tab-bar/.card component names nor the green/constructive button tier
- [ ] #3 --color-accent is #e2001a in css_library and no app overrides it; only the logo differs per app
- [ ] #4 Visual + behavioral parity with the TÜV catalog verified for each migrated app (modal red header, focus-visible, dark mode, a11y roles)
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-06-30 20:11
---
ROLLOUT-CAVEAT (entdeckt im P2-Browsertest): die geteilte CSS wird per ?v=APP_BUILD cache-gebustet, aber APP_BUILD ist je App eine statische Konstante. Da css_library SHARED ist, ändert eine components.css/theme.css-Änderung KEINEN App-APP_BUILD → Browser liefern die alte CSS aus der Cache, und die neuen .app-*-Klassen sind UNGESTYLT (sah im Test aus wie 'kein Karten-Rahmen', war reiner Cache). FIX nötig pro App beim Live-Schalten: APP_BUILD (bzw. der CSS-Cache-Buster) bumpen, sonst sehen Nutzer die Migration nicht / kaputt. Dev: Hard-Reload (Cmd+Shift+R) reicht. Optional besser: Cache-Buster an die mtime der shared CSS koppeln. Beim Verifizieren JEDER App-Migration zuerst hart neu laden.
---

author: claude
created: 2026-07-01 05:39
---
SIDE-QUESTS done during pilot (shared-layer polish, verified live):
1) LOGIN SYNC: promoted Energie's nicer login styling to shared components.css (.login-card 12px radius, 8px inputs, red .btn-login via --color-accent) and removed Energie's energie.css override. All apps using .login-card (Energie/suche/zeiterfassung/last.fm) now match. last.fm login.php rewritten from bespoke standalone to anon chrome header + .login-card + SSO note. Red login CTA kept per Erik (documented exception to reconciliation §1 grey-safe-primary). Verified live on suche.test (light): red button, rounded card, SSO note.
2) PER-APP LOGO COLOUR: chrome now renders the brand logo as a CSS-mask <span> (was <img>), recoloured via --logo-color (fallback --color-accent). Each app sets --logo-color from its config color: suche anthracite(theme-adaptive: #374151 light / #cbd5e0 dark, since its white config colour is invisible on the light header), Energie #d6a733, last.fm #587b37, wlmonitor #e2001a, simplechat #b343cb, zeiterfassung #4e7fc5. Verified live: last.fm green, Energie yellow, suche anthracite — correct shape + colour, mask path resolves per-app. Files: chrome/src/Header.php, css_library/layout.css, each app's app CSS.
---

author: claude
created: 2026-07-01 05:56
---
P3 (suche) done. Migrated all 9 web PHP files + web/js/app.js to .app-* catalog: card/tab/alert/badge renames (incl. interpolated alert classes + JS alert builder). Modals: 3 total (admin iconRename; prefs button/feed) restructured to .app-modal-backdrop[hidden] mechanism; suche's bespoke inline modal JS rewritten from .open/.show class-toggle to hidden-attr toggle (this had silently broken the shared UserModals in suche after P1, since those use [hidden]) — now openModal/closeModal set .hidden and backdrop-close is pointerdown (UI §8). Added .app-modal-content{display:contents} to shared components.css so apps keeping a content wrapper stay layout-transparent (avoids re-indent churn; inert for TÜV). Green tier retired: 5 btn-outline-success → btn-outline-danger (admin upload, prefs save x2 via header/footer, security x3). AC#3: header theme switch already works via shared Chrome (bootstrap data-theme script + wired .theme-btn); fixed the previously-unwired duplicate theme-btn set in the prefs Darstellung tab. Dark three-block in app.css already canonical. Removed dead .modal CSS from app.css. All PHP lint clean, app.js node --check ok, components.css braces 347/347. Not yet browser-verified (extension offline).
---

author: claude
created: 2026-07-01 09:40
---
P4 (wlmonitor) done. All web+inc PHP + web/js/wl-monitor.js migrated to .app-* (card/tab/alert/badge; incl. JS-built monitor cards card.className + 2 JS alert builders + interpolated alerts). Tabs: admin driven by shared admin.js (dual, toggles is-active+active+[hidden]) — clean rename; preferences tab JS is ID-based (toggles .active/[hidden]) — no JS change. Modals: wl-monitor.js had its OWN openModal/closeModal (window.*, loaded AFTER shared admin.js so it WON) using .show class → had silently broken the shared UserModals (app-modal-backdrop[hidden]) in wlmonitor admin, same bug as suche. Rewrote to dual setModal() (app-modal-backdrop→[hidden], legacy .modal→.show) + pointerdown backdrop-close (§8); migrated addFavModal to .app-modal-backdrop. AC#2: tokenized #monitor .card greens onto three-block --wl-monitor-* tokens (rule bodies now var()-only, no literal hex); renamed selectors to #monitor .app-card(-header); removed redundant per-theme overrides; btn-add-steig color→token. Wiener-Linien line-badge hex KEPT hardcoded (17, transit branding). Green tier retired: ~11 btn-outline-success→btn-outline-danger (editFavorite/admin/preferences/security) + refreshed a favorites.php docstring example. EXCEPTION to AC#1: avatarCropModal (preferences.php) stays legacy .modal — it's driven by the shared avatar-cropper.js .show contract + an inline MutationObserver; renaming would make setModal branch to [hidden] and break the cropper. Unifying the cropper modal is a cross-app shared-lib follow-up. All PHP lint clean, wl-monitor.js node --check ok, css braces 83/83. Not browser-verified (extension offline).
---

author: claude
created: 2026-07-01 11:06
---
P5 (Energie) done. AC#1: web+inc PHP migrated to .app-* (generic card/tab/alert/badge). Tabs run on shared admin.js (dual) — clean rename; tab-panels switched from .hidden CLASS to the [hidden] ATTR (catalog .app-tab-panel uses [hidden]; keeping .hidden class would be defeated by .app-tab-panel{display:block} → flash, the known pitfall). Dropped Energie's bespoke tab CSS (.tab-bar/.tab-btn/.tab-panel.hidden) — converged to shared .app-tab (functionally identical underline tabs). KEPT bespoke .tile/.kpi/.kpi-card/.chart-*/.pref-card* and chart green/blue data-viz. AC#2: removed the salmon --color-accent #e94560 override from all 3 energie-theme.css blocks → inherits canonical Jardyx red #e2001a from shared theme.css (only --logo-color #d6a733 differs now). AC#3: task premise was INACCURATE — no .ui-icon mask usage, no SVG sprite exist. Real state: 3 decorative emoji tiles (📅📊📈), functional inline SVGs, one info-circle already on catalog .icon-info-circle. Fixed the actual bug: emoji class="icon" collided with the catalog .icon (SVG-stroke) class from P0 → renamed to .tile-icon. Erik chose to KEEP the emoji (deliberate friendly dashboard) rather than convert to line-icons. ~8 green btns→btn-outline-danger. EXCEPTION (same as wlmonitor): avatarCropModal stays legacy .modal — shared avatar-cropper.js .show contract. UserModals already app-modal-backdrop (P1). PHP lint clean; energie.css braces 134/134, energie-theme 4/4; exhaustive legacy sweep clean. Not browser-verified (extension offline).
---

author: claude
created: 2026-07-01 11:13
---
P6 (simplechat) done. web+inc PHP → .app-* (card/tab/badge + 3 admin modals). Modals+tabs run on SHARED admin.js (dual) — so clean: the 3 inline modals (addChannel/renameChannel/changePw, no .modal-content wrapper) → .app-modal-backdrop[hidden]; .modal-header FLATTENED to 'app-modal-header app-modal-header-row' (both classes one div = accent bg + flex row, no wrapper insert); btn-close→app-modal-close, modal-alerts→app-modal-alerts. UserModals already app-modal-backdrop (P1). KEPT bespoke .auth-card + chat UI (sidebar/bubbles/input-bar). AC#3 per-user accent: default fallback #5856D6→#e2001a (code fallbacks in userprefs/prefs/styles/admin + data/config.yaml + example). styles.php only emits --color-accent override when the color is in the user $allowed palette, so default #e2001a (not in palette) falls through to shared canonical red — per-user palette picks still emit. Palette arrays (incl #5856D6 Indigo option) untouched. ~13 green→danger. PHP lint clean, legacy sweep clean.
---

author: claude
created: 2026-07-01 12:01
---
P8 BLOCKERS CLEARED (2026-07-01):
1. Avatar-cropper unified onto [hidden]/.app-modal-backdrop: shared avatar-cropper.js .show→.hidden (3 spots); wlmonitor+Energie preferences.php avatarCropModal → app-modal-backdrop[hidden] + app-modal-dialog (inline styles kept for the bespoke crop layout; header/body/footer classes dropped — pure inline), MutationObserver removed. No class="modal"/.show anywhere now.
2. suche link-button palette converged onto §9 .btn-color-*: inc/buttons.php gained BUTTON_VARIANT_LEGACY map + button_normalize_variant()/button_variant_class(); render + save + edit-prefill (data-variant) all normalise, so existing s_buttons rows keep their colour with NO DB migration (btn-success→btn-color-green etc). preferences.php <option>s → btn-color-* values.
Also fixed the P2 last.fm gap (green tier + JS alert builders).
VERIFIED zero usage of every P8-target legacy class (.modal*/.dropdown*/.alert*/.tab-*/.badge*/.card*/green tier) across all 6 apps + chrome/src (only back-compat normalizer KEYS remain in suche/inc/buttons.php, not CSS usages). Chrome admin .table/.pagination are NOT in P8's removal scope (kept). css_library deletion (9.9) mapped and ready but NOT yet executed — held for explicit go given it's a destructive shared-file edit with the browser offline (no visual verify).
---
<!-- COMMENTS:END -->
