import { createRoot } from 'react-dom/client';

import { EmbeddedAnalyticsApp } from './EmbeddedAnalyticsApp';
import './index.css';
import './shared/styles.css';

createRoot(document.querySelector('#root')!).render(<EmbeddedAnalyticsApp />);
