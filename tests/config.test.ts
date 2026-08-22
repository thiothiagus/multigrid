import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getConfigPath,
  loadConfig,
  saveConfig,
  computeGridDims,
  normalizeState,
  DEFAULT_URL,
} from '../src/config.ts';
import { Config } from '../src/types.ts';

describe('config module', () => {
  let tmpDir: string;
  let tmpConfigPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-config-test-'));
    tmpConfigPath = getConfigPath(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getConfigPath', () => {
    it('returns the correct file path inside userDataPath', () => {
      const p = getConfigPath('/some/path');
      expect(p).toBe(path.join('/some/path', 'multiconta-config.json'));
    });
  });

  describe('saveConfig and loadConfig', () => {
    it('returns null when file does not exist', () => {
      expect(loadConfig(tmpConfigPath)).toBeNull();
    });

    it('saves config and loads it correctly', () => {
      const sampleConfig: Config = {
        gameUrlDefault: 'https://example.com',
        nextId: 3,
        cols: 2,
        rows: 1,
        colFr: [1, 1],
        rowFr: [1],
        panes: [
          { id: 1, name: 'Conta 1', url: 'https://example.com/1' },
          { id: 2, name: 'Conta 2', url: 'https://example.com/2' },
        ],
      };

      const saved = saveConfig(tmpConfigPath, sampleConfig);
      expect(saved).toBe(true);

      const loaded = loadConfig(tmpConfigPath);
      expect(loaded).toEqual(sampleConfig);
    });

    it('returns null when json file is corrupted', () => {
      fs.writeFileSync(tmpConfigPath, 'invalid json content', 'utf-8');
      expect(loadConfig(tmpConfigPath)).toBeNull();
    });

    it('logs error when saveConfig fails', () => {
      let loggedError = false;
      const mockLogger = {
        info: () => {},
        warn: () => {},
        error: () => {
          loggedError = true;
        },
      };

      // Pass an invalid path directory that does not exist
      const invalidPath = path.join(tmpDir, 'nonexistent', 'config.json');
      const res = saveConfig(invalidPath, { gameUrlDefault: '' } as Config, mockLogger);
      expect(res).toBe(false);
      expect(loggedError).toBe(true);
    });
  });

  describe('computeGridDims', () => {
    it('computes columns and rows correctly', () => {
      expect(computeGridDims(1)).toEqual({ cols: 1, rows: 1 });
      expect(computeGridDims(4)).toEqual({ cols: 2, rows: 2 });
      expect(computeGridDims(5)).toEqual({ cols: 3, rows: 2 });
    });
  });

  describe('normalizeState', () => {
    it('populates default values for empty state', () => {
      const norm = normalizeState({});
      expect(norm.gameUrlDefault).toBe(DEFAULT_URL);
      expect(norm.nextId).toBe(1);
      expect(norm.cols).toBe(1);
      expect(norm.rows).toBe(1);
      expect(norm.colFr).toEqual([1]);
      expect(norm.rowFr).toEqual([1]);
      expect(norm.panes).toEqual([]);
    });

    it('preserves a valid theme preference', () => {
      expect(normalizeState({ theme: 'light' }).theme).toBe('light');
      expect(normalizeState({ theme: 'dark' }).theme).toBe('dark');
      expect(normalizeState({ theme: 'system' }).theme).toBe('system');
    });

    it('removes an invalid theme preference', () => {
      const norm = normalizeState({ theme: 'blue' } as Partial<Config>);
      expect('theme' in norm).toBe(false);
    });

    it('filters invalid panes and recalculates dimensions', () => {
      const corrupt = {
        panes: [
          { id: 1, name: 'Valid' },
          null as unknown as { id: number },
          { id: 'invalid-id' } as unknown as { id: number },
          { id: 2, name: 'Valid 2' },
        ],
      };
      const norm = normalizeState(corrupt);
      expect(norm.panes.length).toBe(2);
      expect(norm.cols).toBe(2);
      expect(norm.rows).toBe(1);
      expect(norm.colFr).toEqual([1, 1]);
      expect(norm.rowFr).toEqual([1]);
    });

    it('preserves custom fractions if array lengths match grid dimensions', () => {
      const input: Partial<Config> = {
        panes: [
          { id: 1, name: '1', url: '' },
          { id: 2, name: '2', url: '' },
          { id: 3, name: '3', url: '' },
          { id: 4, name: '4', url: '' },
        ],
        cols: 2,
        rows: 2,
        colFr: [1.5, 0.5],
        rowFr: [0.8, 1.2],
      };
      const norm = normalizeState(input);
      expect(norm.cols).toBe(2);
      expect(norm.rows).toBe(2);
      expect(norm.colFr).toEqual([1.5, 0.5]);
      expect(norm.rowFr).toEqual([0.8, 1.2]);
    });
  });
});
