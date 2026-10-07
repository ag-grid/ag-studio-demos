/**
 * A transient confirmation, portaled to `<body>` so it is not clipped by the scaled tear sheet.
 *
 * Deliberately plain DOM rather than a framework component: it outlives the element that triggered
 * it, and every variant wants the same two-and-a-bit seconds of feedback.
 */
export function showToast(message: string): void {
    document.querySelector('.agd-ea-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'agd-ea-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 2400);
}
