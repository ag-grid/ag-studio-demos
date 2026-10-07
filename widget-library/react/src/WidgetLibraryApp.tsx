import type { PcwRegistry } from '@demo/widget-library';
import { followPanelBreakpoint, widgetLibraryParams, widgetLibraryProperties } from '@demo/widget-library';
import type { AgDefaultRegistry, AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface WidgetLibraryAppProps {
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
    /**
     * Wraps the widget catalogue, for a host that needs to decorate the pre-built widgets. Applied
     * around the catalogue rather than in place of it.
     */
    decorateWidgets?: (widgets: AgWidgetsConfig<PcwRegistry>) => AgWidgetsConfig<PcwRegistry>;
}

/**
 * The Widget Library demo: a ready-made dashboard composed from a curated catalogue, in which an
 * admin drags in pre-built widgets rather than authoring any.
 *
 * The catalogue is shared with the other framework variants; what this one contributes comes from
 * `ag-studio-react` - `<AgStudio>` to render it, and `createWidgets` to back the built-in widget
 * types with React components.
 *
 * There is no chrome around the canvas, so React's job here is the wiring: hand Studio its
 * properties, and keep the library panel in step with the viewport.
 */
export function WidgetLibraryApp({ studioOverrides, decorateWidgets }: WidgetLibraryAppProps) {
    const [api, setApi] = useState<AgStudioApi<PcwRegistry>>();

    // Read through refs so a changed prop identity cannot remount Studio, which owns its subtree.
    const decorateRef = useRef(decorateWidgets);
    decorateRef.current = decorateWidgets;
    const overridesRef = useRef(studioOverrides);

    const widgets = useMemo(
        () => (config: AgWidgetsConfig<AgDefaultRegistry>) => {
            const catalogue = createWidgets<PcwRegistry>(widgetLibraryParams(config));
            return decorateRef.current ? decorateRef.current(catalogue) : catalogue;
        },
        []
    );

    const studioProperties = useMemo(
        (): AgStudioProperties<PcwRegistry> => ({
            ...widgetLibraryProperties({ widgets, studioOverrides: overridesRef.current }),
            // The event carries the untyped API, so the registry is reapplied here. Everything
            // this demo does with it is registry-aware.
            onApiReady: ({ api: ready }) => setApi(ready as AgStudioApi<PcwRegistry>),
            onStudioPreDestroyed: () => setApi(undefined),
        }),
        [widgets]
    );

    // Open the library panel mid-compose on desktop, collapsed on narrow viewports.
    useEffect(() => (api ? followPanelBreakpoint(api) : undefined), [api]);

    return (
        <div className="agd-wl">
            <AgStudio<PcwRegistry> studioProperties={studioProperties} className="agd-wl-canvas" />
        </div>
    );
}
