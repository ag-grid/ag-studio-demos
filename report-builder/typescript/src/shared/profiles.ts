// Demo personas behind the header profile switcher. `access` is the host
// chrome's own concept (does this profile get editor access?), not a Studio API.
export interface DemoProfile {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly initials: string;
    readonly access: 'view' | 'write';
}

export const viewerProfile: DemoProfile = {
    id: 'viewer',
    name: 'Jamie Chen',
    role: 'Viewer',
    initials: 'JC',
    access: 'view',
};

export const analystProfile: DemoProfile = {
    id: 'analyst',
    name: 'Alex Rivera',
    role: 'Analyst',
    initials: 'AR',
    access: 'write',
};

export const demoProfiles: DemoProfile[] = [viewerProfile, analystProfile];

// The demo opens as the Analyst so the compose UX is visible on first paint.
export const defaultProfile = analystProfile;
