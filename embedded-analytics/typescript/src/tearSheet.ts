import type { TearSheetView, ViewportKey } from '@demo/embedded-analytics';
import { DISCLAIMER, VIEWPORT_TITLES } from '@demo/embedded-analytics';

/**
 * The research tear sheet the widgets are embedded in, built as plain DOM.
 *
 * The sheet is the host application as far as this demo is concerned; its figures come from the
 * shared view model, so every variant shows the same document.
 */

function el(tag: string, className?: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function button(className: string, text?: string): HTMLButtonElement {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function svg(viewBox: string, paths: string[], className?: string, fill = 'currentColor'): SVGSVGElement {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('viewBox', viewBox);
    node.setAttribute('aria-hidden', 'true');
    if (className) node.setAttribute('class', className);
    for (const d of paths) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', fill);
        node.appendChild(path);
    }
    return node;
}

function stat(label: string, value: string): HTMLElement {
    const wrapper = el('div', 'agd-ea-stat');
    wrapper.append(el('dt', 'agd-ea-stat-label', label), el('dd', 'agd-ea-stat-value', value));
    return wrapper;
}

function masthead(view: TearSheetView): HTMLElement {
    const { company, price } = view;

    const header = el('header', 'agd-ea-masthead');

    const brand = el('div', 'agd-ea-brand');
    const logo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    logo.setAttribute('viewBox', '0 0 40 40');
    logo.setAttribute('class', 'agd-ea-logo-mark');
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', `${company.name} logo`);
    for (const [x, fill] of [
        ['5', 'var(--hlvn-navy)'],
        ['27', 'var(--hlvn-navy)'],
    ] as const) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', '4');
        rect.setAttribute('width', '8');
        rect.setAttribute('height', '32');
        rect.setAttribute('fill', fill);
        logo.appendChild(rect);
    }
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevron.setAttribute('d', 'M13 15 L27 22 V30 L13 23 Z');
    chevron.setAttribute('fill', 'var(--hlvn-bronze)');
    logo.appendChild(chevron);

    const brandText = el('div', 'agd-ea-brand-text');
    brandText.appendChild(el('div', 'agd-ea-company-name', company.name));
    const tickerLine = el('div', 'agd-ea-ticker-line');
    tickerLine.append(
        el('span', 'agd-ea-exchange', `${company.exchange}: ${company.ticker}`),
        el('span', 'agd-ea-sector-tag', company.industry)
    );
    brandText.appendChild(tickerLine);
    brand.append(logo, brandText);

    const priceBlock = el('div', 'agd-ea-price-block');
    priceBlock.append(
        el('div', 'agd-ea-price-now', price.now),
        el(
            'div',
            `agd-ea-price-change ${price.isUp ? 'agd-ea-up' : 'agd-ea-down'}`,
            `${price.change} (${price.changePct})`
        ),
        el('div', 'agd-ea-price-as-of', 'Last close')
    );

    header.append(brand, priceBlock);
    return header;
}

function leftColumn(view: TearSheetView): HTMLElement {
    const { company, stats, analyst } = view;
    const section = el('section', 'agd-ea-col-left');

    section.append(
        el('h2', 'agd-ea-section-heading', 'Company Profile'),
        el('p', 'agd-ea-profile-text', company.description),
        el('h2', 'agd-ea-section-heading', 'Key Statistics')
    );

    const grid = el('dl', 'agd-ea-stat-grid');
    for (const entry of stats) {
        grid.appendChild(stat(entry.label, entry.value));
    }
    section.append(grid, el('h2', 'agd-ea-section-heading', 'Analyst Consensus'));

    const analystBlock = el('div', 'agd-ea-analyst');
    const top = el('div', 'agd-ea-analyst-top');
    top.append(
        el('span', 'agd-ea-rating', analyst.rating),
        el('span', 'agd-ea-analyst-meta', `${analyst.numAnalysts} analysts`)
    );
    const targets = el('dl', 'agd-ea-targets');
    targets.append(
        stat('Target (Avg)', analyst.targetAvg),
        stat('High', analyst.targetHigh),
        stat('Low', analyst.targetLow)
    );
    analystBlock.append(top, targets);
    section.appendChild(analystBlock);

    return section;
}

