import type { OnDestroy } from '@angular/core';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import type { ViewportKey } from '@demo/embedded-analytics';
import {
    VIEWPORT_TITLES,
    buildTearSheetView,
    createHalvynDataEngine,
    expandedViewportProperties,
    hasViewportSelection,
    lockBodyScroll,
    onEscapeWhileExpanded,
    showToast,
    withViewportSelection,
} from '@demo/embedded-analytics';
import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-angular';

import { EmbeddedViewportComponent } from './components/embedded-viewport.component';
import { TearSheetComponent } from './components/tear-sheet.component';

/**
 * The Embedded Analytics demo: Studio widgets embedded in someone else's application, styled to
 * match it, with the host owning both the data and the chrome.
 *
 * Three separate Studio instances read from one data engine created here - that shared engine is
 * the point. Expanding one for editing needs its canvas to escape the tear sheet, which is a
 * scaled surface and would trap a `position: fixed` overlay. Angular needs no portal API for
 * that: the overlay is declared here, at the app root, which is already outside the sheet. Only
 * the canvas itself is moved, by hand, so Studio survives the transition.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgStudio, EmbeddedViewportComponent, TearSheetComponent],
    template: `
        <div class="agd-ea" data-embedded-root>
            <app-tear-sheet [view]="view" (export)="exportSheet()">
                <app-embedded-viewport
                    centre
                    viewportKey="price"
                    [dataEngine]="dataEngine"
                    [studioOverrides]="studioOverrides()"
                    (ready)="registerViewport($event)"
                    (expand)="expand($event)"
                />
                <app-embedded-viewport
                    centre
                    viewportKey="financials"
                    [dataEngine]="dataEngine"
                    [studioOverrides]="studioOverrides()"
                    (ready)="registerViewport($event)"
                    (expand)="expand($event)"
                />
                <app-embedded-viewport
                    right
                    viewportKey="segments"
                    [dataEngine]="dataEngine"
                    [studioOverrides]="studioOverrides()"
                    (ready)="registerViewport($event)"
                    (expand)="expand($event)"
                />
            </app-tear-sheet>

            @if (expandedKey()) {
                <div class="agd-ea-viewport agd-ea-viewport-expanded" [attr.data-viewport]="expandedKey()">
                    <div class="agd-ea-viewport-panel">
                        <div class="agd-ea-viewport-header">
                            <span class="agd-ea-viewport-header-title">Edit {{ expandedTitle() }}</span>
                        </div>

                        <ag-studio class="agd-ea-viewport-slot" [studioProperties]="editorProperties()!" />

                        <div class="agd-ea-viewport-footer">
                            <button type="button" class="button-secondary" (click)="cancel()">Cancel</button>
                            <button type="button" class="button" (click)="save()">Save</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
})
export class AppComponent implements OnDestroy {
    public readonly studioOverrides = input<Partial<AgStudioProperties> | undefined>(undefined);
    /** Expands this viewport on first paint, for a host that deep-links one. */
    public readonly initialExpanded = input<ViewportKey | undefined>(undefined);
    public readonly expandedChange = output<ViewportKey | undefined>();

    protected readonly view = buildTearSheetView();
    protected readonly dataEngine = createHalvynDataEngine();

    protected readonly expandedKey = signal<ViewportKey | undefined>(undefined);
    protected readonly expandedTitle = computed(() => {
        const key = this.expandedKey();
        return key ? VIEWPORT_TITLES[key] : '';
    });

    private readonly apis = new Map<ViewportKey, AgStudioApi>();
    /**
     * Bumped as each viewport's instance arrives. A plain Map is not reactive, so this is what the
     * deep-link effect below actually waits on.
     */
    private readonly registrations = signal(0);
    private deepLinkConsumed = false;
    /** The editor's own instance, alive only while the overlay is open. */
    private editorApi?: AgStudioApi;
    private releaseScrollLock?: () => void;
    private stopEscapeListener?: () => void;

    constructor() {
        // Lock the background and listen for Escape only while the editor is open.
        effect(() => {
            const key = this.expandedKey();

            this.releaseScrollLock?.();
            this.stopEscapeListener?.();
            this.releaseScrollLock = key ? lockBodyScroll() : undefined;
            this.stopEscapeListener = key ? onEscapeWhileExpanded(() => this.cancel()) : undefined;
        });

        // A deep-linked viewport starts expanded, once its instance exists - and once only.
        //
        // This used to depend on `expandedKey` for its re-run, which also made it fire every time
        // that cleared: Save, Cancel and Escape each re-expanded the viewport they had just
        // closed, so the editor could not be dismissed at all. It now waits on the registration
        // count, which is the dependency it actually has, and records that it has fired.
        effect(() => {
            this.registrations();

            const initial = this.initialExpanded();
            if (this.deepLinkConsumed || !initial || !this.apis.has(initial)) return;

            this.deepLinkConsumed = true;
            this.expand(initial);
        });
    }

    public ngOnDestroy(): void {
        this.releaseScrollLock?.();
        this.stopEscapeListener?.();
    }

    protected registerViewport({ viewportKey, api }: { viewportKey: ViewportKey; api?: AgStudioApi }): void {
        if (api) {
            this.apis.set(viewportKey, api);
        } else {
            this.apis.delete(viewportKey);
        }
        this.registrations.update((count) => count + 1);
    }

    /**
     * The editor's properties, seeded from what the card is showing. Computed, so opening the
     * overlay builds them from the state at that moment.
     */
    protected readonly editorProperties = computed<AgStudioProperties | undefined>(() => {
        const key = this.expandedKey();
        const card = key && this.apis.get(key);
        if (!key || !card) return undefined;

        return {
            ...expandedViewportProperties(key, this.dataEngine, card.getState(), {
                studioOverrides: this.studioOverrides(),
                // While the edit panel is open the widget must stay selected; re-assert it if a
                // stray click inside the canvas clears it. The guard makes this a no-op once
                // correct, so it never loops with its own setState.
                onStateUpdated: () => {
                    const api = this.editorApi;
                    if (!api || hasViewportSelection(api, key)) return;
                    api.setState(withViewportSelection(api.getState(), key, true));
                },
            }),
            onApiReady: ({ api }) => {
                this.editorApi = api;
            },
            onStudioPreDestroyed: () => {
                this.editorApi = undefined;
            },
        };
    });

    protected expand(key: ViewportKey): void {
        // The editor seeds itself from the card's state, so there has to be a card instance.
        if (!this.apis.has(key)) return;

        this.expandedKey.set(key);
        this.expandedChange.emit(key);
    }

    protected cancel(): void {
        this.collapse();
    }

    /**
     * Save applies the editor's state to the card and logs what a host would persist. Cancel needs
     * no counterpart: the editor is a separate instance, so discarding it discards the edit.
     */
    protected save(): void {
        const key = this.expandedKey();
        const card = key && this.apis.get(key);
        const state = this.editorApi?.getState();
        if (key && card && state) {
            // Selection cleared on the way back: it was set for the editor's panel, and a card
            // with a selected widget would show a highlight nobody asked for.
            card.setState(withViewportSelection(state, key, false));
            // eslint-disable-next-line no-console
            console.log(`AG Studio - saved "${key}" widget state:`, state);
        }
        showToast('Widget saved. State logged to console');
        this.collapse();
    }

    protected exportSheet(): void {
        window.print();
    }

    private collapse(): void {
        if (!this.expandedKey()) return;

        this.expandedKey.set(undefined);
        this.expandedChange.emit(undefined);
    }
}
