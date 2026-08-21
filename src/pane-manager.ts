import { BrowserView } from 'electron';
import { Logger, PaneEntry } from './types';

export interface PaneViewParams {
  win: import('electron').BrowserWindow | null;
  panes: Map<number, PaneEntry>;
  id: number;
  partition: string;
  url: string;
  logger: Logger;
  sendStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
}

export function removePaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = false;
  entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  entry.view.webContents.close();
}

export function reloadPaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.view.webContents.reload();
}

export function backPaneView(entry: PaneEntry): void {
  if (!entry) return;
  if (entry.view.webContents.canGoBack()) {
    entry.view.webContents.goBack();
  }
}

export function clearPaneDataView(entry: PaneEntry): void {
  if (!entry) return;
  entry.view.webContents.session.clearStorageData();
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
    const pokepediaDomain = /pokeapi\.co|bulbapedia\.bob\.ee|serebii\.net|pokemondb\.net/i;
    if (pokepediaDomain.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up Poképédia permitido', { paneId: id, popupUrl });
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1000,
          height: 800,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    if (logger) logger.info('popup', 'Pop-up bloqueado', { paneId: id, popupUrl });
    return { action: 'deny' };
  });

  view.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    if (logger)
      logger.error('load', `Falha ao carregar: ${errorDescription}`, {
        paneId: id,
        url: validatedURL,
        errorCode,
      });
    sendStatus(id, 'error', { errorCode, errorDescription, validatedURL });
  });

  view.webContents.on('did-finish-load', () => {
    sendStatus(id, 'loaded');
  });

  view.webContents.on('page-title-updated', (_, title) => {
    sendStatus(id, 'title', { title });
  });

  panes.set(id, {
    view,
    visible: true,
    bounds: undefined,
    retryCount: 0,
  });
  return true;
}

export { createPaneView, showPaneView };
