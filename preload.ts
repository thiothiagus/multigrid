import { contextBridge, ipcRenderer } from 'electron';
import type { Config, Pane, LayoutItem, PaneStatusPayload, UpdateStatusPayload } from './src/types';

contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config: Config) => ipcRenderer.invoke('save-config', config),

  createPane: (pane: Pane) => ipcRenderer.invoke('create-pane', pane),
  removePane: (id: number) => ipcRenderer.invoke('remove-pane', id),
  reloadPane: (id: number) => ipcRenderer.invoke('reload-pane', id),
  backPane: (id: number) => ipcRenderer.invoke('back-pane', id),
  clearPaneData: (id: number) => ipcRenderer.invoke('clear-pane-data', id),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  syncLayout: (layout: LayoutItem[]) => ipcRenderer.send('sync-layout', layout),

  onPaneStatus: (callback: (data: PaneStatusPayload) => void) => {
    ipcRenderer.on('pane-status', (_event, data) => callback(data));
  },

  checkUpdates: () => ipcRenderer.invoke('updates-check'),
  downloadUpdate: () => ipcRenderer.invoke('updates-download'),
  installUpdate: () => ipcRenderer.invoke('updates-install'),
  onUpdateStatus: (callback: (data: UpdateStatusPayload) => void) => {
    ipcRenderer.on('update-status', (_event, data) => callback(data));
  },
});
