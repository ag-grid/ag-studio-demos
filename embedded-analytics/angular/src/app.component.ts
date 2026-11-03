import { Component, ElementRef, inject, input, signal } from '@angular/core';
import type { AgPopupInstance, AgStudioApi, AgStudioProperties } from 'ag-studio';

import type { CompanyReportPopupParams } from './components/company-report-popup.component';
import { CompanyReportPopupComponent } from './components/company-report-popup.component';
import { OverviewPageComponent } from './components/overview-page.component';
import type { DrillThroughHandler, ViewportKey } from './shared';
import {
    VIEWPORT_KEYS,
    buildOverviewView,
    companyReportPopupOptions,
    createPeerGroupDataEngine,
    getPeerGroup,
    viewportProperties,
} from './shared';

/**
 * The In-App Reporting demo: a host application's own page with Studio widgets embedded in it,
 * from which the reader drills through to a full Studio report on any one company, opened in a
 * popup over the page.
 *
 * Every Studio instance reads from the one data engine created here - that shared engine is the
 * point. This component's own element is the popup parent, so it exists before any viewport does.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [OverviewPageComponent],
    host: { class: 'agd-ea' },
    template: `
        <!-- While the report is open it is what the browser prints, rather than the page behind it. -->
        <app-overview-page [view]="view" [viewports]="viewports" [isPrintRoot]="!reportOpen()" />
    `,
})
export class AppComponent {
    public readonly studioOverrides = input<Partial<AgStudioProperties> | undefined>(undefined);

    private readonly group = getPeerGroup();
    protected readonly view = buildOverviewView(this.group);
    private readonly dataEngine = createPeerGroupDataEngine(this.group);
    private readonly root: HTMLElement = inject(ElementRef).nativeElement;

    protected readonly reportOpen = signal(false);
    private opener?: AgStudioApi;
    private popup?: {
        instance: AgPopupInstance<CompanyReportPopupParams>;
        params: CompanyReportPopupParams;
        /** Focus goes back to wherever the latest drill-through came from. */
        restoreFocusOnClose?: () => void;
    };

    private readonly drillThrough: DrillThroughHandler = (filter, restoreFocusOnClose) => {
        // The popup is not modal, so the overview can drill through again while it is open.
        if (this.popup) {
            this.popup.restoreFocusOnClose = restoreFocusOnClose;
            this.popup.params = { ...this.popup.params, filter };
            this.popup.instance.refresh(this.popup.params);
            return;
        }
        if (!this.opener) return;

        const { group, dataEngine } = this;
        const params: CompanyReportPopupParams = { filter, group, dataEngine, studioOverrides: this.studioOverrides() };
        // Any viewport can open it: they share the popup parent, so it opens over the whole demo.
        const instance = this.opener.createPopup<CompanyReportPopupParams>({
            ...companyReportPopupOptions(this.root),
            comp: CompanyReportPopupComponent,
            compParams: params,
            closedCallback: () => {
                const restoreFocus = this.popup?.restoreFocusOnClose;
                this.popup = undefined;
                this.reportOpen.set(false);
                restoreFocus?.();
            },
        });
        this.popup = { instance, params, restoreFocusOnClose };
        this.reportOpen.set(true);
    };

    protected readonly viewports = Object.fromEntries(
        VIEWPORT_KEYS.map((key): [ViewportKey, AgStudioProperties] => [
            key,
            {
                ...viewportProperties(key, this.dataEngine, this.root, this.drillThrough, {
                    studioOverrides: this.studioOverrides(),
                }),
                onApiReady: ({ api }) => {
                    this.opener ??= api;
                },
            },
        ])
    ) as Record<ViewportKey, AgStudioProperties>;
}
