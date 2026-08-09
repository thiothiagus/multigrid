const { app, BrowserWindow, BrowserView, ipcMain, Menu, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = () => path.join(app.getPath('userData'), 'multiconta-config.json');
const WIN_STATE_PATH = () => path.join(app.getPath('userData'), 'window-state.json');

let win = null;
// id -> { view, bounds, visible, retryTimer, retryCount }
const panes = new Map();

// --- Estado da janela (posicao/tamanho/maximizada, restaurado no boot) ---

let winState = { width: 1500, height: 950, isMaximized: false };
let winStateTimer = null;

function loadWinState() {
  try {
    const saved = JSON.parse(fs.readFileSync(WIN_STATE_PATH(), 'utf-8'));
    if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
      winState = { ...winState, ...saved };
    }
  } catch (e) { /* primeira execucao ou arquivo corrompido: usa o padrao */ }
}

// Se a posicao salva caiu fora de todos os monitores (ex.: mudou o setup),
// recoloca a janela no centro do display primario em vez de abrir invisivel.
function ensureVisibleBounds(bounds) {
  const insideSomeDisplay = screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return bounds.x >= a.x - 50 && bounds.y >= a.y - 50 &&
           bounds.x < a.x + a.width && bounds.y < a.y + a.height;
  });
  if (insideSomeDisplay) return bounds;
  const primary = screen.getPrimaryDisplay().workArea;
  const width = Math.min(bounds.width, primary.width);
  const height = Math.min(bounds.height, primary.height);
  return {
    x: Math.round(primary.x + (primary.width - width) / 2),
    y: Math.round(primary.y + (primary.height - height) / 2),
    width,
    height
  };
}

function saveWinState() {
  if (!win) return;
  winState = { ...win.getBounds(), isMaximized: win.isMaximized() };
  try {
    fs.writeFileSync(WIN_STATE_PATH(), JSON.stringify(winState, null, 2), 'utf-8');
  } catch (e) { /* nao critico: janela em si ja voltou a abrir */ }
}

function scheduleSaveWinState() {
  clearTimeout(winStateTimer);
  winStateTimer = setTimeout(saveWinState, 500);
}

function createWindow() {
  loadWinState();
  const bounds = ensureVisibleBounds({
    x: typeof winState.x === 'number' ? winState.x : undefined,
    y: typeof winState.y === 'number' ? winState.y : undefined,
    width: winState.width,
    height: winState.height
  });
  const winOpts = {
    width: bounds.width,
    height: bounds.height,
    title: 'Multi-Conta Grid',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // A pagina host (index.html) roda isolada e sandboxed, sem acesso a
      // Node/sistema de arquivos. So o preload.js, via contextBridge, expoe
      // o minimo necessario (IPC para criar/mover/recarregar cada conta).
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  };
  if (typeof bounds.x === 'number') { winOpts.x = bounds.x; winOpts.y = bounds.y; }
  win = new BrowserWindow(winOpts);

  win.on('resize', scheduleSaveWinState);
  win.on('move', scheduleSaveWinState);
  win.on('close', saveWinState);

  if (winState.isMaximized) win.maximize();

  win.loadFile('index.html');

  // Descomente para depurar:
  // win.webContents.openDevTools();
}

function sendStatus(id, status, extra) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pane-status', { id, status, extra });
  }
}

function hidePaneView(entry) {
  entry.visible = false;
  entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
}

function showPaneView(entry) {
  entry.visible = true;
  if (entry.bounds) entry.view.setBounds(entry.bounds);
}

function scheduleRetry(id, fromCrash) {
  const entry = panes.get(id);
  if (!entry || entry.retryTimer) return;
  entry.retryCount = (entry.retryCount || 0) + 1;
  if (entry.retryCount > 6) {
    sendStatus(id, 'error-final');
    return;
  }
  const delay = Math.min(2000 * entry.retryCount, 15000);
  sendStatus(id, fromCrash ? 'crashed' : 'retrying', { seconds: Math.round(delay / 1000) });
  entry.retryTimer = setTimeout(() => {
    const e2 = panes.get(id);
    if (!e2) return;
    e2.retryTimer = null;
    if (fromCrash) showPaneView(e2);
    try { e2.view.webContents.reload(); } catch (err) { /* view pode ja ter sido removida */ }
  }, delay);
}

// --- Ciclo de vida de cada conta (BrowserView nativo, nao <webview>) ---

