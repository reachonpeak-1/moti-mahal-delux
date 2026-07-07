import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import gkRegencyImg from './assets/gk_regency.webp';

// Early preload of critical Largest Contentful Paint (LCP) image
const preloadLcp = new Image();
preloadLcp.src = gkRegencyImg;
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SettingsProvider } from './contexts/SettingsContext.tsx';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <SettingsProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
