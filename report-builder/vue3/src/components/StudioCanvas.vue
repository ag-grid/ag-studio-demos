<script setup lang="ts">
import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-vue3';

import type { ReportBuilderStudioOptions } from '../shared';
import { reportBuilderProperties } from '../shared';

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

const studioProperties: AgStudioProperties = {
    ...reportBuilderProperties(props.options),
    onApiReady: ({ api }) => emit('ready', api),
    onStudioPreDestroyed: () => emit('ready', undefined),
};
</script>

<template>
    <AgStudio :studioProperties="studioProperties" class="agd-rb-canvas" />
</template>
