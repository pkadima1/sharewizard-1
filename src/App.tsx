import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Import testing utilities for debugging text overlays
// This will expose debugging functions to the window object
import './utils/textOverlayTesting.js';
import './utils/textOverlayDiagnostics.js';

// Import text overlay utilities and make them globally available
import { 
  drawCustomTextOverlay, 
  getTextOverlayDataFromElement,
  initializeMediaFileCache 
} from './utils/textOverlayHelpers';

// Make text overlay utilities globally available for use in other components
if (typeof window !== 'undefined') {
  // @ts-ignore - adding to window
  window.drawCustomTextOverlay = drawCustomTextOverlay;
  // @ts-ignore - adding to window
  window.getTextOverlayDataFromElement = getTextOverlayDataFromElement;
  
  // Ensure media file cache is initialized
  initializeMediaFileCache();
}

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import CaptionGenerator from "./pages/CaptionGenerator";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PreviewRepost from "./pages/PreviewRepost";
import LongFormWizard from "./pages/LongFormWizard";
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />          <BrowserRouter>            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow main-container">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pricing" element={<Pricing />} />                  <Route path="/caption-generator" element={<CaptionGenerator />} />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/preview-repost" element={<PreviewRepost />} />
                  <Route path="/longform" element={<LongFormWizard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}<Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;