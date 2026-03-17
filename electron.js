const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function startBackend() {
  // Determine correct server path based on whether app is packaged
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'index.js')
    : path.join(__dirname, 'server', 'index.js');
  
  console.log('Starting backend from:', serverPath);
  console.log('App is packaged:', app.isPackaged);
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  
  // Check if server file exists
  if (!fs.existsSync(serverPath)) {
    const errorMsg = `Server file not found at: ${serverPath}`;
    console.error(errorMsg);
    const { dialog } = require('electron');
    dialog.showErrorBox('Backend Error', errorMsg);
    return;
  }

  const dataPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(__dirname, 'data');

  backendProcess = spawn('node', [serverPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      PORT: '3001',
      NODE_ENV: 'production',
      HOP_DATA_DIR: dataPath
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend Error]', data.toString().trim());
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
  });

  console.log('Backend server starting on port 3001...');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Hop! - Network Engineer Toolset',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'icon.ico')
      : path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    backgroundColor: '#0a0e1a',
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.setZoomLevel(0)
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Hop!',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Hop!',
              message: 'Hop! - Network Engineer Toolset',
              detail: 'Version 1.0.0\nGabriel Stancu — 2026\ngabriel.stancu@live.com\nFreeware License',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Determine correct URL based on whether app is packaged
  const isDev = process.env.ELECTRON_START_URL !== undefined;
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else if (app.isPackaged) {
    const htmlPath = path.join(process.resourcesPath, 'app.asar', 'client', 'build', 'index.html');
    startUrl = `file://${htmlPath}`;
  } else {
    startUrl = `file://${path.join(__dirname, 'client', 'build', 'index.html')}`;
  }
  
  console.log('Loading URL:', startUrl);
  console.log('Mode:', isDev ? 'Development' : 'Production');
  console.log('Is packaged:', app.isPackaged);
  
  // Wait for backend to be ready with health check
  async function waitForBackend(maxRetries = 15, interval = 500) {
    const http = require('http');
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:3001/api/history', (res) => {
            resolve(true);
          });
          req.on('error', reject);
          req.setTimeout(500, () => { req.destroy(); reject(new Error('timeout')); });
        });
        return true;
      } catch {
        await new Promise(r => setTimeout(r, interval));
      }
    }
    return false;
  }

  waitForBackend().then((ready) => {
    if (!ready) {
      console.warn('Backend may not be ready, loading UI anyway...');
    }
    mainWindow.loadURL(startUrl).catch(err => {
      console.error('Failed to load URL:', err);
      const { dialog } = require('electron');
      dialog.showErrorBox('Load Error', `Failed to load: ${startUrl}\n\nError: ${err.message}`);
    });
    
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      console.log('Hop! window ready');
    });

    // Open DevTools only in development mode
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigation to external URLs
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        console.log('Force killing backend process...');
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
    
    backendProcess = null;
  }
}

// App lifecycle events
app.on('ready', () => {
  console.log('Hop! Electron app starting...');
  console.log('App version:', app.getVersion());
  console.log('Electron version:', process.versions.electron);
  console.log('Node version:', process.versions.node);
  
  // Ensure data directory exists
  const dataDir = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    } catch (err) {
      console.error('Failed to create data directory:', err);
    }
  }
  
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    startBackend();
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
