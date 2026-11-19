import { createRoot } from 'react-dom/client';

import { InAppReportingApp } from './InAppReportingApp';
import './index.css';
import './shared/styles.css';

createRoot(document.querySelector('#root')!).render(<InAppReportingApp />);
