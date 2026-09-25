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
  openExternalLogin: (id: number, url: string) =>
    ipcRenderer.invoke('open-external-login', { id, url }),
  importClearance: (id: number, url: string, value: string) =>
    ipcRenderer.invoke('import-clearance', { id, url, value }),
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

  getAppVersion: () => ipcRenderer.invoke('app-version'),

  logRendererError: (data: {
    message: string;
    stack?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    reason?: string;
    url?: string;
  }) => ipcRenderer.send('renderer-error', data),
});
