const { contextBridge, ipcRenderer } = require('electron');

// Com sandbox:true e contextIsolation:true, a pagina (index.html) nao tem
// acesso a nada do Node/sistema de arquivos diretamente. Esse preload expoe
// so o que a interface realmente precisa: salvar/carregar configuracao e
// controlar o ciclo de vida das contas (BrowserViews) no processo principal.
contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  createPane: (pane) => ipcRenderer.invoke('create-pane', pane),
  removePane: (id) => ipcRenderer.invoke('remove-pane', id),
  reloadPane: (id) => ipcRenderer.invoke('reload-pane', id),
  backPane: (id) => ipcRenderer.invoke('back-pane', id),
  clearPaneData: (id) => ipcRenderer.invoke('clear-pane-data', id),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  syncLayout: (layout) => ipcRenderer.send('sync-layout', layout),

  onPaneStatus: (callback) => {
    ipcRenderer.on('pane-status', (event, data) => callback(data));
  }
});
