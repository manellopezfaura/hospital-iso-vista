
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set initial dark mode class based on user preference or default to dark mode
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
