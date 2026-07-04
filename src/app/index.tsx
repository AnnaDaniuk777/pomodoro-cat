import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/400.css';
import { App } from './App';
import { WidgetScreen } from '@/pages/widget';
import './styles/global.css';

const isWidget = window.location.hash === '#widget';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isWidget ? <WidgetScreen /> : <App />}</StrictMode>,
);
