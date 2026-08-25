import { app } from 'electron';
import type { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { Logger, UpdateStatusPayload } from './types';
import { mapUpdaterEventToPayload } from './update-status';

const INITIAL_CHECK_DELAY_MS = 10_000;
const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000;

export interface UpdaterParams {
  getWin: () => BrowserWindow | null;
  logger: Logger;
}

let checkTimer: NodeJS.Timeout | null = null;

function sendUpdateStatus(getWin: () => BrowserWindow | null, payload: UpdateStatusPayload): void {
  const win = getWin();
  if (win && !win.isDestroyed()) {
    win.webContents.send('update-status', payload);
  }
}

// Ativa o auto-update somente no app empacotado: em desenvolvimento o
// electron-updater falha ao resolver app-update.yml e o erro seria ruido.
export function initUpdater({ getWin, logger }: UpdaterParams): void {
  if (!app.isPackaged) {
    logger.info('updater', 'Auto-update desativado fora do app empacotado');
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (payload: UpdateStatusPayload) => sendUpdateStatus(getWin, payload);

  autoUpdater.on('checking-for-update', () => {
    send(mapUpdaterEventToPayload('checking-for-update'));
  });

  autoUpdater.on('update-available', info => {
    logger.info('updater', 'Update disponivel', { version: info.version });
    send(mapUpdaterEventToPayload('update-available', info));
  });

  autoUpdater.on('update-not-available', info => {
    logger.info('updater', 'Nenhum update disponivel', { version: info.version });
    send(mapUpdaterEventToPayload('update-not-available', info));
  });

  autoUpdater.on('download-progress', progress => {
    send(mapUpdaterEventToPayload('download-progress', undefined, { percent: progress.percent }));
  });

  autoUpdater.on('update-downloaded', info => {
    logger.info('updater', 'Update baixado', { version: info.version });
    send(mapUpdaterEventToPayload('update-downloaded', info));
  });

  autoUpdater.on('error', err => {
    logger.error('updater', 'Falha na verificacao/download de update', { error: err.message });
    send(mapUpdaterEventToPayload('error', undefined, { message: err.message }));
  });

  const initialTimer = setTimeout(() => {
    void checkForUpdates(logger);
  }, INITIAL_CHECK_DELAY_MS);
  initialTimer.unref();

  checkTimer = setInterval(() => {
    void checkForUpdates(logger);
  }, CHECK_INTERVAL_MS);
  checkTimer.unref();
}

export async function checkForUpdates(logger: Logger): Promise<boolean> {
  if (!app.isPackaged) return false;
  try {
    await autoUpdater.checkForUpdates();
    return true;
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('updater', 'Falha ao verificar updates', { error: err.message });
    return false;
  }
}

export function downloadUpdate(logger: Logger): boolean {
  if (!app.isPackaged) return false;
  try {
    autoUpdater.downloadUpdate();
    return true;
  } catch (e: unknown) {
    const err = e as Error;
    logger.error('updater', 'Falha ao iniciar download do update', { error: err.message });
    return false;
  }
}

// Instalacao silenciosa com reinicio automatico do app apos concluir.
export function installUpdate(logger?: Logger): boolean {
  if (!app.isPackaged) return false;
  try {
    autoUpdater.quitAndInstall(true, true);
    return true;
  } catch (e: unknown) {
    const err = e as Error;
    if (logger) logger.error('updater', 'Falha ao instalar update', { error: err.message });
    return false;
  }
}

export function stopUpdaterSchedule(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}
