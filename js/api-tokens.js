// js/api-tokens.js — Inhalt des "Tokens verwalten"-Dialogs auf der
// Profilseite (Erikr\Chrome\ApiTokens, chrome-Repo src/ApiTokens.php). Erik,
// 2026-07-25: "Die API-Token Verwaltung ist jetzt direkt im Profil. Das ist
// unschön. Schreib nur: 'Tokens verwalten (#)' und mach das analog Kennwort
// ändern in einem eigenen Dialog." — der Block sitzt seither im
// app-modal-body des #apiTokensModal-Dialogs (Öffnen/Schließen via
// admin.js' openModal()/closeModal(), siehe Profile::render()), Anlegen/
// Widerrufen bleiben ohne Full-Page-Reload — Anlegen hängt eine neue Zeile
// per DOM an, Widerrufen entfernt sie; der "Tokens verwalten (N)"-Auslöser-
// Button außerhalb des Dialogs wird dabei mit aktualisiert (siehe
// aktualisiereZaehler() unten).
//
// Nutzt die geteilte apiCall()-Hülle (Regel §21 — neue Callsites MÜSSEN sie
// verwenden) und den geteilten confirmDialog() aus dialog.js (kein natives
// confirm(), Rule §8/UI-Regeln) — Profile::render() lädt dialog.js bereits,
// wenn der Token-Dialog aktiv ist.
//
// Geladen als <script type="module">, wie dialog.js/api-call.js — anders
// als das plain-<script>-Muster von avatar-cropper.js (dessen
// initAvatarCropper({...}) von einem separaten, unmittelbar folgenden
// Inline-Skript aufgerufen wird). Ein solcher Aufruf wäre hier ein
// Ausführungsreihenfolge-Fallstrick: type="module"-Skripte sind wie
// `defer` verzögert, ein normales <script> danach würde also VOR diesem
// Modul laufen. Stattdessen liest der Modul-Top-Level-Code selbst
// `data-action`/`data-csrf-token` vom `#apiTokensBlock`-Element (dem
// app-modal-body des Dialogs) — das ist sicher, weil Modul-Skripte erst nach
// Abschluss des HTML-Parsens ausgeführt werden, das Element also längst
// existiert.

import { apiCall } from './api-call.js';

const QUELLE = { web: 'Web', credentials: 'Zugangsdaten' };

function formatiereDatum(dtStr) {
    if (!dtStr) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dtStr);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : dtStr;
}

function baueZeile(item) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center justify-content-between gap-2';
    li.dataset.tokenId = String(item.id);
    const label = item.label && item.label !== '' ? item.label : '(ohne Bezeichnung)';
    li.dataset.tokenLabel = label;

    const quelle = QUELLE[item.source] || (item.source || 'Unbekannt');
    const meta = quelle + ' · erstellt ' + formatiereDatum(item.created_at)
        + ' · zuletzt genutzt ' + (item.last_used_at ? formatiereDatum(item.last_used_at) : 'nie');

    const info = document.createElement('div');
    const labelDiv = document.createElement('div');
    labelDiv.className = 'fw-semibold';
    labelDiv.textContent = label;
    const metaDiv = document.createElement('div');
    metaDiv.className = 'text-muted';
    metaDiv.textContent = meta;
    info.append(labelDiv, metaDiv);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-outline-danger';
    btn.setAttribute('data-token-revoke', '');
    btn.setAttribute('aria-label', 'Token „' + label + '“ widerrufen');
    const icon = document.createElement('span');
    icon.className = 'ui-icon ui-icon-delete';
    icon.setAttribute('aria-hidden', 'true');
    btn.append(icon, document.createTextNode(' Widerrufen'));

    li.append(info, btn);
    return li;
}

