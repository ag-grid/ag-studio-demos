/**
 * Widget menu icons in the style of Studio's own: 32x32, filled paths, theme palette variables.
 * `M1 31H32V32H0V0H1V31Z` is the built-in cartesian icons' axis rule.
 */

const FILL_1 = 'var(--ag-chart-palette-fills-1-color, #5090DC)';
const FILL_2 = 'var(--ag-chart-palette-fills-2-color, #43964E)';
const FILL_3 = 'var(--ag-chart-palette-fills-3-color, #5FCCC8)';
const BORDER = 'var(--ag-border-color, #B3B4B4)';
const SUBTLE = 'var(--ag-subtle-text-color, #B9B7B7)';
const AXIS = `<path d="M1 31H32V32H0V0H1V31Z" fill="${BORDER}"/>`;

const svg = (body: string) =>
    `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const organizationIcon = svg(`
<path d="M11 2H21V9H11V2Z" fill="${FILL_1}"/>
<path d="M2 22H12V29H2V22Z" fill="${FILL_2}"/>
<path d="M20 22H30V29H20V22Z" fill="${FILL_3}"/>
<path d="M15.5 9H16.5V15H15.5V9ZM7 15H25V16H7V15ZM6.5 16H7.5V22H6.5V16ZM24.5 16H25.5V22H24.5V16Z" fill="${SUBTLE}"/>`);

export const worldMapIcon = svg(`
<path d="M2 9L8 6L13 9L12 16L6 19L2 14V9Z" fill="${FILL_1}"/>
<path d="M17 6L25 4L30 9L29 17L22 20L16 14L17 6Z" fill="${FILL_2}"/>
<path d="M9 22L16 21L19 26L14 30L8 28L9 22Z" fill="${SUBTLE}"/>
<circle cx="8" cy="12" r="4" fill="${FILL_3}" opacity="0.85"/>
<circle cx="24" cy="12" r="6" fill="${FILL_3}" opacity="0.6"/>`);

export const routeMapIcon = svg(`
<path d="M2 8L9 5L14 9L12 16L5 18L2 13V8Z" fill="${SUBTLE}" opacity="0.5"/>
<path d="M19 5L27 4L30 10L28 18L21 19L17 12L19 5Z" fill="${SUBTLE}" opacity="0.5"/>
<path d="M4 25C10 25 12 15 18 15C24 15 25 24 30 24V26C24 26 23 17 18 17C13 17 11 27 4 27V25Z" fill="${FILL_1}"/>
<circle cx="4" cy="26" r="3" fill="${FILL_2}"/>
<circle cx="29" cy="25" r="3" fill="${FILL_3}"/>`);

export const errorBarsIcon = svg(`
<path d="M4 17H10V31H4V17Z" fill="${FILL_1}"/>
<path d="M13 11H19V31H13V11Z" fill="${FILL_2}"/>
<path d="M22 21H28V31H22V21Z" fill="${FILL_3}"/>
<path d="M4 12H10V13H4V12ZM6.5 13H7.5V21H6.5V13ZM4 21H10V22H4V21Z
         M13 6H19V7H13V6ZM15.5 7H16.5V15H15.5V7ZM13 15H19V16H13V15Z
         M22 16H28V17H22V16ZM24.5 17H25.5V25H24.5V17ZM22 25H28V26H22V25Z" fill="${SUBTLE}"/>
${AXIS}`);

export const annotatedBarIcon = svg(`
<path d="M4 22H8V31H4V22Z" fill="${FILL_1}"/>
<path d="M10 17H14V31H10V17Z" fill="${FILL_1}"/>
<path d="M16 19H20V31H16V19Z" fill="${FILL_2}"/>
<path d="M22 10H26V31H22V10Z" fill="${FILL_3}"/>
<path d="M2 20H30V21H2V20Z" fill="${SUBTLE}"/>
<path d="M17 3H30V10H23L20 13V10H17V3Z" fill="${FILL_3}" opacity="0.45"/>
${AXIS}`);

export const choroplethIcon = svg(`
<path d="M12 2L19 4L17 11L10 12L8 6L12 2Z" fill="${FILL_1}"/>
<path d="M19 4L27 7L26 15L17 14L19 4Z" fill="${FILL_3}"/>
<path d="M8 6L10 12L8 20L2 17L3 9L8 6Z" fill="${SUBTLE}" opacity="0.55"/>
<path d="M10 13L17 14L18 22L11 24L8 20L10 13Z" fill="${FILL_2}"/>
<path d="M18 15L26 16L24 25L18 23L18 15Z" fill="${FILL_1}" opacity="0.65"/>
<path d="M4 28H28V30H4V28Z" fill="${BORDER}"/>`);

export const sankeyIcon = svg(`
<path d="M2 4H6V15H2V4Z" fill="${FILL_1}"/>
<path d="M2 18H6V29H2V18Z" fill="${FILL_2}"/>
<path d="M26 6H30V16H26V6Z" fill="${FILL_3}"/>
<path d="M26 19H30V29H26V19Z" fill="${FILL_1}"/>
<path d="M6 5C15 5 17 7 26 7V13C17 13 15 10 6 10V5Z" fill="${FILL_1}" opacity="0.5"/>
<path d="M6 19C15 19 17 22 26 22V28C17 28 15 25 6 25V19Z" fill="${FILL_2}" opacity="0.5"/>
<path d="M6 11C15 11 17 21 26 21V24C17 24 15 14 6 14V11Z" fill="${FILL_3}" opacity="0.5"/>`);

export const quadrantIcon = svg(`
<path d="M2 2H15V15H2V2Z" fill="${FILL_1}" opacity="0.18"/>
<path d="M17 2H30V15H17V2Z" fill="${FILL_3}" opacity="0.18"/>
<path d="M2 17H15V30H2V17Z" fill="${SUBTLE}" opacity="0.14"/>
<path d="M17 17H30V30H17V17Z" fill="${FILL_2}" opacity="0.18"/>
<path d="M15.5 2H16.5V30H15.5V2ZM2 15.5H30V16.5H2V15.5Z" fill="${BORDER}"/>
<circle cx="8" cy="8" r="3" fill="${FILL_1}"/>
<circle cx="23" cy="6" r="4" fill="${FILL_3}"/>
<circle cx="21" cy="12" r="2" fill="${FILL_3}"/>
<circle cx="9" cy="23" r="2" fill="${SUBTLE}"/>
<circle cx="24" cy="23" r="3" fill="${FILL_2}"/>`);
