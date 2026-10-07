/**
 * Stop the page behind an expanded viewport from scrolling, and release it again.
 *
 * Shared because it is the same obligation in every variant, and easy to half-implement: the class
 * is on `<body>`, which no variant's own component tree owns.
 */
export function lockBodyScroll(): () => void {
    document.body.classList.add('agd-ea-expanded-active');
    return () => document.body.classList.remove('agd-ea-expanded-active');
}
