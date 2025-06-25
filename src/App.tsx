import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import RouterConfig from "./RouterConfig";
import SupportChat from './components/SupportChat';
import { detectAndSetLanguage } from './utils/languageUtils';

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
  
  // Don't initialize language detection here - it will be handled by the LanguageProvider
}
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <ChatProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <RouterConfig />
                <SupportChat />
              </TooltipProvider>
            </ChatProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;