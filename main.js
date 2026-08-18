const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { getWinStatePath, loadWinState, ensureVisibleBounds, saveWinState, scheduleSaveWinState } = require('./src/win-state');
const { getConfigPath, loadConfig, saveConfig } = require('./src/config');
const { scheduleRetry } = require('./src/retry');
const { showPaneView, createPaneView, removePaneView, reloadPaneView, backPaneView, clearPaneDataView } = require('./src/pane-manager');

let win = null;
const panes = new Map();

function sendStatus(id, status, extra) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pane-status', { id, status, extra });
  }
}

function createWindow() {
  const winStatePath = getWinStatePath(app);
  const winState = loadWinState(winStatePath, logger);
  const bounds = ensureVisibleBounds({
    x: typeof winState.x === 'number' ? winState.x : undefined,
    y: typeof winState.y === 'number' ? winState.y : undefined,
    width: winState.width,
    height: winState.height
  }, require('electron').screen);

  const winOpts = {
    width: bounds.width,
    height: bounds.height,
    title: 'Multi-Conta Grid',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  };
  if (typeof bounds.x === 'number') { winOpts.x = bounds.x; winOpts.y = bounds.y; }
  win = new BrowserWindow(winOpts);

  win.on('resize', () => scheduleSaveWinState(win, winStatePath, logger));
  win.on('move', () => scheduleSaveWinState(win, winStatePath, logger));
  win.on('close', () => saveWinState(win, winStatePath, logger));

  if (winState.isMaximized) win.maximize();

  win.loadFile('index.html');
}

ipcMain.handle('create-pane', (event, { id, partition, url }) => {
  return createPaneView({
    win,
    panes,
    id,
    partition,
    url,
    logger,
    sendStatus,
    scheduleRetry: (paneId, fromCrash) => scheduleRetry({ panes, id: paneId, fromCrash, logger, sendStatus, showPaneView })
  });
});

ipcMain.handle('remove-pane', (event, id) => {
  return removePaneView({ win, panes, id, logger });
});

ipcMain.handle('reload-pane', (event, id) => {
  return reloadPaneView({ panes, id, logger });
});

ipcMain.handle('back-pane', (event, id) => {
  return backPaneView({ panes, id });
});

ipcMain.on('sync-layout', (event, layout) => {
  if (!Array.isArray(layout)) return;
  layout.forEach(({ id, x, y, width, height }) => {
    const entry = panes.get(id);
    if (!entry) return;
    entry.bounds = { x, y, width, height };
    if (entry.visible) entry.view.setBounds(entry.bounds);
  });
});

ipcMain.handle('load-config', () => {
  return loadConfig(getConfigPath(app));
});

ipcMain.handle('save-config', (event, config) => {
  return saveConfig(getConfigPath(app), config, logger);
});

ipcMain.handle('clear-pane-data', (event, id) => {
  return clearPaneDataView({ panes, id, logger });
});

ipcMain.handle('export-config', async () => {
  try {
    const raw = fs.readFileSync(getConfigPath(app), 'utf-8');
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar configuração (backup)',
      defaultPath: 'multiconta-config.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled || !filePath) return { ok: false, reason: 'canceled' };
    fs.writeFileSync(filePath, raw, 'utf-8');
    return { ok: true, path: filePath };
  } catch (e) {
    logger.error('io', 'Falha ao exportar configuracao', { error: e.message });
    return { ok: false, reason: 'error' };
  }
});

ipcMain.handle('import-config', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Importar configuração (backup)',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled || !filePaths || !filePaths[0]) return null;
    const config = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    if (!config || !Array.isArray(config.panes) || config.panes.length === 0) return null;
    return config;
  } catch (e) {
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
  if (process.platform !== 'darwin') app.quit();
});
