import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import type { PcwRegistry } from '@demo/widget-library';
import { followPanelBreakpoint, widgetLibraryParams, widgetLibraryProperties } from '@demo/widget-library';
import type { AgDefaultRegistry, AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-angular';

/**
 * The Widget Library demo: a ready-made dashboard composed from a curated catalogue, in which an
 * admin drags in pre-built widgets rather than authoring any.
 *
 * The catalogue is shared with the other framework variants; what this one contributes comes from
 * `ag-studio-angular` - `<ag-studio>` to render it, and `createWidgets` to back the built-in widget
 * types with Angular components.
 *
 * There is no chrome around the canvas, so Angular's job here is the wiring: hand Studio its
 * properties, and keep the library panel in step with the viewport.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgStudio],
    template: `
        <div class="agd-wl">
            <ag-studio class="agd-wl-canvas" [studioProperties]="studioProperties" />
        </div>
    `,
})
export class AppComponent implements OnDestroy {
    private stopFollowingBreakpoint?: () => void;

    protected readonly studioProperties: AgStudioProperties<PcwRegistry> = {
        ...widgetLibraryProperties({
            widgets: (config: AgWidgetsConfig<AgDefaultRegistry>) =>
                createWidgets<PcwRegistry>(widgetLibraryParams(config)),
        }),
        onApiReady: ({ api }) => {
            this.stopFollowingBreakpoint = followPanelBreakpoint(api as AgStudioApi<PcwRegistry>);
        },
        onStudioPreDestroyed: () => {
            this.stopFollowingBreakpoint?.();
            this.stopFollowingBreakpoint = undefined;
        },
    };

    public ngOnDestroy(): void {
        this.stopFollowingBreakpoint?.();
    }
}
