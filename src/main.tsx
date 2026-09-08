import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Type declaration for Electron window bridge
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      toggleFullscreen: () => void;
      printReceipt: (data: unknown) => Promise<{ success: boolean; timestamp: number }>;
      onUpdateStatus: (cb: (status: string) => void) => void;
    };
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
