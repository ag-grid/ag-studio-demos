<script setup lang="ts">
import type { AgStudioProperties } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-vue3';
import { onBeforeUnmount, ref } from 'vue';

import type { ServiceHealthRegistry, UpdateInterval } from './shared';
import {
    LiveFeed,
    ServiceHealthSimulation,
    UPDATE_INTERVALS,
    serviceHealthProperties,
    serviceHealthWidgets,
} from './shared';

/**
 * The Real-time Dashboard demo: a monitoring dashboard over a simulated fleet of services, kept live
 * by applying the fleet's changes to Studio's data engine every second.
 *
 * The simulation, the feed and the dashboard are shared with the other framework variants; what
 * this one contributes is the toolbar that pauses and resumes the feed and sets how often it
 * updates.
 */
const isRunning = ref(false);
const updateInterval = ref<UpdateInterval>(UPDATE_INTERVALS[0]);

const simulation = new ServiceHealthSimulation();
const feed = new LiveFeed({
    simulation,
    onChange: (changed) => {
        isRunning.value = changed.isRunning;
        updateInterval.value = changed.updateInterval;
    },
});

const studioProperties: AgStudioProperties<ServiceHealthRegistry> = {
    ...serviceHealthProperties({ simulation }),
    widgets: createWidgets(serviceHealthWidgets),
    onStudioReady: (event) => feed.connect(event.api.getDataEngine()),
};

function onIntervalChange({ target }: Event) {
    if (!(target instanceof HTMLSelectElement)) {
        return;
    }
    const selected = UPDATE_INTERVALS.find((ms) => String(ms) === target.value);
    if (selected != null) {
        feed.setUpdateInterval(selected);
    }
}

onBeforeUnmount(() => feed.destroy());
</script>

<template>
    <div class="agd-sh">
        <div class="agd-sh-toolbar">
            <h1 class="agd-sh-title">Service Health</h1>
            <span class="agd-sh-status" :data-running="isRunning" role="status">
                {{ isRunning ? 'Live' : 'Paused' }}
            </span>
            <button type="button" class="agd-sh-button" @click="isRunning ? feed.pause() : feed.start()">
                {{ isRunning ? 'Pause' : 'Resume' }}
            </button>
            <label class="agd-sh-control">
                Update every
                <select class="agd-sh-select" :value="updateInterval" @change="onIntervalChange">
                    <option v-for="ms in UPDATE_INTERVALS" :key="ms" :value="ms">{{ ms / 1000 }}s</option>
                </select>
            </label>
        </div>
        <AgStudio :studioProperties="studioProperties" class="agd-sh-canvas" />
    </div>
</template>
