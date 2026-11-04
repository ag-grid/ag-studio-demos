import type { ElementRef } from '@angular/core';
import { Component, input, output, viewChild } from '@angular/core';

import type { DemoProfile } from '../shared';
import { BRAND } from '../shared';
import { PLUS_ICON_PATH } from './icons';
import { ProfileSwitcherComponent } from './profile-switcher.component';
import type { Report } from './report-item.component';
import { ReportItemComponent } from './report-item.component';

@Component({
    selector: 'app-reports-sidebar',
    standalone: true,
    imports: [ProfileSwitcherComponent, ReportItemComponent],
    // The host is a pass-through, so `<aside>` is the flex child the stylesheet expects and
    // stretches to the full height of the shell - as it does in the React and Vue variants.
    styles: `
        :host {
            display: contents;
        }
    `,
    template: `
        <aside class="agd-rb-sidebar">
            <div class="agd-rb-brand">
                {{ brand.name }}<span class="agd-rb-brand-accent">{{ brand.accent }}</span>
            </div>
            <div class="agd-rb-sidebar-heading">Reports</div>

            <nav
                #nav
                class="agd-rb-reports-nav"
                role="tablist"
                aria-orientation="vertical"
                aria-label="Reports"
                (keydown)="onKeyDown($event)"
            >
                @for (report of reports(); track report.id) {
                    <app-report-item
                        [report]="report"
                        [isActive]="report.id === selectedReportId()"
                        [canRename]="isEditing()"
                        [renameOnMount]="report.id === renamingReportId()"
                        (select)="selectReport.emit(report.id)"
                        (rename)="renameReport.emit({ reportId: report.id, name: $event })"
                        (renameCancelled)="discardReport.emit(report.id)"
                    />
                }
            </nav>

            @if (isEditing()) {
                <button type="button" class="agd-rb-new-report" (click)="addReport.emit()">
                    <svg class="agd-rb-new-report-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            [attr.d]="plusIconPath"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>
                    New report
                </button>
            }

            <app-profile-switcher
                [profiles]="profiles()"
                [current]="currentProfile()"
                (change)="changeProfile.emit($event)"
            />
        </aside>
    `,
})
export class ReportsSidebarComponent {
    public readonly reports = input.required<readonly Report[]>();
    public readonly selectedReportId = input.required<string>();
    /** Report opened in rename mode, as a freshly created one is. */
    public readonly renamingReportId = input<string | undefined>(undefined);
    /** Whether the signed-in persona is mid-edit-session, which gates New report and renaming. */
    public readonly isEditing = input(false);
    public readonly profiles = input.required<readonly DemoProfile[]>();
    public readonly currentProfile = input.required<DemoProfile>();

    public readonly selectReport = output<string>();
    public readonly addReport = output<void>();
    public readonly renameReport = output<{ reportId: string; name: string }>();
    public readonly discardReport = output<string>();
    public readonly changeProfile = output<string>();

    protected readonly brand = BRAND;
    protected readonly plusIconPath = PLUS_ICON_PATH;

    private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');

    /**
     * Arrow-key navigation for the vertical report list: roving focus, with selection following
     * focus. Home/End jump to the first and last report. The rename input is left alone so its own
     * caret movement still works.
     */
    protected onKeyDown(event: KeyboardEvent): void {
        if ((event.target as HTMLElement).tagName === 'INPUT') return;

        const items = [...this.nav().nativeElement.querySelectorAll<HTMLElement>('[role="tab"]')];
        if (items.length === 0) return;
        const index = items.findIndex((item) => item === document.activeElement);

        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else return;

        event.preventDefault();
        const target = items[next];
        target.focus();
        const reportId = target.dataset['reportId'];
        if (reportId) {
            this.selectReport.emit(reportId);
        }
    }
}
