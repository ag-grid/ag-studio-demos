<script setup lang="ts">
import type { AgWidgetParams } from 'ag-studio';
import { shallowRef } from 'vue';

import type { AnalystConsensusDef, AnalystConsensusView } from '../shared';
import { loadAnalystConsensus } from '../shared';

/** The Analyst Consensus custom widget: the rating the price targets imply, and how many analysts set them. */
const props = defineProps<{ params: AgWidgetParams<AnalystConsensusDef> }>();

const view = shallowRef<AnalystConsensusView>();
let hasLoaded = false;
let loadCount = 0;

async function refresh(params: AgWidgetParams<AnalystConsensusDef>): Promise<void> {
    const load = ++loadCount;
    const isCurrent = () => load === loadCount;
    const next = await loadAnalystConsensus(params, hasLoaded, isCurrent);
    if (!isCurrent()) {
        return;
    }
    hasLoaded = next != null;
    view.value = next;
}

// Studio awaits `initialised` as the widget's start-up, so it is not shown as ready before the first load.
const firstLoad = refresh(props.params);
defineExpose({ refresh, initialised: () => firstLoad });
</script>

<template>
    <div class="analyst-consensus">
        <span class="analyst-consensus-rating" :data-rating="view?.rating">{{ view?.ratingLabel }}</span>
        <span class="analyst-consensus-count">{{ view?.countLabel }}</span>
    </div>
</template>
