import { createEmbeddedAnalyticsDemo } from './embeddedAnalyticsDemo';
import './index.css';

import '@demo/embedded-analytics/styles.css';

createEmbeddedAnalyticsDemo({ container: document.querySelector<HTMLElement>('#app')! });
