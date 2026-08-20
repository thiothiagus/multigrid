import fs from 'fs';
import path from 'path';
import { WinState, Logger } from './types';
import { BrowserWindow } from 'electron';

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

export function saveWinState(win: BrowserWindow, winStatePath: string, logger?: Logger): void {
  if (!win) return;
  const state = win.getBounds();
  const newWinState: WinState = {
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    isMaximized: win.isMaximized(),
  };
  winState = newWinState;
  try {
    fs.writeFileSync(winStatePath, JSON.stringify(winState));
  } catch (e) {
    if (logger)
      logger.error('io', 'Falha ao salvar window state', {
        error: e instanceof Error ? e.message : String(e),
      });
  }
}

export function scheduleSaveWinState(
  win: BrowserWindow,
  winStatePath: string,
  logger?: Logger
): void {
  if (winStateTimer) clearTimeout(winStateTimer);
  winStateTimer = setTimeout(() => saveWinState(win, winStatePath, logger), 1500);
}
