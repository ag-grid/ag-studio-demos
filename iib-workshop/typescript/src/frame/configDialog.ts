/**
 * Export and import of Studio's report state. Copy and paste is the primary path because a
 * sandboxed published page silently blocks downloads it starts itself; download may fail.
 */
import { requireElement } from './html';
import { createModalFocus } from './modalFocus';

export interface ConfigDialogOptions {
    /** Where the overlay goes: inside the app, so it inherits the app's theme. */
    parent: HTMLElement;
    /** Aborted when the app is destroyed, which removes the document listener. */
    signal: AbortSignal;
    /** Makes the app inert while the dialog is up, so nothing behind it can be reached by Tab. */
    setAppInert(inert: boolean): void;
    getState(): unknown;
    /**
     * Applies a report and resolves with the problems Studio reported, empty when it accepted it.
     * On any problem the previous report must be back in place by the time this resolves.
     */
    importState(state: unknown): Promise<string[]>;
}

export interface ConfigDialog {
    openExport(): void;
    openImport(): void;
}

const isReportState = (value: unknown): boolean => {
    const pages = (value as { pages?: unknown } | null)?.pages;
    return Array.isArray(pages) && pages.length > 0;
};

export function createConfigDialog(options: ConfigDialogOptions): ConfigDialog {
    const { parent, signal, setAppInert, getState, importState } = options;

    const overlay = document.createElement('div');
    overlay.className = 'config-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="config-dialog" role="dialog" aria-modal="true" aria-labelledby="config-heading">
            <div class="config-head">
                <h2 id="config-heading" class="config-title"></h2>
                <button type="button" class="config-close" data-close aria-label="Close">&times;</button>
            </div>
            <p class="config-hint" data-hint></p>
            <textarea class="config-text" data-text spellcheck="false"></textarea>
            <div class="config-status" data-status role="status"></div>
            <div class="config-actions">
                <button type="button" class="config-button" data-copy>Copy to clipboard</button>
                <button type="button" class="config-button" data-download>Download .json</button>
                <button type="button" class="config-button" data-choose-file>Choose file</button>
                <input type="file" accept="application/json,.json" data-file hidden />
                <button type="button" class="config-button config-button-primary" data-apply>Import</button>
            </div>
        </div>`;
    parent.appendChild(overlay);
    const modalFocus = createModalFocus(overlay, setAppInert);

    const el = <T extends HTMLElement>(selector: string) => requireElement<T>(overlay, selector);
    const heading = el<HTMLHeadingElement>('.config-title');
    const hint = el<HTMLParagraphElement>('[data-hint]');
    const text = el<HTMLTextAreaElement>('[data-text]');
    const status = el<HTMLDivElement>('[data-status]');
    const copyBtn = el<HTMLButtonElement>('[data-copy]');
    const downloadBtn = el<HTMLButtonElement>('[data-download]');
    const chooseFileBtn = el<HTMLButtonElement>('[data-choose-file]');
    const fileInput = el<HTMLInputElement>('[data-file]');
    const applyBtn = el<HTMLButtonElement>('[data-apply]');

    const say = (message: string, tone: 'ok' | 'error' | '' = '') => {
        status.textContent = message;
        status.dataset.tone = tone;
    };

    const close = () => {
        // Import closes itself after a delay, by which time the reader may have closed it already.
        if (overlay.hidden) {
            return;
        }
        overlay.hidden = true;
        say('');
        modalFocus.leave();
    };

    const show = () => {
        modalFocus.enter();
        overlay.hidden = false;
    };

    const openExport = () => {
        heading.textContent = 'Export configuration';
        hint.textContent =
            'The full report configuration: pages, widgets, data mappings and layout. Copy it, or save it as a file.';
        text.value = JSON.stringify(getState(), null, 2);
        text.readOnly = true;
        copyBtn.hidden = false;
        downloadBtn.hidden = false;
        chooseFileBtn.hidden = true;
        applyBtn.hidden = true;
        show();
        text.focus();
        text.select();
        // `select()` leaves the caret at the end, scrolling the box to the last line.
        text.scrollTop = 0;
    };

    const openImport = () => {
        heading.textContent = 'Import configuration';
        hint.textContent = 'Paste a configuration exported from this app, or choose a .json file, then Import.';
        text.value = '';
        text.readOnly = false;
        copyBtn.hidden = true;
        downloadBtn.hidden = true;
        chooseFileBtn.hidden = false;
        applyBtn.hidden = false;
        show();
        text.focus();
    };

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(text.value);
            say('Copied.', 'ok');
        } catch {
            // Clipboard access needs a permission the sandbox may withhold; selecting the
            // text leaves the reader one keystroke from copying it themselves.
            text.select();
            say('Could not reach the clipboard. The text is selected - press Cmd/Ctrl+C.', 'error');
        }
    });

    downloadBtn.addEventListener('click', () => {
        try {
            const url = URL.createObjectURL(new Blob([text.value], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'report-config.json';
            a.click();
            URL.revokeObjectURL(url);
            say('If nothing downloaded, this page is sandboxed - use Copy instead.');
        } catch {
            say('Downloads are blocked here. Use Copy to clipboard instead.', 'error');
        }
    });

    // A real button, because a hidden file input wrapped in a label cannot be reached by Tab.
    chooseFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        text.value = await file.text();
        say(`Loaded ${file.name}. Press Import to apply it.`);
        fileInput.value = '';
    });

    applyBtn.addEventListener('click', async () => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(text.value);
        } catch (error) {
            say(`That is not valid JSON: ${(error as Error).message}`, 'error');
            return;
        }
        // Studio swaps a report with no pages for a blank one, so turn it away before handing it over.
        if (!isReportState(parsed)) {
            say('That JSON has no pages, so it is not a report configuration.', 'error');
            return;
        }
        const problems = await importState(parsed);
        if (problems.length > 0) {
            say(`Studio rejected it, so your current report is unchanged: ${problems.join(' ')}`, 'error');
            return;
        }
        say('Imported.', 'ok');
        setTimeout(close, 700);
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close();
    });
    el<HTMLButtonElement>('[data-close]').addEventListener('click', close);
    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape' && !overlay.hidden) close();
        },
        { signal }
    );

    return { openExport, openImport };
}
