// Framework-agnostic parts of the Widget Library demo: the curated catalogue, the dataset behind
// it, the Grafana-style theme, and the Studio wiring every variant opens on.
export type { DemoData } from './generator';
export { generateDemoData } from './generator';
export { getPreconfiguredWidgetsData } from './data';
export type { PcwRegistry } from './library';
export { widgetLibraryParams } from './library';
export { preconfiguredWidgetsState } from './state';
export type { WidgetLibraryStudioOptions } from './studioSetup';
export { createWidgetLibraryStudio, followPanelBreakpoint, grafanaTheme, widgetLibraryProperties } from './studioSetup';
