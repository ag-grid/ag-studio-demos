import type { OverviewView, ViewportKey } from './shared';
import { DISCLAIMER, VIEWPORT_KEYS } from './shared';

/**
 * The host application's own page, built as plain DOM: the peer-group overview the widgets are
 * embedded in.
 *
 * The overview's figures come from the shared view model, so every variant shows the same document.
 */

function el(tag: string, className?: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function masthead({ title, description }: OverviewView): HTMLElement {
    const header = el('header', 'agd-ea-masthead');
    header.append(
        el('div', 'agd-ea-eyebrow', 'Sector Research - Industrials'),
        el('h1', 'agd-ea-title', title),
        el('p', 'agd-ea-lede', description)
    );
    return header;
}

function keyStats({ stats }: OverviewView): HTMLElement {
    const list = el('dl', 'agd-ea-kpis');
    for (const { label, value } of stats) {
        const stat = el('div', 'agd-ea-kpi');
        stat.append(el('dd', 'agd-ea-kpi-value', value), el('dt', 'agd-ea-kpi-label', label));
        list.appendChild(stat);
    }
    return list;
}

function coverage({ companies }: OverviewView): HTMLElement {
    const list = el('ul', 'agd-ea-coverage');
    for (const { ticker, name, logoUrl } of companies) {
        const item = el('li', 'agd-ea-coverage-item');
        const logo = document.createElement('img');
        logo.className = 'agd-ea-coverage-logo';
        logo.src = logoUrl;
        logo.alt = '';
        const text = el('div');
        text.append(el('div', 'agd-ea-coverage-ticker', ticker), el('div', 'agd-ea-coverage-name', name));
        item.append(logo, text);
        list.appendChild(item);
    }
    return list;
}

export interface OverviewPage {
    sheet: HTMLElement;
    /** Where each viewport's Studio instance mounts. */
    mounts: Record<ViewportKey, HTMLElement>;
}

export function createOverviewPage(root: HTMLElement, view: OverviewView): OverviewPage {
    const scroll = el('div', 'agd-ea-sheet-scroll');
    const sheet = el('article', 'agd-ea-sheet');

    const grid = el('div', 'agd-ea-viewports');
    const mounts = {} as Record<ViewportKey, HTMLElement>;
    for (const key of VIEWPORT_KEYS) {
        const viewport = el('section', 'agd-ea-viewport');
        viewport.dataset.viewport = key;
        mounts[key] = el('div', 'agd-ea-viewport-mount');
        viewport.appendChild(mounts[key]);
        grid.appendChild(viewport);
    }

    const footer = el('footer', 'agd-ea-sheet-footer');
    footer.appendChild(el('p', 'agd-ea-disclaimer', DISCLAIMER));

    sheet.append(masthead(view), keyStats(view), coverage(view), grid, footer);
    scroll.appendChild(sheet);
    root.appendChild(scroll);

    return { sheet, mounts };
}
