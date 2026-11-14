import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// NOTE: React.StrictMode has been removed to prevent compatibility issues
// with the 'recharts' library in React 18, which can cause 'useRef' errors.
root.render(
    <App />
);
