import { createRoot } from 'react-dom/client';

import { EmbeddedAnalyticsApp } from './EmbeddedAnalyticsApp';
import './index.css';

import '@demo/embedded-analytics/styles.css';

createRoot(document.querySelector('#root')!).render(<EmbeddedAnalyticsApp />);
