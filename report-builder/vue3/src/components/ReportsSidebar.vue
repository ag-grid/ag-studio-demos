<script setup lang="ts">
import { ref } from 'vue';

import type { DemoProfile } from '../shared';
import { BRAND } from '../shared';

import { PLUS_ICON_PATH } from './icons';
import ProfileSwitcher from './ProfileSwitcher.vue';
import type { Report } from './ReportItem.vue';
import ReportItem from './ReportItem.vue';

const props = defineProps<{
    reports: readonly Report[];
    selectedReportId: string;
    /** Report opened in rename mode, as a freshly created one is. */
    renamingReportId?: string;
    /** Whether the signed-in persona is mid-edit-session, which gates New report and renaming. */
    isEditing: boolean;
    profiles: readonly DemoProfile[];
    currentProfile: DemoProfile;
}>();

const emit = defineEmits<{
    selectReport: [reportId: string];
    addReport: [];
    renameReport: [reportId: string, name: string];
    discardReport: [reportId: string];
    changeProfile: [profileId: string];
}>();

const nav = ref<HTMLElement>();

/**
 * Arrow-key navigation for the vertical report list: roving focus, with selection following focus.
 * Home/End jump to the first and last report. The rename input is left alone so its own caret
 * movement still works.
 */
function onKeyDown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'INPUT') return;

    const items = [...(nav.value?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    if (items.length === 0) return;
    const index = items.findIndex((item) => item === document.activeElement);

    let next = index;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;

    event.preventDefault();
    const target = items[next];
    target.focus();
    if (target.dataset.reportId) {
        emit('selectReport', target.dataset.reportId);
    }
}
</script>

<template>
    <aside class="agd-rb-sidebar">
        <div class="agd-rb-brand">
            {{ BRAND.name }}<span class="agd-rb-brand-accent">{{ BRAND.accent }}</span>
        </div>
        <div class="agd-rb-sidebar-heading">Reports</div>

        <nav
            ref="nav"
            class="agd-rb-reports-nav"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Reports"
            @keydown="onKeyDown"
        >
            <ReportItem
                v-for="report in reports"
                :key="report.id"
                :report="report"
                :is-active="report.id === selectedReportId"
                :can-rename="isEditing"
                :rename-on-mount="report.id === renamingReportId"
                @select="emit('selectReport', report.id)"
                @rename="(name) => emit('renameReport', report.id, name)"
                @rename-cancelled="emit('discardReport', report.id)"
            />
        </nav>

        <button v-if="isEditing" type="button" class="agd-rb-new-report" @click="emit('addReport')">
            <svg class="agd-rb-new-report-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="PLUS_ICON_PATH" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            New report
        </button>

        <ProfileSwitcher
            :profiles="profiles"
            :current="currentProfile"
            @change="(profileId) => emit('changeProfile', profileId)"
        />
    </aside>
</template>
