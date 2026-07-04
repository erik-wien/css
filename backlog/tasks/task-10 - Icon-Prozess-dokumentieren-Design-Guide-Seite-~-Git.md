---
id: TASK-10
title: Icon-Prozess dokumentieren + Design-Guide-Seite (~/Git)
status: To Do
assignee: []
created_date: '2026-07-04 14:52'
labels: []
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konsolidierung großteils erledigt: stroke-.icon entfernt, kanonisch ist .ui-icon/.ui-icon-NAME (mask, currentColor); ui-icon-home/search/phone/mobile registriert. Rest: (1) Icon-Prozess in css_library/CLAUDE.md + ~/.claude/rules/ui-design-rules.md §11 dokumentieren (Nutzung <span class='ui-icon ui-icon-NAME'>, neue Icons als icon-NAME.svg + .ui-icon-NAME-Klasse zentral registrieren; Abgrenzung zu .icon-btn/.icon-info-circle). (2) Design-Guide-Seite analog ~/TUEV web/inc/_sg_icons.php (liest .ui-icon-*-Klassen aus components.css, rendert Grid) — gibt es in ~/Git noch nicht. (3) Verbliebene <img>-Icons anderer Apps (z.B. suche) bei Gelegenheit auf .ui-icon migrieren.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Icon-Prozess dokumentiert (CLAUDE.md + UI-Rules §11)
- [ ] #2 Design-Guide-Seite listet alle .ui-icon-* automatisch
- [ ] #3 Namenskonvention icon-NAME.svg + .ui-icon-NAME verbindlich notiert
<!-- AC:END -->
