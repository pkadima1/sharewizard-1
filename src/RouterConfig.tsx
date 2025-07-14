import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import CaptionGenerator from "./pages/CaptionGenerator";
import LongFormWizard from "./pages/LongFormWizard";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PreviewRepost from "./pages/PreviewRepost";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import InspirationHubPage from "./pages/inspiration-hub";
import { useLanguage } from "./contexts/LanguageContext";
import { trackPageView } from "./utils/analytics";

// Lazy-loaded test components (only in development)
const TestLongformGeneration = lazy(() => 
  import('./components/tests/TestLongformGeneration')
);

const GoogleTrendsTest = lazy(() => 
  import('./components/examples/GoogleTrendsTest')
);

// Component to handle language URL detection and redirection
const LanguageRouteHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useParams<{ lang: string }>();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const supportedLangCodes = supportedLanguages.map(l => l.code);
    
    // If there's a language in the URL and it's supported
    if (lang && supportedLangCodes.includes(lang)) {
      // If the URL language is different from the current language, update it
      if (lang !== currentLanguage) {
        changeLanguage(lang);
      }
    } else if (lang && !supportedLangCodes.includes(lang)) {
      // If the language in URL is not supported, redirect to current language
      const newPath = location.pathname.replace(`/${lang}`, `/${currentLanguage}`);
      navigate(newPath, { replace: true });
    }
  }, [lang, currentLanguage, changeLanguage, supportedLanguages, navigate, location.pathname]);

  return <>{children}</>;
};

// Component to redirect root paths to language-prefixed paths
const RootRedirect: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // For the root path, redirect to language-prefixed home
    if (location.pathname === '/') {
      navigate(`/${currentLanguage}/home`, { replace: true });
    } else {
      // For other paths, just add the language prefix
      navigate(`/${currentLanguage}${location.pathname}`, { replace: true });
    }
  }, [currentLanguage, navigate, location.pathname]);

  return null;
};

// Component to handle global page tracking
const GlobalPageTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return null;
};

const RouterConfig = () => {  
  return (
    <ErrorBoundary>
      <GlobalPageTracker />
      <div className="flex flex-col min-h-screen">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
        <main className="flex-grow main-container">
          <ErrorBoundary>            
            <Routes>
              {/* Root redirects - redirect paths without language prefix */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/profile" element={<RootRedirect />} />
              <Route path="/login" element={<RootRedirect />} />
              <Route path="/signup" element={<RootRedirect />} />
              <Route path="/forgot-password" element={<RootRedirect />} />
              <Route path="/dashboard" element={<RootRedirect />} />
              <Route path="/pricing" element={<RootRedirect />} />
              <Route path="/caption-generator" element={<RootRedirect />} />
              <Route path="/terms" element={<RootRedirect />} />
              <Route path="/privacy" element={<RootRedirect />} />
              <Route path="/preview-repost" element={<RootRedirect />} />
              <Route path="/longform" element={<RootRedirect />} />
              <Route path="/gallery" element={<RootRedirect />} />
              <Route path="/blog" element={<RootRedirect />} />
              <Route path="/inspiration-hub" element={<RootRedirect />} />
              <Route path="/contact" element={<RootRedirect />} />
              <Route path="/admin" element={<RootRedirect />} />
              
              {/* Language-prefixed routes */}
              <Route path="/:lang/*" element={
                <LanguageRouteHandler>
                  <Routes>
                    <Route path="/home" element={<Index />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/caption-generator" element={<CaptionGenerator />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/preview-repost" element={<PreviewRepost />} />
                    <Route path="/longform" element={<ErrorBoundary><LongFormWizard /></ErrorBoundary>} />
                    <Route path="/gallery" element={<Gallery />} />
                                  <Route path="/blog" element={<ErrorBoundary><Blog /></ErrorBoundary>} />
              <Route path="/inspiration-hub" element={<ErrorBoundary><InspirationHubPage /></ErrorBoundary>} />
              <Route path="/contact" element={<Contact />} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                    
                    {/* Development-only testing routes */}
                    {import.meta.env.DEV && (
                      <>
                        <Route 
                          path="/test-longform" 
                          element={
                            <ErrorBoundary>
                              <Suspense fallback={<div className="p-8 text-center">Loading test component...</div>}>
                                <TestLongformGeneration />
                              </Suspense>
                            </ErrorBoundary>
                          } 
                        />
                        <Route 
                          path="/test-trends" 
                          element={
                            <ErrorBoundary>
                              <Suspense fallback={<div className="p-8 text-center">Loading Google Trends test...</div>}>
                                <GoogleTrendsTest />
                              </Suspense>
                            </ErrorBoundary>
                          } 
                        />
                      </>
                    )}
                    
                    {/* Nested route catch-all for unknown pages */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </LanguageRouteHandler>
              } />
              
              {/* Global catch-all for completely unknown routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default RouterConfig;
