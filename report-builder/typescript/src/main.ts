import './index.css';
import { createReportBuilderDemo } from './reportBuilderDemo';

import '@demo/report-builder/styles.css';

createReportBuilderDemo({ container: document.querySelector<HTMLElement>('#app')! });
