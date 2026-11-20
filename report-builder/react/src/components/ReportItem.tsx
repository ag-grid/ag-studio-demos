import { useEffect, useRef, useState } from 'react';

import { ReportIcon } from './icons';

export interface Report {
    id: string;
    name: string;
}

interface Props {
    report: Report;
    isActive: boolean;
    /** Whether a double-click should start a rename. Only the editing persona may. */
    canRename: boolean;
    /** Opens in rename mode, as a freshly created report does. */
    renameOnMount?: boolean;
    onSelect: () => void;
    onRename: (name: string) => void;
    /** Abandoning the rename of a brand-new report discards the report itself. */
    onRenameCancelled: () => void;
}

/**
 * One report in the sidebar, renameable in place.
 *
 * The input is absolutely positioned over the label rather than replacing it, and the label is
 * hidden rather than unmounted, so entering rename mode never resizes the item or the sidebar.
 */
export function ReportItem({
    report,
    isActive,
    canRename,
    renameOnMount,
    onSelect,
    onRename,
    onRenameCancelled,
}: Props) {
    const [isRenaming, setIsRenaming] = useState(renameOnMount ?? false);
    const [draft, setDraft] = useState(report.name);
    const inputRef = useRef<HTMLInputElement>(null);
    // Commit and cancel both fire from a blur race with keydown; this keeps the first one.
    const settledRef = useRef(false);

    useEffect(() => {
        if (!isRenaming) return;
        settledRef.current = false;
        setDraft(report.name);
        inputRef.current?.focus();
        inputRef.current?.select();
    }, [isRenaming, report.name]);

    const commit = () => {
        if (settledRef.current) return;
        settledRef.current = true;
        setIsRenaming(false);
        onRename(draft.trim() || report.name);
    };

    const cancel = () => {
        if (settledRef.current) return;
        settledRef.current = true;
        setIsRenaming(false);
        if (renameOnMount) {
            onRenameCancelled();
        }
    };

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            // Roving tabindex: only the selected report is in the tab sequence; the rest are
            // reached with the arrow keys (see ReportsSidebar).
            tabIndex={isActive ? 0 : -1}
            title={report.name}
            data-report-id={report.id}
            className={`agd-rb-report-item${isActive ? ' active' : ''}`}
            onClick={onSelect}
            onDoubleClick={() => {
                if (canRename) setIsRenaming(true);
            }}
        >
            <ReportIcon className="agd-rb-report-icon" />
            <span className="agd-rb-report-label" style={isRenaming ? { visibility: 'hidden' } : undefined}>
                {report.name}
            </span>
            {isRenaming && (
                <input
                    ref={inputRef}
                    type="text"
                    className="agd-rb-rename-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commit}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            commit();
                        } else if (event.key === 'Escape') {
                            event.preventDefault();
                            cancel();
                        }
                    }}
                />
            )}
        </button>
    );
}
