// web/js/dialog.js — App-Dialoge als Ersatz für native alert/confirm/prompt (①).
// Baut on-the-fly ein .app-modal-backdrop im Katalog-Markup (shared
// components.css) und liefert ein Promise:
//   confirmDialog(text, opts) → true|false
//   promptDialog(text, opts)  → string|null
//   alertDialog(text, opts)   → void (Promise<void>)
//
// Eigenes ESC-/Backdrop-/Fokus-Handling: js/modal.js verkabelt nur die BEIM
// LADEN vorhandenen Modale, nicht dynamisch erzeugte. Nach dem Schließen wird
// der Knoten entfernt und der vorherige Fokus zurückgegeben; die Scroll-Sperre
// (body.modal-offen) wird wie in modal.js anhand sichtbarer Backdrops neu
// bestimmt, damit sie ein evtl. darunterliegendes Modal nicht aufhebt.
//
// Für Nicht-Modul-Aufrufer (web/admin.php, Inline-Nonce-Skript) werden die drei
// Funktionen zusätzlich an window gehängt.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), '
    + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// gefahr → CSS-Klasse der Bestätigungs-Schaltfläche (ui-design-rules §7.1):
//   'neutral'   – ändert nichts / reversibler Flag-Toggle → bare .btn
//   'secondary' – schreibt Daten (Default) → .btn-outline-danger
//   'commit'    – permanente/irreversible Entfernung → .btn-danger
const GEFAHR_KLASSE = {
    neutral: 'btn',
    secondary: 'btn btn-outline-danger',
    commit: 'btn btn-danger',
};

let idZaehler = 0;

/**
 * Kern: baut den Dialog, fokussiert, verkabelt Schließen-Wege. `aufloesen`
 * bekommt den Rückgabewert; `eingabe` (optional) macht aus dem Body ein
 * Eingabefeld, dessen Wert bei OK zurückgegeben wird.
 */
function oeffneDialog({ titel, text, okLabel, gefahr, mitEingabe, startwert }) {
    return new Promise((resolve) => {
        const vorherFokussiert = document.activeElement;
        const titelId = 'dlg-titel-' + (++idZaehler);

        const backdrop = document.createElement('div');
        backdrop.className = 'app-modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', titelId);

        const dialog = document.createElement('div');
        dialog.className = 'app-modal-dialog app-modal-sm';

        const header = document.createElement('div');
        header.className = 'app-modal-header';
        const headerRow = document.createElement('div');
        headerRow.className = 'app-modal-header-row';
        const h2 = document.createElement('h2');
        h2.className = 'app-modal-title';
        h2.id = titelId;
        h2.textContent = titel;
        headerRow.append(h2);
        header.append(headerRow);

        const body = document.createElement('div');
        body.className = 'app-modal-body';
        const p = document.createElement('p');
        p.className = 'dlg-text';
        p.textContent = text;
        body.append(p);

        let feld = null;
        if (mitEingabe) {
            feld = document.createElement('input');
            feld.type = 'text';
            feld.className = 'form-control';
            feld.value = startwert ?? '';
            body.append(feld);
        }

        const footer = document.createElement('div');
        footer.className = 'app-modal-footer';

        // Beenden: Knoten weg, Scroll-Sperre neu bestimmen, Fokus zurück, Promise.
        function schliessen(wert) {
            document.removeEventListener('keydown', aufEsc, true);
            backdrop.remove();
            document.body.classList.toggle('modal-offen',
                !!document.querySelector('.app-modal-backdrop:not([hidden])'));
            if (vorherFokussiert && typeof vorherFokussiert.focus === 'function') {
                vorherFokussiert.focus();
            }
            resolve(wert);
        }

        const abbrechenWert = mitEingabe ? null : false;

        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        // Reiner Hinweis (nur-ok): neutraler OK-Knopf, kein Daten-Rot.
        okBtn.className = gefahr === 'nur-ok'
            ? GEFAHR_KLASSE.neutral
            : (GEFAHR_KLASSE[gefahr] || GEFAHR_KLASSE.secondary);
        okBtn.textContent = okLabel;
        okBtn.addEventListener('click', () => schliessen(mitEingabe ? feld.value : true));

        // alertDialog braucht keinen Abbrechen-Knopf (nur OK).
        if (gefahr !== 'nur-ok') {
            const abbrechen = document.createElement('button');
            abbrechen.type = 'button';
            abbrechen.className = 'btn';
            abbrechen.textContent = 'Abbrechen';
            abbrechen.addEventListener('click', () => schliessen(abbrechenWert));
            footer.append(abbrechen);
        }
        footer.append(okBtn);

        dialog.append(header, body, footer);
        backdrop.append(dialog);

        // Backdrop schließt auf pointerdown (Gesten-Start, ui-design-rules §8) =
        // Abbrechen. alertDialog (nur OK) schließt per Backdrop ebenfalls.
        backdrop.addEventListener('pointerdown', (ev) => {
            if (ev.target === backdrop) schliessen(abbrechenWert);
        });
        // Tab-Fokus-Trap innerhalb des Dialogs.
        backdrop.addEventListener('keydown', (ev) => {
            if (ev.key !== 'Tab') return;
            const f = Array.from(dialog.querySelectorAll(FOCUSABLE))
                .filter((el) => el.offsetParent !== null);
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
            else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
        });
        // Enter im Eingabefeld = OK.
        if (feld) {
            feld.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') { ev.preventDefault(); schliessen(feld.value); }
            });
        }
        function aufEsc(ev) { if (ev.key === 'Escape') { ev.preventDefault(); schliessen(abbrechenWert); } }
        document.addEventListener('keydown', aufEsc, true);

        document.body.append(backdrop);
        document.body.classList.add('modal-offen');
        // Fokus: Eingabefeld (markiert) bzw. OK-Knopf.
        if (feld) { feld.focus(); feld.select(); } else { okBtn.focus(); }
    });
}

export function confirmDialog(text, opts = {}) {
    return oeffneDialog({
        titel: opts.titel ?? 'Bestätigen',
        text,
        okLabel: opts.okLabel ?? 'OK',
        gefahr: opts.gefahr ?? 'secondary',
        mitEingabe: false,
    });
}

export function promptDialog(text, opts = {}) {
    return oeffneDialog({
        titel: opts.titel ?? 'Eingabe',
        text,
        okLabel: opts.okLabel ?? 'OK',
        gefahr: opts.gefahr ?? 'secondary',
        mitEingabe: true,
        startwert: opts.wert ?? '',
    }).then((wert) => (wert === null ? null : String(wert).trim()));
}

export function alertDialog(text, opts = {}) {
    return oeffneDialog({
        titel: opts.titel ?? 'Hinweis',
        text,
        okLabel: opts.okLabel ?? 'OK',
        gefahr: 'nur-ok',
        mitEingabe: false,
    }).then(() => undefined);
}

// Nicht-Modul-Aufrufer (admin.php Inline-Nonce-Skript).
window.confirmDialog = confirmDialog;
window.promptDialog = promptDialog;
window.alertDialog = alertDialog;
