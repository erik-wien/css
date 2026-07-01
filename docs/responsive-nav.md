# Responsive nav pattern

This library intentionally diverges from the classic "hamburger toggles a stacked navbar" pattern (e.g. [W3Schools' responsive navbar dropdown](https://www.w3schools.com/howto/howto_js_responsive_navbar_dropdown.asp)). If you reach for that pattern to "fix" the mobile nav, read this first — the divergence is deliberate.

## What we do

- **Desktop (≥768 px):** horizontal `.header-nav` in the top bar with optional `.header-dropdown` panels on hover/click.
- **Mobile (≤767 px):** `.header-nav` is hidden. The avatar button (`.user-btn`) becomes the single affordance — its chevron is replaced with a CSS-drawn ☰ glyph (`layout.css`, `@media (max-width: 767px)`). Tapping it opens the existing `.user-dropdown`, which contains:
  1. Nav items (mirrored from `appMenu`, rendered server-side into `.dropdown-nav-section`)
  2. Account items (preferences, security, admin, theme row, help, logout)

Nav items with nested children become drill-down triggers on mobile: the top panel is `.dd-main`, the sub-panel is `.dd-sub`, and a small JS toggle swaps `.dd-collapsed` / `.dd-open` classes.

## Why not the W3Schools pattern

The W3Schools example wires a separate `<a class="icon">☰</a>` that toggles a `.responsive` class on the navbar, stacking the items below. Applied to our chrome that would produce **two independent dropdowns** on mobile — nav on the left, account on the right — each with its own open/close state, its own a11y wiring, and its own visual weight.

One unified dropdown wins on:

- **UX** — one place to look, one gesture to dismiss.
- **A11y** — one `aria-expanded`, one focus trap, one Esc handler.
- **Code** — `Chrome\Header::render()` emits the nav items twice (once in `.header-nav` for desktop, once in `.dropdown-nav-section` for mobile); CSS hides the wrong one per breakpoint. No imperative "toggle class on hamburger click" beyond what the user-dropdown already does.

The cost is the server-side dual-render — a handful of duplicated `<a>` tags. That's cheap, and it keeps the JavaScript surface to a single dropdown toggle.

## When the W3Schools pattern would be right

- If an app grows a nav that genuinely doesn't belong in the account dropdown (deep product taxonomy, 20+ items, category headers, search inside the nav).
- At that point the app has outgrown the shared chrome and should either propose an extension to `Chrome\Header` or ship its own layout.

Until then, keep the dual-render pattern. Do not reintroduce a standalone hamburger.

## Relevant code

- `css_library/layout.css` — `.header-nav`, `.header-dropdown*`, `.user-dropdown`, `.dropdown-nav-section`, `.dd-main` / `.dd-sub`, and the `@media (max-width: 767px)` hamburger block.
- `chrome/src/Header.php` — the server-side dual-render.
- `ui-design-rules.md` §12 — the fixed-header contract that this implementation satisfies.
