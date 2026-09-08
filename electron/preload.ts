import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.send('window-fullscreen'),
  printReceipt: (receiptData: unknown) => ipcRenderer.invoke('print-receipt', receiptData),
  getHardwareDna: () => ipcRenderer.invoke('get-hardware-dna'),
  onUpdateStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('update-status', (_event, value) => callback(value));
  }
});

