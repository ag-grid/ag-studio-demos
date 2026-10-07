// Framework-agnostic parts of the Embedded Analytics demo: the Halvyn dataset and its tear-sheet
// figures, plus the Studio wiring each embedded viewport opens on.
export type {
    AnalystSummary,
    CompanyProfile,
    FinancialPeriod,
    HalvynTearSheet,
    KeyStats,
    Peer,
    PricePoint,
    Segment,
} from './data';
export { getHalvynData, getHalvynTearSheet } from './data';
export { financialsState, priceState, segmentsState } from './state';
export type { ViewportKey, ViewportStudioOptions } from './studioSetup';
export {
    createHalvynDataEngine,
    EMBEDDED_PROPERTIES,
    expandedViewportProperties,
    FULLSCREEN_PROPERTIES,
    hasViewportSelection,
    isViewportKey,
    VIEWPORT_KEYS,
    VIEWPORT_STATES,
    VIEWPORT_TITLES,
    viewportProperties,
    withViewportSelection,
} from './studioSetup';
export { lockBodyScroll } from './bodyScroll';
export { EXPANDED_PARAM, onEscapeWhileExpanded } from './escape';
export { showToast } from './toast';
export type { TearSheetPeer, TearSheetStat, TearSheetView } from './tearSheet';
export { buildTearSheetView, DISCLAIMER } from './tearSheet';
