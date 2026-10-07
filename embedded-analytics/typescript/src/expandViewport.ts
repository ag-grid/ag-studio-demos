import type { ViewportKey } from '@demo/embedded-analytics';
import { VIEWPORT_TITLES, lockBodyScroll } from '@demo/embedded-analytics';

/**
 * Expanding a viewport for editing.
 *
 * The editor has to leave the tear sheet: the sheet is a scaled surface, which traps a
 * `position: fixed` overlay, and Studio's own popups attach to `<body>`. So the overlay is built
 * in `<body>`, with its own Studio instance seeded from what the card is showing - the card's
 * instance stays where it is, untouched, until Save applies the editor's state to it.
 */

export interface ExpandedOverlay {
    key: ViewportKey;
    root: HTMLElement;
    /** Where the editor's own Studio instance mounts. */
    slot: HTMLElement;
    saveButton: HTMLButtonElement;
    cancelButton: HTMLButtonElement;
    /** Takes the overlay out of the document and releases the background scroll lock. */
    close: () => void;
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

/** Build the expanded editor in `<body>` and open it, with an empty slot for its Studio instance. */
export function openExpandedOverlay(key: ViewportKey): ExpandedOverlay {
    const root = el('div', 'agd-ea-viewport agd-ea-viewport-expanded');
    root.dataset.viewport = key;

    const panel = el('div', 'agd-ea-viewport-panel');

    const header = el('div', 'agd-ea-viewport-header');
    header.appendChild(el('span', 'agd-ea-viewport-header-title', `Edit ${VIEWPORT_TITLES[key]}`));

    const slot = el('div', 'agd-ea-viewport-slot');

    const footer = el('div', 'agd-ea-viewport-footer');
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'button-secondary';
    cancelButton.textContent = 'Cancel';
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button';
    saveButton.textContent = 'Save';
    footer.append(cancelButton, saveButton);

    panel.append(header, slot, footer);
    root.appendChild(panel);

    document.body.appendChild(root);
    const releaseScrollLock = lockBodyScroll();

    return {
        key,
        root,
        slot,
        saveButton,
        cancelButton,
        close: () => {
            root.remove();
            releaseScrollLock();
        },
    };
}
