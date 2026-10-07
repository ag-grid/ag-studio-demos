import type { DemoProfile, ReportBuilderStudioOptions } from '@demo/report-builder';
import {
    BRAND,
    createBlankReport,
    createReportBuilderStudio,
    defaultProfile,
    demoProfiles,
    reportBuilderReports,
} from '@demo/report-builder';
import type { AgStudioApi } from 'ag-studio';

import type { ReportBuilderChrome } from './chrome';
import { createChrome, createReportButton, reportLabel, setReportName } from './chrome';

export interface ReportBuilderDemoOptions extends ReportBuilderStudioOptions {
    /**
     * Element the demo renders into. The chrome is appended to it and removed again on destroy;
     * the demo never touches anything outside it.
     */
    container: HTMLElement;
    /**
     * Called when the visitor selects a report, with the report now showing. Intended for hosts
     * that reflect the selection somewhere outside the demo, such as the address bar.
     *
     * Deliberately not called for a selection the host itself drove through `selectReport`, nor
     * for the selection changes that follow creating or discarding a report.
     */
    onReportSelect?: (reportId: string) => void;
}

export interface ReportBuilderDemo {
    /** The underlying Studio instance, for hosts that drive it further. */
    readonly api: AgStudioApi;
    /** Show a report, without calling back into `onReportSelect`. */
    selectReport: (reportId: string) => void;
    /** Tear down Studio, the chrome and every listener the demo registered. */
    destroy: () => void;
}

class ReportBuilderDemoImpl implements ReportBuilderDemo {
    public readonly api: AgStudioApi;

    private readonly chrome: ReportBuilderChrome;
    private readonly onReportSelect?: (reportId: string) => void;

    /** Cleanups for listeners outside the chrome's own subtree, which removal alone would leave behind. */
    private readonly teardowns: (() => void)[] = [];

    /**
     * Host-owned chrome state, distinct from Studio's own `mode` property: which persona is
     * signed in, and whether their editor access is mid-edit-session.
     */
    private currentProfile: DemoProfile = defaultProfile;
    private currentMode: 'view' | 'edit' = 'edit';
    private reportSeq = 0;

    constructor(options: ReportBuilderDemoOptions) {
        const { container, onReportSelect, ...studioOptions } = options;
        const { initialReportId } = studioOptions;

        this.onReportSelect = onReportSelect;

        this.chrome = createChrome(container, {
            reports: reportBuilderReports,
            profiles: demoProfiles,
            defaultProfile,
            brand: BRAND,
        });

        this.api = createReportBuilderStudio(this.chrome.canvas, studioOptions);

        if (initialReportId) {
            this.updateReportDisplay(initialReportId);
        }

        this.wireControls();

        // Paint the initial chrome now that `api` is assigned, which render() reads.
        this.render();
    }

    public selectReport(reportId: string): void {
        this.applyReport(reportId);
    }

    public destroy(): void {
        this.teardowns.forEach((teardown) => teardown());
        this.teardowns.length = 0;
        this.api.destroy();
        this.chrome.root.remove();
    }

    /** Move Studio and the sidebar to `reportId`, without notifying the host. */
    private applyReport(reportId: string): void {
        const state = this.api.getState();
        if (state.selectedPageId !== reportId) {
            this.api.setState({ ...state, selectedPageId: reportId });
        }
        this.updateReportDisplay(reportId);
    }

    /** A selection the visitor made, which the host may want to reflect elsewhere. */
    private selectReportFromUser(reportId: string): void {
        this.applyReport(reportId);
        this.onReportSelect?.(reportId);
    }

    private updateReportDisplay(reportId: string): void {
        let active: HTMLElement | undefined;

        this.chrome.reportsNav.querySelectorAll<HTMLElement>('[data-report-id]').forEach((item) => {
            const isActive = item.dataset.reportId === reportId;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
            // Roving tabindex: only the selected report is in the tab sequence; the rest are
            // reached with the arrow keys (see wireKeyboardNav).
            item.tabIndex = isActive ? 0 : -1;
            if (isActive) {
                active = item;
            }
        });

        // Keep the active report visible, scoping the scroll to the sidebar list (never the
        // page) so the demo layout stays put.
        active?.scrollIntoView({ block: 'nearest' });
    }

