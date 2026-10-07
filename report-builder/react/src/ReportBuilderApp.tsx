import type { DemoProfile, ReportBuilderStudioOptions } from '@demo/report-builder';
import { createBlankReport, defaultProfile, demoProfiles, reportBuilderReports } from '@demo/report-builder';
import type { AgStudioApi } from 'ag-studio';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Report } from './components/ReportItem';
import { ReportsSidebar } from './components/ReportsSidebar';
import { StudioCanvas } from './components/StudioCanvas';

export interface ReportBuilderAppProps extends ReportBuilderStudioOptions {
    /**
     * Called when the visitor selects a report, with the report now showing. Intended for hosts
     * that reflect the selection somewhere outside the demo, such as the address bar.
     *
     * Deliberately not called for a selection the host drove through `selectedReportId`, nor for
     * the selection changes that follow creating or discarding a report.
     */
    onReportSelect?: (reportId: string) => void;
    /**
     * Drives the demo to this report whenever the value changes. For hosts that own the selected
     * report (from a URL, say) and need to move it from outside - restoring one on a Back press,
     * for instance.
     *
     * It steers the selection rather than owning it outright: the demo still selects a report it
     * has just created, which a host that only mirrors clicks would otherwise veto.
     */
    selectedReportId?: string;
}

/**
 * The Report Builder demo: an analyst-facing app shell in which reports are composed from charts,
 * grids and KPI tiles.
 *
 * React owns the chrome - which report is selected, which persona is signed in, the report list
 * and its names. Studio owns the dashboard, and is driven through its API rather than through
 * props, because its state is far larger than the slice this chrome cares about.
 */
export function ReportBuilderApp({
    onReportSelect,
    selectedReportId: controlledReportId,
    ...studioOptions
}: ReportBuilderAppProps) {
    const { initialReportId } = studioOptions;

    const [api, setApi] = useState<AgStudioApi>();
    const [reports, setReports] = useState<Report[]>(() => reportBuilderReports.map((report) => ({ ...report })));
    const [selectedReportId, setSelectedReportId] = useState(initialReportId ?? reportBuilderReports[0].id);
    const [renamingReportId, setRenamingReportId] = useState<string>();
    const [profile, setProfile] = useState<DemoProfile>(defaultProfile);
    /** Host chrome state, distinct from Studio's own `mode`: is this persona mid-edit-session? */
    const [mode, setMode] = useState<'view' | 'edit'>('edit');
    /** Names new reports in creation order, so they do not renumber as reports come and go. */
    const [reportSeq, setReportSeq] = useState(0);

    const isEditing = profile.access === 'write' && mode === 'edit';

    /** Which report to fall back to if a rename of a brand-new report is abandoned. */
    const restoreReportIdRef = useRef<string>();

    // A host steering the selection from outside, e.g. restoring one on a Back press.
    useEffect(() => {
        if (controlledReportId != null) {
            setSelectedReportId(controlledReportId);
        }
    }, [controlledReportId]);

    // Studio's selected page follows the chrome's. Reconciled in an effect rather than in each
    // handler so a host-driven selection and the demo's own take the same path.
    useEffect(() => {
        if (!api) return;
        const state = api.getState();
        if (state.selectedPageId !== selectedReportId) {
            api.setState({ ...state, selectedPageId: selectedReportId });
        }
    }, [api, selectedReportId]);

    // The signed-in persona's access decides whether Studio is editable.
    useEffect(() => {
        api?.setProperty('mode', isEditing ? 'edit' : 'view');
    }, [api, isEditing]);

    // Keep the selected report in view, scoping the scroll to the sidebar list (never the page)
    // so the demo layout stays put.
    useEffect(() => {
        document
            .querySelector<HTMLElement>(`.agd-rb-reports-nav [data-report-id="${selectedReportId}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [selectedReportId]);

    const selectReport = useCallback(
        (reportId: string) => {
            setSelectedReportId(reportId);
            onReportSelect?.(reportId);
        },
        [onReportSelect]
    );

    /**
     * New report is chrome, not a Studio feature: it appends a blank page through the public API
     * and names it in the sidebar itself, Studio pages carrying no display name.
     */
    const addReport = useCallback(() => {
        if (!api) return;

        const state = api.getState();
        restoreReportIdRef.current = state.selectedPageId;

        const seq = reportSeq + 1;
        const id = `page-${seq}`;
        api.setState({ ...state, pages: [...state.pages, createBlankReport(id)], selectedPageId: id });

        setReportSeq(seq);
        setReports((current) => [...current, { id, name: `Report ${seq}` }]);
        setSelectedReportId(id);
        setRenamingReportId(id);
    }, [api, reportSeq]);

    const renameReport = useCallback((reportId: string, name: string) => {
        setRenamingReportId(undefined);
        setReports((current) => current.map((report) => (report.id === reportId ? { ...report, name } : report)));
    }, []);

    const discardReport = useCallback(
        (reportId: string) => {
            setRenamingReportId(undefined);
            setReports((current) => current.filter((report) => report.id !== reportId));

            if (!api) return;
            const state = api.getState();
            const pages = state.pages.filter((page) => page.id !== reportId);
            const restore = restoreReportIdRef.current;
            const fallback = pages[pages.length - 1]?.id ?? state.selectedPageId;
            const nextId = restore != null && pages.some((page) => page.id === restore) ? restore : fallback;

            api.setState({ ...state, pages, selectedPageId: nextId });
            setSelectedReportId(nextId);
        },
        [api]
    );

    /**
     * Switching profile switches access and the edit session together: the Analyst profile opens
     * an edit session immediately; the Viewer profile returns to a plain view.
     */
    const changeProfile = useCallback((profileId: string) => {
        const next = demoProfiles.find((candidate) => candidate.id === profileId);
        if (!next) return;
        setProfile(next);
        setMode(next.access === 'write' ? 'edit' : 'view');
    }, []);

    // The root's access and edit classes expose the chrome's state to CSS.
    const rootClasses = [
        'agd-rb',
        profile.access === 'write' ? 'access-write' : 'access-view',
        mode === 'edit' ? 'edit-active' : 'view-active',
    ].join(' ');

    return (
        <div className={rootClasses}>
            <div className="agd-rb-body">
                <ReportsSidebar
                    reports={reports}
                    selectedReportId={selectedReportId}
                    renamingReportId={renamingReportId}
                    isEditing={isEditing}
                    profiles={demoProfiles}
                    currentProfile={profile}
                    onSelectReport={selectReport}
                    onAddReport={addReport}
                    onRenameReport={renameReport}
                    onDiscardReport={discardReport}
                    onChangeProfile={changeProfile}
                />
                <main className="agd-rb-canvas-wrap">
                    <StudioCanvas {...studioOptions} onReady={setApi} />
                </main>
            </div>
        </div>
    );
}
