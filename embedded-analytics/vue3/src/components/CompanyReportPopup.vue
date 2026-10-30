<script lang="ts">
import type { AgConditionDefinition, AgDataEngine, AgStudioProperties } from 'ag-studio';

import type { PeerGroup } from '../shared';

export interface CompanyReportPopupParams {
    filter: AgConditionDefinition;
    group: PeerGroup;
    dataEngine: AgDataEngine;
    studioOverrides?: Partial<AgStudioProperties>;
}
</script>

<script setup lang="ts">
import type { AgStudioApi, AgWidgetsConfig } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-vue3';
import { computed, ref, shallowRef, useTemplateRef } from 'vue';

import type { PeerGroupRegistry } from '../shared';
import {
    ANALYST_CONSENSUS_WIDGET,
    DISCLAIMER,
    buildCompanyView,
    companyReportProperties,
    formatAsOf,
    printCompanyReport,
    showCompanyReport,
    withoutImageDownload,
} from '../shared';

import AnalystConsensus from './AnalystConsensus.vue';

/**
 * The popup a drill-through opens: an A4 landscape page, with the company report in a Studio of its
 * own between the host's masthead and footer, and the host's toolbar above it.
 */
const props = defineProps<{ params: CompanyReportPopupParams }>();

const widgets = (widgetConfig: AgWidgetsConfig<PeerGroupRegistry>) =>
    withoutImageDownload(
        createWidgets<PeerGroupRegistry>({
            additionalTypes: [{ ...ANALYST_CONSENSUS_WIDGET, comp: AnalystConsensus }],
            menu: [{ label: 'Custom', widgetIds: ['analystConsensus'] }, ...widgetConfig.menu],
        })
    );

const current = shallowRef(props.params);
const mode = ref<'view' | 'edit'>('view');
const studio = useTemplateRef<{ api?: AgStudioApi<PeerGroupRegistry> }>('studio');

// The report's opening properties only: another company is shown through the API instead.
const { dataEngine, filter, studioOverrides } = props.params;
const studioProperties = { ...companyReportProperties(dataEngine, filter, { studioOverrides }), widgets };

const company = computed(() => buildCompanyView(current.value.group, String(current.value.filter.value)));
const rangePosition = computed(() => `${Math.min(Math.max(company.value?.range52w.position ?? 0, 0), 1) * 100}%`);
const asOf = formatAsOf();

function refresh(params: CompanyReportPopupParams): void {
    current.value = params;
    const api = studio.value?.api;
    if (api) {
        showCompanyReport(api, params.filter);
    }
}

function print(): void {
    printCompanyReport();
}

defineExpose({ refresh });
</script>

<template>
    <div class="agd-ea-report">
        <div class="agd-ea-report-toolbar">
            <button type="button" class="agd-ea-button" @click="mode = mode === 'edit' ? 'view' : 'edit'">
                {{ mode === 'edit' ? 'View Mode' : 'Edit Mode' }}
            </button>
            <button type="button" class="agd-ea-button agd-ea-button-primary" @click="print">
                Print
            </button>
        </div>
        <article class="agd-ea-report-page" data-print-root>
            <header v-if="company" class="agd-ea-report-masthead">
                <img class="agd-ea-report-masthead-logo" :src="company.logoUrl" alt="" />
                <div class="agd-ea-report-masthead-identity">
                    <div class="agd-ea-report-masthead-name">{{ company.name }}</div>
                    <div class="agd-ea-report-masthead-tagline">{{ company.tagline }}</div>
                </div>
                <div class="agd-ea-range">
                    <div class="agd-ea-report-masthead-label">52-Week Range</div>
                    <div class="agd-ea-range-track">
                        <span class="agd-ea-range-marker" :style="{ left: rangePosition }"></span>
                    </div>
                    <div class="agd-ea-range-ends">
                        <span>{{ company.range52w.low }}</span>
                        <span>{{ company.range52w.high }}</span>
                    </div>
                </div>
                <div class="agd-ea-report-masthead-price">
                    <div class="agd-ea-report-masthead-close">{{ company.lastClose }}</div>
                    <div class="agd-ea-report-masthead-change" :data-direction="company.direction">
                        {{ company.change }}
                    </div>
                    <div class="agd-ea-report-masthead-label">Last Close</div>
                </div>
            </header>
            <AgStudio ref="studio" class="agd-ea-report-mount" :studio-properties="studioProperties" :mode="mode" />
            <footer class="agd-ea-report-footer">
                <span>{{ DISCLAIMER }}</span>
                <span>Figures as of {{ asOf }}</span>
            </footer>
        </article>
    </div>
</template>
