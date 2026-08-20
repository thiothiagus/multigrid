// pane-manager.ts - Módulo de gestão de panes (Main process only)
import { BrowserView, BrowserWindow } from 'electron';
import { PaneEntry, Logger } from './types';

export function hidePaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = false;
  entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
}

export function showPaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = true;
  if (entry.bounds) entry.view.setBounds(entry.bounds);
}

export function createPaneView(options: {
  win: BrowserWindow;
  panes: Map<number, PaneEntry>;
  id: number;
  partition: string;
  url: string;
  logger: Logger;
  sendStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  scheduleRetry: (id: number, fromCrash: boolean) => void;
}): boolean {
  const { win, panes, id, partition, url, logger, sendStatus, scheduleRetry } = options;
  if (!win || panes.has(id)) return false;

  const view = new BrowserView({
    webPreferences: {
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.addBrowserView(view);
  view.webContents.loadURL(url);

  view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    if (!popupUrl || !/^https?:/i.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up bloqueado (URL invalida)', { paneId: id, popupUrl });
      return { action: 'deny' };
    }
    const authDomains =
      /accounts\.google\.com|discord\.com\/oauth2|facebook\.com\/dialog|github\.com\/login/i;
    if (authDomains.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up OAuth permitido', { paneId: id, popupUrl });
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    const pokepediaDomain = /poke\.idleworld\.online/i;
    if (pokepediaDomain.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up Poképedia permitido', { paneId: id, popupUrl });
      return { action: 'allow' };
    }
    // By default allow popups
    return { action: 'allow' };
  });

  view.webContents.on('did-fail-load', () => {
    // Handle failed load? The original didn't have this, but we can keep as is.
  });

  view.webContents.on('did-frame-finish-load', () => {
    // Optional
  });

  panes.set(id, { view, visible: true, bounds: undefined, retryTimer: null, retryCount: 0 });
  return true;
}

export function removePaneView(options: {
  win: BrowserWindow;
  panes: Map<number, PaneEntry>;
  id: number;
  logger: Logger;
}): void {
  const { win, panes, id, logger } = options;
  const entry = panes.get(id);
  if (entry) {
    if (entry.view && !win.isDestroyed()) {
      win.removeBrowserView(entry.view);
    }
    panes.delete(id);
  }
}

export function reloadPaneView(options: {
  panes: Map<number, PaneEntry>;
  id: number;
  logger: Logger;
}): void {
  const { panes, id, logger } = options;
  const entry = panes.get(id);
  if (entry && entry.view) {
    entry.view.webContents.reload();
  }
}

export function backPaneView(options: { panes: Map<number, PaneEntry>; id: number }): void {
  const { panes, id } = options;
  const entry = panes.get(id);
  if (entry && entry.view) {
    entry.view.webContents.goBack();
  }
}

export function clearPaneDataView(options: { panes: Map<number, PaneEntry>; id: number }): void {
  const { panes, id } = options;
  const entry = panes.get(id);
  if (entry && entry.view) {
    entry.view.webContents.session.clearCache();
    entry.view.webContents.session.clearStorageData();
  }
}
