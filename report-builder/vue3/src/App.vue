<script setup lang="ts">
import type { AgStudioApi } from 'ag-studio';
import { computed, ref, watch } from 'vue';

import type { DemoProfile, ReportBuilderStudioOptions } from '@demo/report-builder';
import { createBlankReport, defaultProfile, demoProfiles, reportBuilderReports } from '@demo/report-builder';

import type { Report } from './components/ReportItem.vue';
import ReportsSidebar from './components/ReportsSidebar.vue';
import StudioCanvas from './components/StudioCanvas.vue';

/**
 * The Report Builder demo: an analyst-facing app shell in which reports are composed from charts,
 * grids and KPI tiles.
 *
 * Vue owns the chrome - which report is selected, which persona is signed in, the report list and
 * its names. Studio owns the dashboard, and is driven through its API rather than through props,
 * because its state is far larger than the slice this chrome cares about.
 */
const props = defineProps<{
    options?: ReportBuilderStudioOptions;
    /**
     * Drives the demo to this report whenever the value changes. For hosts that own the selected
     * report (from a URL, say) and need to move it from outside.
     */
    selectedReportId?: string;
}>();

const emit = defineEmits<{
    /**
     * The visitor selected a report. Not emitted for a selection the host drove through
     * `selectedReportId`, nor for the selection changes that follow creating or discarding one.
     */
    reportSelect: [reportId: string];
}>();

const studioOptions = computed<ReportBuilderStudioOptions>(() => props.options ?? {});

const api = ref<AgStudioApi>();
const reports = ref<Report[]>(reportBuilderReports.map((report) => ({ ...report })));
const selectedReportId = ref(props.options?.initialReportId ?? reportBuilderReports[0].id);
const renamingReportId = ref<string>();
const profile = ref<DemoProfile>(defaultProfile);
/** Host chrome state, distinct from Studio's own `mode`: is this persona mid-edit-session? */
const mode = ref<'view' | 'edit'>('edit');
/** Names new reports in creation order, so they do not renumber as reports come and go. */
const reportSeq = ref(0);
/** Which report to fall back to if a rename of a brand-new report is abandoned. */
const restoreReportId = ref<string>();

const isEditing = computed(() => profile.value.access === 'write' && mode.value === 'edit');

// A host steering the selection from outside, e.g. restoring one on a Back press.
watch(
    () => props.selectedReportId,
    (reportId) => {
        if (reportId != null) {
            selectedReportId.value = reportId;
        }
    }
);

// Studio's selected page follows the chrome's, wherever the change came from.
watch([api, selectedReportId], ([instance, reportId]) => {
    if (!instance) return;
    const state = instance.getState();
    if (state.selectedPageId !== reportId) {
        instance.setState({ ...state, selectedPageId: reportId });
    }

    // Keep the selected report in view, scoping the scroll to the sidebar list (never the page).
    document
        .querySelector<HTMLElement>(`.agd-rb-reports-nav [data-report-id="${reportId}"]`)
        ?.scrollIntoView({ block: 'nearest' });
});

// The signed-in persona's access decides whether Studio is editable.
watch([api, isEditing], ([instance, editing]) => instance?.setProperty('mode', editing ? 'edit' : 'view'));

function selectReport(reportId: string) {
    selectedReportId.value = reportId;
    emit('reportSelect', reportId);
}

/**
 * New report is chrome, not a Studio feature: it appends a blank page through the public API and
 * names it in the sidebar itself, Studio pages carrying no display name.
 */
function addReport() {
    const instance = api.value;
    if (!instance) return;

    const state = instance.getState();
    restoreReportId.value = state.selectedPageId;

    const seq = ++reportSeq.value;
    const id = `page-${seq}`;
    instance.setState({ ...state, pages: [...state.pages, createBlankReport(id)], selectedPageId: id });

    reports.value = [...reports.value, { id, name: `Report ${seq}` }];
    selectedReportId.value = id;
    renamingReportId.value = id;
}

function renameReport(reportId: string, name: string) {
    renamingReportId.value = undefined;
    reports.value = reports.value.map((report) => (report.id === reportId ? { ...report, name } : report));
}

function discardReport(reportId: string) {
    renamingReportId.value = undefined;
    reports.value = reports.value.filter((report) => report.id !== reportId);

    const instance = api.value;
    if (!instance) return;

    const state = instance.getState();
    const pages = state.pages.filter((page) => page.id !== reportId);
    const restore = restoreReportId.value;
    const fallback = pages[pages.length - 1]?.id ?? state.selectedPageId;
    const nextId = restore != null && pages.some((page) => page.id === restore) ? restore : fallback;

    instance.setState({ ...state, pages, selectedPageId: nextId });
    selectedReportId.value = nextId;
}

/**
 * Switching profile switches access and the edit session together: the Analyst profile opens an
 * edit session immediately; the Viewer profile returns to a plain view.
 */
function changeProfile(profileId: string) {
    const next = demoProfiles.find((candidate) => candidate.id === profileId);
    if (!next) return;
    profile.value = next;
    mode.value = next.access === 'write' ? 'edit' : 'view';
}

// The root's access and edit classes expose the chrome's state to CSS.
const rootClasses = computed(() => [
    'agd-rb',
    profile.value.access === 'write' ? 'access-write' : 'access-view',
    mode.value === 'edit' ? 'edit-active' : 'view-active',
]);
</script>

<template>
    <div :class="rootClasses">
        <div class="agd-rb-body">
            <ReportsSidebar
                :reports="reports"
                :selected-report-id="selectedReportId"
                :renaming-report-id="renamingReportId"
                :is-editing="isEditing"
                :profiles="demoProfiles"
                :current-profile="profile"
                @select-report="selectReport"
                @add-report="addReport"
                @rename-report="renameReport"
                @discard-report="discardReport"
                @change-profile="changeProfile"
            />
            <main class="agd-rb-canvas-wrap">
                <StudioCanvas :options="studioOptions" @ready="(instance) => (api = instance)" />
            </main>
        </div>
    </div>
</template>
