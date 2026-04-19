---
id: TASK-5
title: Palette tier + correlation layer + btn-color-* family; drop §9 brand-red rule
status: Done
assignee: []
created_date: '2026-04-18 11:54'
updated_date: '2026-04-18 16:43'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce an explicit **palette layer** in the shared CSS library to separate concrete colour values from semantic UI roles, and add a user-facing `btn-color-*` button family that binds directly to the palette. This enables apps (wlmonitor favourites, suche) to let users pick actual colours — red, blue, green, etc. — rather than meaningless semantic classes like `danger` or `primary`.

The refactor is **additive and low-risk**: existing semantic classes (`.btn-primary`, `.btn-danger`, `.alert-warning`, etc.) keep their names and rules. Only their upstream source tokens are reworded through a palette indirection. The one visible regression is `.btn-primary` flipping from Jardyx red to grey — which is the intended outcome (see §9 rule drop below).

## Three layers

**Layer 1 — palette (new, in `theme.css`)**

Named concrete colours, each with a light + dark variant. Developers edit hex values here and only here. Dark-mode three-block pattern (`:root` + `[data-theme="dark"]` + `prefers-color-scheme: dark`) still applies — each block defines the full palette.

```
--palette-red-light, --palette-red-dark
--palette-blue-light, --palette-blue-dark
--palette-green-light, --palette-green-dark
--palette-yellow-light, --palette-yellow-dark
--palette-orange-light, --palette-orange-dark
--palette-purple-light, --palette-purple-dark
--palette-turquoise-light, --palette-turquoise-dark
--palette-grey-light, --palette-grey-dark
--palette-neutral  /* transparent / fall-through to body text */
```

Concrete values (light mode; dark-mode block must mirror with analogous overrides):

| Palette var | Hex | Source |
|---|---|---|
| `--palette-red-light` | `#e2001a` | existing `--jardyx-red` |
| `--palette-red-dark` | `#b8001a` | existing `--color-primary-hover` |
| `--palette-blue-light` | `#4E7FC5` | new, user-provided |
| `--palette-blue-dark` | `#275382` | existing `--jardyx-blue` |
| `--palette-green-light` | `#587b37` | existing `--jardyx-green` |
| `--palette-green-dark` | `#456028` | existing `--color-success-hover` |
| `--palette-yellow-light` | `#d6a733` | existing `--jardyx-yellow` |
| `--palette-yellow-dark` | `#b8901c` | existing `--color-warning-hover` |
| `--palette-orange-light` | `#e27708` | existing `--jardyx-orange` |
| `--palette-orange-dark` | `#C9762F` | new, user-provided |
| `--palette-purple-light` | `#B343CB` | new, user-provided |
| `--palette-purple-dark` | `#7B2484` | existing `--jardyx-purple` |
| `--palette-turquoise-light` | `#17B8C5` | new, user-provided |
| `--palette-turquoise-dark` | `#009193` | new, user-provided |
| `--palette-grey-light` | `#e0e0e0` | existing `--jardyx-lightgrey` |
| `--palette-grey-dark` | `#606060` | existing `--jardyx-darkgrey` |
| `--palette-neutral` | `transparent` | renders body-text on `components.css` button base |

The existing `--jardyx-*` tokens at `theme.css:9-16` can either be kept as aliases for back-compat or folded entirely into the palette names. Recommended: keep `--jardyx-red` as the canonical brand mark alias (`--jardyx-red: var(--palette-red-light)`) since `CLAUDE.md` documents `#e2001a` as the CI colour; drop the rest.

**Layer 2 — correlation (in `theme.css`, replaces the current inline `var(--jardyx-*)` refs)**

The single file a dev edits to change which palette colour a semantic role uses. Existing semantic token names are unchanged.

```
--color-primary:       var(--palette-grey-dark);     /* was --jardyx-red */
--color-primary-hover: var(--palette-grey-light);    /* was #b8001a */
--color-secondary:     var(--palette-grey-dark);
--color-secondary-hover: var(--palette-grey-light);
--color-success:       var(--palette-green-bright);
--color-success-hover: var(--palette-green-dark);
--color-warning:       var(--palette-yellow-bright);
--color-warning-hover: var(--palette-yellow-dark);
--color-danger:        var(--palette-red-bright);
--color-danger-hover:  var(--palette-red-dark);
--color-info:          var(--palette-blue-bright);
--color-info-hover:    var(--palette-blue-dark);
--color-accent:        var(--palette-red-bright);  /* brand mark (logos, headline) keeps red */
```

