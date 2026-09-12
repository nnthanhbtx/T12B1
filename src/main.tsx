import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker immediately for 100% offline caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
