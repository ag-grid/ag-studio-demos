import { Component, computed, signal, viewChild } from '@angular/core';
import type { AgConditionDefinition, AgDataEngine, AgStudioProperties, AgWidgetsConfig } from 'ag-studio';
import type { AgCustomComponent } from 'ag-studio-angular';
import { AgStudio, createWidgets } from 'ag-studio-angular';

import type { PeerGroup, PeerGroupRegistry } from '../shared';
import {
    ANALYST_CONSENSUS_WIDGET,
    DISCLAIMER,
    buildCompanyView,
    companyReportProperties,
    formatAsOf,
    printCompanyReport,
    showCompanyReport,
} from '../shared';
import { AnalystConsensusComponent } from './analyst-consensus.component';

export interface CompanyReportPopupParams {
    filter: AgConditionDefinition;
    group: PeerGroup;
    dataEngine: AgDataEngine;
    studioOverrides?: Partial<AgStudioProperties>;
}

const widgets = (widgetConfig: AgWidgetsConfig<PeerGroupRegistry>) =>
    createWidgets<PeerGroupRegistry>({
        additionalTypes: [{ ...ANALYST_CONSENSUS_WIDGET, comp: AnalystConsensusComponent }],
        menu: [{ label: 'Custom', widgetIds: ['analystConsensus'] }, ...widgetConfig.menu],
    });

/**
 * The popup a drill-through opens: an A4 landscape page, with the company report in a Studio of its
 * own between the host's masthead and footer, and the host's toolbar above it.
 */
@Component({
    standalone: true,
    imports: [AgStudio],
    host: { class: 'agd-ea-report' },
    template: `
        <div class="agd-ea-report-toolbar">
            <button type="button" class="agd-ea-button" (click)="toggleMode()">
                {{ mode() === 'edit' ? 'View Mode' : 'Edit Mode' }}
            </button>
            <button type="button" class="agd-ea-button agd-ea-button-primary" (click)="print()">Print</button>
        </div>
        <article class="agd-ea-report-page" data-print-root>
            @if (company(); as company) {
                <header class="agd-ea-report-masthead">
                    <img class="agd-ea-report-masthead-logo" [src]="company.logoUrl" alt="" />
                    <div class="agd-ea-report-masthead-identity">
                        <div class="agd-ea-report-masthead-name">{{ company.name }}</div>
                        <div class="agd-ea-report-masthead-tagline">{{ company.tagline }}</div>
                    </div>
                    <div class="agd-ea-range">
                        <div class="agd-ea-report-masthead-label">52-Week Range</div>
                        <div class="agd-ea-range-track">
                            <span class="agd-ea-range-marker" [style.left.%]="rangePosition()"></span>
                        </div>
                        <div class="agd-ea-range-ends">
                            <span>{{ company.range52w.low }}</span>
                            <span>{{ company.range52w.high }}</span>
                        </div>
                    </div>
                    <div class="agd-ea-report-masthead-price">
                        <div class="agd-ea-report-masthead-close">{{ company.lastClose }}</div>
                        <div class="agd-ea-report-masthead-change" [attr.data-direction]="company.direction">
                            {{ company.change }}
                        </div>
                        <div class="agd-ea-report-masthead-label">Last Close</div>
                    </div>
                </header>
            }
            @if (studioProperties) {
                <ag-studio class="agd-ea-report-mount" [studioProperties]="studioProperties" [mode]="mode()" />
            }
            <footer class="agd-ea-report-footer">
                <span>{{ disclaimer }}</span>
                <span>Figures as of {{ asOf }}</span>
            </footer>
        </article>
    `,
})
export class CompanyReportPopupComponent implements AgCustomComponent<CompanyReportPopupParams> {
    protected readonly disclaimer = DISCLAIMER;
    protected readonly asOf = formatAsOf();
    protected readonly mode = signal<'view' | 'edit'>('view');
    /** The report's opening properties only: another company is shown through the API instead. */
    protected studioProperties?: AgStudioProperties<PeerGroupRegistry>;

    private readonly params = signal<CompanyReportPopupParams | undefined>(undefined);
    private readonly studio = viewChild(AgStudio<PeerGroupRegistry>);

    protected readonly company = computed(() => {
        const params = this.params();
        return params && buildCompanyView(params.group, String(params.filter.value));
    });
    protected readonly rangePosition = computed(
        () => Math.min(Math.max(this.company()?.range52w.position ?? 0, 0), 1) * 100
    );

    agInit(params: CompanyReportPopupParams): void {
        const { dataEngine, filter, studioOverrides } = params;
        this.params.set(params);
        this.studioProperties = { ...companyReportProperties(dataEngine, filter, { studioOverrides }), widgets };
    }

    refresh(params: CompanyReportPopupParams): void {
        this.params.set(params);
        const api = this.studio()?.api;
        if (api) {
            showCompanyReport(api, params.filter);
        }
    }

    protected toggleMode(): void {
        this.mode.update((mode) => (mode === 'edit' ? 'view' : 'edit'));
    }

    protected print(): void {
        printCompanyReport();
    }
}
