import { WebContentsView } from 'electron';

export interface Pane {
  id: number;
  label: string;
  partition: string;
  url: string;
}

export interface Config {
  gameUrlDefault?: string;
  nextId: number;
  cols: number;
  rows: number;
  colFr: number[];
  rowFr: number[];
  panes: Pane[];
}

export interface WinState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

export interface LayoutItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaneStatusPayload {
  id: number;
  status: string;
  extra?: { seconds?: number; [key: string]: unknown };
}

export interface Logger {
  init?: (userDataPath: string, isPackaged?: boolean) => void;
  error: (category: string, message: string, extra?: Record<string, unknown>) => void;
  warn: (category: string, message: string, extra?: Record<string, unknown>) => void;
  info: (category: string, message: string, extra?: Record<string, unknown>) => void;
  getLogPath?: () => string | null;
}

export interface PaneEntry {
  view: WebContentsView;
  visible: boolean;
  bounds?: { x: number; y: number; width: number; height: number };
  retryTimer?: NodeJS.Timeout | null;
  retryCount?: number;
}

export interface WindowApi {
  loadConfig: () => Promise<Config | null>;
  saveConfig: (config: Config) => Promise<boolean>;
  createPane: (pane: Pane) => Promise<boolean>;
  removePane: (id: number) => Promise<boolean>;
  reloadPane: (id: number) => Promise<boolean>;
  backPane: (id: number) => Promise<boolean>;
  clearPaneData: (id: number) => Promise<boolean>;
  exportConfig: () => Promise<{ ok: boolean; path?: string } | null>;
  importConfig: () => Promise<Config | null>;
  syncLayout: (layout: LayoutItem[]) => void;
  onPaneStatus: (callback: (data: PaneStatusPayload) => void) => void;
}

declare global {
  interface Window {
    api: WindowApi;
  }
}
