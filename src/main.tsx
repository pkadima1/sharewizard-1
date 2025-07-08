import { createRoot } from 'react-dom/client'
import { StrictMode, Suspense } from 'react'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
// Import theme styles after the index.css file
import './styles/theme-adaptability.css'
// Import i18n configuration
import './i18n';

// Loading component for suspense fallback
const Loader = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
