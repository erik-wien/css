---
id: TASK-1
title: 'Responsive: hide .header-appname on xs screens'
status: Done
assignee: []
created_date: '2026-04-18 09:09'
updated_date: '2026-04-18 16:46'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The app name next to the logo stays visible on xs (≤575px) and sm (≤767px) screens, crowding the header and pushing the user menu tight against the right edge. It should collapse on small viewports so only the logo + user cluster show.

**Where the bug lives**
- Single CSS rule: `css_library/layout.css:129` — `.header-appname { font-size: 1.1rem; font-weight: 600; color: var(--color-text); }` — no responsive behaviour.
- Emitted from: `chrome/src/Header.php:87` (shared), simplechat `inc/html.php` (topBar + standaloneTopBar) and `web/help/_header.php`, plus hand-rolled `<span class="header-appname">` in Energie and suche on login/reset/impressum/totp_verify/forgotPassword/setpassword pages.
- simplechat has an app-local override at `web/css/app.css:614` (`font-size: 15px`) — unrelated, can stay.

**Proposed fix**
Add to `css_library/layout.css` right after the `.header-appname` rule:
```css
@media (max-width: 575px) {
  .header-appname { display: none; }
}
```
One shared rule, propagates to every app on next deploy of css_library. Decision point: xs only (≤575px) vs sm-and-below (≤767px) — xs is safer (phones only); sm also hides on narrow tablets.

**Out of scope**
- simplechat's app-local font-size override at `web/css/app.css:614` — leave alone.
- Login/reset/impressum etc. pages in Energie/suche that hand-roll `<span class="header-appname">` — the shared CSS rule applies automatically via the class.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Single @media block added to css_library/layout.css hiding .header-appname below the agreed breakpoint
- [ ] #2 Verified in browser at xs widths across all apps (simplechat, wlmonitor, Energie, suche, zeiterfassung) — header name is hidden, logo + user menu remain
- [ ] #3 Verified on auth pages (login, password reset, impressum) in Energie and suche — appname also hidden there
- [ ] #4 No regression at sm/md/lg/xl breakpoints — name visible as before
<!-- AC:END -->
