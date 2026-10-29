// Framework-agnostic parts of the Report Builder demo: the personas its account switcher offers,
// and the Studio wiring every variant opens on. The chrome around it belongs to each variant.
export { executiveOverviewPage } from './state';
export type { DemoProfile } from './profiles';
export { analystProfile, defaultProfile, demoProfiles, viewerProfile } from './profiles';
export type { ReportBuilderStudioOptions } from './studioSetup';
export {
    BRAND,
    acmeTheme,
    createBlankReport,
    createReportBuilderStudio,
    reportBuilderProperties,
    reportBuilderReports,
} from './studioSetup';
