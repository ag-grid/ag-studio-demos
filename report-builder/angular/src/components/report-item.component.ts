import type { ElementRef } from '@angular/core';
import { Component, effect, input, output, signal, viewChild } from '@angular/core';

import { REPORT_ICON_PATH } from './icons';

export interface Report {
    id: string;
    name: string;
}

/**
 * One report in the sidebar, renameable in place.
 *
 * The input is absolutely positioned over the label rather than replacing it, and the label is
 * hidden rather than removed, so entering rename mode never resizes the item or the sidebar.
 */
@Component({
    selector: 'app-report-item',
    standalone: true,
    // The host is a pass-through, so each item lays out in the reports nav exactly as it does
    // in the React and Vue variants.
    styles: `
        :host {
            display: contents;
        }
    `,
    template: `
        <button
            type="button"
            role="tab"
            [attr.aria-selected]="isActive()"
            [attr.tabindex]="isActive() ? 0 : -1"
            [title]="report().name"
            [attr.data-report-id]="report().id"
            class="agd-rb-report-item"
            [class.active]="isActive()"
            (click)="select.emit()"
            (dblclick)="startRename()"
        >
            <svg class="agd-rb-report-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    [attr.d]="reportIconPath"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                />
            </svg>
            <span class="agd-rb-report-label" [style.visibility]="isRenaming() ? 'hidden' : null">{{
                report().name
            }}</span>
            @if (isRenaming()) {
                <input
                    #input
                    type="text"
                    class="agd-rb-rename-input"
                    [value]="report().name"
                    (blur)="commit(input.value)"
                    (keydown.enter)="commit(input.value)"
                    (keydown.escape)="cancel()"
                />
            }
        </button>
    `,
})
export class ReportItemComponent {
    public readonly report = input.required<Report>();
    public readonly isActive = input(false);
    /** Whether a double-click should start a rename. Only the editing persona may. */
    public readonly canRename = input(false);
    /** Opens in rename mode, as a freshly created report does. */
    public readonly renameOnMount = input(false);

    public readonly select = output<void>();
    public readonly rename = output<string>();
    /** Abandoning the rename of a brand-new report discards the report itself. */
    public readonly renameCancelled = output<void>();

    protected readonly reportIconPath = REPORT_ICON_PATH;
    protected readonly isRenaming = signal(false);

    private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
    // Commit and cancel both fire from a blur race with keydown; this keeps the first one.
    private settled = false;

    constructor() {
        effect(() => {
            if (this.renameOnMount()) {
                this.isRenaming.set(true);
            }
        });

        // Focus and select once the input exists, so the name can be typed straight over.
        effect(() => {
            const input = this.input()?.nativeElement;
            if (!input) return;
            input.focus();
            input.select();
        });
    }

    protected startRename(): void {
        if (!this.canRename()) return;
        this.settled = false;
        this.isRenaming.set(true);
    }

    protected commit(value: string): void {
        if (this.settled) return;
        this.settled = true;
        this.isRenaming.set(false);
        this.rename.emit(value.trim() || this.report().name);
    }

    protected cancel(): void {
        if (this.settled) return;
        this.settled = true;
        this.isRenaming.set(false);
        if (this.renameOnMount()) {
            this.renameCancelled.emit();
        }
    }
}
