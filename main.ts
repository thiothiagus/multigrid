import { app, BrowserWindow, ipcMain, dialog, screen, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import * as logger from './logger';
import {
  getWinStatePath,
  loadWinState,
  ensureVisibleBounds,
  saveWinState,
  scheduleSaveWinState,
} from './src/win-state';
import { getConfigPath, loadConfig, saveConfig, migrateLegacyConfig } from './src/config';
import {
  createPaneView,
  removePaneEntry,
  reloadPaneView,
  backPaneView,
  clearPaneDataView,
  scheduleRetry,
  showPaneView,
  clearAllPanes,
  importClearanceToPane,
} from './src/pane-manager';
import type { PaneEntry } from './src/types';
import { initUpdater, checkForUpdates, downloadUpdate, installUpdate } from './src/updater';

let win: BrowserWindow | null = null;
const panes = new Map<number, PaneEntry>();

function sendStatus(id: number, status: string, extra?: Record<string, unknown>): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pane-status', { id, status, extra });
  }
}

function createWindow(): void {
  const winStatePath = getWinStatePath(app.getPath('userData'));
  const winState = loadWinState(winStatePath, logger);
  const bounds = ensureVisibleBounds(
    {
      x: typeof winState.x === 'number' ? winState.x : undefined,
      y: typeof winState.y === 'number' ? winState.y : undefined,
      width: winState.width,
      height: winState.height,
    },
    screen
  );

  const winOpts: Partial<import('electron').BrowserWindowConstructorOptions> = {
    width: bounds.width,
    height: bounds.height,
    title: 'MultiGrid',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
  if (typeof bounds.x === 'number') {
    winOpts.x = bounds.x;
    winOpts.y = bounds.y;
  }
  win = new BrowserWindow(winOpts);

  win.on('resize', () => {
    if (win) scheduleSaveWinState(win, winStatePath, logger);
  });
  win.on('move', () => {
    if (win) scheduleSaveWinState(win, winStatePath, logger);
  });
  win.on('close', () => {
    if (win) saveWinState(win, winStatePath, logger);
  });

  if (winState.isMaximized) win.maximize();

  win.loadFile('index.html');
}

ipcMain.handle('create-pane', (event, { id, partition, url }) => {
  if (!win) return false;
  return createPaneView({
    win,
    panes,
    id,
    partition,
    url,
    logger,
    sendStatus,
    onLoadError: (paneId, fromCrash) => {
      const entry = panes.get(paneId);
      if (entry) {
        scheduleRetry({
          panes,
          id: paneId,
          fromCrash,
          logger,
          sendStatus,
          showPaneView,
        });
      }
    },
  });
});

ipcMain.handle('remove-pane', (event, id: number) => {
  const entry = panes.get(id);
  if (entry) removePaneEntry(panes, id);
  return !!entry;
});

ipcMain.handle('reload-pane', (event, id: number) => {
  const entry = panes.get(id);
  if (entry) reloadPaneView(entry);
  return !!entry;
});

ipcMain.handle('back-pane', (event, id: number) => {
  const entry = panes.get(id);
  if (entry) backPaneView(entry);
  return !!entry;
});

ipcMain.on(
  'sync-layout',
  (_event, layout: Array<{ id: number; x: number; y: number; width: number; height: number }>) => {
    if (!Array.isArray(layout)) return;
    const layoutMap = new Map(layout.map(item => [item.id, item]));
    panes.forEach((entry, id) => {
      const item = layoutMap.get(id);
      if (item) {
        entry.bounds = { x: item.x, y: item.y, width: item.width, height: item.height };
        if (entry.visible) entry.view.setBounds(entry.bounds);
      } else {
        entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    });
  }
);

ipcMain.handle('load-config', () => {
  return loadConfig(getConfigPath(app.getPath('userData')));
});

ipcMain.handle('save-config', (_event, config: Parameters<typeof saveConfig>[1]) => {
  return saveConfig(getConfigPath(app.getPath('userData')), config, logger);
});

ipcMain.handle('clear-pane-data', (event, id: number) => {
  const entry = panes.get(id);
  if (entry) clearPaneDataView(entry);
  return !!entry;
});

// Fluxo "login pelo navegador": abre a URL do jogo no navegador padrão
// (onde o challenge da Cloudflare passa) para o usuário resolver lá.
ipcMain.handle('open-external-login', (_event, { id, url }: { id: number; url: string }) => {
  const entry = panes.get(id);
  if (!entry) return false;
  const target =
    typeof url === 'string' && /^https?:/i.test(url) ? url : entry.view.webContents.getURL();
  if (!/^https?:/i.test(target)) return false;
  void shell.openExternal(target);
  if (logger) logger.info('auth', 'Login externo aberto no navegador', { paneId: id, url: target });
  return true;
});

// Importa o `cf_clearance` resolvido no navegador para a sessão do painel.
ipcMain.handle(
  'import-clearance',
  async (_event, { id, url, value }: { id: number; url: string; value: string }) => {
    const entry = panes.get(id);
    const result = await importClearanceToPane(entry, url, value);
    if (logger) {
      if (result.ok) logger.info('auth', 'cf_clearance importado', { paneId: id });
      else
        logger.error('auth', 'Falha ao importar cf_clearance', {
          paneId: id,
          reason: result.reason,
        });
    }
    return result;
  }
);

ipcMain.handle('export-config', async () => {
  try {
    const raw = fs.readFileSync(getConfigPath(app.getPath('userData')), 'utf-8');
    if (!win) return { ok: false, reason: 'no-window' };
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar configuração (backup)',
      defaultPath: 'multigrid-config.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { ok: false, reason: 'canceled' };
    fs.writeFileSync(filePath, raw, 'utf-8');
    return { ok: true, path: filePath };
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('io', 'Falha ao exportar configuracao', { error: err.message });
    return { ok: false, reason: 'error' };
  }
});

ipcMain.handle('import-config', async () => {
  try {
    if (!win) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Importar configuração (backup)',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePaths || !filePaths[0]) return null;
    const config = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
    if (!config || !Array.isArray(config.panes) || config.panes.length === 0) return null;
    return config;
  } catch {
    return null;
  }
});

app.whenReady().then(() => {
  logger.init(app.getPath('userData'), app.isPackaged);
  migrateLegacyConfig(app.getPath('userData'), logger);
  createWindow();
  initUpdater({ getWin: () => win, logger });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('updates-check', () => checkForUpdates(logger));
ipcMain.handle('updates-download', () => downloadUpdate(logger));
ipcMain.handle('updates-install', () => installUpdate(logger));

ipcMain.handle('app-version', () => app.getVersion());

ipcMain.on('renderer-error', (_event, data: unknown) => {
  try {
    const d = data as Record<string, unknown>;
    const message =
      typeof d?.message === 'string' ? String(d.message).slice(0, 2000) : 'renderer error';
    const stack = typeof d?.stack === 'string' ? String(d.stack).slice(0, 4000) : undefined;
    const source = typeof d?.source === 'string' ? String(d.source).slice(0, 500) : undefined;
    const reason = typeof d?.reason === 'string' ? String(d.reason).slice(0, 2000) : undefined;
    const url = typeof d?.url === 'string' ? String(d.url).slice(0, 500) : undefined;
    logger.error('renderer', message, {
      stack,
      source,
      reason,
      url,
      lineno: d?.lineno,
      colno: d?.colno,
    });
  } catch {
    // ignorar payload malformado
  }
});

app.on('before-quit', () => {
  clearAllPanes(panes);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
