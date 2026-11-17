import type { AgWidgetParams } from 'ag-studio';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { BarGaugeDef, BarGaugeView } from './shared';
import { loadBarGauge } from './shared';

/** The Bar Gauge custom widget: one LED bar per category, lit by threshold. */
export function BarGauge(params: AgWidgetParams<BarGaugeDef>) {
    const [view, setView] = useState<BarGaugeView>();
    const hasLoaded = useRef(false);

    // Studio hands over new params on every refresh, so each one loads again.
    useEffect(() => {
        let current = true;
        loadBarGauge(params, hasLoaded.current, () => current).then((next) => {
            if (!current) return;
            hasLoaded.current = next != null;
            setView(next);
        });
        return () => {
            current = false;
        };
    }, [params]);

    const thresholds = view && {
        '--agd-bar-gauge-amber-from': `${view.amberFrom}%`,
        '--agd-bar-gauge-green-from': `${view.greenFrom}%`,
    };
    return (
        <div className="agd-bar-gauge" style={thresholds as CSSProperties}>
            {view?.rows.map(({ label, value, fill, level }) => (
                <div key={label} className="agd-bar-gauge-row" data-level={level}>
                    <div className="agd-bar-gauge-label">{label}</div>
                    <div className="agd-bar-gauge-track">
                        <div
                            className="agd-bar-gauge-fill"
                            style={{ '--agd-bar-gauge-fill': `${fill}%` } as CSSProperties}
                        />
                    </div>
                    <div className="agd-bar-gauge-value">{value}</div>
                </div>
            ))}
        </div>
    );
}
