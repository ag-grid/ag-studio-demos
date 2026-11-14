import './index.css';
import { createServiceHealthDemo } from './serviceHealthDemo';
import './shared/styles.css';

createServiceHealthDemo({ container: document.querySelector<HTMLElement>('#app')! });
