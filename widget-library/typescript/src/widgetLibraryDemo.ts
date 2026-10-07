import type { PcwRegistry } from '@demo/widget-library';
import { createWidgetLibraryStudio, followPanelBreakpoint, widgetLibraryParams } from '@demo/widget-library';
import type { AgDefaultRegistry, AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { createWidgets } from 'ag-studio';

export interface WidgetLibraryDemoOptions {
    /** Element the demo renders into. Its canvas is removed again on destroy. */
    container: HTMLElement;
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
    /**
     * Wraps the widget catalogue, for a host that needs to decorate the pre-built widgets. Applied
     * around the catalogue rather than in place of it.
     */
    decorateWidgets?: (widgets: AgWidgetsConfig<PcwRegistry>) => AgWidgetsConfig<PcwRegistry>;
}

export interface WidgetLibraryDemo {
    readonly api: AgStudioApi<PcwRegistry>;
    destroy: () => void;
}

/**
 * Mount the Widget Library demo: a ready-made dashboard composed from a curated catalogue, in
 * which an admin drags in pre-built widgets rather than authoring any.
 *
 * The built-in widget types are backed by `ag-studio`'s own renderers here, which is the whole
 * difference between this variant and the React one.
 */
export function createWidgetLibraryDemo(options: WidgetLibraryDemoOptions): WidgetLibraryDemo {
    const { container, studioOverrides, decorateWidgets } = options;

    const canvas = document.createElement('div');
    canvas.className = 'agd-wl-canvas';

    const root = document.createElement('div');
    root.className = 'agd-wl';
    root.appendChild(canvas);
    container.appendChild(root);

    const widgets = (config: AgWidgetsConfig<AgDefaultRegistry>) => {
        const catalogue = createWidgets<PcwRegistry>(widgetLibraryParams(config));
        return decorateWidgets ? decorateWidgets(catalogue) : catalogue;
    };

    const api = createWidgetLibraryStudio(canvas, { widgets, studioOverrides });
    const stopFollowingBreakpoint = followPanelBreakpoint(api);

    return {
        api,
        destroy: () => {
            stopFollowingBreakpoint();
            api.destroy();
            root.remove();
        },
    };
}
