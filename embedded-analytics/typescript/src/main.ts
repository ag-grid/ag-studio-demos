import { createEmbeddedAnalyticsDemo } from './embeddedAnalyticsDemo';
import './index.css';
import './shared/styles.css';

createEmbeddedAnalyticsDemo({ container: document.querySelector<HTMLElement>('#app')! });
