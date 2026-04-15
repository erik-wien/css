# Shared CSS Library

Portable CSS foundation shared by all PHP web projects under `~/Git`. Provides design tokens, resets, layout utilities, and UI components — no build step, no framework, vanilla CSS only.

## Files

| Path | Purpose |
|------|---------|
| `theme.css` | CSS custom properties only — no rules. Light/dark/auto theme tokens. Toggle via `data-theme="dark"\|"light"` on `<html>`. |
| `reset.css` | Universal box-sizing, body defaults, element resets. Requires `theme.css` loaded first. |
| `layout.css` | Containers, 12-column grid, spacing/display/text utilities, fixed app-header/footer, navbar, user dropdown, responsive breakpoints. |
| `components.css` | Bootstrap-shaped UI components: buttons (all variants + outlines), forms, alerts, cards, modals, dropdowns, badges, tables, pagination, spinners, login card. |
| `fonts/` | Atkinson Hyperlegible woff2 files. Consumers symlink or copy into `web/fonts/` and declare `@font-face` locally. |
| `icons/` | Central brand assets: `jardyx.svg` and full favicon set. Symlinked into consumer projects alongside `shared/`. |

## Design tokens

### Raw Jardyx palette (reference only — use semantic tokens in components)

```
--jardyx-red, --jardyx-blue, --jardyx-green, --jardyx-yellow
--jardyx-purple, --jardyx-orange, --jardyx-darkgrey, --jardyx-lightgrey
```

### Semantic color tokens

```
--color-bg, --color-surface, --color-surface-alt, --color-card
--color-text, --color-muted, --color-border
--color-primary,   --color-primary-hover
--color-secondary, --color-secondary-hover, --color-secondary-alt
--color-danger,    --color-danger-hover
--color-success,   --color-success-hover, --color-success-alt
--color-warning,   --color-warning-hover
--color-info,      --color-info-hover
--color-dark,      --color-dark-hover
--color-nav-bg, --color-nav-text
--color-accent  (aliases --color-primary by default)
```

### Non-color tokens

```
--font-sans, --font-mono
--radius, --radius-sm
--shadow-sm, --shadow
```

Consumer projects may add their own tokens (e.g. `--color-green`) in a `project-theme.css` that loads after the shared `theme.css`.

## Load order (mandatory in consumers)

```html
<link rel="stylesheet" href="shared/theme.css">
<link rel="stylesheet" href="shared/reset.css">
<link rel="stylesheet" href="shared/layout.css">
<link rel="stylesheet" href="shared/components.css">
<link rel="stylesheet" href="project-theme.css">   <!-- project palette overrides -->
<link rel="stylesheet" href="app.css">             <!-- project-specific styles -->
```

## Integration

Each consumer project symlinks this directory into its web tree:

```
wlmonitor/web/css/shared  -> ~/Git/css
Energie/web/styles/shared -> ~/Git/css
simplechat-2.1/web/css/shared -> ~/Git/css
```

The `icons/` and `fonts/` directories are symlinked separately alongside `shared/`:

```
wlmonitor/web/css/icons -> ~/Git/css/icons
wlmonitor/web/fonts/    -> ~/Git/css/fonts
```

## Deployment

All consumer projects deploy with `rsync --copy-links`, which resolves symlinks into real files at the destination. Do not introduce files that depend on directory structure above `~/Git/css`.

## Theming mechanism

`theme.css` defines three blocks that must stay in sync (same variable set in all three):

```css
:root { /* light default */ }

[data-theme="dark"] { /* explicit dark override */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* OS-level auto dark */ }
}
```

Consumer projects override the palette in their own `project-theme.css` using the same three-block pattern. The `--color-primary` CI red (`#e2001a` light / `#ff3347` dark) is the default; projects may override it in `project-theme.css`.

## Fixed chrome (mandatory layout pattern)

Both the header and footer are `position: fixed`. Every consumer must compensate in `app.css`:

```css
body {
  padding-top: 56px;    /* rendered .app-header height */
  padding-bottom: 32px; /* rendered .app-footer height */
}
```

**Header** — use `.app-header > .header-left + .header-right`. Left cluster: `.brand` + `.header-logo` + `.header-appname` + optional search/select. Right cluster: `.header-nav` + `.user-menu` (user button → `.user-dropdown`).

**Footer** — use `.app-footer` with a per-app grid override: `display: grid; grid-template-columns: 1fr auto 1fr`. Columns: Impressum link | copyright | version string.

See `~/.claude/rules/ui-design-rules.md` §12–§14 for full markup requirements.
