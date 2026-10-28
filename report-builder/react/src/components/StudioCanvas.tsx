import type { AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-react';
import { useMemo } from 'react';

import type { ReportBuilderRegistry, ReportBuilderStudioOptions } from '../shared';
import { HEADLINE_KPI_WIDGET, reportBuilderProperties } from '../shared';
import { HeadlineKpi } from './HeadlineKpi';

interface Props extends ReportBuilderStudioOptions {
    /** Receives the Studio instance once it is ready, and `undefined` when it is torn down. */
    onReady: (api?: AgStudioApi) => void;
}

const widgets = (widgetConfig: AgWidgetsConfig<ReportBuilderRegistry>) =>
    createWidgets<ReportBuilderRegistry>({
        additionalTypes: [{ ...HEADLINE_KPI_WIDGET, comp: HeadlineKpi }],
        menu: [{ label: 'Custom', widgetIds: ['headlineKpi'] }, ...widgetConfig.menu],
    });

/**
 * Renders Studio through `ag-studio-react` - the integration a React application actually writes.
 *
 * The app above drives Studio through its API rather than through props, because its state is far
 * larger than the slice the chrome cares about. So the properties are built once and the API is
 * handed up from `onApiReady`, which is a Studio property and therefore identical in every
 * framework variant of this demo.
 */
export function StudioCanvas({ onReady, ...studioOptions }: Props) {
    // Built once: these are Studio's initial properties, and rebuilding them on a later render
    // would regenerate the dataset.
    const studioProperties = useMemo(
        (): AgStudioProperties<ReportBuilderRegistry> => ({
            ...reportBuilderProperties(widgets, studioOptions),
            onApiReady: ({ api }) => onReady(api),
            onStudioPreDestroyed: () => onReady(undefined),
        }),
        []
    );

    return <AgStudio studioProperties={studioProperties} className="agd-rb-canvas" />;
}