function peerTable(view: TearSheetView): HTMLElement {
    const table = el('table', 'agd-ea-peer-table');

    const head = el('thead');
    const headRow = el('tr');
    headRow.appendChild(el('th', undefined, 'Ticker'));
    for (const label of ['Mkt Cap', 'P/E', 'Rev Gr.']) {
        headRow.appendChild(el('th', 'agd-ea-num', label));
    }
    head.appendChild(headRow);

    const bodyEl = el('tbody');
    view.peers.forEach((peer, index) => {
        const row = el('tr', index === 0 ? 'agd-ea-self-row' : undefined);
        row.appendChild(el('td', undefined, peer.ticker));
        for (const value of [peer.marketCap, peer.peRatio, peer.revenueGrowth]) {
            row.appendChild(el('td', 'agd-ea-num', value));
        }
        bodyEl.appendChild(row);
    });

    table.append(head, bodyEl);
    return table;
}

function footer(onExport: () => void): HTMLElement {
    const sheetFooter = el('footer', 'agd-ea-sheet-footer');
    sheetFooter.appendChild(el('p', 'agd-ea-disclaimer', DISCLAIMER));

    const exportButton = button('agd-ea-export-button');
    exportButton.title = 'Export this tear sheet';
    const icon = svg(
        '0 0 24 24',
        ['M6 9V3h12v6', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v7H6z'],
        undefined,
        'none'
    );
    for (const path of icon.querySelectorAll('path')) {
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
    }
    exportButton.append(icon, el('span', undefined, 'Export'));
    exportButton.addEventListener('click', onExport);

    sheetFooter.appendChild(exportButton);
    return sheetFooter;
}

export interface ViewportChrome {
    /** The card in the sheet. */
    card: HTMLElement;
    /** Where Studio's container sits while embedded. */
    slot: HTMLElement;
    /** Studio's own container, moved between the card and the expanded overlay. */
    mount: HTMLElement;
    editButton: HTMLButtonElement;
}

/** One viewport card: a slot for Studio's canvas, and the affordance that expands it. */
export function createViewportChrome(key: ViewportKey): ViewportChrome {
    const title = VIEWPORT_TITLES[key];

    const card = el('div', 'agd-ea-viewport');
    card.dataset.viewport = key;

    const slot = el('div', 'agd-ea-viewport-slot');
    const mount = el('div', 'agd-ea-viewport-mount');
    slot.appendChild(mount);

    const editButton = button('agd-ea-edit-button');
    editButton.title = `Edit ${title}`;
    editButton.setAttribute('aria-label', `Edit ${title}`);
    editButton.append(
        svg('0 0 32 32', [
            'M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-16 16V26h7.4l15-15zM20.4 4l3.6 3.6-3 3L17.4 7l3-3zM5 24v-4.6l11-11 3.6 3.6-11 11H5z',
        ]),
        el('span', undefined, 'Edit')
    );

    card.append(slot, editButton);

    return { card, slot, mount, editButton };
}

export interface TearSheetChrome {
    root: HTMLElement;
    /** Where each viewport card belongs, by column. */
    centreColumn: HTMLElement;
    rightColumn: HTMLElement;
}

/** Build the sheet into `container`, leaving the viewport columns empty for the caller to fill. */
export function createTearSheet(container: HTMLElement, view: TearSheetView, onExport: () => void): TearSheetChrome {
    const root = el('div', 'agd-ea');
    root.dataset.embeddedRoot = '';

    const scroll = el('div', 'agd-ea-sheet-scroll');
    scroll.dataset.sheetScroll = '';

    const sheet = el('article', 'agd-ea-sheet');
    sheet.dataset.tearSheet = '';

    const body = el('div', 'agd-ea-body');
    const centreColumn = el('section', 'agd-ea-col-centre');
    const rightColumn = el('section', 'agd-ea-col-right');
    body.append(leftColumn(view), centreColumn, rightColumn);

    sheet.append(masthead(view), el('div', 'agd-ea-rule'), body, el('div', 'agd-ea-rule'), footer(onExport));
    scroll.appendChild(sheet);
    root.appendChild(scroll);
    container.appendChild(root);

    return { root, centreColumn, rightColumn };
}

/** The peer table sits under the right column's viewport, so it is added after the cards. */
export function appendPeerComparison(rightColumn: HTMLElement, view: TearSheetView): void {
    rightColumn.append(el('h2', 'agd-ea-section-heading', 'Peer Comparison'), peerTable(view));
}
