// Framework-agnostic parts of the Real-time Dashboard demo: the simulated fleet behind the live
// tables, the feed that sends its changes to Studio, the Studio properties every variant opens with,
// and the heatmap widget every variant registers.
export type { ServiceHealthRegistry } from './heatmapWidget';
export type { LiveFeedOptions, UpdateInterval } from './liveFeed';
export { LiveFeed, UPDATE_INTERVALS } from './liveFeed';
export { ServiceHealthSimulation } from './simulation';
export type { ServiceHealthStudioOptions } from './studioSetup';
export { serviceHealthProperties, serviceHealthWidgets } from './studioSetup';
