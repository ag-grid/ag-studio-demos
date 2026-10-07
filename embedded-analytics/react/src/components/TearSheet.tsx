import type { TearSheetView } from '@demo/embedded-analytics';
import { DISCLAIMER } from '@demo/embedded-analytics';
import type { ReactNode } from 'react';

interface Props {
    view: TearSheetView;
    /** The two viewports that sit in the centre column. */
    centre: ReactNode;
    /** The viewport that sits above the peer table. */
    right: ReactNode;
    onExport: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="agd-ea-stat">
            <dt className="agd-ea-stat-label">{label}</dt>
            <dd className="agd-ea-stat-value">{value}</dd>
        </div>
    );
}

function Masthead({ view }: { view: TearSheetView }) {
    const { company, price } = view;

    return (
        <header className="agd-ea-masthead">
            <div className="agd-ea-brand">
                <svg className="agd-ea-logo-mark" viewBox="0 0 40 40" role="img" aria-label={`${company.name} logo`}>
                    <rect x="5" y="4" width="8" height="32" fill="var(--hlvn-navy)" />
                    <rect x="27" y="4" width="8" height="32" fill="var(--hlvn-navy)" />
                    <path d="M13 15 L27 22 V30 L13 23 Z" fill="var(--hlvn-bronze)" />
                </svg>
                <div className="agd-ea-brand-text">
                    <div className="agd-ea-company-name">{company.name}</div>
                    <div className="agd-ea-ticker-line">
                        <span className="agd-ea-exchange">
                            {company.exchange}: {company.ticker}
                        </span>
                        <span className="agd-ea-sector-tag">{company.industry}</span>
                    </div>
                </div>
            </div>
            <div className="agd-ea-price-block">
                <div className="agd-ea-price-now">{price.now}</div>
                <div className={`agd-ea-price-change ${price.isUp ? 'agd-ea-up' : 'agd-ea-down'}`}>
                    {price.change} ({price.changePct})
                </div>
                <div className="agd-ea-price-as-of">Last close</div>
            </div>
        </header>
    );
}

/**
 * The research tear sheet the widgets are embedded in: the host application, as far as this demo
 * is concerned. Its figures come from the shared view model, so every variant shows the same sheet.
 */
export function TearSheet({ view, centre, right, onExport }: Props) {
    const { company, stats, analyst, peers } = view;

    return (
        <div className="agd-ea-sheet-scroll" data-sheet-scroll>
            <article className="agd-ea-sheet" data-tear-sheet>
                <Masthead view={view} />

                <div className="agd-ea-rule" />

                <div className="agd-ea-body">
                    <section className="agd-ea-col-left">
                        <h2 className="agd-ea-section-heading">Company Profile</h2>
                        <p className="agd-ea-profile-text">{company.description}</p>

                        <h2 className="agd-ea-section-heading">Key Statistics</h2>
                        <dl className="agd-ea-stat-grid">
                            {stats.map((stat) => (
                                <Stat key={stat.label} {...stat} />
                            ))}
                        </dl>

                        <h2 className="agd-ea-section-heading">Analyst Consensus</h2>
                        <div className="agd-ea-analyst">
                            <div className="agd-ea-analyst-top">
                                <span className="agd-ea-rating">{analyst.rating}</span>
                                <span className="agd-ea-analyst-meta">{analyst.numAnalysts} analysts</span>
                            </div>
                            <dl className="agd-ea-targets">
                                <Stat label="Target (Avg)" value={analyst.targetAvg} />
                                <Stat label="High" value={analyst.targetHigh} />
                                <Stat label="Low" value={analyst.targetLow} />
                            </dl>
                        </div>
                    </section>

                    <section className="agd-ea-col-centre">{centre}</section>

                    <section className="agd-ea-col-right">
                        {right}

                        <h2 className="agd-ea-section-heading">Peer Comparison</h2>
                        <table className="agd-ea-peer-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th className="agd-ea-num">Mkt Cap</th>
                                    <th className="agd-ea-num">P/E</th>
                                    <th className="agd-ea-num">Rev Gr.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {peers.map((peer, index) => (
                                    <tr key={peer.ticker} className={index === 0 ? 'agd-ea-self-row' : undefined}>
                                        <td>{peer.ticker}</td>
                                        <td className="agd-ea-num">{peer.marketCap}</td>
                                        <td className="agd-ea-num">{peer.peRatio}</td>
                                        <td className="agd-ea-num">{peer.revenueGrowth}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>

                <div className="agd-ea-rule" />
                <footer className="agd-ea-sheet-footer">
                    <p className="agd-ea-disclaimer">{DISCLAIMER}</p>
                    <button
                        type="button"
                        className="agd-ea-export-button"
                        onClick={onExport}
                        title="Export this tear sheet"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
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
    );
}
