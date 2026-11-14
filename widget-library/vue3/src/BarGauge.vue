<script setup lang="ts">
import type { AgWidgetParams } from 'ag-studio';
import { shallowRef } from 'vue';

import type { BarGaugeDef, BarGaugeView } from './shared';
import { loadBarGauge } from './shared';

/** The Bar Gauge custom widget: one LED bar per category, lit by threshold. */
const props = defineProps<{ params: AgWidgetParams<BarGaugeDef> }>();

const view = shallowRef<BarGaugeView>();
let hasLoaded = false;
let loadCount = 0;

async function refresh(params: AgWidgetParams<BarGaugeDef>): Promise<void> {
    const load = ++loadCount;
    const isCurrent = () => load === loadCount;
    const next = await loadBarGauge(params, hasLoaded, isCurrent);
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
    <div
        class="agd-bar-gauge"
        :style="
            view && {
                '--agd-bar-gauge-amber-from': `${view.amberFrom}%`,
                '--agd-bar-gauge-green-from': `${view.greenFrom}%`,
            }
        "
    >
        <div v-for="row in view?.rows" :key="row.label" class="agd-bar-gauge-row" :data-level="row.level">
            <div class="agd-bar-gauge-label">{{ row.label }}</div>
            <div class="agd-bar-gauge-track">
                <div class="agd-bar-gauge-fill" :style="{ '--agd-bar-gauge-fill': `${row.fill}%` }" />
            </div>
            <div class="agd-bar-gauge-value">{{ row.value }}</div>
        </div>
    </div>
</template>
