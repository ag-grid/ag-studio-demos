import type { AgStudioProperties } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-react';
import { useEffect, useRef, useState } from 'react';

import type { ServiceHealthRegistry, UpdateInterval } from './shared';
import {
    LiveFeed,
    ServiceHealthSimulation,
    UPDATE_INTERVALS,
    serviceHealthProperties,
    serviceHealthWidgets,
} from './shared';

export interface ServiceHealthAppProps {
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties<ServiceHealthRegistry>>;
}

const widgets = createWidgets(serviceHealthWidgets);

/**
 * The Real-time Dashboard demo: a monitoring dashboard over a simulated fleet of services, kept live
 * by applying the fleet's changes to Studio's data engine every second.
 *
 * The simulation, the feed and the dashboard are shared with the other framework variants; what
 * this one contributes is the toolbar that pauses and resumes the feed and sets how often it
 * updates.
 */
export function ServiceHealthApp({ studioOverrides }: ServiceHealthAppProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [updateInterval, setUpdateInterval] = useState<UpdateInterval>(UPDATE_INTERVALS[0]);

    // Created once and read through a ref, so a re-render cannot restart the simulation or remount
    // Studio, which owns its subtree.
    const demo = useRef<{ feed: LiveFeed; studioProperties: AgStudioProperties<ServiceHealthRegistry> }>();
    if (demo.current == null) {
        const simulation = new ServiceHealthSimulation();
        const feed = new LiveFeed({
            simulation,
            onChange: (changed) => {
                setIsRunning(changed.isRunning);
                setUpdateInterval(changed.updateInterval);
            },
        });
        demo.current = {
            feed,
            studioProperties: {
                ...serviceHealthProperties({ simulation, studioOverrides }),
                widgets,
                onStudioReady: (event) => feed.connect(event.api.getDataEngine()),
            },
        };
    }
    const { feed, studioProperties } = demo.current;

    useEffect(() => () => feed.destroy(), [feed]);

    const onIntervalChange = (value: string) => {
        const selected = UPDATE_INTERVALS.find((ms) => String(ms) === value);
        if (selected != null) {
            feed.setUpdateInterval(selected);
        }
    };

    return (
        <div className="agd-sh">
            <div className="agd-sh-toolbar">
                <h1 className="agd-sh-title">Service Health</h1>
                <span className="agd-sh-status" data-running={isRunning} role="status">
                    {isRunning ? 'Live' : 'Paused'}
                </span>
                <button
                    type="button"
                    className="agd-sh-button"
                    onClick={() => (isRunning ? feed.pause() : feed.start())}
                >
                    {isRunning ? 'Pause' : 'Resume'}
                </button>
                <label className="agd-sh-control">
                    Update every
                    <select
                        className="agd-sh-select"
                        value={updateInterval}
                        onChange={(event) => onIntervalChange(event.target.value)}
                    >
                        {UPDATE_INTERVALS.map((ms) => (
                            <option key={ms} value={ms}>
                                {ms / 1000}s
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <AgStudio studioProperties={studioProperties} className="agd-sh-canvas" />
        </div>
    );
}
