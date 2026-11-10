import { createRoot } from 'react-dom/client';

import { ReportBuilderApp } from './ReportBuilderApp';
import './index.css';
import './shared/styles.css';

createRoot(document.querySelector('#root')!).render(<ReportBuilderApp />);
