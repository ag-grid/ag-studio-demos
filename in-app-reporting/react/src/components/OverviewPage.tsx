import type { ReactNode } from 'react';

import type { OverviewView, ViewportKey } from '../shared';
import { DISCLAIMER, VIEWPORT_KEYS } from '../shared';

interface Props {
    view: OverviewView;
    /** The Studio instance shown in each viewport. */
    viewports: Record<ViewportKey, ReactNode>;
    /** Whether the browser prints this page, rather than a report open over it. */
    isPrintRoot: boolean;
}

/**
 * The host application's own page: the peer-group overview the widgets are embedded in. Its figures
 * come from the shared view model, so every variant shows the same document.
 */
export function OverviewPage({ view: { title, description, stats, companies }, viewports, isPrintRoot }: Props) {
    return (
        <div className="agd-ea-sheet-scroll">
            <article className="agd-ea-sheet" data-print-root={isPrintRoot ? '' : undefined}>
                <header className="agd-ea-masthead">
                    <div className="agd-ea-eyebrow">Sector Research - Industrials</div>
                    <h1 className="agd-ea-title">{title}</h1>
                    <p className="agd-ea-lede">{description}</p>
                </header>

                <dl className="agd-ea-kpis">
                    {stats.map(({ label, value }) => (
                        <div key={label} className="agd-ea-kpi">
                            <dd className="agd-ea-kpi-value">{value}</dd>
                            <dt className="agd-ea-kpi-label">{label}</dt>
                        </div>
                    ))}
                </dl>

                <ul className="agd-ea-coverage">
                    {companies.map(({ ticker, name, logoUrl }) => (
                        <li key={ticker} className="agd-ea-coverage-item">
                            <img className="agd-ea-coverage-logo" src={logoUrl} alt="" />
                            <div>
                                <div className="agd-ea-coverage-ticker">{ticker}</div>
                                <div className="agd-ea-coverage-name">{name}</div>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="agd-ea-viewports">
                    {VIEWPORT_KEYS.map((key) => (
                        <section key={key} className="agd-ea-viewport" data-viewport={key}>
                            {viewports[key]}
                        </section>
                    ))}
                </div>

                <footer className="agd-ea-sheet-footer">
                    <p className="agd-ea-disclaimer">{DISCLAIMER}</p>
                </footer>
            </article>
        </div>
    );
}
