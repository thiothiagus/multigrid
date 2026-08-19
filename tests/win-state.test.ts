import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getWinStatePath,
  loadWinState,
  saveWinState,
  ensureVisibleBounds,
} from '../src/win-state.ts';
import { Screen, Display } from 'electron';

describe('win-state module', () => {
  let tmpDir: string;
  let tmpWinStatePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'win-state-test-'));
    tmpWinStatePath = getWinStatePath(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getWinStatePath', () => {
    it('returns window-state.json path', () => {
      expect(getWinStatePath('/test')).toBe(path.join('/test', 'window-state.json'));
    });
  });

  describe('loadWinState & saveWinState', () => {
    it('returns default win state if file does not exist', () => {
      const state = loadWinState(tmpWinStatePath);
      expect(state).toHaveProperty('width');
      expect(state).toHaveProperty('height');
    });

    it('loads saved win state correctly', () => {
      const sample = { x: 100, y: 100, width: 1200, height: 800, isMaximized: true };
      fs.writeFileSync(tmpWinStatePath, JSON.stringify(sample), 'utf-8');

      const loaded = loadWinState(tmpWinStatePath);
      expect(loaded.x).toBe(100);
      expect(loaded.y).toBe(100);
      expect(loaded.width).toBe(1200);
      expect(loaded.height).toBe(800);
      expect(loaded.isMaximized).toBe(true);
    });

    it('saves win state from BrowserWindow instance', () => {
      const mockWin = {
        isDestroyed: () => false,
        isMaximized: () => false,
        getBounds: () => ({ x: 50, y: 50, width: 1000, height: 700 }),
      };

      saveWinState(mockWin as unknown as import('electron').BrowserWindow, tmpWinStatePath);
      const loaded = loadWinState(tmpWinStatePath);
      expect(loaded.x).toBe(50);
      expect(loaded.y).toBe(50);
      expect(loaded.width).toBe(1000);
      expect(loaded.height).toBe(700);
    });
  });

  describe('ensureVisibleBounds', () => {
    const mockScreen = (displays: Display[]): Screen =>
      ({
        getAllDisplays: () => displays,
        getPrimaryDisplay: () => displays[0],
      }) as unknown as Screen;

    it('returns original bounds if inside a display work area', () => {
      const primaryDisplay: Partial<Display> = {
        workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      };
      const screen = mockScreen([primaryDisplay as Display]);

      const bounds = { x: 100, y: 100, width: 1200, height: 800 };
      const res = ensureVisibleBounds(bounds, screen);
      expect(res).toEqual(bounds);
    });

    it('repositions bounds to primary display if outside all displays', () => {
      const primaryDisplay: Partial<Display> = {
        workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      };
      const screen = mockScreen([primaryDisplay as Display]);

      // Window saved at disconnected secondary monitor coordinates
      const bounds = { x: 3000, y: 3000, width: 1200, height: 800 };
      const res = ensureVisibleBounds(bounds, screen);
      expect(res.x).toBeDefined();
      expect(res.y).toBeDefined();
      expect(res.x).toBeGreaterThanOrEqual(0);
      expect(res.y).toBeGreaterThanOrEqual(0);
      expect(res.width).toBe(1200);
      expect(res.height).toBe(800);
    });
  });
});
