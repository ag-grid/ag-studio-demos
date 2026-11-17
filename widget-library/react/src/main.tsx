import { createRoot } from 'react-dom/client';

import { WidgetLibraryApp } from './WidgetLibraryApp';
import './index.css';
import './shared/styles.css';

createRoot(document.querySelector('#root')!).render(<WidgetLibraryApp />);
