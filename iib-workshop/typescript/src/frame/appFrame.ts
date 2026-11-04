import type { WorkshopEventConfig } from '../eventConfig';
import type { ReportMeta } from '../shared/reports';
import type { ThemeMode, ThemePresetId } from '../shared/theme';
import { THEME_PRESETS } from '../shared/theme';
import agStudioLogoUrl from './ag-studio-logo.svg?url';
import { escapeHtml, requireElement } from './html';

const REPORT_ICON = `<svg class="report-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 20v-8M10 20V5M15 20v-5M20 20V9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const PLUS_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const SUN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const QR_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20v-1M20 14h-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const RESET_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.2 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3.4 4.6V10H8.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const QR_BUTTON = `<button type="button" class="topbar-icon" data-qr aria-label="Show this page as a QR code" title="QR code">${QR_ICON}</button>`;

export interface AppFrame {
    /** The element Studio mounts into. */
    studioHost: HTMLElement;
    /**
     * Mark the active report, redrawing the list only when the reports or their names
     * changed, since Studio reports state on every drag frame.
     */
    setReports(reports: ReportMeta[], activeId: string): void;
    /** Reflect a mode Studio was put into from outside the mode switch. */
    setMode(mode: 'view' | 'edit'): void;
    /**
     * Opens the name field on a report. For a report that was just added, Escape discards
     * the report instead of only the edit, so an accidental New report leaves nothing behind.
     */
    renameReport(id: string, isNew?: boolean): void;
    /** Makes the chrome and Studio unreachable, for a dialog that must be answered first. */
    setInert(inert: boolean): void;
}

export interface AppFrameOptions {
    /** The event's name, note and branding. */
    event: Pick<WorkshopEventConfig, 'title' | 'topbarNote' | 'brand'>;
    showQrCode: boolean;
    reports: ReportMeta[];
    activeReportId: string;
    themePreset: ThemePresetId;
    themeMode: ThemeMode;
    onSelectReport(id: string): void;
    onAddReport(): void;
    onRenameReport(id: string, name: string): void;
    onDiscardReport(id: string): void;
    onModeChange(mode: 'view' | 'edit'): void;
    onExportConfig(): void;
    onImportConfig(): void;
    onThemeChange(preset: ThemePresetId, mode: ThemeMode): void;
    onShowQr(): void;
    onReset(): void;
}

/** Builds the shell around Studio. Framework-free so the chrome does not drag in a UI library. */
export function createAppFrame(root: HTMLElement, options: AppFrameOptions): AppFrame {
    const {
        event,
        showQrCode,
        reports,
        activeReportId,
        themePreset,
        themeMode,
        onSelectReport,
        onAddReport,
        onRenameReport,
        onDiscardReport,
        onModeChange,
        onExportConfig,
        onImportConfig,
        onThemeChange,
        onShowQr,
        onReset,
    } = options;
    const { title, topbarNote, brand } = event;
    let currentMode = themeMode;
    const note = escapeHtml(topbarNote);
    const wordmarkAlt = escapeHtml(brand.wordmarkAlt);

    root.innerHTML = `
        <aside class="sidebar">
            <div class="brand">
                <img class="brand-flower" src="${escapeHtml(brand.logoUrl)}" alt="" width="24" height="24" />
                <span class="brand-text">
                    <img
                        class="brand-wordmark brand-wordmark--on-dark"
                        src="${escapeHtml(brand.wordmarkOnDarkUrl)}"
                        alt="${wordmarkAlt}"
                    />
                    <img
                        class="brand-wordmark brand-wordmark--on-light"
                        src="${escapeHtml(brand.wordmarkOnLightUrl)}"
                        alt="${wordmarkAlt}"
                    />
                    <span class="brand-sub">${escapeHtml(brand.subtitle)}</span>
                </span>
            </div>
            <div class="heading">Reports</div>
            <nav class="reports" role="tablist" aria-orientation="vertical" aria-label="Reports"></nav>
            <button type="button" class="new-report" data-add-report>${PLUS_ICON}New report</button>
            <div class="powered-by">
                <span class="powered-by-label">Built with</span>
                <img class="powered-by-logo" src="${agStudioLogoUrl}" alt="AG Studio" width="108" height="25" />
            </div>
        </aside>
        <main class="canvas">
            <div class="topbar">
                <div class="topbar-brand">
                    <span class="topbar-title">${escapeHtml(title)}</span>
                    <span class="topbar-note" title="${note}">${note}</span>
                </div>
                <div class="topbar-actions">
                    <label class="theme-picker">
                        <span class="visually-hidden">Theme</span>
                        <select class="theme-select" data-theme-preset>
                            ${THEME_PRESETS.map(
                                ({ id, label }) =>
                                    `<option value="${id}"${id === themePreset ? ' selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </label>
                    <button type="button" class="topbar-icon" data-theme-mode aria-label="Switch to light mode" aria-pressed="false" title="Light or dark"></button>
                    <span class="topbar-divider" aria-hidden="true"></span>
                    <button type="button" class="topbar-button" data-export title="Export the report configuration">Export</button>
                    <button type="button" class="topbar-button" data-import title="Import a report configuration">Import</button>
                    ${showQrCode ? QR_BUTTON : ''}
                    <button type="button" class="topbar-icon" data-reset aria-label="Discard saved changes and reload the starter" title="Reset to the starter">${RESET_ICON}</button>
                </div>
                <div class="mode-switch" role="group" aria-label="Mode">
                    <button type="button" class="mode-option active" data-mode="view" aria-pressed="true">View</button>
                    <button type="button" class="mode-option" data-mode="edit" aria-pressed="false">Edit</button>
                </div>
            </div>
            <div class="studio-outer"></div>
        </main>`;

    const reportList = requireElement<HTMLElement>(root, '.reports');
    const reportButtons = () => [...reportList.querySelectorAll<HTMLButtonElement>('[data-report-id]')];
    const activeButton = () => reportButtons().find((button) => button.classList.contains('active'));
    let renderedKey = '';
    // Listeners are delegated to the list, because it is rebuilt whenever a report is added, renamed or imported.
    const reportFrom = (target: EventTarget | null) =>
        (target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-report-id]')?.dataset.reportId;

    /** Roving focus: only one report is in the tab order, and the arrow keys move between them. */
    const setTabStop = (target?: HTMLButtonElement) => {
        for (const button of reportButtons()) {
            button.tabIndex = button === target ? 0 : -1;
        }
    };

    const setActiveReport = (id: string) => {
        for (const button of reportButtons()) {
            const isActive = button.dataset.reportId === id;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
            button.tabIndex = isActive ? 0 : -1;
        }
    };

    /** Built with DOM calls rather than markup because a name is whatever the user typed. */
    const createReportButton = ({ id, name }: ReportMeta) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'tab');
        button.className = 'report-item';
        button.dataset.reportId = id;
        button.title = `${name} - double-click to rename`;
        button.innerHTML = `${REPORT_ICON}<span class="report-label"></span>`;
        requireElement(button, '.report-label').textContent = name;
        return button;
    };

    const setReports = (list: ReportMeta[], activeId: string) => {
        const key = JSON.stringify(list);
        if (key === renderedKey) {
            setActiveReport(activeId);
            return;
        }
        renderedKey = key;
        // Rebuilding removes the focused row (a rename commits from it), which would drop focus to the page.
        const focusedId = reportFrom(document.activeElement);
        reportList.replaceChildren(...list.map(createReportButton));
        setActiveReport(activeId);
        reportButtons()
            .find((button) => button.dataset.reportId === focusedId)
            ?.focus();
    };

    const renameReport = (id: string, isNew = false) => {
        const button = reportButtons().find((candidate) => candidate.dataset.reportId === id);
        const label = button?.querySelector<HTMLElement>('.report-label');
        if (!button || !label || button.querySelector('input')) {
            return;
        }
        const previous = label.textContent ?? '';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'report-rename';
        input.value = previous;
        input.setAttribute('aria-label', 'Report name');
        // Hidden rather than removed, so the row keeps its height while the field is open.
        label.style.visibility = 'hidden';
        button.append(input);
        input.focus();
        input.select();

        let settled = false;
        const close = () => {
            settled = true;
            // Removing a focused field drops focus to the page; the row is where it was.
            const hadFocus = document.activeElement === input;
            input.remove();
            label.style.visibility = '';
            if (hadFocus) {
                button.focus();
            }
        };
        const commit = () => {
            if (settled) {
                return;
            }
            const name = input.value.trim() || previous;
            close();
            label.textContent = name;
            button.title = `${name} - double-click to rename`;
            onRenameReport(id, name);
        };
        const cancel = () => {
            if (settled) {
                return;
            }
            close();
            if (isNew) {
                onDiscardReport(id);
            }
        };
        input.addEventListener('keydown', (event) => {
            // Space and Enter would otherwise also press the button the field sits in.
            event.stopPropagation();
            if (event.key === 'Enter') {
                event.preventDefault();
                commit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
            }
        });
        input.addEventListener('click', (event) => event.stopPropagation());
        input.addEventListener('blur', commit);
    };

    reportList.addEventListener('click', (event) => {
        const id = reportFrom(event.target);
        if (!id || id === activeButton()?.dataset.reportId) {
            return;
        }
        setActiveReport(id);
        // Rebuilding a report's charts blocks the main thread; wait a frame so the highlight paints first.
        requestAnimationFrame(() => setTimeout(() => onSelectReport(id)));
    });
    reportList.addEventListener('dblclick', (event) => {
        const id = reportFrom(event.target);
        if (id) {
            renameReport(id);
        }
    });
    // Arrow keys move focus without opening the report, since opening one rebuilds its charts;
    // Enter or Space opens it. F2 renames it, as in a file manager.
    reportList.addEventListener('keydown', (event) => {
        const id = reportFrom(event.target);
        if (!id) {
            return;
        }
        if (event.key === 'F2') {
            event.preventDefault();
            renameReport(id);
            return;
        }
        const buttons = reportButtons();
        const { length } = buttons;
        const index = buttons.findIndex((button) => button.dataset.reportId === id);
        const targets: Record<string, number> = {
            ArrowDown: (index + 1) % length,
            ArrowUp: (index - 1 + length) % length,
            Home: 0,
            End: length - 1,
        };
        const target = buttons[targets[event.key]];
        if (target) {
            event.preventDefault();
            setTabStop(target);
            target.focus();
        }
    });
    // Tabbing back into the list lands on the open report, not the last one an arrow key reached.
    reportList.addEventListener('focusout', (event) => {
        if (!reportList.contains(event.relatedTarget as Node | null)) {
            setTabStop(activeButton());
        }
    });

    setReports(reports, activeReportId);

    const onClick = (selector: string, listener: () => void) =>
        requireElement(root, selector).addEventListener('click', listener);
    onClick('[data-add-report]', onAddReport);
    onClick('[data-export]', onExportConfig);
    onClick('[data-import]', onImportConfig);
    onClick('[data-reset]', onReset);
    if (showQrCode) {
        onClick('[data-qr]', onShowQr);
    }

    const presetSelect = requireElement<HTMLSelectElement>(root, '[data-theme-preset]');
    const modeToggle = requireElement<HTMLButtonElement>(root, '[data-theme-mode]');

    /** The button shows the mode it switches *to*, which is how a light/dark toggle reads. */
    const paintModeToggle = () => {
        const next = currentMode === 'dark' ? 'light' : 'dark';
        modeToggle.innerHTML = currentMode === 'dark' ? SUN_ICON : MOON_ICON;
        modeToggle.setAttribute('aria-label', `Switch to ${next} mode`);
        modeToggle.setAttribute('aria-pressed', String(currentMode === 'light'));
    };
    paintModeToggle();

    presetSelect.addEventListener('change', () => {
        onThemeChange(presetSelect.value as ThemePresetId, currentMode);
    });
    modeToggle.addEventListener('click', () => {
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        paintModeToggle();
        onThemeChange(presetSelect.value as ThemePresetId, currentMode);
    });

    const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-mode]')];
    const setMode = (mode: 'view' | 'edit') => {
        for (const button of modeButtons) {
            const isActive = button.dataset.mode === mode;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        }
    };
    for (const button of modeButtons) {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode as 'view' | 'edit';
            setMode(mode);
            onModeChange(mode);
        });
    }

    const chrome = [requireElement<HTMLElement>(root, '.sidebar'), requireElement<HTMLElement>(root, '.canvas')];

    return {
        studioHost: requireElement<HTMLElement>(root, '.studio-outer'),
        setReports,
        setMode,
        renameReport,
        setInert: (inert) => {
            for (const element of chrome) {
                element.inert = inert;
            }
        },
    };
}
