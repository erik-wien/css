// tests/api-call.test.mjs — Fehlerklassen-Harness für js/api-call.js
// (Robustheit-Audit 2026-07-16, spec-apicall.md). Läuft mit `node --test`
// oder `node tests/api-call.test.mjs`, keine neuen Dependencies (node:test +
// node:assert, gemocktes globalThis.fetch).

import test from 'node:test';
import assert from 'node:assert/strict';
import { apiCall, apiForm, ApiError } from '../js/api-call.js';

function mockResponse(status, ok, bodyText) {
    return {
        ok,
        status,
        text: async () => bodyText,
    };
}

function hangingFetchThatAborts() {
    return (_url, opts) => new Promise((_resolve, reject) => {
        const { signal } = opts;
        const abortErr = () => {
            const e = new Error('The operation was aborted');
            e.name = 'AbortError';
            return e;
        };
        if (signal.aborted) {
            reject(abortErr());
            return;
        }
        signal.addEventListener('abort', () => reject(abortErr()), { once: true });
    });
}

const originalFetch = globalThis.fetch;
test.afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('1. ok + JSON -> gibt das geparste Objekt zurück', async () => {
    globalThis.fetch = async () => mockResponse(200, true, JSON.stringify({ ok: true, wert: 42 }));
    const data = await apiCall('/api.php');
    assert.deepEqual(data, { ok: true, wert: 42 });
});

test("2. 400 + JSON {error:'Feed-URL muss…'} -> ApiError kind:'http', status 400, message enthält Servertext", async () => {
    globalThis.fetch = async () => mockResponse(400, false, JSON.stringify({ error: 'Feed-URL muss mit https:// beginnen' }));
    await assert.rejects(
        () => apiCall('/api.php'),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'http');
            assert.equal(err.status, 400);
            assert.match(err.message, /Feed-URL muss mit https:\/\/ beginnen/);
            assert.equal(err.detail, 'Feed-URL muss mit https:// beginnen');
            return true;
        },
    );
});

test('3. 500 + HTML-Body -> ApiError kind:\'http\', status 500, detail enthält Snippet', async () => {
    const html = '<html><body>Internal Server Error — Stacktrace…</body></html>';
    globalThis.fetch = async () => mockResponse(500, false, html);
    await assert.rejects(
        () => apiCall('/api.php'),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'http');
            assert.equal(err.status, 500);
            assert.ok(err.detail && err.detail.includes('Internal Server Error'));
            return true;
        },
    );
});

test('4. ok + HTML-Body (kein JSON) -> ApiError kind:\'badjson\' mit Status', async () => {
    globalThis.fetch = async () => mockResponse(200, true, '<html>Warning: undefined index</html>');
    await assert.rejects(
        () => apiCall('/api.php'),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'badjson');
            assert.equal(err.status, 200);
            assert.match(err.message, /HTTP 200/);
            return true;
        },
    );
});

test("5. fetch wirft TypeError -> kind:'network'", async () => {
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(
        () => apiCall('/api.php'),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'network');
            assert.match(err.message, /Server nicht erreichbar/);
            return true;
        },
    );
});

test("6. Timeout (fetch hängt, timeoutMs=50) -> kind:'timeout'", async () => {
    globalThis.fetch = hangingFetchThatAborts();
    await assert.rejects(
        () => apiCall('/api.php', { timeoutMs: 50 }),
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'timeout');
            assert.match(err.message, /Zeitüberschreitung nach 0\.05 s/);
            return true;
        },
    );
});

test("7. externes signal abgebrochen -> kind:'abort'", async () => {
    globalThis.fetch = hangingFetchThatAborts();
    const controller = new AbortController();
    const call = apiCall('/api.php', { signal: controller.signal, timeoutMs: 5000 });
    setTimeout(() => controller.abort(), 10);
    await assert.rejects(
        () => call,
        (err) => {
            assert.ok(err instanceof ApiError);
            assert.equal(err.kind, 'abort');
            assert.match(err.message, /abgebrochen/);
            return true;
        },
    );
});

test('8. ok + leerer Body -> null (kein badjson, z.B. 204)', async () => {
    globalThis.fetch = async () => mockResponse(200, true, '');
    const data = await apiCall('/api.php');
    assert.equal(data, null);
});

test('9. ok + literaler JSON-Body "null" -> null (kein badjson-Fehlalarm)', async () => {
    globalThis.fetch = async () => mockResponse(200, true, 'null');
    const data = await apiCall('/api.php');
    assert.equal(data, null);
});

test('apiForm: Objekt -> URLSearchParams-Body + urlencoded Content-Type', async () => {
    let gesehen;
    globalThis.fetch = async (url, opts) => {
        gesehen = opts;
        return mockResponse(200, true, JSON.stringify({ ok: true }));
    };
    await apiForm('/api.php', { a: '1', b: 'zwei' });
    assert.ok(gesehen.body instanceof URLSearchParams);
    assert.equal(gesehen.body.get('a'), '1');
    assert.equal(gesehen.headers['Content-Type'], 'application/x-www-form-urlencoded;charset=UTF-8');
});

test('apiForm: FormData wird unverändert durchgereicht (kein Content-Type gesetzt)', async () => {
    let gesehen;
    globalThis.fetch = async (url, opts) => {
        gesehen = opts;
        return mockResponse(200, true, JSON.stringify({ ok: true }));
    };
    const fd = new FormData();
    fd.append('x', '1');
    await apiForm('/api.php', fd);
    assert.ok(gesehen.body instanceof FormData);
    assert.equal(gesehen.headers['Content-Type'], undefined);
});
