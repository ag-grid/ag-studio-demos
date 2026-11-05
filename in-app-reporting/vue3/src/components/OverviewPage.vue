<script setup lang="ts">
import type { AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-vue3';

import type { OverviewView, ViewportKey } from '../shared';
import { DISCLAIMER, VIEWPORT_KEYS } from '../shared';

/**
 * The host application's own page: the peer-group overview the widgets are embedded in. Its figures
 * come from the shared view model, so every variant shows the same document.
 */
defineProps<{
    view: OverviewView;
    /** The properties of the Studio instance shown in each viewport. */
    viewports: Record<ViewportKey, AgStudioProperties>;
    /** Whether the browser prints this page, rather than a report open over it. */
    isPrintRoot: boolean;
}>();
</script>

<template>
    <div class="agd-ea-sheet-scroll">
        <article class="agd-ea-sheet" :data-print-root="isPrintRoot ? '' : undefined">
            <header class="agd-ea-masthead">
                <div class="agd-ea-eyebrow">Sector Research - Industrials</div>
                <h1 class="agd-ea-title">{{ view.title }}</h1>
                <p class="agd-ea-lede">{{ view.description }}</p>
            </header>

            <dl class="agd-ea-kpis">
                <div v-for="stat in view.stats" :key="stat.label" class="agd-ea-kpi">
                    <dd class="agd-ea-kpi-value">{{ stat.value }}</dd>
                    <dt class="agd-ea-kpi-label">{{ stat.label }}</dt>
                </div>
            </dl>

            <ul class="agd-ea-coverage">
                <li v-for="company in view.companies" :key="company.ticker" class="agd-ea-coverage-item">
                    <img class="agd-ea-coverage-logo" :src="company.logoUrl" alt="" />
                    <div>
                        <div class="agd-ea-coverage-ticker">{{ company.ticker }}</div>
                        <div class="agd-ea-coverage-name">{{ company.name }}</div>
                    </div>
                </li>
            </ul>

            <div class="agd-ea-viewports">
                <section v-for="key in VIEWPORT_KEYS" :key="key" class="agd-ea-viewport" :data-viewport="key">
                    <AgStudio class="agd-ea-viewport-mount" :studio-properties="viewports[key]" />
                </section>
            </div>

            <footer class="agd-ea-sheet-footer">
                <p class="agd-ea-disclaimer">{{ DISCLAIMER }}</p>
            </footer>
        </article>
    </div>
</template>
