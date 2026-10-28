import type { AgWidgetParams } from 'ag-studio';
import { useEffect, useRef, useState } from 'react';

import type { HeadlineKpiDef, HeadlineKpiView } from '../shared';
import { loadHeadlineKpi } from '../shared';

/** The Headline KPI custom widget: a measure for its latest period, its change, and its target. */
export function HeadlineKpi(params: AgWidgetParams<HeadlineKpiDef>) {
    const [view, setView] = useState<HeadlineKpiView>();
    const hasLoaded = useRef(false);

    // Studio hands over new params on every refresh, so each one loads again.
    useEffect(() => {
        let current = true;
        loadHeadlineKpi(params, hasLoaded.current, () => current).then((next) => {
            if (!current) return;
            hasLoaded.current = next != null;
            setView(next);
        });
        return () => {
            current = false;
        };
    }, [params]);

    const change = view?.change;
    const target = view?.target;
    return (
        <div className="agd-kpi">
            <div className="agd-kpi-value">{view?.value}</div>
            {change && (
                <div className="agd-kpi-change">
                    <span
                        className="agd-kpi-change-label"
                        data-direction={change.direction}
                        data-sentiment={change.sentiment}
                    >
                        {change.label}
                    </span>
                    <span className="agd-kpi-comparison">{change.comparison}</span>
                </div>
            )}
            {target && (
                <div className="agd-kpi-target">
                    <div className="agd-kpi-target-track">
                        <div className="agd-kpi-target-fill" style={{ width: `${target.percent}%` }} />
                    </div>
                    <span className="agd-kpi-target-label">{target.label}</span>
                </div>
            )}
        </div>
    );
}
