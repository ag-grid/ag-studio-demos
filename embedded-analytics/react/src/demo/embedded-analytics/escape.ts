/**
 * Escape, while a viewport is expanded, cancels the edit.
 *
 * Registered in the capture phase because Studio swallows Escape while editing, so a bubble-phase
 * listener would never fire. Returns a teardown: the listener is on `document`, which outlives any
 * one mount.
 */
export function onEscapeWhileExpanded(cancel: () => void): () => void {
    const handler = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
    };

    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
}

/** The query parameter a host may use to deep-link an expanded viewport. */
export const EXPANDED_PARAM = 'hlvn-fullscreen';
