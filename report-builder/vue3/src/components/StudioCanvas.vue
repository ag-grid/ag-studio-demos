<script setup lang="ts">
import type { AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-vue3';

import type { ReportBuilderRegistry, ReportBuilderStudioOptions } from '../shared';
import { HEADLINE_KPI_WIDGET, reportBuilderProperties } from '../shared';

import HeadlineKpi from './HeadlineKpi.vue';

/**
 * Renders Studio through `ag-studio-vue3` - the integration a Vue application actually writes.
 *
 * The app above drives Studio through its API rather than through props, because its state is far
 * larger than the slice the chrome cares about. So the properties are built once, on setup, and
 * the API is handed up from `onApiReady`, which is a Studio property and therefore identical in
 * every framework variant of this demo.
 */
const props = defineProps<{ options: ReportBuilderStudioOptions }>();
const emit = defineEmits<{ ready: [api?: AgStudioApi] }>();

const widgets = (widgetConfig: AgWidgetsConfig<ReportBuilderRegistry>) =>
    createWidgets<ReportBuilderRegistry>({
        additionalTypes: [{ ...HEADLINE_KPI_WIDGET, comp: HeadlineKpi }],
        menu: [{ label: 'Custom', widgetIds: ['headlineKpi'] }, ...widgetConfig.menu],
    });

const studioProperties: AgStudioProperties<ReportBuilderRegistry> = {
    ...reportBuilderProperties(widgets, props.options),
    onApiReady: ({ api }) => emit('ready', api),
    onStudioPreDestroyed: () => emit('ready', undefined),
};
</script>

<template>
    <AgStudio :studioProperties="studioProperties" class="agd-rb-canvas" />
</template>
