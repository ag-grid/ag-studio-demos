<script setup lang="ts">
import type { AgDataEngine, AgReportState, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-vue3';

import type { ViewportKey } from '@demo/embedded-analytics';
import {
    expandedViewportProperties,
    hasViewportSelection,
    VIEWPORT_TITLES,
    viewportProperties,
    withViewportSelection,
} from '@demo/embedded-analytics';

/**
 * One embedded Studio instance, showing a single full-canvas widget, expandable for editing.
 *
 * Both instances are rendered by `ag-studio-vue3`. The editor is a **second** instance, seeded
 * from what the card is showing, rather than the card's instance relocated: it is a different
 * surface with different properties, and keeping them separate is what makes Cancel free - there
 * is nothing to revert, the editor is simply discarded.
 *
 * The editor is rendered through a `<Teleport>` into `<body>` because the tear sheet is a scaled
 * surface, which traps a `position: fixed` overlay, and Studio's own popups attach to `<body>`.
 * Teleporting keeps the chrome inside Vue's component tree, so its buttons stay bound.
 */
const props = defineProps<{
    viewportKey: ViewportKey;
    dataEngine: AgDataEngine;
    /** Whether this viewport is currently expanded for editing. */
    isExpanded: boolean;
    studioOverrides?: Partial<AgStudioProperties>;
}>();

const emit = defineEmits<{
    ready: [viewportKey: ViewportKey, api?: AgStudioApi];
    expand: [viewportKey: ViewportKey];
    save: [state: AgReportState];
    cancel: [];
}>();

let cardApi: AgStudioApi | undefined;
let editorApi: AgStudioApi | undefined;

const cardProperties: AgStudioProperties = {
    ...viewportProperties(props.viewportKey, props.dataEngine, { studioOverrides: props.studioOverrides }),
    onApiReady: ({ api }) => {
        cardApi = api;
        emit('ready', props.viewportKey, api);
    },
    onStudioPreDestroyed: () => {
        cardApi = undefined;
        emit('ready', props.viewportKey, undefined);
    },
};

/** Rebuilt per expand, so the editor opens on whatever the card is showing at that moment. */
const editorProperties = (): AgStudioProperties => ({
    ...expandedViewportProperties(props.viewportKey, props.dataEngine, cardApi!.getState(), {
        studioOverrides: props.studioOverrides,
        // While the edit panel is open the widget must stay selected; re-assert it if a stray click
        // inside the canvas clears it. The guard makes this a no-op once correct, so it never loops
        // with its own setState.
        onStateUpdated: () => {
            if (!editorApi || hasViewportSelection(editorApi, props.viewportKey)) return;
            editorApi.setState(withViewportSelection(editorApi.getState(), props.viewportKey, true));
        },
    }),
    onApiReady: ({ api }) => {
        editorApi = api;
    },
    onStudioPreDestroyed: () => {
        editorApi = undefined;
    },
});
</script>

<template>
    <div class="agd-ea-viewport" :data-viewport="viewportKey">
        <AgStudio :studioProperties="cardProperties" class="agd-ea-viewport-slot" />

        <button
            type="button"
            class="agd-ea-edit-button"
            :title="`Edit ${VIEWPORT_TITLES[viewportKey]}`"
            :aria-label="`Edit ${VIEWPORT_TITLES[viewportKey]}`"
            @click="emit('expand', viewportKey)"
        >
            <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                <path
                    d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-16 16V26h7.4l15-15zM20.4 4l3.6 3.6-3 3L17.4 7l3-3zM5 24v-4.6l11-11 3.6 3.6-11 11H5z"
                />
            </svg>
            <span>Edit</span>
        </button>

        <Teleport v-if="isExpanded" to="body">
            <div class="agd-ea-viewport agd-ea-viewport-expanded" :data-viewport="viewportKey">
                <div class="agd-ea-viewport-panel">
                    <div class="agd-ea-viewport-header">
                        <span class="agd-ea-viewport-header-title">Edit {{ VIEWPORT_TITLES[viewportKey] }}</span>
                    </div>

                    <AgStudio :studioProperties="editorProperties()" class="agd-ea-viewport-slot" />

                    <div class="agd-ea-viewport-footer">
                        <button type="button" class="button-secondary" @click="emit('cancel')">Cancel</button>
                        <button type="button" class="button" @click="emit('save', editorApi!.getState())">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
