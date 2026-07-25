// js/account-deactivate.js — Verhalten des "Konto deaktivieren"-Dialogs auf
// der Profilseite (Erikr\Chrome\Profile::render(), chrome-Repo src/Profile.php,
// Cfg-Schlüssel `deactivateAction`/`isAdmin`). Deaktivierung, nicht Löschung:
// umkehrbar, ein Administrator schaltet das Konto wieder frei.
//
// Öffnen/Schließen macht dieses Modul NICHT selbst: der Auslöser trägt
// `data-modal-open="deactivate-modal"`, die beiden Schließen-Schaltflächen
// `data-modal-close`, verdrahtet vom geteilten openModal()/closeModal() aus
// admin.js (Fokusfalle, Escape, und der Backdrop-Close auf **pointerdown**
// statt click — UI-Regel §8: ein click nach "mousedown innen → mouseup außen"
// trifft das Backdrop und würde den Dialog mitten in einer Textauswahl
// schließen). Profile::render() lädt admin.js mit, wenn der Token-Dialog es
// nicht ohnehin schon tut. Kein zweiter Dialog-Mechanismus.
//
// Geladen als <script type="module"> von Profile::render() (wie
// api-tokens.js) — die Apps binden es NICHT selbst ein; als einfaches
// <script defer> wäre der import unten ein Syntaxfehler.

import { apiCall } from './api-call.js';

const modal = document.getElementById('deactivate-modal');
const form = document.getElementById('deactivate-form');

if (modal && form) {
    const fehler = document.getElementById('deactivate-error');
    const kennwort = document.getElementById('deactivate-password');
    const absenden = document.querySelector('[form="deactivate-form"][type="submit"]');

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

    // Beim Schließen aufräumen: Kennwort nicht im DOM stehen lassen, alte
    // Fehlermeldung nicht beim nächsten Öffnen wieder zeigen. closeModal()
    // entfernt nur das [hidden] — daher an der Attributänderung hängen.
    new MutationObserver(() => {
        if (modal.hasAttribute('hidden')) {
            if (kennwort) kennwort.value = '';
            zeigeFehler(null);
        }
    }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        zeigeFehler(null);
        if (absenden) absenden.disabled = true;
        try {
            // apiCall() (Regel §21): liest den Body auch bei !res.ok, hängt
            // bei nicht parsebarer Antwort HTTP-Status und Snippet an die
            // Meldung — nie ein blankes "Fehler".
            const daten = await apiCall(form.action, { body: new FormData(form) });
            // Der Kontrakt verlangt 4xx im Fehlerfall (dann wirft apiCall
            // bereits). Antwortet ein Handler versehentlich mit HTTP 200 und
            // {ok:false}, darf das keine Weiterleitung auslösen — der Nutzer
            // hielte sein Konto sonst faelschlich für deaktiviert.
            if (daten && daten.ok === false) {
                throw new Error(daten.message || daten.error || 'Deaktivierung fehlgeschlagen.');
            }
            // Die Sitzung ist serverseitig beendet; ab hier ist jede weitere
            // Anfrage dieser Seite ohnehin abgewiesen.
            window.location.href = 'login.php?disabled=1';
        } catch (e) {
            zeigeFehler(e.message || 'Deaktivierung fehlgeschlagen.');
            if (absenden) absenden.disabled = false;
            if (kennwort) kennwort.focus();
        }
    });
}
