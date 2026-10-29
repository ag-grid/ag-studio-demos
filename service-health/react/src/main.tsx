import { createRoot } from 'react-dom/client';

import { ServiceHealthApp } from './ServiceHealthApp';
import './index.css';
import './shared/styles.css';

createRoot(document.querySelector('#root')!).render(<ServiceHealthApp />);
