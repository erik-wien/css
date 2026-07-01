---
id: TASK-9.1
title: >-
  P0 — css_library: ship .app-* catalog classes as aliases + token/primitive
  parity
status: Done
assignee: []
created_date: '2026-06-30 14:46'
updated_date: '2026-06-30 20:17'
labels: []
dependencies: []
documentation:
  - /Users/erikr/TUEV/theme/docs/ui-framework/catalog.md
parent_task_id: TASK-9
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Foundation phase. NO app may break — css_library is symlinked into all apps simultaneously. Add the TÜV catalog .app-* component classes ALONGSIDE the existing legacy names (alias layer), so apps migrate markup one at a time. Map: .app-modal-backdrop/-dialog/-header/-body/-footer ~ .modal*; .app-menu-surface/.app-menu-item ~ .dropdown-menu/.dropdown-item; .app-alert/.app-alert-* ~ .alert/.alert-*; .app-tabs/.app-tab/.app-tab-panel ~ .tab-bar/.tab-btn/.tab-panel; .app-badge/.app-badge-* ~ .badge/.badge-*; .frame/.frame-accent (new). Make the modal header red-accented to match the catalog. Add token parity (--color-section/-card/-frame/-surface-alt, --status-* ampel, verify --color-on-accent). Add missing primitives: .app-spinner (consolidating .spinner-border), .app-kv, .app-help + tooltip, .status-*. Set --color-accent: #e2001a canonically. Stub the green/constructive tier (.btn-success/.btn-outline-success) as deprecated aliases mapping to neutral/danger so it is visually retired without breaking existing markup; full removal happens in the final cleanup phase. Reference: ~/TUEV/theme/docs/ui-framework/catalog.md and reconciliation.md §1 (no green) + §2 (dark-mode three-block).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .app-* catalog classes exist in components.css and render identically to their legacy counterparts
- [ ] #2 Existing app markup using legacy class names still renders unchanged (alias layer intact)
- [ ] #3 Missing primitives added: .app-spinner, .app-kv, .frame/.frame-accent, .app-help/tooltip, .status-*
- [ ] #4 --color-accent canonicalized to #e2001a; modal header uses the red accent
- [ ] #5 Green/constructive button tier visually retired (deprecated alias to neutral/danger), documented as pending removal
- [ ] #6 css_library designguide/demo page (if present) shows the new .app-* components
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped additively — zero app-side changes required (components.css + theme.css are loaded by all apps via the shared symlink).
theme.css: added catalog token aliases in :root (lazy var() so they track per-theme values): --color-section(=surface), --color-frame(=bg), --color-frame-border(=muted), --color-backdrop, --radius-md; plus theme-invariant --status-blue/green/orange/red.
components.css: appended the '.app-* COMPONENT CATALOG — Phase P0' block: .icon-btn; .app-modal-* (red accent header, sans title per Git skin, [hidden] guard); .app-menu-surface/.app-menu-item/-label/-count/-sep ([hidden] guard); .app-alert + tones (reuse legacy alert hex incl. dark blocks); .app-badge + tones + -outline (pill); .app-tabs/.app-tab/-count/-panel/.app-tabs-sub; .frame/.frame-accent/.app-card-title; .app-kv; .app-spinner(+sm/lg, reduced-motion); .app-help/.app-tooltip; .app-table(+variants); .app-pagination; .status-*.
Green button tier retired (reconciliation §1): .btn-success/.btn-outline-success remapped to the red data-changing tier (success STATUS tones in alerts/badges stay green). Removed fully in P8.
Legacy component classes left untouched. Verified: brace balance components.css 333/333, theme.css 4/4; no class-name collisions across all app CSS; no app references .app-* yet (expected — migration starts at P2).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-06-30 15:40
---
Card extension (decided with Erik during the pilot): added .app-card / .app-card-header / .app-card-header-split / .app-card-body / .app-card-footer / .app-card-heading to components.css as faithful rename targets for the legacy .card* family. .app-card-title stays the small uppercase section label; .app-card-heading is the prominent card title. Catalog doc updated (~/TUEV/theme/docs/ui-framework/catalog.md, Container section) — now binding for TÜV apps too.
---

author: claude
created: 2026-06-30 20:17
---
Spacing-Fix (aus P2-Browsertest): .app-tabs hatte keinen margin-bottom → migrierte Tab-Seiten (last.fm admin/track) hatten die Karte bündig auf der Tableisten-Unterlinie. Ergänzt: .app-tabs { margin-bottom: var(--space-4) } und .app-tabs.app-tabs-sub { margin-bottom: var(--space-3) }. Visuell bestätigt auf lastfm.test/admin.php.
---
<!-- COMMENTS:END -->
