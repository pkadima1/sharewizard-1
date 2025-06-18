import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
// Import theme styles after the index.css file
import './styles/theme-adaptability.css'
// Import i18n configuration - must be imported before any component that uses translations
import i18n from './i18n'
// Import and initialize language settings
import { initializeLanguage } from './utils/languageUtils'

// Wait for i18n to initialize, then mount the app
const mountApp = () => {
  // Initialize language settings
  initializeLanguage()

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
};

// If i18n is already initialized, mount the app immediately
if (i18n.isInitialized) {
  mountApp();
} else {
  // Otherwise, wait for initialization to complete
  i18n.on('initialized', mountApp);
}
