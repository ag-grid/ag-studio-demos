import { Component, computed, effect, input, output, signal } from '@angular/core';
import type { AgStudioApi } from 'ag-studio';

import type { Report } from './components/report-item.component';
import { ReportsSidebarComponent } from './components/reports-sidebar.component';
import { StudioCanvasComponent } from './components/studio-canvas.component';
import type { DemoProfile, ReportBuilderStudioOptions } from './shared';
import { createBlankReport, defaultProfile, demoProfiles, reportBuilderReports } from './shared';

/**
 * The Report Builder demo: an analyst-facing app shell in which reports are composed from charts,
 * grids and KPI tiles.
 *
 * Angular owns the chrome - which report is selected, which persona is signed in, the report list
 * and its names. Studio owns the dashboard, and is driven through its API rather than through
 * inputs, because its state is far larger than the slice this chrome cares about.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [ReportsSidebarComponent, StudioCanvasComponent],
    template: `
        <div class="agd-rb" [class]="stateClasses()">
            <div class="agd-rb-body">
                <app-reports-sidebar
                    [reports]="reports()"
                    [selectedReportId]="selectedReportId()"
                    [renamingReportId]="renamingReportId()"
                    [isEditing]="isEditing()"
                    [profiles]="profiles"
                    [currentProfile]="profile()"
                    (selectReport)="selectReport($event)"
                    (addReport)="addReport()"
                    (renameReport)="renameReport($event.reportId, $event.name)"
                    (discardReport)="discardReport($event)"
                    (changeProfile)="changeProfile($event)"
                />
                <main class="agd-rb-canvas-wrap">
                    <app-studio-canvas [options]="options()" (ready)="api.set($event)" />
                </main>
            </div>
        </div>
    `,
})
export class AppComponent {
    public readonly options = input<ReportBuilderStudioOptions>({});
    /**
     * Drives the demo to this report whenever the value changes. For hosts that own the selected
     * report (from a URL, say) and need to move it from outside.
     */
    public readonly selectedReport = input<string | undefined>(undefined);
    /**
     * The visitor selected a report. Not emitted for a selection the host drove through
     * `selectedReport`, nor for the selection changes that follow creating or discarding one.
     */
    public readonly reportSelect = output<string>();

    protected readonly api = signal<AgStudioApi | undefined>(undefined);
    protected readonly reports = signal<Report[]>(reportBuilderReports.map((report) => ({ ...report })));
    protected readonly selectedReportId = signal(reportBuilderReports[0].id);
    protected readonly renamingReportId = signal<string | undefined>(undefined);
    protected readonly profile = signal<DemoProfile>(defaultProfile);
    /** Host chrome state, distinct from Studio's own `mode`: is this persona mid-edit-session? */
    protected readonly mode = signal<'view' | 'edit'>('edit');
    protected readonly profiles = demoProfiles;

    protected readonly isEditing = computed(() => this.profile().access === 'write' && this.mode() === 'edit');

    /** The root's access and edit classes expose the chrome's state to CSS. */
    protected readonly stateClasses = computed(() => ({
        'access-write': this.profile().access === 'write',
        'access-view': this.profile().access === 'view',
        'edit-active': this.mode() === 'edit',
        'view-active': this.mode() === 'view',
    }));

    /** Names new reports in creation order, so they do not renumber as reports come and go. */
    private reportSeq = 0;
    /** Which report to fall back to if a rename of a brand-new report is abandoned. */
    private restoreReportId?: string;

    constructor() {
        // The demo opens on whichever report its options nominate.
        effect(() => {
            const initial = this.options().initialReportId;
            if (initial) {
                this.selectedReportId.set(initial);
            }
        });

        // A host steering the selection from outside, e.g. restoring one on a Back press.
        effect(() => {
            const reportId = this.selectedReport();
            if (reportId) {
                this.selectedReportId.set(reportId);
            }
        });

        // Studio's selected page follows the chrome's, wherever the change came from.
        effect(() => {
            const api = this.api();
            const reportId = this.selectedReportId();
            if (!api) return;

            const state = api.getState();
            if (state.selectedPageId !== reportId) {
                api.setState({ ...state, selectedPageId: reportId });
            }

            // Keep the selected report in view, scoping the scroll to the sidebar list.
            document
                .querySelector<HTMLElement>(`.agd-rb-reports-nav [data-report-id="${reportId}"]`)
                ?.scrollIntoView({ block: 'nearest' });
        });

        // The signed-in persona's access decides whether Studio is editable.
        effect(() => this.api()?.setProperty('mode', this.isEditing() ? 'edit' : 'view'));
    }

    protected selectReport(reportId: string): void {
        this.selectedReportId.set(reportId);
        this.reportSelect.emit(reportId);
    }

    /**
     * New report is chrome, not a Studio feature: it appends a blank page through the public API
     * and names it in the sidebar itself, Studio pages carrying no display name.
     */
    protected addReport(): void {
        const api = this.api();
        if (!api) return;

        const state = api.getState();
        this.restoreReportId = state.selectedPageId;

        const seq = ++this.reportSeq;
        const id = `page-${seq}`;
        api.setState({ ...state, pages: [...state.pages, createBlankReport(id)], selectedPageId: id });

        this.reports.update((reports) => [...reports, { id, name: `Report ${seq}` }]);
        this.selectedReportId.set(id);
        this.renamingReportId.set(id);
    }

    protected renameReport(reportId: string, name: string): void {
        this.renamingReportId.set(undefined);
        this.reports.update((reports) =>
            reports.map((report) => (report.id === reportId ? { ...report, name } : report))
        );
    }

    protected discardReport(reportId: string): void {
        this.renamingReportId.set(undefined);
        this.reports.update((reports) => reports.filter((report) => report.id !== reportId));

        const api = this.api();
        if (!api) return;

        const state = api.getState();
        const pages = state.pages.filter((page) => page.id !== reportId);
        const restore = this.restoreReportId;
        const fallback = pages[pages.length - 1]?.id ?? state.selectedPageId;
        const nextId = restore != null && pages.some((page) => page.id === restore) ? restore : fallback;

        api.setState({ ...state, pages, selectedPageId: nextId });
        this.selectedReportId.set(nextId);
    }

    /**
     * Switching profile switches access and the edit session together: the Analyst profile opens
     * an edit session immediately; the Viewer profile returns to a plain view.
     */
    protected changeProfile(profileId: string): void {
        const next = demoProfiles.find((candidate) => candidate.id === profileId);
        if (!next) return;
        this.profile.set(next);
        this.mode.set(next.access === 'write' ? 'edit' : 'view');
    }
}
