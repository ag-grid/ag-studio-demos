export interface ModalFocus {
    /** Call as the dialog opens, before focusing anything inside it. */
    enter(): void;
    /** Call as the dialog closes. */
    leave(): void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The controls Tab can reach: anything hidden, or inside something hidden, or disabled is skipped. */
const tabbableIn = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => !element.closest('[hidden]') && !element.matches(':disabled')
    );

/**
 * Keeps keyboard focus inside an `aria-modal` dialog: the app behind it is inert while it is open,
 * Tab wraps around the dialog's own controls, and focus goes back to whatever opened it once it closes.
 */
export function createModalFocus(container: HTMLElement, setAppInert: (inert: boolean) => void): ModalFocus {
    let returnTo: HTMLElement | undefined;

    // Making the app inert does not reach a page the app is embedded in, such as the host page's
    // header and navigation, so Tab off either end of the dialog would otherwise land there.
    container.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') {
            return;
        }
        const controls = tabbableIn(container);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (document.activeElement === (event.shiftKey ? first : last)) {
            event.preventDefault();
            (event.shiftKey ? last : first)?.focus();
        }
    });

    return {
        enter: () => {
            returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
            setAppInert(true);
        },
        leave: () => {
            setAppInert(false);
            returnTo?.focus();
            returnTo = undefined;
        },
    };
}
