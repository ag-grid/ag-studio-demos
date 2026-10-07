import type { DemoProfile } from '@demo/report-builder';
import { BRAND } from '@demo/report-builder';
import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

import { ProfileSwitcher } from './ProfileSwitcher';
import type { Report } from './ReportItem';
import { ReportItem } from './ReportItem';
import { PlusIcon } from './icons';

interface Props {
    reports: ReadonlyArray<Report>;
    selectedReportId: string;
    /** Report opened in rename mode, as a freshly created one is. */
    renamingReportId?: string;
    /** Whether the signed-in persona is mid-edit-session, which gates New report and renaming. */
    isEditing: boolean;
    profiles: ReadonlyArray<DemoProfile>;
    currentProfile: DemoProfile;
    onSelectReport: (reportId: string) => void;
    onAddReport: () => void;
    onRenameReport: (reportId: string, name: string) => void;
    onDiscardReport: (reportId: string) => void;
    onChangeProfile: (profileId: string) => void;
}

export function ReportsSidebar({
    reports,
    selectedReportId,
    renamingReportId,
    isEditing,
    profiles,
    currentProfile,
    onSelectReport,
    onAddReport,
    onRenameReport,
    onDiscardReport,
    onChangeProfile,
}: Props) {
    const navRef = useRef<HTMLElement>(null);

    /**
     * Arrow-key navigation for the vertical report list: roving focus, with selection following
     * focus. Home/End jump to the first and last report. The rename input is left alone so its own
     * caret movement still works.
     */
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if ((event.target as HTMLElement).tagName === 'INPUT') return;

        const items = [...(navRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
        if (items.length === 0) return;
        const index = items.findIndex((item) => item === document.activeElement);

        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else return;

        event.preventDefault();
        const target = items[next];
        target.focus();
        if (target.dataset.reportId) onSelectReport(target.dataset.reportId);
    };

    return (
        <aside className="agd-rb-sidebar">
            <div className="agd-rb-brand">
                {BRAND.name}
                <span className="agd-rb-brand-accent">{BRAND.accent}</span>
            </div>
            <div className="agd-rb-sidebar-heading">Reports</div>

            <nav
                ref={navRef}
                className="agd-rb-reports-nav"
                role="tablist"
                aria-orientation="vertical"
                aria-label="Reports"
                onKeyDown={onKeyDown}
            >
                {reports.map((report) => (
                    <ReportItem
                        key={report.id}
                        report={report}
                        isActive={report.id === selectedReportId}
                        canRename={isEditing}
                        renameOnMount={report.id === renamingReportId}
                        onSelect={() => onSelectReport(report.id)}
                        onRename={(name) => onRenameReport(report.id, name)}
                        onRenameCancelled={() => onDiscardReport(report.id)}
                    />
                ))}
            </nav>

            {isEditing && (
                <button type="button" className="agd-rb-new-report" onClick={onAddReport}>
                    <PlusIcon className="agd-rb-new-report-icon" />
                    New report
                </button>
            )}

            <ProfileSwitcher profiles={profiles} current={currentProfile} onChange={onChangeProfile} />
        </aside>
    );
}
