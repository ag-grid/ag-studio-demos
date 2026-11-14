<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { REPORT_ICON_PATH } from './icons';

export interface Report {
    id: string;
    name: string;
}

const props = defineProps<{
    report: Report;
    isActive: boolean;
    /** Whether a double-click should start a rename. Only the editing persona may. */
    canRename: boolean;
    /** Opens in rename mode, as a freshly created report does. */
    renameOnMount?: boolean;
}>();

const emit = defineEmits<{
    select: [];
    rename: [name: string];
    /** Abandoning the rename of a brand-new report discards the report itself. */
    renameCancelled: [];
}>();

const isRenaming = ref(props.renameOnMount ?? false);
const draft = ref(props.report.name);
const input = ref<HTMLInputElement>();
// Commit and cancel both fire from a blur race with keydown; this keeps the first one.
const settled = ref(false);

watch(
    isRenaming,
    async (renaming) => {
        if (!renaming) return;
        settled.value = false;
        draft.value = props.report.name;
        await nextTick();
        input.value?.focus();
        input.value?.select();
    },
    { immediate: true }
);

function commit() {
    if (settled.value) return;
    settled.value = true;
    isRenaming.value = false;
    emit('rename', draft.value.trim() || props.report.name);
}

function cancel() {
    if (settled.value) return;
    settled.value = true;
    isRenaming.value = false;
    if (props.renameOnMount) {
        emit('renameCancelled');
    }
}

function onDoubleClick() {
    if (props.canRename) {
        isRenaming.value = true;
    }
}
</script>

<template>
    <!--
        The input is absolutely positioned over the label rather than replacing it, and the label is
        hidden rather than removed, so entering rename mode never resizes the item or the sidebar.
    -->
    <button
        type="button"
        role="tab"
        :aria-selected="isActive"
        :tabindex="isActive ? 0 : -1"
        :title="report.name"
        :data-report-id="report.id"
        :class="['agd-rb-report-item', { active: isActive }]"
        @click="emit('select')"
        @dblclick="onDoubleClick"
    >
        <svg class="agd-rb-report-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="REPORT_ICON_PATH" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="agd-rb-report-label" :style="isRenaming ? { visibility: 'hidden' } : undefined">
            {{ report.name }}
        </span>
        <input
            v-if="isRenaming"
            ref="input"
            v-model="draft"
            type="text"
            class="agd-rb-rename-input"
            @blur="commit"
            @keydown.enter.prevent="commit"
            @keydown.esc.prevent="cancel"
        />
    </button>
</template>
