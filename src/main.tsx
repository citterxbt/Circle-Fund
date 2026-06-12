import './polyfills';

import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

// Global error handler for module-level throws that ErrorBoundary can't catch
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.innerHTML) {
    root.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#070707;color:#fff;padding:24px;font-family:system-ui">
        <div style="max-width:600px;text-align:center">
          <h2 style="color:#ef4444;margin-bottom:16px">Application Failed to Load</h2>
          <pre style="background:#111;padding:16px;border-radius:8px;overflow:auto;max-height:200px;font-size:13px;color:#f87171;text-align:left">${event.error?.message || 'Unknown error'}</pre>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer">Reload</button>
        </div>
      </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
