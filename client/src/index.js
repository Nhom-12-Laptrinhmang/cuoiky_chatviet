import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// DEV: filter noisy React Router future-flag deprecation warnings in dev env.
// These are informational only and can be noisy during development. We only
// suppress the specific React Router future-flag messages so other warnings
// are still visible.
if (process.env.NODE_ENV === 'development') {
  try {
    const _warn = console.warn.bind(console);
    console.warn = (...args) => {
      const first = args[0] && String(args[0]);
      if (first && first.includes('React Router Future Flag Warning')) {
        // ignore this specific message
        return;
      }
      _warn(...args);
    };
  } catch (e) {
    // ignore if console is not writable
  }
}

/**
 * Entry point - Render App vào div#root
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
