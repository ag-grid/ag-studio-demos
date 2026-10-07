import { Component, computed, input, output } from '@angular/core';
import type { ViewportKey } from '@demo/embedded-analytics';
import { VIEWPORT_TITLES, viewportProperties } from '@demo/embedded-analytics';
import type { AgDataEngine, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-angular';

/**
 * One embedded Studio instance, showing a single full-canvas widget.
 *
 * Rendered by `ag-studio-angular`, like every other Studio in these demos. The expanded editor is
 * the app's own, a second instance seeded from this card's state - nothing is moved out of here,
 * so this component needs nothing beyond its properties and the API it hands up.
 */
@Component({
    selector: 'app-embedded-viewport',
    standalone: true,
    imports: [AgStudio],
    template: `
        <div class="agd-ea-viewport" [attr.data-viewport]="viewportKey()">
            <ag-studio class="agd-ea-viewport-slot" [studioProperties]="studioProperties()" />

            <button
                type="button"
                class="agd-ea-edit-button"
                [title]="'Edit ' + title()"
                [attr.aria-label]="'Edit ' + title()"
                (click)="expand.emit(viewportKey())"
            >
                <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                    <path
                        d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-16 16V26h7.4l15-15zM20.4 4l3.6 3.6-3 3L17.4 7l3-3zM5 24v-4.6l11-11 3.6 3.6-11 11H5z"
                    />
                </svg>
                <span>Edit</span>
            </button>
        </div>
    `,
})
export class EmbeddedViewportComponent {
    public readonly viewportKey = input.required<ViewportKey>();
    public readonly dataEngine = input.required<AgDataEngine>();
    public readonly studioOverrides = input<Partial<AgStudioProperties> | undefined>(undefined);

    public readonly ready = output<{ viewportKey: ViewportKey; api?: AgStudioApi }>();
    public readonly expand = output<ViewportKey>();

    protected readonly title = computed(() => VIEWPORT_TITLES[this.viewportKey()]);

    protected readonly studioProperties = computed<AgStudioProperties>(() => ({
        ...viewportProperties(this.viewportKey(), this.dataEngine(), {
            studioOverrides: this.studioOverrides(),
        }),
        onApiReady: ({ api }) => this.ready.emit({ viewportKey: this.viewportKey(), api }),
        onStudioPreDestroyed: () => this.ready.emit({ viewportKey: this.viewportKey() }),
    }));
}
