import { createRoot } from 'react-dom/client';

import { ReportBuilderApp } from './ReportBuilderApp';
import './index.css';

import '@demo/report-builder/styles.css';

createRoot(document.querySelector('#root')!).render(<ReportBuilderApp />);
