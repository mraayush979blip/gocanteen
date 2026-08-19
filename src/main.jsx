import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import App from './App';
import * as Sentry from '@sentry/react';
import ErrorFallback from './components/ErrorFallback';
import './index.css';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection to ensure it persists
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

// PWA and Service Worker registration
window.__CACHE_BUST_VERSION__ = "v5"; // Forcing a new Javascript hash to bypass 404s
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered:', reg.scope);
        // Explicitly check for updates in the background
        reg.update();
      })
      .catch((err) => console.error('PWA Service Worker registration failed:', err));

    // When the service worker updates and takes control, seamlessly reload the page to apply it
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Handle path-based redirects for HashRouter
if (window.location.pathname === '/ad') {
  window.location.replace('/#/ad');
}

// Dynamically swap PWA manifest for internal portals to allow separate PWA installation
const updateManifest = () => {
  const hash = window.location.hash;
  const isInternal = hash.includes('/ad') || hash.includes('/staff') || hash.includes('/admin');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.setAttribute('href', isInternal ? '/manifest-staff.json' : '/manifest.json');
  }
};
updateManifest();
window.addEventListener('hashchange', updateManifest);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
        <HashRouter>
          <App />
          <Analytics />
        </HashRouter>
      </Sentry.ErrorBoundary>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
