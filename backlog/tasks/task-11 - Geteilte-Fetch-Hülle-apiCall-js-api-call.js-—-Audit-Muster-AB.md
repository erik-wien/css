---
id: TASK-11
title: Geteilte Fetch-Hülle apiCall() (js/api-call.js) — Audit-Muster A+B
status: Done
assignee: []
created_date: '2026-07-16 06:56'
updated_date: '2026-07-16 07:00'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Kontext

Robustheit-Audit 2026-07-16 (`/Users/erikr/TUEV/audit-robustheit-20260716/`) fand quer über alle Apps
zwei wiederkehrende Muster:

- **Muster A:** Fetch-Hüllen lesen bei `!res.ok` den JSON-Body nicht → konkrete Servermeldung
  verpufft als „HTTP 400" oder „Netzwerkfehler" (betrifft u. a. suche `sucheFetch`, wlmonitor
  `apiFetch`, zeiterfassung `importOne`, biblio `postApi` teils).
- **Muster B:** fehlendes `.catch()` an Fetches/Polls → unhandled rejection, UI bleibt stumm
  (last.fm Charts, simplechat Polls, suche sucheFetch-Aufrufer).

Vorbild existiert bereits im Bestand (antrago `api.js` readJson/Envelope, energie `_apiJson()`),
aber es gibt noch keine geteilte, offiziell dokumentierte Instanz für die `~/Git`-Apps.

Volle Spec: `/Users/erikr/TUEV/audit-robustheit-20260716/spec-apicall.md` (unbedingt vor
Implementierung lesen).

## Ziel

Eine geteilte JS-Funktion `js/api-call.js` in `css_library`, die beide Muster für alle
`~/Git`-Apps beendet (die Apps binden `css_library` bereits per Symlink unter `web/css/shared/`
ein).

## API

```js
/**
 * apiCall(url, { method='POST', body, timeoutMs=30000, signal, headers } = {})
 *   → Promise<object>  // das geparste JSON bei Erfolg (res.ok && Body parsebar)
 *   wirft ApiError bei allem anderen.
 */
class ApiError extends Error {
  status;   // HTTP-Status (0 bei Netzwerk-/Abbruchfehler)
  detail;   // Server-`detail`/`error`-Feld falls vorhanden, sonst Body-Snippet (max 300 Zeichen), sonst null
  kind;     // 'http' | 'network' | 'timeout' | 'abort' | 'badjson'
}
```

## Verhalten (7 Punkte, Essenz aus den Audit-Befunden)

1. `!res.ok` → **trotzdem** `res.json()` versuchen; `error`/`detail`-Felder in die ApiError
   übernehmen. Nur wenn der Body nicht parsebar ist: Text-Snippet als detail. Nie nur „HTTP 400".
2. `res.ok` aber Body nicht parsebar (PHP-Warning-Leak, HTML-Fehlerseite) → ApiError
   `kind:'badjson'` mit Status + Snippet — NICHT stilles null.
3. Netzwerkfehler (fetch wirft) → `kind:'network'`, Meldung „Server nicht erreichbar".
4. `timeoutMs` via eigenem AbortController → `kind:'timeout'`, Meldung nennt die Dauer.
   Ein extern übergebenes `signal` wird verkettet; Nutzer-Abbruch → `kind:'abort'`.
5. `ApiError.message` ist immer eine fertige, deutsche, konkrete Meldung
   (z. B. „Serverfehler (HTTP 500) — <detail>", „Zeitüberschreitung nach 30 s").
6. Zusatzexport `apiForm(url, formDataOrObject, opts)` — Convenience für die häufigen
   POST-FormData/urlencoded-Callsites.
7. Kein Framework, ES-Modul + klassisches Script beides bedienen (wie `dialog.js` es löst —
   an dessen Konvention orientieren).

## Nicht-Ziele

- Kein Retry/Backoff (app-spezifisch).
- Kein Envelope-Zwang (`{ok:...}` bleibt Sache der Apps).
- Keine Callsite-Umstellungen in den Apps — das sind eigene Backlog-Tasks je App.

## Verweis

Vollständige Spec inkl. Rationale: `/Users/erikr/TUEV/audit-robustheit-20260716/spec-apicall.md`.
Schwester-Instanz (getrenntes Ökosystem, gleiche API/Semantik): `~/TUEV/theme/js/api-call.js`
(eigener Backlog-Task im theme-Repo). Kopf-Kommentar in beiden Dateien soll aufs jeweils andere
File verweisen.

## Acceptance Criteria

- [ ] `css_library/js/api-call.js` exportiert `apiCall`, `apiForm`, `ApiError` gemäß obiger API.
- [ ] Alle 7 Verhaltenspunkte sind implementiert und durch einen kleinen node-Harness-Test mit
      gemocktem `fetch` abgedeckt (ok+JSON, 400+JSON-error, 500+HTML-Body, Netzwerk-Throw, Timeout).
- [ ] node-Syntaxcheck läuft grün.
- [ ] Designguide-/README-Eintrag mit Verwendungsbeispiel ergänzt.
- [ ] Kopf-Kommentar verweist auf `~/TUEV/theme/js/api-call.js` als Schwester-Datei.
<!-- SECTION:DESCRIPTION:END -->
