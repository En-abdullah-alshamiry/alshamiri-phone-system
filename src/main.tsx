import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Early capture of PWA beforeinstallprompt to ensure it is never missed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    (window as any).__deferredPwaPrompt = e;
  });
}

createRoot(document.getElementById('root')!).render(<App />);
