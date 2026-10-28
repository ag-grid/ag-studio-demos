import type { ElementRef, OnDestroy } from '@angular/core';
import { Component, input, output, signal, viewChild } from '@angular/core';

import type { DemoProfile } from '../shared';
import { CHECK_PATH, CHEVRON_DOWN_PATH } from './icons';

/**
 * The account switcher pinned to the bottom of the sidebar, and the menu of demo personas it
 * opens upward.
 *
 * Arrow keys move between profiles, Escape closes and returns focus to the button, and a pointer
 * press outside dismisses it.
 */
@Component({
    selector: 'app-profile-switcher',
    standalone: true,
    template: `
        <div class="agd-rb-profile-switcher">
            <button
                #trigger
                type="button"
                class="agd-rb-profile-button"
                aria-haspopup="menu"
                [attr.aria-expanded]="isOpen()"
                [attr.aria-controls]="menuId"
                (click)="toggle()"
            >
                <span class="agd-rb-avatar" aria-hidden="true">{{ current().initials }}</span>
                <span class="agd-rb-profile-identity">
                    <span class="agd-rb-profile-name">{{ current().name }}</span>
                    <span class="agd-rb-profile-role">{{ current().role }}</span>
                </span>
                <svg class="agd-rb-profile-chevron" viewBox="0 0 32 32" aria-hidden="true">
                    <path [attr.d]="chevronPath" />
                </svg>
            </button>

            <div
                #menu
                [id]="menuId"
                class="agd-rb-profile-menu"
                role="menu"
                aria-label="Switch profile"
                [hidden]="!isOpen()"
                (keydown.escape)="close()"
                (keydown.arrowdown)="moveFocus(1)"
                (keydown.arrowup)="moveFocus(-1)"
            >
                <div class="agd-rb-profile-menu-heading" aria-hidden="true">Switch profile</div>
                @for (profile of profiles(); track profile.id) {
                    <button
                        type="button"
                        role="menuitemradio"
                        [attr.aria-checked]="profile.id === current().id"
                        [attr.tabindex]="profile.id === current().id ? 0 : -1"
                        [attr.data-profile-id]="profile.id"
                        class="agd-rb-profile-option"
                        (click)="choose(profile.id)"
                    >
                        <span class="agd-rb-avatar" aria-hidden="true">{{ profile.initials }}</span>
                        <span class="agd-rb-profile-identity">
                            <span class="agd-rb-profile-name">{{ profile.name }}</span>
                            <span class="agd-rb-profile-role">{{ profile.role }}</span>
                        </span>
                        <svg class="agd-rb-profile-tick" viewBox="0 0 32 32" aria-hidden="true">
                            <path [attr.d]="checkPath" />
                        </svg>
                    </button>
                }
            </div>
        </div>
    `,
})
export class ProfileSwitcherComponent implements OnDestroy {
    public readonly profiles = input.required<readonly DemoProfile[]>();
    public readonly current = input.required<DemoProfile>();
    public readonly change = output<string>();

    protected readonly menuId = 'agd-rb-profile-menu';
    protected readonly chevronPath = CHEVRON_DOWN_PATH;
    protected readonly checkPath = CHECK_PATH;
    protected readonly isOpen = signal(false);

    private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
    private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');

    private readonly onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (!this.menu().nativeElement.contains(target) && !this.trigger().nativeElement.contains(target)) {
            this.setOpen(false);
        }
    };

    public ngOnDestroy(): void {
        document.removeEventListener('pointerdown', this.onPointerDown);
    }

    protected toggle(): void {
        this.setOpen(!this.isOpen());
    }

    protected close(): void {
        this.setOpen(false);
        this.trigger().nativeElement.focus();
    }

    protected choose(profileId: string): void {
        this.change.emit(profileId);
        this.close();
    }

    protected moveFocus(step: number): void {
        const options = [...this.menu().nativeElement.querySelectorAll<HTMLElement>('[data-profile-id]')];
        const index = options.findIndex((option) => option === document.activeElement);
        options[(index + step + options.length) % options.length]?.focus();
    }

    private setOpen(open: boolean): void {
        this.isOpen.set(open);

        if (open) {
            document.addEventListener('pointerdown', this.onPointerDown);
            // Opening moves focus onto the checked item, which is where the roving tab stop sits.
            queueMicrotask(() =>
                this.menu().nativeElement.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
            );
        } else {
            document.removeEventListener('pointerdown', this.onPointerDown);
        }
    }
}
