import './index.css';
import './shared/styles.css';
import { createWidgetLibraryDemo } from './widgetLibraryDemo';

createWidgetLibraryDemo({ container: document.querySelector<HTMLElement>('#app')! });
