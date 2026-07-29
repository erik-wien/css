---
id: TASK-12
title: >-
  Geteilte Assets werden ohne Cache-Buster ausgeliefert — Aenderungen an
  css_library greifen bis zu 4 h nicht
status: To Do
assignee: []
created_date: '2026-07-29 10:19'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nebenbefund aus auth TASK-7 (2026-07-29).

BEFUND: Die Apps binden Dateien aus dem geteilten css/shared/ ueberwiegend OHNE ?v=-Parameter ein. Gemessen (Anzahl eindeutiger Referenzen auf css/shared/*.js|css in web/*.php):

  App             ohne ?v=   mit ?v=
  suche                  0         1
  biblio                 2         5
  Energie                6         1
  simplechat             7         0
  wlmonitor             10         2
  last.fm               11         0
  zeiterfassung         11         1

Ausgeliefert wird mit 'cache-control: max-age=14400' (4 h), nachgemessen an https://biblio.jardyx.com/css/shared/js/admin.js und https://wlmonitor.eriks.cloud/css/shared/js/admin.js. Danach revalidiert der Browser ueber ETag/Last-Modified und holt die neue Datei — es heilt sich also selbst, aber erst nach bis zu vier Stunden.

WARUM DAS ZAEHLT: Eine Aenderung an einer geteilten Datei wirkt bis zu 4 h nicht, obwohl der serverseitige Teil des Deploys sofort greift. Das erzeugt Mischzustaende aus neuem PHP und alter JS-Datei. Konkret bei auth TASK-7 aufgetreten: die App unterdrueckt seit dem Deploy die (falsche) Erfolgsmeldung, waehrend eine gecachte alte admin.js die Warnung noch nicht anzeigen kann — in diesem Fenster saehe ein Admin bei einem Mailfehler GAR KEINE Meldung. Harmloser als die vorherige Falschmeldung, aber unnoetig.

Der Mischzustand ist die eigentliche Gefahr, nicht die Verzoegerung: bei jeder kuenftigen Aenderung, die Server- und Client-Seite gemeinsam betrifft, ist fuer 4 h ein inkonsistenter Stand aktiv.

MOEGLICHE WEGE (nicht vorgegeben):
- Einheitlich ?v=APP_BUILD an alle shared-Referenzen. Problem: APP_BUILD ist in suche/simplechat/wlmonitor/last.fm/Energie eine handgepflegte Zahl — sie wird beim naechsten Mal wieder vergessen.
- Das biblio-Muster uebernehmen (APP_BUILD = juengste mtime aller ausgelieferten JS/CSS, base36). Es erfasst nach dem Deploy auch das geteilte Verzeichnis, weil rsync --copy-links dort echte Dateien anlegt und die mtime erhaelt — also genau der Fall, um den es hier geht. Lokal greift es fuer shared/ nicht, weil RecursiveDirectoryIterator symlinked Verzeichnisse per Default nicht betritt.
- Alternativ serverseitig: kuerzeres max-age fuer css/shared/ oder must-revalidate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eine Aenderung an einer Datei in css_library wirkt nach dem Deploy sofort, ohne dass ein Nutzer den Browser-Cache leeren muss
- [ ] #2 Der Mechanismus funktioniert ohne manuelles Hochzaehlen — eine vergessene Nummer darf nicht wieder zu altem Code beim Nutzer fuehren
- [ ] #3 In allen sieben Apps einheitlich; die gemessenen Zahlen oben sind auf 0 ohne ?v= (oder aequivalent geloest)
<!-- AC:END -->