ipcMain.handle('create-pane', (event, { id, partition, url }) => {
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

  // Pop-ups: permite que janelas de autenticacao (Google, Discord, etc.) abram
  // em janela nativa separada (o fluxo OAuth precisa dela para funcionar), mas
  // bloqueia outros pop-ups (anuncios, etc.) carregando-os no proprio painel.
  view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    if (!popupUrl || !/^https?:/i.test(popupUrl)) {
      return { action: 'deny' };
    }
    // Lista de domínios de autenticacao conhecidos (OAuth providers)
    const authDomains = /accounts\.google\.com|discord\.com\/oauth2|facebook\.com\/dialog|github\.com\/login/i;
    if (authDomains.test(popupUrl)) {
      // Permite janela nativa para OAuth (mesma partition, sem barra de navegacao)
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true }
        }
      };
    }
    // Outros pop-ups: carrega no proprio painel (bloqueia janela extra)
    view.webContents.loadURL(popupUrl);
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
    if (errorCode === -3) return; // ERR_ABORTED (navegacao cancelada, ignora)
    sendStatus(id, 'error');
    scheduleRetry(id, false);
  });
  view.webContents.on('render-process-gone', (e, details) => {
    hidePaneView(entry);
    sendStatus(id, 'crashed', { reason: details && details.reason });
    scheduleRetry(id, true);
  });

  return true;
});

ipcMain.handle('remove-pane', (event, id) => {
  const entry = panes.get(id);
  if (!entry) return false;
  if (entry.retryTimer) clearTimeout(entry.retryTimer);
  try { win.removeBrowserView(entry.view); } catch (err) { /* ignore */ }
  panes.delete(id);
  return true;
});

ipcMain.handle('reload-pane', (event, id) => {
  const entry = panes.get(id);
  if (!entry) return false;
  entry.retryCount = 0;
  if (entry.retryTimer) { clearTimeout(entry.retryTimer); entry.retryTimer = null; }
  showPaneView(entry);
  try { entry.view.webContents.reload(); } catch (err) { /* ignore */ }
  return true;
});

ipcMain.handle('back-pane', (event, id) => {
  const entry = panes.get(id);
  if (!entry) return false;
  if (entry.view.webContents.canGoBack()) entry.view.webContents.goBack();
  return true;
});

// A interface (renderer) manda a posicao/tamanho de cada painel em pixels,
// calculada a partir do layout real da pagina (getBoundingClientRect).
// O processo principal so aplica esses numeros diretamente via setBounds -
// e por isso o conteudo sempre preenche o espaco certo, sem depender do
// <webview> repassar o resize pra dentro da pagina carregada.
ipcMain.on('sync-layout', (event, layout) => {
  if (!Array.isArray(layout)) return;
  layout.forEach(({ id, x, y, width, height }) => {
    const entry = panes.get(id);
    if (!entry) return;
    entry.bounds = { x, y, width, height };
    if (entry.visible) entry.view.setBounds(entry.bounds);
  });
});

// --- Persistencia da configuracao (numero de contas, rotulos, tamanhos) ---

ipcMain.handle('load-config', () => {
  try {
    const raw = fs.readFileSync(CONFIG_PATH(), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null; // primeira execucao ou arquivo corrompido -> mostra o setup
  }
});

ipcMain.handle('save-config', (event, config) => {
  try {
    fs.writeFileSync(CONFIG_PATH(), JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Falha ao salvar configuracao:', e);
    return false;
  }
});

// --- Gestao das contas: limpar dados, backup/restauracao ---

ipcMain.handle('clear-pane-data', async (event, id) => {
  const entry = panes.get(id);
  if (!entry) return false;
  try {
    // Limpa cookies/armazenamento da partition da conta (recupera login
    // travado, etc.) e recarrega o painel do zero.
    await entry.view.webContents.session.clearStorageData();
    if (entry.retryTimer) { clearTimeout(entry.retryTimer); entry.retryTimer = null; }
    entry.retryCount = 0;
    showPaneView(entry);
    entry.view.webContents.reload();
    return true;
  } catch (e) {
    console.error('Falha ao limpar dados da conta', id, e);
    return false;
  }
});

ipcMain.handle('export-config', async () => {
  try {
    const raw = fs.readFileSync(CONFIG_PATH(), 'utf-8');
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar configuração (backup)',
      defaultPath: 'multiconta-config.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled || !filePath) return { ok: false, reason: 'canceled' };
    fs.writeFileSync(filePath, raw, 'utf-8');
    return { ok: true, path: filePath };
  } catch (e) {
    console.error('Falha ao exportar configuração:', e);
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
    return null; // arquivo invalido -> o renderer avisa
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
