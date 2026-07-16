// js/api-call.js — geteilte Fetch-Hülle apiCall()/apiForm()/ApiError.
// Beendet zwei häufige Audit-Muster (Robustheit-Audit 2026-07-16,
// ~/TUEV/audit-robustheit-20260716/spec-apicall.md, Regel §21 in
// ~/.claude/rules/ui-design-rules.md): (A) Fetch-Hüllen lesen bei !res.ok
// den JSON-Body nicht → die konkrete Servermeldung verpufft als „HTTP 400"
// oder „Netzwerkfehler"; (B) fehlendes .catch() → die UI stirbt wortlos.
//
// Schwester-File (anderes Ökosystem, gleiche API/Semantik):
// ~/TUEV/theme/js/api-call.js (antrago/imago — TUEV koppelt nicht an
// css_library).
//
// Verwendung:
//   import { apiCall, apiForm, ApiError } from './shared/js/api-call.js';
//
//   // vorher: konkrete Servermeldung geht verloren
//   fetch('/api.php', { method: 'POST', body: fd })
//     .then((res) => res.json())
//     .then((data) => { if (!data.ok) zeigeFehler('Fehler'); })
//     .catch(() => zeigeFehler('Netzwerkfehler'));
//
//   // nachher: konkrete Meldung, unterscheidbare Fehlerklassen
//   try {
//     const data = await apiForm('/api.php', { aktion: 'speichern' });
//     zeigeErfolg(data);
//   } catch (e) {
//     zeigeFehler(e.message); // z.B. "Serverfehler (HTTP 400) — Feed-URL muss mit https:// beginnen"
//   }
//
// Für Nicht-Modul-Aufrufer (Inline-Nonce-Skripte) werden apiCall/apiForm/
// ApiError zusätzlich an window gehängt (wie dialog.js es löst).

export class ApiError extends Error {
    constructor(message, { status = 0, detail = null, kind }) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
        this.kind = kind; // 'http' | 'network' | 'timeout' | 'abort' | 'badjson'
    }
}

const SNIPPET_MAX = 300;

function snippet(text) {
    if (!text) return null;
    const s = String(text).trim();
    if (!s) return null;
    return s.length > SNIPPET_MAX ? s.slice(0, SNIPPET_MAX) + '…' : s;
}

// Body lesen + versuchen als JSON zu parsen. Liefert { json, rawText } —
// json ist null, wenn der Body leer oder nicht parsebar ist.
async function leseKoerper(res) {
    let rawText = '';
    try {
        rawText = await res.text();
    } catch {
        return { json: null, rawText: '' };
    }
    if (!rawText) return { json: null, rawText: '' };
    try {
        return { json: JSON.parse(rawText), rawText };
    } catch {
        return { json: null, rawText };
    }
}

/**
 * apiCall(url, { method='POST', body, timeoutMs=30000, signal, headers } = {})
 *   → Promise<object>  // geparstes JSON bei Erfolg (res.ok && Body parsebar)
 *   wirft ApiError bei allem anderen.
 */
export async function apiCall(url, opts = {}) {
    const {
        method = 'POST',
        body,
        timeoutMs = 30000,
        signal,
        headers,
    } = opts;

    const eigenerController = new AbortController();
    let verkettetesSignal = eigenerController.signal;
    let manuelleAbmeldung = null;

    if (signal) {
        if (typeof AbortSignal.any === 'function') {
            verkettetesSignal = AbortSignal.any([eigenerController.signal, signal]);
        } else {
            // Manuelle Verkettung für Umgebungen ohne AbortSignal.any.
            if (signal.aborted) {
                eigenerController.abort();
            } else {
                const weiterleiten = () => eigenerController.abort();
                signal.addEventListener('abort', weiterleiten, { once: true });
                manuelleAbmeldung = () => signal.removeEventListener('abort', weiterleiten);
            }
        }
    }

    let abgelaufen = false;
    const timer = setTimeout(() => {
        abgelaufen = true;
        eigenerController.abort();
    }, timeoutMs);

    let res;
    try {
        res = await fetch(url, { method, body, headers, signal: verkettetesSignal });
    } catch (err) {
        clearTimeout(timer);
        if (manuelleAbmeldung) manuelleAbmeldung();

        if (err && err.name === 'AbortError') {
            if (abgelaufen) {
                const sekunden = timeoutMs / 1000;
                throw new ApiError(`Zeitüberschreitung nach ${sekunden} s`, {
                    status: 0,
                    detail: null,
                    kind: 'timeout',
                });
            }
            throw new ApiError('Anfrage abgebrochen', {
                status: 0,
                detail: null,
                kind: 'abort',
            });
        }

        throw new ApiError('Server nicht erreichbar', {
            status: 0,
            detail: err && err.message ? err.message : null,
            kind: 'network',
        });
    }

    clearTimeout(timer);
    if (manuelleAbmeldung) manuelleAbmeldung();

    const { json, rawText } = await leseKoerper(res);

    if (!res.ok) {
        const serverMeldung = json && (json.error || json.detail);
        const detail = serverMeldung ? String(serverMeldung) : snippet(rawText);
        const meldung = detail
            ? `Serverfehler (HTTP ${res.status}) — ${detail}`
            : `Serverfehler (HTTP ${res.status})`;
        throw new ApiError(meldung, { status: res.status, detail, kind: 'http' });
    }

    if (json === null) {
        throw new ApiError(
            `Antwort nicht auswertbar (HTTP ${res.status})${rawText ? ' — ' + snippet(rawText) : ''}`,
            { status: res.status, detail: snippet(rawText), kind: 'badjson' },
        );
    }

    return json;
}

/**
 * apiForm(url, formDataOrObject, opts) — Convenience für POST-FormData/
 * urlencoded-Callsites. Objekt → URLSearchParams (application/x-www-form-
 * urlencoded), FormData wird unverändert durchgereicht (Browser setzt den
 * multipart-Content-Type samt Boundary selbst).
 */
export async function apiForm(url, formDataOrObject, opts = {}) {
    let body;
    let headers = opts.headers;

    if (formDataOrObject instanceof FormData) {
        body = formDataOrObject;
    } else {
        body = new URLSearchParams(formDataOrObject || {});
        headers = { 'Content-Type': 'application/x-www-form-urlencoded', ...(opts.headers || {}) };
    }

    return apiCall(url, { ...opts, body, headers });
}

// Nicht-Modul-Aufrufer (Inline-Nonce-Skripte). Guard, damit das Modul auch
// unter Node (Tests, kein window) importierbar bleibt.
if (typeof window !== 'undefined') {
    window.apiCall = apiCall;
    window.apiForm = apiForm;
    window.ApiError = ApiError;
}
