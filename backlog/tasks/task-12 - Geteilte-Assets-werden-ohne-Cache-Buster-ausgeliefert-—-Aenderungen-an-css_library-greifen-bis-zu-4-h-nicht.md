---
id: TASK-12
title: >-
  Geteilte Assets werden ohne Cache-Buster ausgeliefert — Aenderungen an
  css_library greifen bis zu 4 h nicht
status: Done
assignee: []
created_date: '2026-07-29 10:19'
updated_date: '2026-07-30 04:57'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nebenbefund aus auth TASK-7 (2026-07-29), umgesetzt 2026-07-30.

KORREKTUR DES URSPRUENGLICHEN BEFUNDS: Die erste Fassung dieser Beschreibung
behauptete, fuenf Apps haetten ueberhaupt keinen Cache-Buster. Das war falsch
und beruhte auf einem zu grobem grep. Tatsaechlich hat JEDE App eine
mtime-basierte Ableitung — sc_asset_v(), $cssV()/$jsV(), lf_asset_v(),
en_asset_v(), zf_asset_v(), biblios APP_BUILD. Der Mechanismus fehlte also
nicht; er wurde nur an bestimmten Stellen nicht benutzt.

TATSAECHLICHE BEFUNDE (alle gemessen, nicht geschaetzt):

1. 29 Asset-Referenzen banden JS/CSS OHNE jeden Buster ein. Darunter in ALLEN
   sechs Apps, die sie laden, die geteilte css/shared/js/admin.js — genau die
   Datei, die auth TASK-7 geaendert hat. Ebenso field-enhance.js (5 Apps),
   dialog.js (zeiterfassung), und in simplechat 38 Referenzen auf den
   Auth-Seiten (login, setpassword, forgotPassword, executeReset, totp_verify,
   impressum), die alle ueber basePath() ohne Buster liefen.

2. suches APP_BUILD war die handgepflegte Zahl 6. Da JEDE Asset-URL in suche an
   ?v=APP_BUILD haengt, blieb dort nach einer css_library-Aenderung alles auf dem
   alten Stand, bis der Browser von selbst revalidierte.

3. biblios Auto-Ableitung hatte einen Fehler: ohne FOLLOW_SYMLINKS betritt
   RecursiveDirectoryIterator das symlinkte web/css/shared nicht. Nachgemessen:
   5 von 19 Dateien gesehen, juengste mtime einen Tag zu alt — die
   admin.js-Aenderung von TASK-7 war fuer die Kennung unsichtbar. Nur in der
   Entwicklung wirksam (auf dem Server legt rsync --copy-links echte Dateien an),
   also genau dort, wo man es fuer einen Browser-Cache haelt.

UMSETZUNG:
- Erikr\\Chrome\\AssetVersion (neu, mit Test): fromMtimes() fuer ein
  abgeleitetes APP_BUILD, forFile() fuer einzelne Dateien. Ersetzt biblios
  Inline-Fassung und wird von suche mitbenutzt, statt sie zu kopieren.
- biblio + suche: APP_BUILD daraus abgeleitet.
- simplechat: assetPath() neben basePath(), 38 Referenzen umgestellt.
- wlmonitor: AssetVersion::forFile() auf den Standalone-Seiten (login, admin),
  wo die Closure aus inc/layout.php nicht in Reichweite ist.
- last.fm / Energie / zeiterfassung / suche / biblio: die fehlenden Referenzen
  auf den jeweils vorhandenen eigenen Helfer bzw. das eigene Idiom umgestellt —
  kein achter Mechanismus.

NACHWEIS: Login-Seite jeder App auf einem eigenen PHP-Server gerendert
(*.test zeigt lokal auf EINEN Vhost und ist als Nachweis untauglich — der erste
Versuch lieferte deshalb fuer alle sieben dasselbe Ergebnis). Danach 0
Referenzen ohne Buster in allen sieben Apps, und der Buster fuer
css/shared/js/admin.js loest in allen sieben auf die mtime der
TASK-7-Aenderung auf.

NICHT TEIL DAVON (bewusst): die sieben *_asset_v()-Helfer zu einem
zusammenzufassen. Sie funktionieren, und sie alle auf AssetVersion umzuziehen
haette ~60 weitere Referenzen angefasst, ohne etwas zu reparieren. Waere ein
eigener Aufraeum-Task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Eine Aenderung an einer Datei in css_library wirkt nach dem Deploy sofort, ohne dass ein Nutzer den Browser-Cache leeren muss
- [x] #2 Der Mechanismus funktioniert ohne manuelles Hochzaehlen — eine vergessene Nummer darf nicht wieder zu altem Code beim Nutzer fuehren
- [x] #3 In allen sieben Apps einheitlich; die gemessenen Zahlen oben sind auf 0 ohne ?v= (oder aequivalent geloest)
<!-- AC:END -->
