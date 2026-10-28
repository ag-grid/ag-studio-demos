<script setup lang="ts">
import type { AgPopupInstance, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { computed, ref, useTemplateRef } from 'vue';

import type { DrillThroughHandler, ViewportKey } from './shared';
import {
    VIEWPORT_KEYS,
    buildOverviewView,
    companyReportPopupOptions,
    createPeerGroupDataEngine,
    getPeerGroup,
    viewportProperties,
} from './shared';

import type { CompanyReportPopupParams } from './components/CompanyReportPopup.vue';
import CompanyReportPopup from './components/CompanyReportPopup.vue';
import OverviewPage from './components/OverviewPage.vue';

/**
 * The In-App Reporting demo: a host application's own page with Studio widgets embedded in it,
 * from which the reader drills through to a full Studio report on any one company, opened in a
 * popup over the page.
 *
 * Every Studio instance reads from the one data engine created here - that shared engine is the
 * point.
 */
const props = defineProps<{
    studioOverrides?: Partial<AgStudioProperties>;
}>();

const group = getPeerGroup();
const view = buildOverviewView(group);
const dataEngine = createPeerGroupDataEngine(group);

// The viewports open their menus and the report popup in this element, so it must exist first.
const root = useTemplateRef<HTMLElement>('root');
const reportOpen = ref(false);
let opener: AgStudioApi | undefined;
let popup:
    | {
          instance: AgPopupInstance<CompanyReportPopupParams>;
          params: CompanyReportPopupParams;
          /** Focus goes back to wherever the latest drill-through came from. */
          restoreFocusOnClose?: () => void;
      }
    | undefined;

function openReport(container: HTMLElement): DrillThroughHandler {
    return (filter, restoreFocusOnClose) => {
        // The popup is not modal, so the overview can drill through again while it is open.
        if (popup) {
            popup.restoreFocusOnClose = restoreFocusOnClose;
            popup.params = { ...popup.params, filter };
            popup.instance.refresh(popup.params);
            return;
        }
        if (!opener) return;

        const params: CompanyReportPopupParams = {
            filter,
            group,
            dataEngine,
            studioOverrides: props.studioOverrides,
        };
        // Any viewport can open it: they share the popup parent, so it opens over the whole demo.
        const instance = opener.createPopup<CompanyReportPopupParams>({
            ...companyReportPopupOptions(container),
            comp: CompanyReportPopup,
            compParams: params,
            closedCallback: () => {
                const restoreFocus = popup?.restoreFocusOnClose;
                popup = undefined;
                reportOpen.value = false;
                restoreFocus?.();
            },
        });
        popup = { instance, params, restoreFocusOnClose };
        reportOpen.value = true;
    };
}

const viewports = computed(() => {
    const container = root.value;
    if (!container) return undefined;

    const drillThrough = openReport(container);
    return Object.fromEntries(
        VIEWPORT_KEYS.map((key): [ViewportKey, AgStudioProperties] => [
            key,
            {
                ...viewportProperties(key, dataEngine, container, drillThrough, {
                    studioOverrides: props.studioOverrides,
                }),
                onApiReady: ({ api }) => {
                    opener ??= api;
                },
            },
        ])
    ) as Record<ViewportKey, AgStudioProperties>;
});
</script>

<template>
    <div ref="root" class="agd-ea">
        <!-- While the report is open it is what the browser prints, rather than the page behind it. -->
        <OverviewPage v-if="viewports" :view="view" :viewports="viewports" :is-print-root="!reportOpen" />
    </div>
</template>
