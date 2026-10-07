import { Component, input, output } from '@angular/core';
import type { TearSheetView } from '@demo/embedded-analytics';
import { DISCLAIMER } from '@demo/embedded-analytics';

/**
 * The research tear sheet the widgets are embedded in: the host application, as far as this demo
 * is concerned. Its figures come from the shared view model, so every variant shows the same sheet.
 *
 * The viewports are projected in, so this component stays pure presentation.
 */
@Component({
    selector: 'app-tear-sheet',
    standalone: true,
    template: `
        <div class="agd-ea-sheet-scroll" data-sheet-scroll>
            <article class="agd-ea-sheet" data-tear-sheet>
                <header class="agd-ea-masthead">
                    <div class="agd-ea-brand">
                        <svg
                            class="agd-ea-logo-mark"
                            viewBox="0 0 40 40"
                            role="img"
                            [attr.aria-label]="view().company.name + ' logo'"
                        >
                            <rect x="5" y="4" width="8" height="32" fill="var(--hlvn-navy)" />
                            <rect x="27" y="4" width="8" height="32" fill="var(--hlvn-navy)" />
                            <path d="M13 15 L27 22 V30 L13 23 Z" fill="var(--hlvn-bronze)" />
                        </svg>
                        <div class="agd-ea-brand-text">
                            <div class="agd-ea-company-name">{{ view().company.name }}</div>
                            <div class="agd-ea-ticker-line">
                                <span class="agd-ea-exchange">
                                    {{ view().company.exchange }}: {{ view().company.ticker }}
                                </span>
                                <span class="agd-ea-sector-tag">{{ view().company.industry }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="agd-ea-price-block">
                        <div class="agd-ea-price-now">{{ view().price.now }}</div>
                        <div
                            class="agd-ea-price-change"
                            [class.agd-ea-up]="view().price.isUp"
                            [class.agd-ea-down]="!view().price.isUp"
                        >
                            {{ view().price.change }} ({{ view().price.changePct }})
                        </div>
                        <div class="agd-ea-price-as-of">Last close</div>
                    </div>
                </header>

                <div class="agd-ea-rule"></div>

                <div class="agd-ea-body">
                    <section class="agd-ea-col-left">
                        <h2 class="agd-ea-section-heading">Company Profile</h2>
                        <p class="agd-ea-profile-text">{{ view().company.description }}</p>

                        <h2 class="agd-ea-section-heading">Key Statistics</h2>
                        <dl class="agd-ea-stat-grid">
                            @for (stat of view().stats; track stat.label) {
                                <div class="agd-ea-stat">
                                    <dt class="agd-ea-stat-label">{{ stat.label }}</dt>
                                    <dd class="agd-ea-stat-value">{{ stat.value }}</dd>
                                </div>
                            }
                        </dl>

                        <h2 class="agd-ea-section-heading">Analyst Consensus</h2>
                        <div class="agd-ea-analyst">
                            <div class="agd-ea-analyst-top">
                                <span class="agd-ea-rating">{{ view().analyst.rating }}</span>
                                <span class="agd-ea-analyst-meta">{{ view().analyst.numAnalysts }} analysts</span>
                            </div>
                            <dl class="agd-ea-targets">
                                <div class="agd-ea-stat">
                                    <dt class="agd-ea-stat-label">Target (Avg)</dt>
                                    <dd class="agd-ea-stat-value">{{ view().analyst.targetAvg }}</dd>
                                </div>
                                <div class="agd-ea-stat">
                                    <dt class="agd-ea-stat-label">High</dt>
                                    <dd class="agd-ea-stat-value">{{ view().analyst.targetHigh }}</dd>
                                </div>
                                <div class="agd-ea-stat">
                                    <dt class="agd-ea-stat-label">Low</dt>
                                    <dd class="agd-ea-stat-value">{{ view().analyst.targetLow }}</dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section class="agd-ea-col-centre">
                        <ng-content select="[centre]" />
                    </section>

                    <section class="agd-ea-col-right">
                        <ng-content select="[right]" />

                        <h2 class="agd-ea-section-heading">Peer Comparison</h2>
                        <table class="agd-ea-peer-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th class="agd-ea-num">Mkt Cap</th>
                                    <th class="agd-ea-num">P/E</th>
                                    <th class="agd-ea-num">Rev Gr.</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (peer of view().peers; track peer.ticker; let first = $first) {
                                    <tr [class.agd-ea-self-row]="first">
                                        <td>{{ peer.ticker }}</td>
                                        <td class="agd-ea-num">{{ peer.marketCap }}</td>
                                        <td class="agd-ea-num">{{ peer.peRatio }}</td>
                                        <td class="agd-ea-num">{{ peer.revenueGrowth }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </section>
                </div>

                <div class="agd-ea-rule"></div>
                <footer class="agd-ea-sheet-footer">
                    <p class="agd-ea-disclaimer">{{ disclaimer }}</p>
                    <button
                        type="button"
                        class="agd-ea-export-button"
                        title="Export this tear sheet"
                        (click)="export.emit()"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M6 9V3h12v6" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v7H6z" />
                        </svg>
                        <span>Export</span>
                    </button>
                </footer>
            </article>
        </div>
    `,
})
export class TearSheetComponent {
    public readonly view = input.required<TearSheetView>();
    public readonly export = output<void>();

    protected readonly disclaimer = DISCLAIMER;
}
