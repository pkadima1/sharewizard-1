import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
// Import theme styles after the index.css file
import './styles/theme-adaptability.css'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
