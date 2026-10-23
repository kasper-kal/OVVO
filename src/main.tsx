import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';

/*
 * In development, a bare visit opens the skeleton lab (see `App.tsx`). A dev preview URL cannot
 * carry a hash of its own, and while the loading state is being looked at, that is the screen to
 * see. Any explicit hash is left alone, so every other screen is still one link away.
 */
if (import.meta.env.DEV && !window.location.hash) {
  window.location.hash = '#/skeleton';
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
