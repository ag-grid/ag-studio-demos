<script setup lang="ts">
import type { AgWidgetParams } from 'ag-studio';
import { shallowRef } from 'vue';

import type { HeadlineKpiDef, HeadlineKpiView } from '../shared';
import { loadHeadlineKpi } from '../shared';

/** The Headline KPI custom widget: a measure for its latest period, its change, and its target. */
const props = defineProps<{ params: AgWidgetParams<HeadlineKpiDef> }>();

const view = shallowRef<HeadlineKpiView>();
let hasLoaded = false;
let loadCount = 0;

async function refresh(params: AgWidgetParams<HeadlineKpiDef>): Promise<void> {
    const load = ++loadCount;
    const isCurrent = () => load === loadCount;
    const next = await loadHeadlineKpi(params, hasLoaded, isCurrent);
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
    <div class="agd-kpi">
        <div class="agd-kpi-value">{{ view?.value }}</div>
        <div v-if="view?.change" class="agd-kpi-change">
            <span
                class="agd-kpi-change-label"
                :data-direction="view.change.direction"
                :data-sentiment="view.change.sentiment"
                >{{ view.change.label }}</span
            >
            <span class="agd-kpi-comparison">{{ view.change.comparison }}</span>
        </div>
        <div v-if="view?.target" class="agd-kpi-target">
            <div class="agd-kpi-target-track">
                <div class="agd-kpi-target-fill" :style="{ width: `${view.target.percent}%` }" />
            </div>
            <span class="agd-kpi-target-label">{{ view.target.label }}</span>
        </div>
    </div>
</template>
