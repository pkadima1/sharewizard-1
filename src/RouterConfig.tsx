import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PreviewRepost from "./pages/PreviewRepost";

// Lazy-loaded test components (only in development)
const TestLongformGeneration = lazy(() => 
  import('./components/tests/TestLongformGeneration')
);

const RouterConfig = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <ErrorBoundary>
            <Navbar />
          </ErrorBoundary>
          <main className="flex-grow main-container">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/caption-generator" element={<CaptionGenerator />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/preview-repost" element={<PreviewRepost />} />                <Route path="/longform" element={<ErrorBoundary><LongFormWizard /></ErrorBoundary>} />
                
                {/* Development-only testing routes */}
                {import.meta.env.DEV && (
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
                )}
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <ErrorBoundary>
            <Footer />
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default RouterConfig;
