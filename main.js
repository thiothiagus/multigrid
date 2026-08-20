"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger = __importStar(require("./logger"));
const win_state_1 = require("./src/win-state");
const config_1 = require("./src/config");
const retry_1 = require("./src/retry");
const pane_manager_1 = require("./src/pane-manager");
let win = null;
const panes = new Map();
function sendStatus(id, status, extra) {
    if (win && !win.isDestroyed()) {
        win.webContents.send('pane-status', { id, status, extra });
    }
}
function createWindow() {
    const winStatePath = (0, win_state_1.getWinStatePath)(electron_1.app.getPath('userData'));
    const winState = (0, win_state_1.loadWinState)(winStatePath, logger);
    const bounds = (0, win_state_1.ensureVisibleBounds)({
        x: typeof winState.x === 'number' ? winState.x : undefined,
        y: typeof winState.y === 'number' ? winState.y : undefined,
        width: winState.width,
        height: winState.height,
    }, electron_1.screen);
    const winOpts = {
        width: bounds.width,
        height: bounds.height,
        title: 'Multi-Conta Grid',
        icon: path_1.default.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    };
    if (typeof bounds.x === 'number') {
        winOpts.x = bounds.x;
        winOpts.y = bounds.y;
    }
    win = new electron_1.BrowserWindow(winOpts);
    win.on('resize', () => {
        if (win)
            (0, win_state_1.scheduleSaveWinState)(win, winStatePath, logger);
    });
    win.on('move', () => {
        if (win)
            (0, win_state_1.scheduleSaveWinState)(win, winStatePath, logger);
    });
    win.on('close', () => {
        if (win)
            (0, win_state_1.saveWinState)(win, winStatePath, logger);
    });
    win.loadFile('index.html');
}
electron_1.ipcMain.handle('create-pane', (event, { id, partition, url }) => {
    if (!win)
        return false;
    return (0, pane_manager_1.createPaneView)({
        win,
        panes,
        id,
        partition,
        url,
        logger,
        sendStatus,
        scheduleRetry: (paneId, fromCrash) => (0, retry_1.scheduleRetry)({ panes, id: paneId, fromCrash, logger, sendStatus, showPaneView: pane_manager_1.showPaneView }),
    });
});
electron_1.ipcMain.handle('remove-pane', (event, id) => {
    if (!win)
        return false;
    return (0, pane_manager_1.removePaneView)({ win, panes, id, logger });
});
electron_1.ipcMain.handle('reload-pane', (event, id) => {
    return (0, pane_manager_1.reloadPaneView)({ panes, id, logger });
});
electron_1.ipcMain.handle('back-pane', (event, id) => {
    return (0, pane_manager_1.backPaneView)({ panes, id });
});
electron_1.ipcMain.on('sync-layout', (_event, layout) => {
    if (!Array.isArray(layout))
        return;
    const layoutMap = new Map(layout.map(item => [item.id, item]));
    panes.forEach((entry, id) => {
        const item = layoutMap.get(id);
        if (item) {
            entry.bounds = { x: item.x, y: item.y, width: item.width, height: item.height };
            if (entry.visible)
                entry.view.setBounds(entry.bounds);
        }
        else {
            entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        }
    });
});
electron_1.ipcMain.handle('load-config', () => {
    return (0, config_1.loadConfig)((0, config_1.getConfigPath)(electron_1.app.getPath('userData')));
});
electron_1.ipcMain.handle('save-config', (_event, config) => {
    return (0, config_1.saveConfig)((0, config_1.getConfigPath)(electron_1.app.getPath('userData')), config, logger);
});
electron_1.ipcMain.handle('clear-pane-data', (event, id) => {
    return (0, pane_manager_1.clearPaneDataView)({ panes, id });
});
electron_1.ipcMain.handle('export-config', async () => {
    try {
        const raw = fs_1.default.readFileSync((0, config_1.getConfigPath)(electron_1.app.getPath('userData')), 'utf-8');
        if (!win)
            return { ok: false, reason: 'no-window' };
        const { canceled, filePath } = await electron_1.dialog.showSaveDialog(win, {
            title: 'Exportar configuração (backup)',
            defaultPath: 'multiconta-config.json',
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (canceled || !filePath)
            return { ok: false, reason: 'canceled' };
        fs_1.default.writeFileSync(filePath, raw, 'utf-8');
        return { ok: true, path: filePath };
    }
    catch (e) {
        const err = e;
        logger.error('io', 'Falha ao exportar configuracao', { error: err.message });
        return { ok: false, reason: 'error' };
    }
});
electron_1.ipcMain.handle('import-config', async () => {
    try {
        if (!win)
            return null;
        const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(win, {
            title: 'Importar configuração (backup)',
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (canceled || !filePaths || !filePaths[0])
            return null;
        const config = JSON.parse(fs_1.default.readFileSync(filePaths[0], 'utf-8'));
        if (!config || !Array.isArray(config.panes) || config.panes.length === 0)
            return null;
        return config;
    }
    catch {
        return null;
    }
});
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
