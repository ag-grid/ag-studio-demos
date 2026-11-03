import type { AgWidgetParams } from 'ag-studio';
import { useEffect, useRef, useState } from 'react';

import type { AnalystConsensusDef, AnalystConsensusView } from '../shared';
import { loadAnalystConsensus } from '../shared';

/** The Analyst Consensus custom widget: the rating the price targets imply, and how many analysts set them. */
export function AnalystConsensus(params: AgWidgetParams<AnalystConsensusDef>) {
    const [view, setView] = useState<AnalystConsensusView>();
    const hasLoaded = useRef(false);

    // Studio hands over new params on every refresh, so each one loads again.
    useEffect(() => {
        let current = true;
        loadAnalystConsensus(params, hasLoaded.current, () => current).then((next) => {
            if (!current) return;
            hasLoaded.current = next != null;
            setView(next);
        });
        return () => {
            current = false;
        };
    }, [params]);

    return (
        <div className="analyst-consensus">
            <span className="analyst-consensus-rating" data-rating={view?.rating}>
                {view?.ratingLabel}
            </span>
            <span className="analyst-consensus-count">{view?.countLabel}</span>
        </div>
    );
}
