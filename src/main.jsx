import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/app.css';
import { registerSW, initInstallPromptCapture } from './utils/pwa';

// Capturar o beforeinstallprompt o mais cedo possível — Chrome dispara o
// evento muito cedo e se perdermos, o botão "Instalar app" nunca aparece.
initInstallPromptCapture();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

registerSW();
