import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let isMaximized = false;
let previousBounds = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/assets/ProjectDefault.avif'), // placeholder
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#18181b',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    mainWindow.webContents.openDevTools(); // Temporary for debugging
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('scan-engines', async () => {
  // Simple scan for common Unreal Engine install paths
  const commonPaths = [
    'C:\\Program Files\\Epic Games',
    'C:\\Program Files (x86)\\Epic Games',
    'D:\\Unreal'
  ];

  const engines = [];

  for (const basePath of commonPaths) {
    if (fs.existsSync(basePath)) {
      try {
        const items = fs.readdirSync(basePath);
        for (const item of items) {
          if (item.startsWith('UE_')) {
            const enginePath = path.join(basePath, item);
            const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64');
            const exePath = path.join(binPath, 'UnrealEditor.exe');
            if (fs.existsSync(exePath)) {
              const stats = fs.statSync(enginePath);
              const size = getFolderSize(enginePath);
              engines.push({
                version: item.replace('UE_', ''),
                exePath,
                directoryPath: enginePath,
                folderSize: formatBytes(size),
                lastLaunch: 'Unknown' // Could track this separately
              });
            }
          }
        }
      } catch (err) {
        console.error('Error scanning path:', basePath, err);
      }
    }
  }

  return engines;
});

ipcMain.handle('scan-projects', async () => {
  // Scan common project directories
  const searchPaths = [
    path.join(os.homedir(), 'Documents', 'Unreal Projects'),
    'C:\\Users\\Public\\Documents\\Unreal Projects',
    'D:\\Unreal\\Projects'
  ];

  const projects = [];

  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      const uprojectFiles = findUprojectFiles(searchPath);
      for (const uprojectPath of uprojectFiles) {
        try {
          const projectDir = path.dirname(uprojectPath);
          const projectName = path.basename(projectDir);
          const stats = fs.statSync(projectDir);
          const size = getFolderSize(projectDir);

          // Read .uproject to get engine version if possible
          let version = 'Unknown';
          try {
            const uprojectContent = fs.readFileSync(uprojectPath, 'utf8');
            const match = uprojectContent.match(/"EngineAssociation":\s*"([^"]+)"/);
            if (match) version = match[1];
          } catch (err) {
            // Ignore
          }

          projects.push({
            name: projectName,
            version,
            size: formatBytes(size),
            createdAt: stats.birthtime.toISOString().split('T')[0],
            projectPath: projectDir
          });
        } catch (err) {
          console.error('Error processing project:', uprojectPath, err);
        }
      }
    }
  }

  return projects;
});

ipcMain.handle('launch-engine', async (event, exePath) => {
  try {
    spawn(exePath, [], { detached: true, stdio: 'ignore' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('launch-project', async (event, projectPath) => {
  // Find the associated engine
  const uprojectPath = path.join(projectPath, `${path.basename(projectPath)}.uproject`);
  if (!fs.existsSync(uprojectPath)) {
    return { success: false, error: 'Project file not found' };
  }

  try {
    const uprojectContent = fs.readFileSync(uprojectPath, 'utf8');
    const match = uprojectContent.match(/"EngineAssociation":\s*"([^"]+)"/);
    if (!match) {
      return { success: false, error: 'Engine association not found' };
    }

    const engineVersion = match[1];
    // Find engine exe
    const engines = await scanEnginesInternal();
    const engine = engines.find(e => e.version === engineVersion);
    if (!engine) {
      return { success: false, error: 'Associated engine not found' };
    }

    spawn(engine.exePath, [uprojectPath], { detached: true, stdio: 'ignore' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-directory', async (event, dirPath) => {
  spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' });
});

ipcMain.handle('select-engine-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Unreal Engine Folder',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folder = result.filePaths[0];
  const exePath = path.join(folder, 'Engine', 'Binaries', 'Win64', 'UnrealEditor.exe');
  if (!fs.existsSync(exePath)) return null;
  const stats = fs.statSync(folder);
  const size = getFolderSize(folder);
  const version = path.basename(folder).replace('UE_', '');
  return {
    version,
    exePath,
    directoryPath: folder,
    folderSize: formatBytes(size),
    lastLaunch: 'Unknown'
  };
});

ipcMain.handle('select-project-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Unreal Project Folder',
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const folder = result.filePaths[0];
  const uprojectFiles = findUprojectFiles(folder);
  if (uprojectFiles.length === 0) return null;
  const uprojectPath = uprojectFiles[0];
  const projectName = path.basename(folder);
  const stats = fs.statSync(folder);
  const size = getFolderSize(folder);
  let version = 'Unknown';
  try {
    const uprojectContent = fs.readFileSync(uprojectPath, 'utf8');
    const match = uprojectContent.match(/"EngineAssociation":\s*"([^\"]+)"/);
    if (match) version = match[1];
  } catch (err) {
    // ignore
  }

  return {
    name: projectName,
    version,
    size: formatBytes(size),
    createdAt: stats.birthtime.toISOString().split('T')[0],
    projectPath: folder
  };
});

ipcMain.on('window-minimize', () => {
  console.log('Main process: minimize called');
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  console.log('Main process: maximize called');
  if (mainWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

    if (isMaximized) {
      // Restore
      if (previousBounds) {
        mainWindow.setPosition(previousBounds.x, previousBounds.y);
        mainWindow.setSize(previousBounds.width, previousBounds.height);
      }
      isMaximized = false;
    } else {
      // Maximize
      previousBounds = mainWindow.getBounds();
      mainWindow.setPosition(0, 0);
      mainWindow.setSize(screenWidth, screenHeight);
      isMaximized = true;
    }
  }
});

ipcMain.on('window-close', () => {
  console.log('Main process: close called');
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return isMaximized;
});

// Helper functions
function findUprojectFiles(dir) {
  const files = [];
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.')) {
          scan(fullPath);
        } else if (item.endsWith('.uproject')) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }
  scan(dir);
  return files;
}

function getFolderSize(folderPath) {
  let size = 0;
  function calc(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          calc(fullPath);
        } else {
          size += stat.size;
        }
      }
    } catch (err) {
      // Ignore
    }
  }
  calc(folderPath);
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function scanEnginesInternal() {
  // Same as ipcMain.handle('scan-engines')
  const commonPaths = [
    'C:\\Program Files\\Epic Games',
    'C:\\Program Files (x86)\\Epic Games',
    'D:\\Unreal'
  ];

  const engines = [];

  for (const basePath of commonPaths) {
    if (fs.existsSync(basePath)) {
      try {
        const items = fs.readdirSync(basePath);
        for (const item of items) {
          if (item.startsWith('UE_')) {
            const enginePath = path.join(basePath, item);
            const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64');
            const exePath = path.join(binPath, 'UnrealEditor.exe');
            if (fs.existsSync(exePath)) {
              const stats = fs.statSync(enginePath);
              const size = getFolderSize(enginePath);
              engines.push({
                version: item.replace('UE_', ''),
                exePath,
                directoryPath: enginePath,
                folderSize: formatBytes(size),
                lastLaunch: 'Unknown'
              });
            }
          }
        }
      } catch (err) {
        console.error('Error scanning path:', basePath, err);
      }
    }
  }

  return engines;
}