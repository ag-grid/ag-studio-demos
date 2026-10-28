import { Component, input, output } from '@angular/core';
import type { AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-angular';

import type { ReportBuilderRegistry, ReportBuilderStudioOptions } from '../shared';
import { HEADLINE_KPI_WIDGET, reportBuilderProperties } from '../shared';
import { HeadlineKpiComponent } from './headline-kpi.component';

const widgets = (widgetConfig: AgWidgetsConfig<ReportBuilderRegistry>) =>
    createWidgets<ReportBuilderRegistry>({
        additionalTypes: [{ ...HEADLINE_KPI_WIDGET, comp: HeadlineKpiComponent }],
        menu: [{ label: 'Custom', widgetIds: ['headlineKpi'] }, ...widgetConfig.menu],
    });

/**
 * Renders Studio through `ag-studio-angular` - the integration an Angular application actually
 * writes.
 *
 * The app above drives Studio through its API rather than through inputs, because its state is far
 * larger than the slice the chrome cares about. So the properties are built once, on construction,
 * and the API is handed up from `onApiReady`, which is a Studio property and therefore identical in
 * every framework variant of this demo.
 */
@Component({
    selector: 'app-studio-canvas',
    standalone: true,
    imports: [AgStudio],
    template: `<ag-studio class="agd-rb-canvas" [studioProperties]="studioProperties" />`,
    // The host is a pass-through, so it takes itself out of the layout and `<ag-studio>` becomes
    // the flex child the stylesheet expects - the same position the canvas holds in the React and
    // Vue variants. Without this the host is an inline box and the canvas cannot grow.
    styles: `
        :host {
            display: contents;
        }
    `,
})
export class StudioCanvasComponent {
    public readonly options = input<ReportBuilderStudioOptions>({});
    public readonly ready = output<AgStudioApi | undefined>();

    protected readonly studioProperties: AgStudioProperties<ReportBuilderRegistry> = {
        ...reportBuilderProperties(widgets, this.options()),
        onApiReady: ({ api }) => this.ready.emit(api),
        onStudioPreDestroyed: () => this.ready.emit(undefined),
    };
}
