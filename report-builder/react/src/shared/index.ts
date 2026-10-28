// Framework-agnostic parts of the Report Builder demo: the personas its account switcher offers,
// the Headline KPI custom widget less its component, and the Studio wiring every variant opens on.
// The chrome around it belongs to each variant.
export type { HeadlineKpiChange, HeadlineKpiTarget, HeadlineKpiView } from './headlineKpi';
export { HEADLINE_KPI_WIDGET, loadHeadlineKpi } from './headlineKpi';
export type { HeadlineKpiDef, ReportBuilderRegistry } from './interfaces';
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
