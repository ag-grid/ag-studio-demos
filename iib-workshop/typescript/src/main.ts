import { AgStudioLicenseManager } from 'ag-studio';

import { eventConfig } from './eventConfig';
import { createIibWorkshopDemo } from './iibWorkshopDemo';
import './index.css';
import { readRuntimeConfig } from './runtimeConfig';

const { licenseKey } = readRuntimeConfig(import.meta.env);

// Optional: without a key the app still runs, watermarked, and logs a trial notice.
if (licenseKey) {
    AgStudioLicenseManager.setLicenseKey(licenseKey);
}

const container = document.querySelector<HTMLElement>('#app');
if (!container) {
    throw new Error('IIB workshop: index.html has no #app element to mount into.');
}

document.title = eventConfig.documentTitle;

createIibWorkshopDemo({ container, event: eventConfig });
