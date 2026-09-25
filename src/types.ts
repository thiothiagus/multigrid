import { BrowserView } from 'electron';
import type { ThemePreference } from './theme';

// Tipos de update vivem aqui (modulo compartilhado entre main/renderer).
// Se ficassem em src/update-status.ts, o arquivo entraria no programa do
// renderer (via types) e seria reemitido como ESM, sobrescrevendo a saida
// CommonJS usada pelo processo principal.
export type UpdateStatus =
  'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateStatusPayload {
  status: UpdateStatus;
  version?: string;
  progress?: number;
  message?: string;
}

export interface Pane {
  id: number;
  label: string;
  partition: string;
  url: string;
}

export interface LayoutPreset {
  name: string;
  cols: number;
  rows: number;
  colFr: number[];
  rowFr: number[];
}

export interface Config {
  gameUrlDefault?: string;
  /** Perfil de jogo ativo (id de GAME_PROFILES, ex.: 'piw'). Opcional por compat. */
  activeProfile?: string;
  nextId: number;
  cols: number;
  rows: number;
  colFr: number[];
  rowFr: number[];
  panes: Pane[];
  customPresets?: LayoutPreset[];
  theme?: ThemePreference;
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
  view: BrowserView;
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
  openExternalLogin: (id: number, url: string) => Promise<boolean>;
  importClearance: (
    id: number,
    url: string,
    value: string
  ) => Promise<{ ok: boolean; reason?: string }>;
  exportConfig: () => Promise<{ ok: boolean; path?: string } | null>;
  importConfig: () => Promise<Config | null>;
  syncLayout: (layout: LayoutItem[]) => void;
  onPaneStatus: (callback: (data: PaneStatusPayload) => void) => void;

  checkUpdates: () => Promise<boolean>;
  downloadUpdate: () => Promise<boolean>;
  installUpdate: () => Promise<boolean>;
  onUpdateStatus: (callback: (data: UpdateStatusPayload) => void) => void;

  getAppVersion: () => Promise<string>;

  logRendererError: (data: {
    message: string;
    stack?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    reason?: string;
    url?: string;
  }) => void;
}

declare global {
  interface Window {
    api: WindowApi;
  }
}
