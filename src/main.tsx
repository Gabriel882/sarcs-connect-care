import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure the root element exists before rendering
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Create the root and render the app
const root = createRoot(rootElement);
root.render(<App />);
