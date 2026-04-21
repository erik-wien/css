---
id: TASK-MEDIUM.1
title: Ship @font-face for Atkinson Hyperlegible from shared layout.css
status: Done
assignee: []
created_date: '2026-04-21 05:44'
updated_date: '2026-04-21 06:33'
labels: []
dependencies: []
parent_task_id: TASK-MEDIUM
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit 2026-04-20: only simplechat actually serves Atkinson Hyperlegible (ui-rules §4). suche ships the woff2 files but never declares @font-face; wlmonitor/zeiterfassung/Energie ship nothing and fall through to system-ui. Root cause: css_library ships the font files in fonts/ but no @font-face declarations anywhere. Add @font-face blocks (Regular, Bold, Italic, BoldItalic, font-display: swap) to shared layout.css so every consumer picks them up automatically via the existing symlink. Decide font weight set: simplechat has 4, suche has 2 — align on 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 @font-face declarations added to css_library/layout.css
- [x] #2 Font URLs use relative paths that work across consumer symlinks
- [x] #3 All 4 weights (Regular, Italic, Bold, BoldItalic) included with font-display: swap
- [x] #4 Per-app @font-face in simplechat removed (now inherited from shared)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Copy the four woff2 weights (Regular, Italic, Bold, BoldItalic) already present in consumers into `css_library/fonts/` if not already there — verify filenames match simplechat's @font-face block (AtkinsonHyperlegible-{Regular,Italic,Bold,BoldItalic}.woff2).
2. Add four `@font-face` blocks at the top of `layout.css`, each with `font-display: swap`, `font-family: 'Atkinson Hyperlegible'`, appropriate `font-weight` (400/700) and `font-style` (normal/italic), and `src: url('fonts/AtkinsonHyperlegible-<variant>.woff2') format('woff2')`.
3. Path note: use relative `fonts/…` so it resolves under every consumer's `web/css/shared/` symlink (css_library is the symlink target, so the font file lives at `web/css/shared/fonts/<file>.woff2`).
4. Remove the per-app `@font-face` block from simplechat's CSS (whichever file declares it — check `web/css/app.css`).
5. Verify: hard-reload each of the 5 apps; DevTools Network tab should show `AtkinsonHyperlegible-Regular.woff2` loaded from the shared path; no 404 for the other 3 weights.
6. Fallback: keep `system-ui` in the `body { font-family: … }` rule in `reset.css` or similar so the swap target is the intended chain.
<!-- SECTION:PLAN:END -->
