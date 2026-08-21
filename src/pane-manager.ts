import { BrowserView } from 'electron';
import { Logger, PaneEntry } from './types';
import { scheduleRetry } from './retry';

export interface PaneViewParams {
  win: import('electron').BrowserWindow | null;
  panes: Map<number, PaneEntry>;
  id: number;
  partition: string;
  url: string;
  logger: Logger;
  sendStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
}

function hidePaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = false;
  entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
}

function showPaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = true;
  if (entry.bounds) entry.view.setBounds(entry.bounds);
}

function createPaneView({
  win,
  panes,
  id,
  partition,
  url,
  logger,
  sendStatus,
}: PaneViewParams): boolean {
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
      if (logger) logger.info('popup', 'Pop-up Pokepedia permitido', { paneId: id, popupUrl });
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 800,
          height: 600,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    if (logger) logger.info('popup', 'Pop-up externo permitido', { paneId: id, popupUrl });
    return { action: 'allow' };
  });

  view.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3 || errorCode === -105 || errorCode === -104 || errorCode === -102) {
      if (logger)
        logger.info('load', 'Falha de rede ao carregar', {
          paneId: id,
          url: validatedURL,
          error: errorDescription,
        });
      sendStatus(id, 'error', { reason: errorDescription });
      scheduleRetry({ panes, id, fromCrash: true, logger, sendStatus });
    }
  });

  view.webContents.on('render-process-gone', (_, details) => {
    if (logger) logger.warn('crash', 'Render process gone', { paneId: id, reason: details.reason });
    sendStatus(id, 'crashed', { reason: details.reason });
    scheduleRetry({ panes, id, fromCrash: true, logger, sendStatus });
  });
  view.webContents.on('unresponsive', () => {
    if (logger) logger.warn('unresponsive', 'Painel sem resposta', { paneId: id });
    sendStatus(id, 'error', { reason: 'unresponsive' });
  });

  view.webContents.on('responsive', () => {
    if (logger) logger.info('responsive', 'Painel recuperou resposta', { paneId: id });
    sendStatus(id, 'ok');
  });

  view.webContents.on('did-finish-load', () => {
    sendStatus(id, 'ok');
  });

  const entry: PaneEntry = { view, visible: true, retryCount: 0 };
  panes.set(id, entry);
  return true;
}

function removePaneView({
  win,
  panes,
  id,
  _logger,
}: {
  win: import('electron').BrowserWindow;
  panes: Map<number, PaneEntry>;
  id: number;
  _logger?: Logger;
}): boolean {
  const entry = panes.get(id);
  if (!entry) return false;
  win.removeBrowserView(entry.view);
  panes.delete(id);
  return true;
}

function reloadPaneView({
  panes,
  id,
  _logger,
}: {
  panes: Map<number, PaneEntry>;
  id: number;
  _logger?: Logger;
}): boolean {
  const entry = panes.get(id);
  if (!entry) return false;
  entry.view.webContents.reload();
  return true;
}

function backPaneView({ panes, id }: { panes: Map<number, PaneEntry>; id: number }): boolean {
  const entry = panes.get(id);
  if (!entry) return false;
  if (entry.view.webContents.canGoBack()) {
    entry.view.webContents.goBack();
  }
  return true;
}

async function clearPaneDataView({
  panes,
  id,
  _logger,
}: {
  panes: Map<number, PaneEntry>;
  id: number;
  _logger?: Logger;
}): Promise<boolean> {
  const entry = panes.get(id);
  if (!entry) return false;
  await entry.view.webContents.session.clearStorageData();
  return true;
}

export {
  hidePaneView,
  showPaneView,
  createPaneView,
  removePaneView,
  reloadPaneView,
  backPaneView,
  clearPaneDataView,
};
