<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

import type { DemoProfile } from '@demo/report-builder';

import { CHECK_PATH, CHEVRON_DOWN_PATH } from './icons';

/**
 * The account switcher pinned to the bottom of the sidebar, and the menu of demo personas it
 * opens upward.
 *
 * Arrow keys move between profiles, Escape closes and returns focus to the button, and a pointer
 * press outside dismisses it.
 */
const props = defineProps<{ profiles: readonly DemoProfile[]; current: DemoProfile }>();
const emit = defineEmits<{ change: [profileId: string] }>();

const MENU_ID = 'agd-rb-profile-menu';

const isOpen = ref(false);
const button = ref<HTMLButtonElement>();
const menu = ref<HTMLDivElement>();

let stopListening: (() => void) | undefined;

watch(isOpen, (open) => {
    stopListening?.();
    stopListening = undefined;
    if (!open) return;

    // Opening moves focus onto the checked item, which is where the roving tab stop sits.
    menu.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();

    const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (!menu.value?.contains(target) && !button.value?.contains(target)) {
            isOpen.value = false;
        }
    };
    document.addEventListener('pointerdown', onPointerDown);
    stopListening = () => document.removeEventListener('pointerdown', onPointerDown);
});

onBeforeUnmount(() => stopListening?.());

function close() {
    isOpen.value = false;
    button.value?.focus();
}

function moveFocus(step: number) {
    const options = [...(menu.value?.querySelectorAll<HTMLElement>('[data-profile-id]') ?? [])];
    const index = options.findIndex((option) => option === document.activeElement);
    options[(index + step + options.length) % options.length]?.focus();
}

function choose(profileId: string) {
    emit('change', profileId);
    close();
}
</script>

<template>
    <div class="agd-rb-profile-switcher">
        <button
            ref="button"
            type="button"
            class="agd-rb-profile-button"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            :aria-controls="MENU_ID"
            @click="isOpen = !isOpen"
        >
            <span class="agd-rb-avatar" aria-hidden="true">{{ current.initials }}</span>
            <span class="agd-rb-profile-identity">
                <span class="agd-rb-profile-name">{{ current.name }}</span>
                <span class="agd-rb-profile-role">{{ current.role }}</span>
            </span>
            <svg class="agd-rb-profile-chevron" viewBox="0 0 32 32" aria-hidden="true">
                <path :d="CHEVRON_DOWN_PATH" />
            </svg>
        </button>

        <div
            :id="MENU_ID"
            ref="menu"
            class="agd-rb-profile-menu"
            role="menu"
            aria-label="Switch profile"
            :hidden="!isOpen"
            @keydown.esc.prevent="close"
            @keydown.down.prevent="moveFocus(1)"
            @keydown.up.prevent="moveFocus(-1)"
        >
            <div class="agd-rb-profile-menu-heading" aria-hidden="true">Switch profile</div>
            <button
                v-for="profile in profiles"
                :key="profile.id"
                type="button"
                role="menuitemradio"
                :aria-checked="profile.id === current.id"
                :tabindex="profile.id === current.id ? 0 : -1"
                :data-profile-id="profile.id"
                class="agd-rb-profile-option"
                @click="choose(profile.id)"
            >
                <span class="agd-rb-avatar" aria-hidden="true">{{ profile.initials }}</span>
                <span class="agd-rb-profile-identity">
                    <span class="agd-rb-profile-name">{{ profile.name }}</span>
                    <span class="agd-rb-profile-role">{{ profile.role }}</span>
                </span>
                <svg class="agd-rb-profile-tick" viewBox="0 0 32 32" aria-hidden="true">
                    <path :d="CHECK_PATH" />
                </svg>
            </button>
        </div>
    </div>
</template>
