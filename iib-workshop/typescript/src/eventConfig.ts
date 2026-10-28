import type { AgDataSourcesDefinition, AgReportState } from 'ag-studio';

import iibFlowerUrl from './frame/iib-flower.svg?url';
import iibWordmarkOnLightUrl from './frame/iib-text-dark.svg?url';
import iibWordmarkOnDarkUrl from './frame/iib-text-light.svg?url';
import { dataSources } from './shared/data/sources';
import type { ReportMeta } from './shared/reports';
import { REPORTS, initialState } from './shared/reports';
import type { ThemeMode, ThemePresetId } from './shared/theme';
import type { AppRegistry } from './shared/widgets/registry';

/**
 * Everything about one workshop event that is not code. The licence key comes from `.env`
 * instead, so it never has to be committed.
 */
export interface WorkshopEventConfig {
    /** The heading in the topbar. Change it to name the event. */
    title: string;
    /** The browser tab title for the standalone app. An embedding page keeps its own. */
    documentTitle: string;
    /** One line beside the topbar controls describing what the app is preloaded with. Keep it short. */
    topbarNote: string;
    /** The organiser's or partner's branding at the top of the sidebar. */
    brand: {
        /** The small mark beside the wordmark. Change it for another partner's logo. */
        logoUrl: string;
        /** The wordmark shown in dark mode, so light ink. */
        wordmarkOnDarkUrl: string;
        /** The wordmark shown in light mode, so dark ink. */
        wordmarkOnLightUrl: string;
        /** Alternative text for the wordmark: the partner's name as it should be read out. */
        wordmarkAlt: string;
        /** The caption under the wordmark. */
        subtitle: string;
        /** The Google font the caption is set in, whatever theme preset is active. */
        font: string;
    };
    /** The theme a first-time visitor sees. Change it when the event has a house preset of its own. */
    theme: {
        /** The id of one of the presets in the theme picker, such as `iib` for the house style. */
        preset: ThemePresetId;
        /** `light` or `dark`. Visitors can switch, and their choice is remembered. */
        mode: ThemeMode;
    };
    /** Prefix for every `localStorage` key. Change it per event so earlier events' reports do not reopen. */
    storageNamespace: string;
    /** Whether the topbar offers a QR code of the page address, for opening it on a phone. */
    showQrCode: boolean;
    /** What Studio opens with. */
    studio: {
        /** The tables and their joins. Change them by editing or regenerating the data source files. */
        dataSources: AgDataSourcesDefinition<AppRegistry>;
        /** The report pages, widgets and layout a first-time visitor starts on. */
        initialState: AgReportState<AppRegistry>;
        /** Sidebar names for the pages in `initialState`, which carry no names of their own. */
        reports: ReportMeta[];
    };
}

/** The AG Studio x Information is Beautiful workshop. */
export const eventConfig: WorkshopEventConfig = {
    title: 'AG Studio × Information is Beautiful',
    documentTitle: 'AG Studio - Information is Beautiful Workshop',
    topbarNote: 'Preloaded with Wikipedia edit wars data, 8 custom widget types and every native widget.',
    brand: {
        logoUrl: iibFlowerUrl,
        wordmarkOnDarkUrl: iibWordmarkOnDarkUrl,
        wordmarkOnLightUrl: iibWordmarkOnLightUrl,
        wordmarkAlt: 'Information is Beautiful',
        subtitle: 'Data studio',
        font: 'Quicksand',
    },
    theme: { preset: 'iib', mode: 'dark' },
    storageNamespace: 'ag-studio-iib-workshop',
    showQrCode: true,
    studio: {
        dataSources,
        initialState,
        reports: REPORTS,
    },
};
