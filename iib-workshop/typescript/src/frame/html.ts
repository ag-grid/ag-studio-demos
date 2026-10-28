const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapes text for markup. The frame builds its chrome as template strings, and some of what
 * goes into them - event copy, a page address - is not written by this code.
 */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

/**
 * An element the frame's own markup is known to contain. Throws rather than returning null,
 * so a selector that drifts from its markup fails at once and by name.
 */
export function requireElement<T extends Element>(root: Element, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) {
        throw new Error(`IIB workshop: expected the frame markup to contain "${selector}".`);
    }
    return element;
}
