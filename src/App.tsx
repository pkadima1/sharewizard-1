import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AnalyticsProvider } from "./contexts/AnalyticsContext";
import RouterConfig from "./RouterConfig";
import SupportChat from './components/SupportChat';
import ReferralAttributionBanner from './components/referral/ReferralAttributionBanner';


// Import text overlay utilities and make them globally available
import { 
  drawCustomTextOverlay, 
  getTextOverlayDataFromElement,
  initializeMediaFileCache 
} from './utils/textOverlayHelpers';

// Import referral testing utilities
import './utils/testReferralAccess';

// Make text overlay utilities globally available for use in other components
if (typeof window !== 'undefined') {
  // @ts-expect-error - adding to window
  window.drawCustomTextOverlay = drawCustomTextOverlay;
  // @ts-expect-error - adding to window
  window.getTextOverlayDataFromElement = getTextOverlayDataFromElement;
  
  // Ensure media file cache is initialized
  initializeMediaFileCache();
  

  
  // Don't initialize language detection here - it will be handled by the LanguageProvider
}
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AnalyticsProvider>
              <LanguageProvider>
                <ChatProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <ReferralAttributionBanner />
                    <RouterConfig />
                    <SupportChat />
                  </TooltipProvider>
                </ChatProvider>
              </LanguageProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>;
export default App;