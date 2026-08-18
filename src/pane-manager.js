// pane-manager.js - Módulo de gestão de panes (Main & Browser)

if (typeof require !== 'undefined') {
  try {
    const { BrowserView } = require('electron');

    function hidePaneView(entry) {
      if (!entry) return;
      entry.visible = false;
      entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }

    function showPaneView(entry) {
      if (!entry) return;
      entry.visible = true;
      if (entry.bounds) entry.view.setBounds(entry.bounds);
    }

    function createPaneView({ win, panes, id, partition, url, logger, sendStatus, scheduleRetry }) {
      if (!win || panes.has(id)) return false;

      const view = new BrowserView({
        webPreferences: {
          partition,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      });
      win.addBrowserView(view);
      view.webContents.loadURL(url);

      view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
        if (!popupUrl || !/^https?:/i.test(popupUrl)) {
          if (logger) logger.info('popup', 'Pop-up bloqueado (URL invalida)', { paneId: id, popupUrl });
          return { action: 'deny' };
        }
        const authDomains = /accounts\.google\.com|discord\.com\/oauth2|facebook\.com\/dialog|github\.com\/login/i;
        if (authDomains.test(popupUrl)) {
          if (logger) logger.info('popup', 'Pop-up OAuth permitido', { paneId: id, popupUrl });
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 600,
              height: 700,
              webPreferences: { partition, nodeIntegration: false, contextIsolation: true }
            }
          };
        }
        view.webContents.loadURL(popupUrl);
        if (logger) logger.info('popup', 'Pop-up redirecionado para o painel', { paneId: id, popupUrl });
        return { action: 'deny' };
      });

      const entry = { view, bounds: { x: 0, y: 0, width: 0, height: 0 }, visible: true, retryTimer: null, retryCount: 0 };
      panes.set(id, entry);

      view.webContents.on('did-start-loading', () => sendStatus(id, 'loading'));
      view.webContents.on('did-stop-loading', () => {
        entry.retryCount = 0;
        sendStatus(id, 'ok');
      });
      view.webContents.on('did-fail-load', (e, errorCode) => {
        if (errorCode === -3) return;
        if (logger) logger.error('pane', 'Falha ao carregar pagina', { paneId: id, errorCode });
        sendStatus(id, 'error');
        scheduleRetry(id, false);
      });
      view.webContents.on('render-process-gone', (e, details) => {
        if (logger) logger.error('crash', 'Render process do painel crashou', { paneId: id, reason: details && details.reason });
        hidePaneView(entry);
        sendStatus(id, 'crashed', { reason: details && details.reason });
        scheduleRetry(id, true);
      });

      return true;
    }

function removePaneView({ win, panes, id, logger }) {
  const entry = panes.get(id);
  if (!entry) return false;
  if (entry.retryTimer) clearTimeout(entry.retryTimer);
  try {
    win.removeBrowserView(entry.view);
  } catch (err) {
    if (logger) logger.warn('pane', 'Falha ao remover BrowserView', { paneId: id, error: err.message });
  }
  panes.delete(id);
  return true;
}

function reloadPaneView({ panes, id, logger }) {
  const entry = panes.get(id);
  if (!entry) return false;
  entry.retryCount = 0;
  if (entry.retryTimer) {
    clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
  }
  showPaneView(entry);
  try {
    entry.view.webContents.reload();
  } catch (err) {
    if (logger) logger.warn('pane', 'Falha ao recarregar painel', { paneId: id, error: err.message });
  }
  return true;
}

function backPaneView({ panes, id }) {
  const entry = panes.get(id);
  if (!entry) return false;
  if (entry.view.webContents.canGoBack()) entry.view.webContents.goBack();
  return true;
}

async function clearPaneDataView({ panes, id, logger }) {
  const entry = panes.get(id);
  if (!entry) return false;
  try {
    await entry.view.webContents.session.clearStorageData();
    if (entry.retryTimer) {
      clearTimeout(entry.retryTimer);
      entry.retryTimer = null;
    }
    entry.retryCount = 0;
    showPaneView(entry);
    entry.view.webContents.reload();
    if (logger) logger.info('pane', 'Dados da conta limpos', { paneId: id });
    return true;
  } catch (err) {
    if (logger) logger.error('pane', 'Falha ao limpar dados da conta', { paneId: id, error: err.message });
    return false;
  }
}

module.exports = {
  hidePaneView,
  showPaneView,
  createPaneView,
  removePaneView,
  reloadPaneView,
  backPaneView,
  clearPaneDataView
};
  } catch (e) {
    // Browser environment
  }
}

function hideOverlay(overlay) {
  if (overlay) overlay.classList.add('hidden');
}

function showOverlay(overlay, msg) {
  if (!overlay) return;
  const msgEl = overlay.querySelector('.overlay-msg');
  if (msgEl) msgEl.textContent = msg;
  overlay.classList.remove('hidden');
}

function updatePaneStatus(id, status, extra) {
  const paneEl = document.querySelector('.pane[data-id="' + id + '"]');
  if (!paneEl) return;
  const dot = paneEl.querySelector('.status-dot');
  const overlay = paneEl.querySelector('.pane-overlay');
  if (!dot) return;

  switch (status) {
    case 'loading':
      dot.className = 'status-dot loading';
      break;
    case 'ok':
      dot.className = 'status-dot ok';
      hideOverlay(overlay);
      break;
    case 'error':
      dot.className = 'status-dot error';
      break;
    case 'retrying':
      dot.className = 'status-dot error';
      showOverlay(overlay, 'Conexão perdida. Tentando reconectar em ' + (extra && extra.seconds) + 's...');
      break;
    case 'crashed':
      dot.className = 'status-dot error';
      showOverlay(overlay, 'O painel travou (' + ((extra && extra.reason) || 'motivo desconhecido') + '). Reiniciando...');
      break;
    case 'error-final':
      dot.className = 'status-dot error';
      showOverlay(overlay, 'Não foi possível reconectar automaticamente. Verifique sua internet e clique em Tentar novamente.');
      break;
  }
}
