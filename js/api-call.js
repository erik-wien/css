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
    constructor(message, { status = 0, detail = null, kind } = {}) {
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

// Detail für HTTP-Fehler aus dem Rohtext ableiten: parst der Body zu einem
// JSON-Objekt, zählt NUR ein nicht-leerer .error/.detail-String (sonst null —
// kein Klammer-Dump von z.B. "{}"); parst er nicht oder zu etwas anderem als
// einem Objekt (Zahl, Array, literalem null, Nicht-JSON-Text), zählt ein
// Snippet des Rohtexts.
function extractDetail(rawText) {
    let json;
    let parsed = false;
    if (rawText) {
        try {
            json = JSON.parse(rawText);
            parsed = true;
        } catch {
            parsed = false;
        }
    }
    const istObjekt = parsed && json !== null && typeof json === 'object' && !Array.isArray(json);
    if (istObjekt) {
        const err = typeof json.error === 'string' && json.error !== '' ? json.error : null;
        const det = typeof json.detail === 'string' && json.detail !== '' ? json.detail : null;
        return err ?? det ?? null;
    }
    return snippet(rawText);
}

// res.text() selbst gegen Exceptions absichern (Muster C1) — schlägt der Read
// fehl, wirft dies direkt eine badjson-ApiError statt eine rohe Exception
// durchzureichen.
async function leseRohtext(res) {
    try {
        return await res.text();
    } catch {
        throw new ApiError(
            `Unerwartete Serverantwort (HTTP ${res.status}, kein gültiges JSON)`,
            { status: res.status, detail: null, kind: 'badjson' },
        );
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
                throw new ApiError(`Zeitüberschreitung nach ${timeoutMs / 1000} s`, {
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

    const rawText = await leseRohtext(res);

    if (!res.ok) {
        const detail = extractDetail(rawText);
        const meldung = detail
            ? `Serverfehler (HTTP ${res.status}) — ${detail}`
            : `Serverfehler (HTTP ${res.status})`;
        throw new ApiError(meldung, { status: res.status, detail, kind: 'http' });
    }

    // Leerer Body (z.B. 204) ist bewusst kein Fehler: null zurückgeben statt
    // 'badjson'. 'badjson' ist reserviert für einen NICHT-leeren Body, der
    // sich nicht als JSON parsen lässt (ein literaler JSON-"null"-Body parst
    // hier erfolgreich zu null und zählt daher auch als Erfolg).
    if (rawText === '') return null;

    try {
        return JSON.parse(rawText);
    } catch {
        const snip = snippet(rawText);
        const meldung = `Unerwartete Serverantwort (HTTP ${res.status}, kein gültiges JSON)`
            + (snip ? ` — ${snip}` : '');
        throw new ApiError(meldung, { status: res.status, detail: snip, kind: 'badjson' });
    }
}

/**
 * apiForm(url, formDataOrObject, opts) — Convenience für POST-FormData/
 * urlencoded-Callsites. Objekt → URLSearchParams (application/x-www-form-
 * urlencoded), FormData wird unverändert durchgereicht (Browser setzt den
 * multipart-Content-Type samt Boundary selbst).
 */
export async function apiForm(url, formDataOrObject, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    let body;

    if (formDataOrObject instanceof FormData) {
        body = formDataOrObject;
    } else {
        body = new URLSearchParams(formDataOrObject || {});
        if (!('Content-Type' in headers) && !('content-type' in headers)) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        }
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
