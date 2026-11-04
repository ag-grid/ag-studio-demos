import type { AgReportState, AgStudioApi } from 'ag-studio';
import { createStudio } from 'ag-studio';

import type { WorkshopEventConfig } from './eventConfig';
import { eventConfig } from './eventConfig';
import { createAppFrame } from './frame/appFrame';
import './frame/appFrame.css';
import { createConfigDialog } from './frame/configDialog';
import { createSessionStore, debounce, fingerprint } from './frame/preferences';
import { createQrDialog } from './frame/qrDialog';
import { createReportImport } from './reportImport';
import type { ReportMeta } from './shared/reports';
import type { Palette, ThemeMode, ThemePresetId } from './shared/theme';
import { buildStudioTheme, googleFonts, presetById, setActivePreset } from './shared/theme';
import type { AppRegistry } from './shared/widgets/registry';
import { widgets } from './shared/widgets/registry';

/** The class the demo puts on its container. Every rule in its stylesheet is scoped under it. */
export const IIB_WORKSHOP_ROOT_CLASS = 'iib-workshop';

const THEME_MODE_CLASS = 'ag-theme-mode';

export interface IibWorkshopDemoOptions {
    /** Element the demo renders into. It is emptied again on destroy. */
    container: HTMLElement;
    /** The event to run. Defaults to the Information is Beautiful workshop. */
    event?: WorkshopEventConfig;
}

export interface IibWorkshopDemo {
    destroy(): void;
}

type ReportState = AgReportState<AppRegistry>;

/** The palette fields the shell's stylesheet reads, each as `--iib-<field>`. */
const FRAME_PALETTE_KEYS = [
    'sidebar',
    'canvas',
    'widget',
    'raised',
    'text',
    'subtle',
    'border',
    'accent',
    'font',
] as const satisfies readonly (keyof Palette)[];

const FRAME_PROPERTIES = [...FRAME_PALETTE_KEYS.map((key) => `--iib-${key}`), '--iib-brand-font', 'color-scheme'];

/**
 * Mount the workshop app: a sidebar of reports and a topbar around a Studio preloaded with the
 * event's data, custom widgets and theme. Reads no environment of its own.
 */
