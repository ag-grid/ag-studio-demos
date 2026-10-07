<script setup lang="ts">
import type { AgReportState, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { onBeforeUnmount, ref, watch } from 'vue';

import type { ViewportKey } from '@demo/embedded-analytics';
import {
    buildTearSheetView,
    createHalvynDataEngine,
    lockBodyScroll,
    onEscapeWhileExpanded,
    showToast,
    withViewportSelection,
} from '@demo/embedded-analytics';

import EmbeddedViewport from './components/EmbeddedViewport.vue';
import TearSheet from './components/TearSheet.vue';

/**
 * The Embedded Analytics demo: Studio widgets embedded in someone else's application, styled to
 * match it, with the host owning both the data and the chrome.
 *
 * Three separate Studio instances read from one data engine created here - that shared engine is
 * the point. Each can be expanded in place for editing; the viewport component follows
 * `isExpanded`, so this component only has to own the value.
 */
const props = defineProps<{
    studioOverrides?: Partial<AgStudioProperties>;
    /** Expands this viewport on first paint, for a host that deep-links one. */
    initialExpanded?: ViewportKey;
}>();

const emit = defineEmits<{ expandedChange: [viewportKey?: ViewportKey] }>();

const view = buildTearSheetView();
const dataEngine = createHalvynDataEngine();

const expandedKey = ref<ViewportKey | undefined>(undefined);
const apis = new Map<ViewportKey, AgStudioApi>();

let releaseScrollLock: (() => void) | undefined;
let stopEscapeListener: (() => void) | undefined;

watch(expandedKey, (key) => {
    releaseScrollLock?.();
    stopEscapeListener?.();
    releaseScrollLock = key ? lockBodyScroll() : undefined;
    stopEscapeListener = key ? onEscapeWhileExpanded(cancel) : undefined;
});

onBeforeUnmount(() => {
    releaseScrollLock?.();
    stopEscapeListener?.();
});

function registerViewport(key: ViewportKey, api?: AgStudioApi) {
    if (api) {
        apis.set(key, api);
        // A deep-linked viewport starts expanded, but only once its card instance exists: the
        // editor seeds itself from that card's state, so expanding before it is ready has nothing
        // to read. Setting the key up front would also skip the `watch` below, which does not fire
        // for a ref's initial value - so nothing would lock body scroll or listen for Escape.
        if (key === props.initialExpanded && !expandedKey.value) {
            expand(key);
        }
    } else {
        apis.delete(key);
    }
}

function expand(key: ViewportKey) {
    // The editor seeds itself from the card's state, so there has to be a card instance.
    if (!apis.has(key)) return;

    expandedKey.value = key;
    emit('expandedChange', key);
}

function collapse() {
    expandedKey.value = undefined;
    emit('expandedChange', undefined);
}

/**
 * Save applies the editor's state to the card and logs what a host would persist. Cancel needs no
 * counterpart: the editor is a separate instance, so discarding it discards the edit.
 */
function save(state: AgReportState) {
    const key = expandedKey.value;
    const api = key && apis.get(key);
    if (key && api) {
        // Selection cleared on the way back: it was set for the editor's panel, and a card with a
        // selected widget would show a highlight nobody asked for.
        api.setState(withViewportSelection(state, key, false));
        // eslint-disable-next-line no-console
        console.log(`AG Studio - saved "${key}" widget state:`, state);
    }
    showToast('Widget saved. State logged to console');
    collapse();
}

function cancel() {
    collapse();
}

function exportSheet() {
    window.print();
}
</script>

<template>
    <div class="agd-ea" data-embedded-root>
        <TearSheet :view="view" @export="exportSheet">
            <template #centre>
                <EmbeddedViewport
                    v-for="key in ['price', 'financials'] as ViewportKey[]"
                    :key="key"
                    :viewport-key="key"
                    :data-engine="dataEngine"
                    :is-expanded="expandedKey === key"
                    :studio-overrides="props.studioOverrides"
                    @ready="registerViewport"
                    @expand="expand"
                    @save="save"
                    @cancel="cancel"
                />
            </template>
            <template #right>
                <EmbeddedViewport
                    viewport-key="segments"
                    :data-engine="dataEngine"
                    :is-expanded="expandedKey === 'segments'"
                    :studio-overrides="props.studioOverrides"
                    @ready="registerViewport"
                    @expand="expand"
                    @save="save"
                    @cancel="cancel"
                />
            </template>
        </TearSheet>
    </div>
</template>
