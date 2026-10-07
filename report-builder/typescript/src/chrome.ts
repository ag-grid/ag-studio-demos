import type { DemoProfile } from '@demo/report-builder';

/** Every element the demo's behaviour needs to reach, resolved once at build time. */
export interface ReportBuilderChrome {
    readonly root: HTMLElement;
    readonly reportsNav: HTMLElement;
    readonly addReportButton: HTMLButtonElement;
    readonly canvas: HTMLElement;
    readonly profileButton: HTMLButtonElement;
    readonly profileMenu: HTMLElement;
    readonly profileAvatar: HTMLElement;
    readonly profileName: HTMLElement;
    readonly profileRole: HTMLElement;
}

export interface ChromeOptions {
    /** Reports listed in the sidebar, in display order. */
    readonly reports: ReadonlyArray<{ id: string; name: string }>;
    /** Personas offered by the account switcher. */
    readonly profiles: ReadonlyArray<DemoProfile>;
    /** The persona shown as signed in on first paint. */
    readonly defaultProfile: DemoProfile;
    /** Wordmark shown above the reports list. */
    readonly brand: { readonly name: string; readonly accent: string };
}

function svg(viewBox: string, path: string, className: string): SVGSVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    element.setAttribute('viewBox', viewBox);
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('class', className);

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    element.appendChild(pathElement);

    return element;
}

function strokeIcon(path: string, className: string): SVGSVGElement {
    const element = svg('0 0 24 24', path, className);
    const pathElement = element.firstElementChild!;
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke', 'currentColor');
    pathElement.setAttribute('stroke-width', '2');
    pathElement.setAttribute('stroke-linecap', 'round');
    return element;
}

const REPORT_ICON_PATH = 'M5 20v-8M10 20V5M15 20v-5M20 20V9';
const PLUS_ICON_PATH = 'M12 5v14M5 12h14';
const CHEVRON_DOWN_PATH = 'M23.763 9.763 16 17.525 8.237 9.763l-2.474 2.474L16 22.475l10.237-10.238-2.474-2.474Z';
const CHECK_PATH = 'M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z';

/**
 * Build a report button. Exported because adding a report mid-session needs the same markup,
 * which the original chrome got by cloning the first button in the list.
 */
export function createReportButton(id: string, name: string, isActive: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `agd-rb-report-item${isActive ? ' active' : ''}`;
    button.dataset.reportId = id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    // Roving tabindex: only the selected report is in the tab sequence, the rest are
    // reached with the arrow keys.
    button.tabIndex = isActive ? 0 : -1;

    button.appendChild(strokeIcon(REPORT_ICON_PATH, 'agd-rb-report-icon'));

    const label = document.createElement('span');
    label.className = 'agd-rb-report-label';
    button.appendChild(label);

    setReportName(button, name);
    return button;
}

/** The label element a report button renames in place. */
export function reportLabel(button: HTMLElement): HTMLElement {
    return button.querySelector<HTMLElement>('.agd-rb-report-label')!;
}

export function setReportName(button: HTMLElement, name: string): void {
    button.dataset.text = name;
    button.title = name;
    reportLabel(button).textContent = name;
}

function createProfileOption(profile: DemoProfile, isActive: boolean): HTMLButtonElement {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'agd-rb-profile-option';
    option.dataset.profileId = profile.id;
    option.setAttribute('role', 'menuitemradio');
    option.setAttribute('aria-checked', isActive ? 'true' : 'false');
    option.tabIndex = isActive ? 0 : -1;

    const avatar = document.createElement('span');
    avatar.className = 'agd-rb-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = profile.initials;

    const identity = document.createElement('span');
    identity.className = 'agd-rb-profile-identity';

    const name = document.createElement('span');
    name.className = 'agd-rb-profile-name';
    name.textContent = profile.name;

    const role = document.createElement('span');
    role.className = 'agd-rb-profile-role';
    role.textContent = profile.role;

    identity.append(name, role);
    option.append(avatar, identity, svg('0 0 32 32', CHECK_PATH, 'agd-rb-profile-tick'));

    return option;
}