export function initApiTokens(root) {
    const action = root.dataset.action;
    const csrfToken = root.dataset.csrfToken || '';

    const fehler = root.querySelector('#apiTokensError');
    const reveal = root.querySelector('#apiTokenReveal');
    const revealField = root.querySelector('#apiTokenRevealField');
    const revealCopyBtn = root.querySelector('#apiTokenRevealCopy');
    const revealDoneBtn = root.querySelector('#apiTokenRevealDone');
    const list = root.querySelector('#apiTokensList');
    const empty = root.querySelector('#apiTokensEmpty');
    const form = root.querySelector('#apiTokenCreateForm');
    const labelInput = root.querySelector('#apiTokenLabel');
    // Auslöser-Button lebt außerhalb des Dialogs (im Konto-Bereich der
    // Profilseite, neben "Kennwort ändern"), global per ID gesucht statt
    // über root — siehe Profile::render()/ApiTokens.php.
    const toggleBtn = document.getElementById('apiTokensToggle');

    if (!action || !form || !list) return;

    function aktualisiereZaehler() {
        if (!toggleBtn) return;
        const n = list.querySelectorAll('[data-token-id]').length;
        toggleBtn.textContent = 'Tokens verwalten (' + n + ')';
    }

    function zeigeFehler(msg) {
        if (!fehler) return;
        if (msg) {
            fehler.textContent = msg;
            fehler.hidden = false;
        } else {
            fehler.hidden = true;
            fehler.textContent = '';
        }
    }

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        zeigeFehler(null);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        try {
            const data = await apiCall(action, {
                body: new URLSearchParams({
                    csrf_token: csrfToken,
                    action: 'token_create',
                    label: labelInput ? labelInput.value : '',
                }),
            });
            if (data && data.item) {
                list.prepend(baueZeile(data.item));
                list.hidden = false;
                if (empty) empty.hidden = true;
                aktualisiereZaehler();
            }
            if (labelInput) labelInput.value = '';
            if (revealField) revealField.value = (data && data.token) || '';
            if (reveal) reveal.hidden = false;
            if (revealField) {
                revealField.focus();
                revealField.select();
            }
        } catch (e) {
            zeigeFehler(e.message || 'Token konnte nicht erstellt werden.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    list.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('[data-token-revoke]');
        if (!btn) return;
        const zeile = btn.closest('[data-token-id]');
        if (!zeile) return;
        const id = zeile.dataset.tokenId;
        const label = zeile.dataset.tokenLabel;
        zeigeFehler(null);

        if (!window.confirmDialog) {
            const msg = 'Bestätigungsdialog konnte nicht geladen werden. Bitte Seite neu laden.';
            if (window.alertDialog) window.alertDialog(msg); else alert(msg);
            return;
        }
        const bestaetigt = await window.confirmDialog(
            'Token „' + label + '“ widerrufen? Geräte, die dieses Token verwenden, verlieren sofort den Zugriff.',
            { titel: 'Token widerrufen', okLabel: 'Widerrufen', gefahr: 'commit' },
        );
        if (!bestaetigt) return;

        btn.disabled = true;
        try {
            await apiCall(action, {
                body: new URLSearchParams({ csrf_token: csrfToken, action: 'token_revoke', id }),
            });
            zeile.remove();
            if (!list.querySelector('[data-token-id]')) {
                list.hidden = true;
                if (empty) empty.hidden = false;
            }
            aktualisiereZaehler();
        } catch (e) {
            zeigeFehler(e.message || 'Widerrufen fehlgeschlagen.');
            btn.disabled = false;
        }
    });

    revealCopyBtn?.addEventListener('click', async () => {
        if (!revealField) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(revealField.value);
            } else {
                revealField.select();
                document.execCommand('copy');
            }
        } catch {
            // Feld bleibt selektiert, manuelles Kopieren weiterhin möglich.
        }
    });

    revealDoneBtn?.addEventListener('click', () => {
        if (reveal) reveal.hidden = true;
        if (revealField) revealField.value = '';
    });
}

// Selbst-Bootstrap: das Modul wird deferred geladen (nach Ende des
// HTML-Parsens), das Element existiert also garantiert bereits.
const apiTokensRoot = document.getElementById('apiTokensBlock');
if (apiTokensRoot) initApiTokens(apiTokensRoot);
