/** The handful of icons the chrome needs, inlined so the starter pulls in no icon library. */

export function ReportIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M5 20v-8M10 20V5M15 20v-5M20 20V9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
            <path d="M23.763 9.763 16 17.525 8.237 9.763l-2.474 2.474L16 22.475l10.237-10.238-2.474-2.474Z" />
        </svg>
    );
}

export function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
            <path d="M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z" />
        </svg>
    );
}
