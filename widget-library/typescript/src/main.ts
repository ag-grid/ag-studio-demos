import './index.css';
import { createWidgetLibraryDemo } from './widgetLibraryDemo';

import '@demo/widget-library/styles.css';

createWidgetLibraryDemo({ container: document.querySelector<HTMLElement>('#app')! });
