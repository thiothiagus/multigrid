import { describe, it, expect } from 'vitest';
import {
  FOCUS_FACTOR,
  applyEqualPreset,
  applyAutoPreset,
  applyColumnsPreset,
  applyRowsPreset,
  applyFocusPreset,
  snapshotPreset,
  normalizeCustomPreset,
  fitPresetToPaneCount,
} from '../src/layout-presets.js';
import { computeGridDims } from '../src/grid-layout.js';

describe('layout-presets', () => {
  describe('applyEqualPreset', () => {
    it('resets all fractions to 1 keeping current dims', () => {
      const st = { cols: 3, rows: 2, colFr: [2, 1, 0.5], rowFr: [4, 1] };
      applyEqualPreset(st);
      expect(st.colFr).toEqual([1, 1, 1]);
      expect(st.rowFr).toEqual([1, 1]);
      expect(st.cols).toBe(3);
      expect(st.rows).toBe(2);
    });

    it('handles null state gracefully', () => {
      expect(() => applyEqualPreset(null)).not.toThrow();
    });
  });

  describe('applyAutoPreset (resetar layout)', () => {
    it('restores default grid dims for n panes with equal fractions', () => {
      const st = { cols: 3, rows: 1, colFr: [4, 2, 1], rowFr: [0.5] };
      applyAutoPreset(st, 5);
      const dims = computeGridDims(5);
      expect(st.cols).toBe(dims.cols);
      expect(st.rows).toBe(dims.rows);
      expect(st.colFr).toEqual(new Array(st.cols).fill(1));
      expect(st.rowFr).toEqual(new Array(st.rows).fill(1));
    });

    it('keeps structure untouched for a single pane', () => {
      const st = { cols: 1, rows: 1, colFr: [3], rowFr: [2] };
      applyAutoPreset(st, 1);
      expect(st.cols).toBe(1);
      expect(st.rows).toBe(1);
      expect(st.colFr).toEqual([1]);
      expect(st.rowFr).toEqual([1]);
    });

    it('ignores invalid pane counts and null state', () => {
      const st = { cols: 2, rows: 1, colFr: [1, 2], rowFr: [1] };
      applyAutoPreset(st, 0);
      applyAutoPreset(st, NaN);
      expect(st.cols).toBe(2);
      expect(st.colFr).toEqual([1, 2]);
      expect(() => applyAutoPreset(null, 4)).not.toThrow();
    });
  });

  describe('applyColumnsPreset', () => {
    it('puts all panes in a single row of n columns', () => {
      const st = { cols: 2, rows: 2, colFr: [2, 1], rowFr: [3, 1] };
      applyColumnsPreset(st, 5);
      expect(st.cols).toBe(5);
      expect(st.rows).toBe(1);
      expect(st.colFr).toEqual([1, 1, 1, 1, 1]);
      expect(st.rowFr).toEqual([1]);
    });

    it('ignores invalid pane counts', () => {
      const st = { cols: 2, rows: 1, colFr: [1, 2], rowFr: [1] };
      applyColumnsPreset(st, 0);
      applyColumnsPreset(st, NaN);
      expect(st.cols).toBe(2);
      expect(st.colFr).toEqual([1, 2]);
    });
  });

  describe('applyRowsPreset', () => {
    it('stacks all panes in a single column of n rows', () => {
      const st = { cols: 3, rows: 2, colFr: [1, 1, 1], rowFr: [2, 1] };
      applyRowsPreset(st, 4);
      expect(st.cols).toBe(1);
      expect(st.rows).toBe(4);
      expect(st.colFr).toEqual([1]);
      expect(st.rowFr).toEqual([1, 1, 1, 1]);
    });

    it('ignores invalid pane counts', () => {
      const st = { cols: 1, rows: 2, colFr: [1], rowFr: [1, 2] };
      applyRowsPreset(st, -3);
      expect(st.rows).toBe(2);
      expect(st.rowFr).toEqual([1, 2]);
    });
  });

  describe('applyFocusPreset', () => {
    it('enlarges the focused cell relative to sibling average without touching siblings', () => {
      const st = { cols: 2, rows: 2, colFr: [1, 1], rowFr: [1, 1] };
      applyFocusPreset(st, 0);
      expect(st.colFr[0]).toBeCloseTo(FOCUS_FACTOR);
      expect(st.colFr[1]).toBe(1);
      expect(st.rowFr[0]).toBeCloseTo(FOCUS_FACTOR);
      expect(st.rowFr[1]).toBe(1);
    });

    it('works on uneven fractions and keeps others unchanged', () => {
      const st = { cols: 3, rows: 1, colFr: [1, 2, 3], rowFr: [1] };
      applyFocusPreset(st, 2);
      expect(st.colFr[2]).toBeCloseTo(FOCUS_FACTOR * ((1 + 2) / 2));
      expect(st.colFr[0]).toBe(1);
      expect(st.colFr[1]).toBe(2);
    });

    it('is idempotent (reapplying does not compound)', () => {
      const st = { cols: 3, rows: 1, colFr: [1, 2, 3], rowFr: [1] };
      applyFocusPreset(st, 0);
      const afterFirst = [...st.colFr];
      applyFocusPreset(st, 0);
      expect(st.colFr).toEqual(afterFirst);
    });

    it('does nothing on single-cell grids or invalid index/factor', () => {
      const single = { cols: 1, rows: 1, colFr: [2], rowFr: [3] };
      applyFocusPreset(single, 0);
      expect(single.colFr).toEqual([2]);
      expect(single.rowFr).toEqual([3]);

      const st = { cols: 2, rows: 1, colFr: [1, 1], rowFr: [1] };
      applyFocusPreset(st, -1);
      applyFocusPreset(st, 2);
      applyFocusPreset(st, 0, 0);
      applyFocusPreset(st, 0, Infinity);
      expect(st.colFr).toEqual([1, 1]);
    });
  });

  describe('snapshotPreset', () => {
    it('deep-copies fractions and trims the name', () => {
      const st = { cols: 2, rows: 2, colFr: [1.5, 2.5], rowFr: [1, 1] };
      const p = snapshotPreset(st, '  Trabalho  ');
      expect(p.name).toBe('Trabalho');
      expect(p.cols).toBe(2);
      expect(p.rowFr).toEqual([1, 1]);
      p.colFr[0] = 99;
      expect(st.colFr[0]).toBe(1.5);
    });

    it('falls back to a default name when blank', () => {
      const st = { cols: 1, rows: 1, colFr: [1], rowFr: [1] };
      expect(snapshotPreset(st, '   ').name).toBe('Meu layout');
    });
  });

  describe('normalizeCustomPreset', () => {
    it('passes through a valid preset unchanged', () => {
      expect(
        normalizeCustomPreset({ name: 'X', cols: 2, rows: 1, colFr: [1, 2], rowFr: [3] })
      ).toEqual({ name: 'X', cols: 2, rows: 1, colFr: [1, 2], rowFr: [3] });
    });

    it('fills missing/invalid fractions with 1 and truncates extras', () => {
      const p = normalizeCustomPreset({
        name: '',
        cols: 3,
        rows: 2,
        colFr: [2, 5],
        rowFr: [1, -4, 9],
      });
      expect(p!.colFr).toEqual([2, 5, 1]);
      expect(p!.rowFr).toEqual([1, 1]);
      expect(p!.name).toBe('Meu layout');
    });

    it('defaults missing fraction arrays entirely', () => {
      const p = normalizeCustomPreset({ name: 'Y', cols: 2, rows: 2 });
      expect(p!.colFr).toEqual([1, 1]);
      expect(p!.rowFr).toEqual([1, 1]);
    });

    it('rejects non-object input and invalid dimensions', () => {
      expect(normalizeCustomPreset(null)).toBeNull();
      expect(normalizeCustomPreset('x')).toBeNull();
      expect(normalizeCustomPreset(42)).toBeNull();
      expect(normalizeCustomPreset({ cols: 0, rows: 1 })).toBeNull();
      expect(normalizeCustomPreset({ cols: 2, rows: -1 })).toBeNull();
      expect(normalizeCustomPreset({ cols: NaN, rows: 1 })).toBeNull();
      expect(normalizeCustomPreset({})).toBeNull();
    });
  });

  describe('fitPresetToPaneCount', () => {
    it('adds rows of fraction 1 until the grid fits all open panes', () => {
      const p = normalizeCustomPreset({ name: 'A', cols: 2, rows: 1, colFr: [3, 1], rowFr: [2] })!;
      const f = fitPresetToPaneCount(p, 5);
      expect(f.cols).toBe(2);
      expect(f.rows).toBe(3);
      expect(f.colFr).toEqual([3, 1]);
      expect(f.rowFr).toEqual([2, 1, 1]);
    });

    it('returns a copy without mutating the original when capacity suffices', () => {
      const p = snapshotPreset({ cols: 3, rows: 2, colFr: [1, 1, 1], rowFr: [1, 1] }, 'B');
      const f = fitPresetToPaneCount(p, 6);
      expect(f.rows).toBe(2);
      expect(f.rowFr).toEqual([1, 1]);
      expect(f).not.toBe(p);
      expect(f.colFr).not.toBe(p.colFr);
    });
  });
});