    /**
     * New report is chrome, not a Studio feature: it appends a blank page through the public
     * API and names it in the sidebar itself, Studio pages carrying no display name.
     */
    private addReport(): void {
        const state = this.api.getState();
        const restoreSelected = state.selectedPageId;
        const seq = ++this.reportSeq;
        const id = `page-${seq}`;

        this.api.setState({
            ...state,
            pages: [...state.pages, createBlankReport(id)],
            selectedPageId: id,
        });

        const button = createReportButton(id, `Report ${seq}`, false);
        this.wireReportButton(button);
        this.chrome.reportsNav.appendChild(button);

        this.updateReportDisplay(id);
        this.beginRename(button, { isNew: true, restoreSelected });
    }

    private wireReportButton(button: HTMLButtonElement): void {
        const id = button.dataset.reportId!;
        button.addEventListener('click', () => this.selectReportFromUser(id));
        button.addEventListener('dblclick', () => {
            if (this.currentMode === 'edit') {
                this.beginRename(button, { isNew: false });
            }
        });
    }

    private beginRename(
        button: HTMLButtonElement,
        { isNew, restoreSelected }: { isNew: boolean; restoreSelected?: string }
    ): void {
        if (button.querySelector('input')) {
            return;
        }

        const previousName = button.dataset.text ?? '';
        const label = reportLabel(button);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'agd-rb-rename-input';
        input.value = previousName;
        // Hidden, not removed from flow, so the item keeps its size while editing.
        label.style.visibility = 'hidden';
        button.appendChild(input);
        input.focus();
        input.select();

        let settled = false;
        const finish = (name: string) => {
            input.remove();
            label.style.visibility = '';
            setReportName(button, name);
        };
        const commit = () => {
            if (settled) return;
            settled = true;
            finish(input.value.trim() || previousName);
        };
        const discard = () => {
            if (settled) return;
            settled = true;
            if (isNew) {
                this.discardReport(button, restoreSelected);
            } else {
                finish(previousName);
            }
        };

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                commit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                discard();
            }
        });
        input.addEventListener('blur', commit);
    }

    private discardReport(button: HTMLButtonElement, restoreSelected?: string): void {
        const id = button.dataset.reportId;
        button.remove();

        const state = this.api.getState();
        const pages = state.pages.filter((page) => page.id !== id);
        const fallback = pages[pages.length - 1]?.id ?? state.selectedPageId;
        const selectedPageId =
            restoreSelected != null && pages.some((page) => page.id === restoreSelected) ? restoreSelected : fallback;

        this.api.setState({ ...state, pages, selectedPageId });
        this.updateReportDisplay(selectedPageId);
    }

    /**
     * Arrow-key navigation for the vertical report list (roving focus, selection follows focus).
     * Home/End jump to the first/last report. The rename input is left alone so its own caret
     * movement still works.
     */
    private wireKeyboardNav(): void {
        const { reportsNav } = this.chrome;

        reportsNav.addEventListener('keydown', (event) => {
            if ((event.target as HTMLElement).tagName === 'INPUT') {
                return;
            }

            const items = [...reportsNav.querySelectorAll<HTMLElement>('[role="tab"]')];
            if (items.length === 0) {
                return;
            }
            const current = items.findIndex((item) => item === document.activeElement);

            let next = current;
            if (event.key === 'ArrowDown') next = (current + 1) % items.length;
            else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = items.length - 1;
            else return;

            event.preventDefault();
            const target = items[next];
            target.focus();
            if (target.dataset.reportId) {
                this.selectReportFromUser(target.dataset.reportId);
            }
        });
    }

    /**
     * Switching profile switches access and the edit session together: the Analyst profile opens
     * an edit session immediately; the Viewer profile returns to a plain view.
     */
    private setProfile(profileId: string): void {
        const profile = demoProfiles.find((candidate) => candidate.id === profileId);
        if (!profile) {
            return;
        }

        this.currentProfile = profile;
        this.currentMode = profile.access === 'write' ? 'edit' : 'view';
        this.render();
    }

    /**
     * Single source of truth for the chrome: the root's `access-` and `edit-` classes expose the
     * host state to CSS, and the New report button and Studio mode follow the signed-in profile.
     */
    private render(): void {
        const { currentProfile, currentMode, chrome } = this;
        const isEditing = currentProfile.access === 'write' && currentMode === 'edit';

        chrome.root.classList.toggle('access-write', currentProfile.access === 'write');
        chrome.root.classList.toggle('access-view', currentProfile.access === 'view');
        chrome.root.classList.toggle('edit-active', currentMode === 'edit');
        chrome.root.classList.toggle('view-active', currentMode === 'view');

        this.renderProfileSwitcher();

        chrome.addReportButton.style.display = isEditing ? '' : 'none';

        this.api.setProperty('mode', isEditing ? 'edit' : 'view');
    }

    /**
     * The account button mirrors the signed-in profile; the menu marks it as the checked radio
     * item and holds the roving tab stop.
     */
    private renderProfileSwitcher(): void {
        const { currentProfile, chrome } = this;

        chrome.profileAvatar.textContent = currentProfile.initials;
        chrome.profileName.textContent = currentProfile.name;
        chrome.profileRole.textContent = currentProfile.role;

        chrome.profileMenu.querySelectorAll<HTMLElement>('[data-profile-id]').forEach((option) => {
            const isActive = option.dataset.profileId === currentProfile.id;
            option.setAttribute('aria-checked', isActive ? 'true' : 'false');
            option.tabIndex = isActive ? 0 : -1;
        });
    }

    private setProfileMenuOpen(open: boolean): void {
        const { profileButton, profileMenu } = this.chrome;

        profileMenu.hidden = !open;
        profileButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
            profileMenu.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
        }
    }

    /**
     * Menu behaviour: arrow keys move between profiles, Escape closes and returns focus to the
     * account button, a pointer press outside dismisses it.
     */
    private wireProfileSwitcher(): void {
        const { profileButton, profileMenu } = this.chrome;

        profileButton.addEventListener('click', () => this.setProfileMenuOpen(profileMenu.hidden));

        profileMenu.querySelectorAll<HTMLButtonElement>('[data-profile-id]').forEach((option) => {
            option.addEventListener('click', () => {
                this.setProfile(option.dataset.profileId!);
                this.setProfileMenuOpen(false);
                profileButton.focus();
            });
        });

        profileMenu.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.setProfileMenuOpen(false);
                profileButton.focus();
                return;
            }

            const options = [...profileMenu.querySelectorAll<HTMLElement>('[data-profile-id]')];
            const current = options.findIndex((option) => option === document.activeElement);

            let next = current;
            if (event.key === 'ArrowDown') next = (current + 1) % options.length;
            else if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
            else return;

            event.preventDefault();
            options[next].focus();
        });

        // On `document`, so it outlives the chrome's subtree and needs an explicit teardown.
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!profileMenu.hidden && !profileMenu.contains(target) && !profileButton.contains(target)) {
                this.setProfileMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        this.teardowns.push(() => document.removeEventListener('pointerdown', onPointerDown));
    }

    private wireControls(): void {
        this.chrome.reportsNav
            .querySelectorAll<HTMLButtonElement>('[data-report-id]')
            .forEach((button) => this.wireReportButton(button));

        this.wireProfileSwitcher();
        this.chrome.addReportButton.addEventListener('click', () => this.addReport());
        this.wireKeyboardNav();
    }
}

/**
 * Mount the Report Builder demo: an analyst-facing app shell in which reports are composed from
 * charts, grids and KPI tiles.
 */
export function createReportBuilderDemo(options: ReportBuilderDemoOptions): ReportBuilderDemo {
    return new ReportBuilderDemoImpl(options);
}
