"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    loadConfig: () => electron_1.ipcRenderer.invoke('load-config'),
    saveConfig: (config) => electron_1.ipcRenderer.invoke('save-config', config),
    createPane: (pane) => electron_1.ipcRenderer.invoke('create-pane', pane),
    removePane: (id) => electron_1.ipcRenderer.invoke('remove-pane', id),
    reloadPane: (id) => electron_1.ipcRenderer.invoke('reload-pane', id),
    backPane: (id) => electron_1.ipcRenderer.invoke('back-pane', id),
    clearPaneData: (id) => electron_1.ipcRenderer.invoke('clear-pane-data', id),
    exportConfig: () => electron_1.ipcRenderer.invoke('export-config'),
    importConfig: () => electron_1.ipcRenderer.invoke('import-config'),
    syncLayout: (layout) => electron_1.ipcRenderer.send('sync-layout', layout),
    onPaneStatus: (callback) => {
        electron_1.ipcRenderer.on('pane-status', (_event, data) => callback(data));
    }
});
