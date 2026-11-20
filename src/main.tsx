import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MatchProvider } from './context/MatchContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MatchProvider>
      <App />
    </MatchProvider>
  </React.StrictMode>
);

// Register PWA Service Worker for offline support and mobile installation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('PWA ServiceWorker registration failed:', error);
      });
  });
}

