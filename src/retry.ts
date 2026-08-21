import type { Logger, PaneEntry } from './types';

export interface ScheduleRetryOpts {
  panes: Map<number, PaneEntry>;
  id: number;
  fromCrash: boolean;
  logger?: Logger;
  sendStatus: (id: number, status: string, extra?: { seconds?: number }) => void;
  showPaneView?: (entry: PaneEntry) => void;
}

export function scheduleRetry({
  panes,
  id,
  fromCrash,
  logger,
  sendStatus,
  showPaneView,
}: ScheduleRetryOpts): void {
  const entry = panes.get(id);
  if (!entry || entry.retryTimer) return;
  entry.retryCount = (entry.retryCount || 0) + 1;
  if (entry.retryCount > 6) {
    if (logger)
      logger.error('pane', 'Retry exaurido, painel desistiu de reconectar', { paneId: id });
    sendStatus(id, 'error-final');
    return;
  }
  const delay = Math.min(2000 * entry.retryCount, 15000);
  sendStatus(id, fromCrash ? 'crashed' : 'retrying', { seconds: Math.round(delay / 1000) });
  entry.retryTimer = setTimeout(() => {
    const e2 = panes.get(id);
    if (!e2) return;
    e2.retryTimer = null;
    if (fromCrash && showPaneView) showPaneView(e2);
    try {
      e2.view.webContents.reload();
    } catch (err: unknown) {
      const e = err as Error;
      if (logger)
        logger.error('pane', 'Falha ao recarregar painel no retry', {
          paneId: id,
          error: e.message,
        });
    }
  }, delay);
}

export function cancelRetry(entry?: PaneEntry | null): void {
  if (entry && entry.retryTimer) {
    clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scheduleRetry,
    cancelRetry,
  };
}
