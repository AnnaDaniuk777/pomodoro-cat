import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p/400.css';
import { App } from './App';
import { WidgetScreen } from '@/pages/widget';
import { PlayerWidgetScreen } from '@/pages/player-widget';
import { preloadCatSheets } from '@/entities/cat';
import './styles/global.css';

preloadCatSheets();

function resolveScreen() {
  if (window.location.hash === '#widget') return <WidgetScreen />;
  if (window.location.hash === '#player-widget') return <PlayerWidgetScreen />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{resolveScreen()}</StrictMode>,
);