export function createIibWorkshopDemo(options: IibWorkshopDemoOptions): IibWorkshopDemo {
    const { container, event = eventConfig } = options;
    const { storageNamespace, brand, studio } = event;
    const { dataSources, reports, initialState } = studio;

    const listeners = new AbortController();
    const sessions = createSessionStore(storageNamespace);

    let studioApi: AgStudioApi<AppRegistry> | undefined;
    let fontLink: HTMLLinkElement | undefined;

    const requireStudio = (): AgStudioApi<AppRegistry> => {
        if (!studioApi) {
            throw new Error('Studio is not running.');
        }
        return studioApi;
    };
    const reportImport = createReportImport(requireStudio);

    /** Identifies the report this build ships, so a stale saved copy of it can be spotted. */
    const shipped = fingerprint(initialState);

    // A saved session replaces the shipped report wholesale, so one from a different build is set
    // aside (kept, not deleted) or a returning visitor would never see a changed report.
    const currentSession = () => {
        const saved = sessions.load();
        if (saved?.state && saved.shipped !== shipped) {
            sessions.supersede();
            return undefined;
        }
        return saved;
    };

    const session = currentSession();

    const startPage = (state: ReportState): string => {
        const saved = state.selectedPageId;
        return state.pages.some((page) => page.id === saved)
            ? saved
            : (state.pages[0]?.id ?? initialState.selectedPageId);
    };

    // User-given page names; Studio pages have none of their own.
    let pageNames: Record<string, string> = { ...session?.pageNames };

    const nameOf = (id: string) =>
        pageNames[id] ?? reports.find((report) => report.id === id)?.name ?? 'Untitled report';

    const reportsIn = (state: ReportState): ReportMeta[] => state.pages.map(({ id }) => ({ id, name: nameOf(id) }));

    const newPageId = (state: ReportState): string => {
        const taken = new Set(state.pages.map(({ id }) => id));
        let n = 1;
        while (taken.has(`report-${n}`)) {
            ++n;
        }
        return `report-${n}`;
    };

    /** Where to go back to if a page is discarded while it is still being named. */
    let pageBeforeAdd: string | undefined;

    let preset: ThemePresetId = session?.preset ?? event.theme.preset;
    let mode: ThemeMode = session?.mode ?? event.theme.mode;

    // The sidebar and topbar sit outside Studio's theme. Set on the container, not `<html>`, so the
    // theme travels with the app into hosts that own `<html>` and its theme attribute.
    const applyFrameTheme = (): void => {
        const palette = setActivePreset(preset, mode);
        const { style } = container;
        for (const key of FRAME_PALETTE_KEYS) {
            style.setProperty(`--iib-${key}`, palette[key]);
        }
        style.setProperty('--iib-brand-font', `"${brand.font}", ${palette.font}`);
        style.setProperty('color-scheme', mode);
        container.setAttribute('data-ag-theme-mode', mode);
    };

    // Studio loads its own fonts via `loadThemeGoogleFonts`; this link is for the shell around it.
    const loadFrameFonts = (): void => {
        const presetFonts = googleFonts(
            (presetById(preset).variants[mode].params.fontFamily as Parameters<typeof googleFonts>[0]) ?? []
        );
        const families = [...new Set([brand.font, ...presetFonts])];
        const href = `https://fonts.googleapis.com/css2?${families
            .map((family) => `family=${encodeURIComponent(family)}:wght@400;500;600;700`)
            .join('&')}&display=swap`;
        if (!fontLink) {
            fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            document.head.append(fontLink);
        }
        if (fontLink.href !== href) {
            fontLink.href = href;
        }
    };

    // The custom widgets read the live palette, so it must change before Studio re-themes.
    const applyTheme = (): void => {
        applyFrameTheme();
        loadFrameFonts();
        studioApi?.updateProperties({ theme: buildStudioTheme(preset, mode) });
    };

    // `ag-theme-mode` is Studio's documented hook for taking the theme mode from an element
    // other than `<html>` or `<body>`, so Studio's own dark-mode params follow the toggle.
    container.classList.add(IIB_WORKSHOP_ROOT_CLASS, THEME_MODE_CLASS);
    applyFrameTheme();
    loadFrameFonts();

    // Chart interactions (expanders, cross-filter) only reach the series in view mode.
    const setMode = (studioMode: 'view' | 'edit') => studioApi?.updateProperties({ mode: studioMode });

    const patchState = (patch: Partial<ReportState>) => {
        if (!studioApi) {
            return;
        }
        studioApi.setState({ ...studioApi.getState(), ...patch });
    };

    const persist = debounce(() => {
        if (studioApi) {
            sessions.save({ preset, mode, shipped, state: studioApi.getState(), pageNames });
        }
    }, 600);

    // A reload or a closed tab skips `destroy()`, so the last edit is written as the page goes.
    // Reset cancels the pending save before it reloads, so this has nothing left to restore.
    window.addEventListener('pagehide', () => persist.flush(), { signal: listeners.signal });

    const syncSidebar = () => {
        const state = studioApi?.getState();
        if (state) {
            frame.setReports(reportsIn(state), state.selectedPageId);
        }
    };

    const saved = session?.state as ReportState | undefined;
    const bootState = saved ?? initialState;

    const frame = createAppFrame(container, {
        event,
        showQrCode: event.showQrCode,
        reports: reportsIn(bootState),
        activeReportId: startPage(bootState),
        themePreset: preset,
        themeMode: mode,
        onSelectReport: (id) => patchState({ selectedPageId: id }),
        // Studio has no "add page" call, so a new report is a state edit.
        onAddReport: () => {
            if (!studioApi) {
                return;
            }
            const state = studioApi.getState();
            const id = newPageId(state);
            pageNames[id] = `Report ${reportsIn(state).length + 1}`;
            pageBeforeAdd = state.selectedPageId;
            setMode('edit');
            frame.setMode('edit');
            studioApi.setState({
                ...state,
                pages: [...state.pages, { id, widgets: {}, widgetLayout: {} }],
                selectedPageId: id,
                panels: { ...state.panels, edit: { collapsed: false } },
            });
            syncSidebar();
            frame.renameReport(id, true);
        },
        onRenameReport: (id, name) => {
            pageNames[id] = name;
            syncSidebar();
            persist();
        },
        onDiscardReport: (id) => {
            if (!studioApi) {
                return;
            }
            const state = studioApi.getState();
            const pages = state.pages.filter((page) => page.id !== id);
            delete pageNames[id];
            studioApi.setState({ ...state, pages, selectedPageId: pageBeforeAdd ?? pages[0].id });
            syncSidebar();
        },
        onModeChange: setMode,
        onExportConfig: () => configDialog.openExport(),
        onImportConfig: () => configDialog.openImport(),
        onThemeChange: (nextPreset, nextMode) => {
            preset = nextPreset;
            mode = nextMode;
            applyTheme();
            persist();
        },
        onShowQr: () => qrDialog.open(),
        // The only way back to the shipped reports once a session has been saved.
        onReset: () => {
            if (!window.confirm('Discard the changes saved in this browser and reload the starter?')) {
                return;
            }
            persist.cancel();
            sessions.clear();
            window.location.reload();
        },
    });

    // Inside the container rather than `<body>`, so the dialogs inherit its theme and go with it.
    const configDialog = createConfigDialog({
        parent: container,
        signal: listeners.signal,
        setAppInert: frame.setInert,
        getState: () => requireStudio().getState(),
        importState: reportImport.importState,
    });

    const qrDialog = createQrDialog({ parent: container, signal: listeners.signal, setAppInert: frame.setInert });

    // Passed as `initialState`, not `setState` afterwards: the schema is not ready in the next tick,
    // so fields fail to resolve. `getState()` returns a placeholder until then, hence `setReports`.
    const start = (state: ReportState) => {
        const selectedPageId = startPage(state);
        frame.setReports(reportsIn(state), selectedPageId);
        return createStudio<AppRegistry>(frame.studioHost, {
            mode: 'view',
            theme: buildStudioTheme(preset, mode),
            loadThemeGoogleFonts: true,
            initialState: { ...state, selectedPageId },
            widgets,
            data: dataSources,
            panels: { options: { data: { tables: { collapsed: true } } } },
            onStateUpdated: () => {
                syncSidebar();
                persist();
            },
            onErrorRaised: reportImport.onErrorRaised,
        });
    };

    // A saved state can name a widget type or field this build lacks; fall back rather than fail to boot.
    try {
        studioApi = start(bootState);
    } catch {
        sessions.clear();
        pageNames = {};
        studioApi = start(initialState);
    }

    let destroyed = false;

    return {
        destroy: () => {
            if (destroyed) {
                return;
            }
            destroyed = true;
            persist.flush();
            const api = studioApi;
            // Cleared first, so a callback that fires while Studio tears down finds nothing to act on.
            studioApi = undefined;
            listeners.abort();
            api?.destroy();
            persist.cancel();
            fontLink?.remove();
            container.replaceChildren();
            container.classList.remove(IIB_WORKSHOP_ROOT_CLASS, THEME_MODE_CLASS);
            container.removeAttribute('data-ag-theme-mode');
            for (const property of FRAME_PROPERTIES) {
                container.style.removeProperty(property);
            }
        },
    };
}
