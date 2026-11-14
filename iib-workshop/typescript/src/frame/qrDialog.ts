import qrcode from 'qrcode-generator';

import { escapeHtml } from './html';
import { createModalFocus } from './modalFocus';

/** A modal showing the page address as a QR code, for opening the report on a phone. */

export interface QrDialog {
    open(): void;
}

export interface QrDialogOptions {
    /** Where the overlay goes: inside the app, so it inherits the app's theme. */
    parent: HTMLElement;
    /** Aborted when the app is destroyed, which removes the document listener. */
    signal: AbortSignal;
    /** Makes the app inert while the dialog is up, so nothing behind it can be reached by Tab. */
    setAppInert(inert: boolean): void;
}

/**
 * Version 0 lets the library pick the smallest symbol that fits, and 'M' error correction
 * survives a phone camera pointed at a projector screen.
 */
function qrSvg(text: string): string {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

export function createQrDialog(options: QrDialogOptions): QrDialog {
    const { parent, signal, setAppInert } = options;

    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    overlay.hidden = true;
    parent.append(overlay);
    const modalFocus = createModalFocus(overlay, setAppInert);

    const close = () => {
        overlay.hidden = true;
        overlay.innerHTML = '';
        modalFocus.leave();
    };

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay || (event.target as HTMLElement).closest('[data-close]')) {
            close();
        }
    });
    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape' && !overlay.hidden) {
                close();
            }
        },
        { signal }
    );

    const open = () => {
        const url = window.location.href;
        overlay.innerHTML = `
            <div class="share-dialog" role="dialog" aria-modal="true">
                <div class="share-head">
                    <h2 class="share-title">Open this report on your phone</h2>
                    <button type="button" class="share-close" data-close aria-label="Close">&times;</button>
                </div>
                <div class="share-qr">${qrSvg(url)}</div>
                <p class="share-url">${escapeHtml(url)}</p>
                <p class="share-note">
                    The code carries the address of this page, not the report. Anyone scanning it gets
                    the starter as it was published; your own edits live in this browser.
                </p>
            </div>`;
        modalFocus.enter();
        overlay.hidden = false;
        overlay.querySelector<HTMLElement>('button')?.focus();
    };

    return { open };
}
