<script setup lang="ts">
import type { AgDefaultRegistry, AgStudioApi, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-vue3';
import { onBeforeUnmount } from 'vue';

import type { PcwRegistry } from '@demo/widget-library';
import { followPanelBreakpoint, widgetLibraryParams, widgetLibraryProperties } from '@demo/widget-library';

/**
 * The Widget Library demo: a ready-made dashboard composed from a curated catalogue, in which an
 * admin drags in pre-built widgets rather than authoring any.
 *
 * The catalogue is shared with the other framework variants; what this one contributes comes from
 * `ag-studio-vue3` - `<AgStudio>` to render it, and `createWidgets` to back the built-in widget
 * types with Vue components.
 *
 * There is no chrome around the canvas, so Vue's job here is the wiring: hand Studio its
 * properties, and keep the library panel in step with the viewport.
 */
let stopFollowingBreakpoint: (() => void) | undefined;

const widgets = (config: AgWidgetsConfig<AgDefaultRegistry>) =>
    createWidgets<PcwRegistry>(widgetLibraryParams(config));

const studioProperties: AgStudioProperties<PcwRegistry> = {
    ...widgetLibraryProperties({ widgets }),
    // The event carries the untyped API, so the registry is reapplied here.
    onApiReady: ({ api }) => {
        stopFollowingBreakpoint = followPanelBreakpoint(api as AgStudioApi<PcwRegistry>);
    },
    onStudioPreDestroyed: () => {
        stopFollowingBreakpoint?.();
        stopFollowingBreakpoint = undefined;
    },
};

onBeforeUnmount(() => stopFollowingBreakpoint?.());
</script>

<template>
    <div class="agd-wl">
        <AgStudio :studioProperties="studioProperties" class="agd-wl-canvas" />
    </div>
</template>
