import type { ThemeMode, ThemePresetId } from '../shared/theme';

/** Everything the app remembers between visits, in one `localStorage` entry. */

/** Bumped when the stored shape changes, so an old entry is discarded rather than misread. */
const STORE_VERSION = 1;

export interface StoredSession {
    version: number;
    savedAt: string;
    preset: ThemePresetId;
    mode: ThemeMode;
    /** Fingerprint of the report this app shipped when the session was saved. */
    shipped?: string;
    /** The Studio report state, exactly as `getState()` returns it. */
    state?: unknown;
    /** Sidebar names by page id. Studio pages carry no name of their own, so the app keeps them. */
    pageNames?: Record<string, string>;
}

export interface SessionStore {
    /**
     * Reads the saved session, or undefined. Treated as untrusted: `localStorage` throws when site
     * data is blocked and can hold a truncated write after hitting the quota.
     */
    load(): StoredSession | undefined;
    save(session: Omit<StoredSession, 'version' | 'savedAt'>): void;
    clear(): void;
    /** Moves the current session aside rather than dropping it. */
    supersede(): void;
}

/** FNV-1a over the serialised report: cheap change detection, not tamper protection. */
export function fingerprint(value: unknown): string {
    const text = JSON.stringify(value) ?? '';
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; ++i) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
}

/**
 * The session store for one event, keyed under its storage namespace so two events served
 * from the same origin never read each other's reports.
 */
export function createSessionStore(namespace: string): SessionStore {
    const storeKey = `${namespace}/session`;
    /** Where a session goes when a new build supersedes it, so an edit is never just deleted. */
    const supersededKey = `${storeKey}/superseded`;

    return {
        load: () => {
            try {
                const raw = localStorage.getItem(storeKey);
                if (!raw) {
                    return undefined;
                }
                const parsed = JSON.parse(raw) as StoredSession;
                return parsed?.version === STORE_VERSION ? parsed : undefined;
            } catch {
                return undefined;
            }
        },
        save: (session) => {
            try {
                const payload: StoredSession = {
                    ...session,
                    version: STORE_VERSION,
                    savedAt: new Date().toISOString(),
                };
                localStorage.setItem(storeKey, JSON.stringify(payload));
            } catch {
                // A full quota or a blocked store is not worth interrupting the session for. The
                // report still works; it just will not be there on the next visit.
            }
        },
        clear: () => {
            try {
                localStorage.removeItem(storeKey);
            } catch {
                // Nothing to do: if the store cannot be written it cannot be holding anything.
            }
        },
        supersede: () => {
            try {
                const raw = localStorage.getItem(storeKey);
                if (raw) {
                    localStorage.setItem(supersededKey, raw);
                }
                localStorage.removeItem(storeKey);
            } catch {
                // Same as elsewhere: a store that cannot be written cannot be holding anything.
            }
        },
    };
}

export interface Debounced<T extends unknown[]> {
    (...args: T): void;
    /** Runs a call that is still waiting, now. For teardown, so the last edit is not lost. */
    flush(): void;
    /** Drops a call that is still waiting. */
    cancel(): void;
}

/** Collapses a burst of state updates into one write; `onStateUpdated` fires on every drag frame. */
export function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): Debounced<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: T | undefined;

    const cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = undefined;
        pending = undefined;
    };
    const flush = () => {
        const args = pending;
        cancel();
        if (args) {
            fn(...args);
        }
    };
    const debounced = (...args: T) => {
        cancel();
        pending = args;
        timer = setTimeout(flush, ms);
    };

    return Object.assign(debounced, { flush, cancel });
}
