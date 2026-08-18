"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRetry = scheduleRetry;
exports.cancelRetry = cancelRetry;
function scheduleRetry({ panes, id, fromCrash, logger, sendStatus, showPaneView }) {
    const entry = panes.get(id);
    if (!entry || entry.retryTimer)
        return;
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
        if (!e2)
            return;
        e2.retryTimer = null;
        if (fromCrash && showPaneView)
            showPaneView(e2);
        try {
            e2.view.webContents.reload();
        }
        catch (err) {
            if (logger)
                logger.error('pane', 'Falha ao recarregar painel no retry', { paneId: id, error: err.message });
        }
    }, delay);
}
function cancelRetry(entry) {
    if (entry && entry.retryTimer) {
        clearTimeout(entry.retryTimer);
        entry.retryTimer = null;
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scheduleRetry,
        cancelRetry
    };
}
