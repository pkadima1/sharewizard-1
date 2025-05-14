import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import theme styles after the index.css file
import './styles/theme-adaptability.css'

createRoot(document.getElementById("root")!).render(<App />);
