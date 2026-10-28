import type { AgConditionDefinition, AgDataEngine, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import type { AgStudioReactProperties } from 'ag-studio-react';
import { AgStudio, createWidgets } from 'ag-studio-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { CompanyView, PeerGroup, PeerGroupRegistry } from '../shared';
import {
    ANALYST_CONSENSUS_WIDGET,
    DISCLAIMER,
    buildCompanyView,
    companyReportProperties,
    formatAsOf,
    printCompanyReport,
    showCompanyReport,
} from '../shared';
import { AnalystConsensus } from './AnalystConsensus';

export interface CompanyReportPopupParams {
    filter: AgConditionDefinition;
    group: PeerGroup;
    dataEngine: AgDataEngine;
    studioOverrides?: Partial<AgStudioProperties>;
}

const widgets = (widgetConfig: AgWidgetsConfig<PeerGroupRegistry>) =>
    createWidgets<PeerGroupRegistry>({
        additionalTypes: [{ ...ANALYST_CONSENSUS_WIDGET, comp: AnalystConsensus }],
        menu: [{ label: 'Custom', widgetIds: ['analystConsensus'] }, ...widgetConfig.menu],
    });

/** The host's own heading for the report: who the company is and where its share price stands. */
function Masthead({ name, logoUrl, tagline, lastClose, change, direction, range52w }: CompanyView) {
    return (
        <header className="agd-ea-report-masthead">
            <img className="agd-ea-report-masthead-logo" src={logoUrl} alt="" />
            <div className="agd-ea-report-masthead-identity">
                <div className="agd-ea-report-masthead-name">{name}</div>
                <div className="agd-ea-report-masthead-tagline">{tagline}</div>
            </div>
            <div className="agd-ea-range">
                <div className="agd-ea-report-masthead-label">52-Week Range</div>
                <div className="agd-ea-range-track">
                    <span
                        className="agd-ea-range-marker"
                        style={{ left: `${Math.min(Math.max(range52w.position, 0), 1) * 100}%` }}
                    />
                </div>
                <div className="agd-ea-range-ends">
                    <span>{range52w.low}</span>
                    <span>{range52w.high}</span>
                </div>
            </div>
            <div className="agd-ea-report-masthead-price">
                <div className="agd-ea-report-masthead-close">{lastClose}</div>
                <div className="agd-ea-report-masthead-change" data-direction={direction}>
                    {change}
                </div>
                <div className="agd-ea-report-masthead-label">Last Close</div>
            </div>
        </header>
    );
}

/**
 * The popup a drill-through opens: an A4 landscape page, with the company report in a Studio of its
 * own between the host's masthead and footer, and the host's toolbar above it.
 */
export function CompanyReportPopup({ filter, group, dataEngine, studioOverrides }: CompanyReportPopupParams) {
    const studio = useRef<AgStudio<PeerGroupRegistry>>(null);
    const shownFilter = useRef(filter);
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    // The report's opening properties only. Another company is shown through the API, so drilling
    // through again does not remount the report.
    const [studioProperties] = useState((): AgStudioReactProperties<PeerGroupRegistry> => ({
        ...companyReportProperties(dataEngine, filter, { studioOverrides }),
        widgets,
    }));

    useEffect(() => {
        const api = studio.current?.api;
        if (!api || shownFilter.current === filter) return;
        shownFilter.current = filter;
        showCompanyReport(api, filter);
    }, [filter]);

    const company = useMemo(() => buildCompanyView(group, String(filter.value)), [group, filter]);
    const asOf = useMemo(() => formatAsOf(), []);

    return (
        <div className="agd-ea-report">
            <div className="agd-ea-report-toolbar">
                <button
                    type="button"
                    className="agd-ea-button"
                    onClick={() => setMode((current) => (current === 'edit' ? 'view' : 'edit'))}
                >
                    {mode === 'edit' ? 'View Mode' : 'Edit Mode'}
                </button>
                <button type="button" className="agd-ea-button agd-ea-button-primary" onClick={printCompanyReport}>
                    Print
                </button>
            </div>
            <article className="agd-ea-report-page" data-print-root>
                {company && <Masthead {...company} />}
                <AgStudio<PeerGroupRegistry>
                    ref={studio}
                    className="agd-ea-report-mount"
                    studioProperties={studioProperties}
                    mode={mode}
                />
                <footer className="agd-ea-report-footer">
                    <span>{DISCLAIMER}</span>
                    <span>Figures as of {asOf}</span>
                </footer>
            </article>
        </div>
    );
}
