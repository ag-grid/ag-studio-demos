import type { DemoProfile } from '@demo/report-builder';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { CheckIcon, ChevronDownIcon } from './icons';

interface Props {
    profiles: ReadonlyArray<DemoProfile>;
    current: DemoProfile;
    onChange: (profileId: string) => void;
}

const MENU_ID = 'agd-rb-profile-menu';

function ProfileIdentity({ profile }: { profile: DemoProfile }) {
    return (
        <span className="agd-rb-profile-identity">
            <span className="agd-rb-profile-name">{profile.name}</span>
            <span className="agd-rb-profile-role">{profile.role}</span>
        </span>
    );
}

/**
 * The account switcher pinned to the bottom of the sidebar, and the menu of demo personas it
 * opens upward.
 *
 * Arrow keys move between profiles, Escape closes and returns focus to the button, and a pointer
 * press outside dismisses it.
 */
export function ProfileSwitcher({ profiles, current, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Opening moves focus onto the checked item, which is where the roving tab stop sits.
        menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        buttonRef.current?.focus();
    };

    const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        const options = [...(menuRef.current?.querySelectorAll<HTMLElement>('[data-profile-id]') ?? [])];
        const index = options.findIndex((option) => option === document.activeElement);

        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % options.length;
        else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
        else return;

        event.preventDefault();
        options[next].focus();
    };

    return (
        <div className="agd-rb-profile-switcher">
            <button
                ref={buttonRef}
                type="button"
                className="agd-rb-profile-button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={MENU_ID}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span className="agd-rb-avatar" aria-hidden="true">
                    {current.initials}
                </span>
                <ProfileIdentity profile={current} />
                <ChevronDownIcon className="agd-rb-profile-chevron" />
            </button>

            <div
                ref={menuRef}
                id={MENU_ID}
                className="agd-rb-profile-menu"
                role="menu"
                aria-label="Switch profile"
                hidden={!isOpen}
                onKeyDown={onMenuKeyDown}
            >
                <div className="agd-rb-profile-menu-heading" aria-hidden="true">
                    Switch profile
                </div>
                {profiles.map((profile) => {
                    const isCurrent = profile.id === current.id;
                    return (
                        <button
                            key={profile.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isCurrent}
                            tabIndex={isCurrent ? 0 : -1}
                            data-profile-id={profile.id}
                            className="agd-rb-profile-option"
                            onClick={() => {
                                onChange(profile.id);
                                close();
                            }}
                        >
                            <span className="agd-rb-avatar" aria-hidden="true">
                                {profile.initials}
                            </span>
                            <ProfileIdentity profile={profile} />
                            <CheckIcon className="agd-rb-profile-tick" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