Rationale for `.btn-primary` = grey: UI design rule §9 previously reserved Jardyx red for `.btn-primary`, which collided with `.btn-danger` (also red) and made the two visually indistinct. Grey is distinct from every other semantic colour and reads as "neutral default action". Brand red remains accessible via `--palette-red-bright` or the new `.btn-color-red` class when explicitly desired for brand surfaces.

**Layer 3 — palette button family (new, in `components.css`)**

Parallel to the existing semantic family; one solid + one outline rule per palette colour:

```
.btn-color-red          { background: var(--palette-red-bright); color:#fff;
                          border:1px solid var(--palette-red-dark); }
.btn-color-red:hover    { background: var(--palette-red-dark); }
.btn-outline-color-red  { background: transparent; color: var(--palette-red-dark);
                          border:1px solid var(--palette-red-bright); }
.btn-outline-color-red:hover { background: var(--palette-red-bright); color:#fff; }
```

Generate for: red, blue, green, yellow, orange, purple, turquoise, grey-light, grey-dark, neutral. (Neutral keeps the bare-`.btn` look — transparent background, body-text foreground, muted border.) These classes never appear in shared semantic components (alerts, form validation, admin toolbars). They exist only for user-pickable accents.

## Files expected to change

- `~/Git/css_library/theme.css` — Layer 1 + Layer 2
- `~/Git/css_library/components.css` — Layer 3
- `~/Git/css_library/docs/design-rules.md` — document the two-layer model
- `~/.claude/rules/ui-design-rules.md` — §9 rewrite (drop brand-red-as-primary rule; document palette tier)

## §9 rule change

Current §9 reserves brand red for `.btn-primary`. Drop that restriction. New wording:

> `.btn-primary` is the default action accent — currently bound to palette grey. It reads as "neutral default action" and is distinct from `.btn-danger` (red) and `.btn-success` (green). Brand red lives in the palette as `--palette-red-bright` and is available as `.btn-color-red` / `.btn-outline-color-red` for explicit brand surfaces (logos, landing hero, admin dashboards that want a Jardyx accent). Never use palette colours to convey UI semantics — use the semantic classes (`.btn-primary`, `.btn-danger`, `.btn-success`) for that. Palette classes exist only for user-picked accents (favourites, personal preferences).

## Visual regression audit

After deploy, expect `.btn-primary` to render grey across every app. Every other semantic class keeps its current colour (green, yellow, red, blue) because the palette mapping matches what it previously resolved to. Quick per-app smoke test: login submit, password-reset submit, any "Speichern"/"Bestätigen" primary action.

## Out of scope

- Adding a palette picker UI anywhere (separate tasks in wlmonitor and suche).
- DB-driven palette editing (explicitly rejected — palette stays hardcoded).
- Renaming any semantic classes.
- Migrating `wl_favorites` data (that's wlmonitor's follow-up task).

## Downstream tasks blocked on this

- `wlmonitor/TASK-4` (rewritten) — data migration from `btn-outline-primary` etc. to `btn-outline-color-*`, removal of Farben admin tab, `inc/colors.php` shrinkage.
- `suche/` (not yet filed) — user-facing palette picker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 theme.css gains --palette-{red,blue,green,yellow,orange,purple,turquoise}-{bright,dark} + --palette-grey-light + --palette-grey-dark + --palette-neutral tokens, with dark-mode block mirroring the light-mode set
- [ ] #2 Existing --color-* semantic tokens re-source from the palette via a correlation block, semantic class selectors unchanged
- [ ] #3 .btn-primary resolves to --palette-grey-dark; brand red reachable only via --palette-red-bright or .btn-color-red
- [ ] #4 components.css ships .btn-color-* and .btn-outline-color-* for every palette colour
- [ ] #5 Neutral palette class preserves the bare-.btn look (transparent background, body-text fg, muted border)
- [ ] #6 design-rules.md §9 rewritten to describe the palette vs. semantic split; brand-red-as-primary rule removed
- [ ] #7 ~/.claude/rules/ui-design-rules.md §9 updated in lockstep
- [ ] #8 All existing .btn-success / .btn-danger / .btn-warning / .btn-info / alert / badge variants render visually unchanged after the switch
- [ ] #9 .btn-primary across every existing app now renders grey instead of Jardyx red — smoke-tested on login, password-reset, admin confirm actions
- [ ] #10 Palette classes are not referenced anywhere in shared components (alerts, tables, admin); they exist solely for user-pickable accents
<!-- AC:END -->
