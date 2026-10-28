import type { AgWidgetLayoutState } from 'ag-studio';

/**
 * A widget's place on the page: its left and top track, and how many tracks it spans. The
 * canvas is 24 tracks wide; a row is about 15px tall.
 */
export const span = (xTrack: number, yTrack: number, xSpan: number, ySpan: number): AgWidgetLayoutState => ({
    xTrack,
    yTrack,
    xSpan,
    ySpan,
});
