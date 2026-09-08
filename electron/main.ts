import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Restaurant OS 2026',
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    frame: true,
    autoHideMenuBar: false,
    backgroundColor: '#0c0e12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Lock Terminal (قفل نقطة البيع)',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow?.webContents.send('trigger-lock');
          },
        },
        {
          label: 'Owner HQ Portal (لوحة المالك)',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow?.webContents.send('trigger-owner-app');
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit (خروج)' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload (إعادة تحميل)' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'zoom', label: 'Maximize / Restore' },
        { role: 'close', label: 'Close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5177').catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.on('window-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('print-receipt', async (_event, receiptData) => {
  console.log('Printing thermal ticket:', receiptData);
  return { success: true, timestamp: Date.now() };
});

ipcMain.handle('get-hardware-dna', async () => {
  try {
    const os = await import('os');
    const crypto = await import('crypto');
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Generic CPU';
    const cpuCores = cpus.length || 8;
    const cpuArch = os.arch();
    const platform = os.platform();
    const hostname = os.hostname();

    // Get MAC address from primary active network interface
    const networkInterfaces = os.networkInterfaces();
    let primaryMac = '00:00:00:00:00:00';
    for (const name of Object.keys(networkInterfaces)) {
      const net = networkInterfaces[name];
      if (net) {
        for (const item of net) {
          if (!item.internal && item.mac && item.mac !== '00:00:00:00:00:00') {
            primaryMac = item.mac.toUpperCase();
            break;
          }
        }
      }
      if (primaryMac !== '00:00:00:00:00:00') break;
    }

    // Generate deterministic Motherboard and Disk signature from machine telemetry
    const mbEntropy = `${platform}:${hostname}:${cpuModel}:${cpuCores}:${cpuArch}:${os.totalmem()}`;
    const mbHash = crypto.createHash('sha256').update(mbEntropy).digest('hex');
    const motherboardUuid = `UUID-${mbHash.substring(0, 8)}-${mbHash.substring(8, 12)}-${mbHash.substring(12, 16).toUpperCase()}`;
    const diskSerial = `DSK-${mbHash.substring(16, 20).toUpperCase()}-${mbHash.substring(20, 28).toUpperCase()}`;

    return {
      cpuId: `CPU-${cpuModel.replace(/\s+/g, '_')}-${cpuCores}C-${cpuArch}`,
      cpuModel,
      cpuCores,
      motherboardUuid,
      primaryMac,
      diskSerial,
      platform,
      isNativeElectron: true,
    };
  } catch (err) {
    console.error('Failed to query native hardware info:', err);
    return null;
  }
});


app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
