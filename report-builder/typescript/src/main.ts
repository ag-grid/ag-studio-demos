import './index.css';
import { createReportBuilderDemo } from './reportBuilderDemo';
import './shared/styles.css';

createReportBuilderDemo({ container: document.querySelector<HTMLElement>('#app')! });
