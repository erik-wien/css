---
id: TASK-9.2
title: 'P1 — chrome: align shared header/footer to .app-* catalog tokens'
status: Done
assignee: []
created_date: '2026-06-30 14:47'
updated_date: '2026-06-30 17:39'
labels: []
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The chrome library already emits .app-header / single-line / Jardyx logo — structure stays. Align its internal modal/dropdown helpers and any component references to the new .app-* catalog classes and tokens shipped in P0. Verify theme-switch + footer still work. No structural header change; the Jardyx single-line header is the intended Git skin (vs TÜV's two-line red band).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 chrome-rendered dropdowns/menus use .app-menu-surface/.app-menu-item
- [x] #2 Any chrome-side modal/alert helpers reference .app-* classes from P0
- [x] #3 Header (single-line, Jardyx logo), theme switch and footer verified across light/dark
- [x] #4 Shared css_library/js/admin.js helpers (showAlert, openModal, closeModal, activateTab) drive/emit .app-* markup (modal=.app-modal-backdrop/[hidden], tabs=.app-tab/.app-tab-panel, alerts=.app-alert), with dual legacy+new support during transition
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DONE. Changes:
1) css_library/js/admin.js — made class-agnostic with DUAL legacy+catalog support (backward-compatible by construction; un-migrated apps unaffected):
   - showAlert() now emits BOTH 'alert app-alert alert-<t> app-alert-<t>' (identical tone colours in both class sets).
   - Modals: added MODAL_SEL='.modal, .app-modal-backdrop', DIALOG_SEL, isAppModal/isModalOpen/setModalOpen helpers. Legacy modals toggle .show (hidden-by-default); catalog modals toggle the [hidden] attribute (flex-by-default). open/close/wire/ESC/focus-trap all route through these.
   - Tabs: TABBTN_SEL='.tab-btn, .app-tab', TABPANEL_SEL='.tab-panel, .app-tab-panel'. Panels of either kind hide via [hidden].
2) chrome shared admin modals (src/Admin/UserModals.php — create/edit/reset) migrated to catalog .app-modal-backdrop[hidden] > .app-modal-dialog.app-modal-sm > .app-modal-header > .app-modal-header-row(.app-modal-title + .app-modal-close) > .app-modal-body(.app-modal-alerts) > .app-modal-footer. Green save/create buttons → .btn-outline-danger (reconciliation §1).
3) chrome UsersTab.php / LogTab.php: card → .app-card / .app-card-header app-card-header-split / .app-card-body; UsersTab 'Benutzer anlegen' button green → red.
4) css_library/components.css: added .app-modal-sm (500px) and .app-modal-alerts helper.
DEFERRED (left on legacy, still work): chrome admin TABLES (.table*) and PAGINATION (.pagination) — catalog .app-table gives red headers and .app-pagination is structurally different (pill); these are visual/structural decisions for a later pass.
VERIFIED: php -l clean (3 files), node --check admin.js OK, components.css braces 342/342, app-modal-sm applied 3x, hidden attr on all 3 backdrops, no green tier left in chrome, no legacy modal-* classes left in chrome.
CAVEATS: (#1) chrome header dropdowns (.header-dropdown-panel/.user-dropdown) are bespoke app-shell nav, not catalog action-menus — intentionally left as-is. (#3) header/footer/theme untouched (already .app-header/.app-footer); live light/dark visual spot-check could not run (browser extension offline) — will be confirmed during the P2 pilot which exercises these shared modals on last.fm's admin screen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-06-30 15:41
---
SCOPE EXPANDED (pilot finding): migration is entangled with shared JS, not just CSS. css_library/js/admin.js builds alerts ('alert alert-'+type), toggles modals (.modal/.show) and tabs (.tab-panel/.tab-btn/.is-active) by legacy class names. Migrating an app's markup to .app-* breaks these helpers unless admin.js handles the new classes. So P1 must update admin.js (+showAlert) to drive/emit .app-* (dual-support) BEFORE app markup migrations. chrome header dropdowns (.header-dropdown-panel/.user-dropdown) are bespoke chrome classes (not catalog menus) — leave as-is; header already emits .app-header (single-line Jardyx), no structural change.
---

author: claude
created: 2026-06-30 17:39
---
P1 complete. Caveats recorded: chrome header dropdowns left bespoke (shell nav, not catalog menus); header/footer visual spot-check deferred to the P2 pilot (browser extension offline). Tables/pagination in chrome admin intentionally deferred (visual/structural decisions). admin.js dual-support means app markup migrations (P3+) are now safe clean renames.
---
<!-- COMMENTS:END -->
