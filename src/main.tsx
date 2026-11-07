import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Prevent Vite HMR WebSocket connection failure messages in the iframe preview environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('WebSocket') ||
      event.reason?.message?.includes('vite') ||
      event.reason?.stack?.includes('createWebSocketModuleRunnerTransport') ||
      event.reason?.stack?.includes('@vite/client')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('WebSocket') ||
      event.filename?.includes('@vite/client') ||
      event.error?.stack?.includes('createWebSocketModuleRunnerTransport') ||
      event.error?.stack?.includes('@vite/client')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
