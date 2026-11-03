import { Component, input } from '@angular/core';
import type { AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-angular';

import type { OverviewView, ViewportKey } from '../shared';
import { DISCLAIMER, VIEWPORT_KEYS } from '../shared';

/**
 * The host application's own page: the peer-group overview the widgets are embedded in. Its figures
 * come from the shared view model, so every variant shows the same document.
 */
@Component({
    selector: 'app-overview-page',
    standalone: true,
    imports: [AgStudio],
    host: { class: 'agd-ea-sheet-scroll' },
    template: `
        <article class="agd-ea-sheet" [attr.data-print-root]="isPrintRoot() ? '' : null">
            <header class="agd-ea-masthead">
                <div class="agd-ea-eyebrow">Sector Research - Industrials</div>
                <h1 class="agd-ea-title">{{ view().title }}</h1>
                <p class="agd-ea-lede">{{ view().description }}</p>
            </header>

            <dl class="agd-ea-kpis">
                @for (stat of view().stats; track stat.label) {
                    <div class="agd-ea-kpi">
                        <dd class="agd-ea-kpi-value">{{ stat.value }}</dd>
                        <dt class="agd-ea-kpi-label">{{ stat.label }}</dt>
                    </div>
                }
            </dl>

            <ul class="agd-ea-coverage">
                @for (company of view().companies; track company.ticker) {
                    <li class="agd-ea-coverage-item">
                        <img class="agd-ea-coverage-logo" [src]="company.logoUrl" alt="" />
                        <div>
                            <div class="agd-ea-coverage-ticker">{{ company.ticker }}</div>
                            <div class="agd-ea-coverage-name">{{ company.name }}</div>
                        </div>
                    </li>
                }
            </ul>

            <div class="agd-ea-viewports">
                @for (key of viewportKeys; track key) {
                    <section class="agd-ea-viewport" [attr.data-viewport]="key">
                        <ag-studio class="agd-ea-viewport-mount" [studioProperties]="viewports()[key]" />
                    </section>
                }
            </div>

            <footer class="agd-ea-sheet-footer">
                <p class="agd-ea-disclaimer">{{ disclaimer }}</p>
            </footer>
        </article>
    `,
})
export class OverviewPageComponent {
    public readonly view = input.required<OverviewView>();
    /** The properties of the Studio instance shown in each viewport. */
    public readonly viewports = input.required<Record<ViewportKey, AgStudioProperties>>();
    /** Whether the browser prints this page, rather than a report open over it. */
    public readonly isPrintRoot = input.required<boolean>();

    protected readonly viewportKeys = VIEWPORT_KEYS;
    protected readonly disclaimer = DISCLAIMER;
}
