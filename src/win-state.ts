import fs from 'fs';
import path from 'path';
import type { WinState, Logger } from './types';

let winState: WinState = { width: 1500, height: 950, isMaximized: false };
let winStateTimer: NodeJS.Timeout | null = null;

export function getWinStatePath(userDataPath: string): string {
  return path.join(userDataPath, 'window-state.json');
}

export function loadWinState(winStatePath: string, logger?: Logger): WinState {
  try {
    const saved = JSON.parse(fs.readFileSync(winStatePath, 'utf-8'));
    if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
      winState = { ...winState, ...saved };
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code !== 'ENOENT' && logger) {
      logger.warn('io', 'Falha ao carregar window state', { error: err.message });
    }
  }
  return winState;
}

export function ensureVisibleBounds(
  bounds: { x?: number; y?: number; width: number; height: number },
  screen: import('electron').Screen
): { x?: number; y?: number; width: number; height: number } {
  const insideSomeDisplay = screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return (
      typeof bounds.x === 'number' &&
      typeof bounds.y === 'number' &&
      bounds.x >= a.x - 50 &&
      bounds.y >= a.y - 50 &&
      bounds.x < a.x + a.width &&
      bounds.y < a.y + a.height
    );
  });
  if (insideSomeDisplay) return bounds;
  const primary = screen.getPrimaryDisplay().workArea;
  const width = Math.min(bounds.width, primary.width);
  const height = Math.min(bounds.height, primary.height);
  return {
    x: Math.round(primary.x + (primary.width - width) / 2),
    y: Math.round(primary.y + (primary.height - height) / 2),
    width,
    height,
  };
}

export function saveWinState(
  win: import('electron').BrowserWindow | null,
  winStatePath: string,
  logger?: Logger
): void {
  if (!win || win.isDestroyed()) return;
  winState = { ...win.getBounds(), isMaximized: win.isMaximized() };
  try {
    fs.writeFileSync(winStatePath, JSON.stringify(winState, null, 2), 'utf-8');
  } catch (e: unknown) {
    const err = e as Error;
    if (logger) logger.warn('io', 'Falha ao salvar window state', { error: err.message });
  }
}

export function scheduleSaveWinState(
  win: import('electron').BrowserWindow | null,
  winStatePath: string,
  logger?: Logger
): void {
  if (winStateTimer) clearTimeout(winStateTimer);
  winStateTimer = setTimeout(() => saveWinState(win, winStatePath, logger), 500);
}

export function getWinState(): WinState {
  return winState;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWinStatePath,
    loadWinState,
    ensureVisibleBounds,
    saveWinState,
    scheduleSaveWinState,
    getWinState,
  };
}