function createProfileSwitcher(
    profiles: ReadonlyArray<DemoProfile>,
    defaultProfile: DemoProfile
): {
    switcher: HTMLElement;
    button: HTMLButtonElement;
    menu: HTMLElement;
    avatar: HTMLElement;
    name: HTMLElement;
    role: HTMLElement;
} {
    const switcher = document.createElement('div');
    switcher.className = 'agd-rb-profile-switcher';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'agd-rb-profile-button';
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');

    const avatar = document.createElement('span');
    avatar.className = 'agd-rb-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = defaultProfile.initials;

    const identity = document.createElement('span');
    identity.className = 'agd-rb-profile-identity';

    const name = document.createElement('span');
    name.className = 'agd-rb-profile-name';
    name.textContent = defaultProfile.name;

    const role = document.createElement('span');
    role.className = 'agd-rb-profile-role';
    role.textContent = defaultProfile.role;

    identity.append(name, role);
    button.append(avatar, identity, svg('0 0 32 32', CHEVRON_DOWN_PATH, 'agd-rb-profile-chevron'));

    const menu = document.createElement('div');
    menu.className = 'agd-rb-profile-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Switch profile');
    menu.hidden = true;

    const heading = document.createElement('div');
    heading.className = 'agd-rb-profile-menu-heading';
    heading.setAttribute('aria-hidden', 'true');
    heading.textContent = 'Switch profile';
    menu.appendChild(heading);

    for (const profile of profiles) {
        menu.appendChild(createProfileOption(profile, profile.id === defaultProfile.id));
    }

    // The menu is labelled by the button it opens from, which needs an id to point at.
    const menuId = 'agd-rb-profile-menu';
    menu.id = menuId;
    button.setAttribute('aria-controls', menuId);

    switcher.append(button, menu);

    return { switcher, button, menu, avatar, name, role };
}

/**
 * Render the demo's product-shell chrome into `container` and return its elements.
 *
 * The chrome is the demo, not the host page: a reports sidebar, an account switcher and a
 * canvas for Studio. Everything is built here rather than expected in the host's markup, so
 * the demo drops into a bare `<div>` and never reaches outside `container`.
 */
export function createChrome(container: HTMLElement, options: ChromeOptions): ReportBuilderChrome {
    const { reports, profiles, defaultProfile, brand } = options;

    const root = document.createElement('div');
    root.className = 'agd-rb';

    const body = document.createElement('div');
    body.className = 'agd-rb-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'agd-rb-sidebar';

    const brandEl = document.createElement('div');
    brandEl.className = 'agd-rb-brand';
    brandEl.textContent = brand.name;
    const brandAccent = document.createElement('span');
    brandAccent.className = 'agd-rb-brand-accent';
    brandAccent.textContent = brand.accent;
    brandEl.appendChild(brandAccent);

    const heading = document.createElement('div');
    heading.className = 'agd-rb-sidebar-heading';
    heading.textContent = 'Reports';

    const reportsNav = document.createElement('nav');
    reportsNav.className = 'agd-rb-reports-nav';
    reportsNav.setAttribute('role', 'tablist');
    reportsNav.setAttribute('aria-orientation', 'vertical');
    reportsNav.setAttribute('aria-label', 'Reports');
    reports.forEach(({ id, name }, index) => {
        reportsNav.appendChild(createReportButton(id, name, index === 0));
    });

    const addReportButton = document.createElement('button');
    addReportButton.type = 'button';
    addReportButton.className = 'agd-rb-new-report';
    addReportButton.appendChild(strokeIcon(PLUS_ICON_PATH, 'agd-rb-new-report-icon'));
    addReportButton.appendChild(document.createTextNode('New report'));

    const profile = createProfileSwitcher(profiles, defaultProfile);

    sidebar.append(brandEl, heading, reportsNav, addReportButton, profile.switcher);

    const canvasWrap = document.createElement('main');
    canvasWrap.className = 'agd-rb-canvas-wrap';

    const canvas = document.createElement('div');
    canvas.className = 'agd-rb-canvas';
    canvasWrap.appendChild(canvas);

    body.append(sidebar, canvasWrap);
    root.appendChild(body);
    container.appendChild(root);

    return {
        root,
        reportsNav,
        addReportButton,
        canvas,
        profileButton: profile.button,
        profileMenu: profile.menu,
        profileAvatar: profile.avatar,
        profileName: profile.name,
        profileRole: profile.role,
    };
}
