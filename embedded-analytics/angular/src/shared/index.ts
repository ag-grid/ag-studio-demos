// Framework-agnostic parts of the In-App Reporting demo: the peer-group dataset and the overview
// page's figures, plus the Studio wiring for its embedded viewports and the company report.
export type { AnalystConsensusView, AnalystRating } from './analystConsensus';
export { ANALYST_CONSENSUS_WIDGET, DEFAULT_EQUAL_WEIGHT_BAND, loadAnalystConsensus } from './analystConsensus';
export type { CompanyView } from './company';
export { buildCompanyView, formatAsOf } from './company';
export type { PeerGroup } from './data';
export { getPeerGroup } from './data';
export type { AnalystConsensusDef, PeerGroupRegistry } from './interfaces';
export type { OverviewCompany, OverviewStat, OverviewView } from './overview';
export { buildOverviewView, DISCLAIMER } from './overview';
export type { DemoStudioOptions, DrillThroughHandler, ViewportKey } from './studioSetup';
export {
    companyReportPopupOptions,
    companyReportProperties,
    createPeerGroupDataEngine,
    printCompanyReport,
    showCompanyReport,
    VIEWPORT_KEYS,
    viewportProperties,
} from './studioSetup';
