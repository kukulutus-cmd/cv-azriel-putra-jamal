import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Kunci total zoom in dan zoom out di HP dan Tablet
if (typeof window !== 'undefined') {
  // Cegah pinch zoom (iOS & Safari)
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());

  // Cegah double tap zoom di Android & iOS
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Cegah Ctrl + Scroll / pinch trackpad
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false }
  );
}

// Auto register PWA service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New PWA content available, will update on reload.');
  },
  onOfflineReady() {
    console.log('POS Lapak Rongsok siap digunakan secara OFFLINE.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
