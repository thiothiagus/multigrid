import { describe, it, expect } from 'vitest';
import { computeGridDims, resetFractions, buildGridTemplates } from '../src/grid-layout.js';

describe('grid-layout', () => {
  describe('computeGridDims', () => {
    it('calculates grid dimensions correctly for 1 to 9 panes', () => {
      expect(computeGridDims(0)).toEqual({ cols: 1, rows: 1 });
      expect(computeGridDims(1)).toEqual({ cols: 1, rows: 1 });
      expect(computeGridDims(2)).toEqual({ cols: 2, rows: 1 });
      expect(computeGridDims(3)).toEqual({ cols: 2, rows: 2 });
      expect(computeGridDims(4)).toEqual({ cols: 2, rows: 2 });
      expect(computeGridDims(5)).toEqual({ cols: 3, rows: 2 });
      expect(computeGridDims(6)).toEqual({ cols: 3, rows: 2 });
      expect(computeGridDims(7)).toEqual({ cols: 3, rows: 3 });
      expect(computeGridDims(8)).toEqual({ cols: 3, rows: 3 });
      expect(computeGridDims(9)).toEqual({ cols: 3, rows: 3 });
    });

    it('handles large pane counts', () => {
      expect(computeGridDims(16)).toEqual({ cols: 4, rows: 4 });
      expect(computeGridDims(20)).toEqual({ cols: 5, rows: 4 });
    });
  });

  describe('resetFractions', () => {
    it('resets colFr and rowFr arrays to 1 for all grid dimensions', () => {
      const state = { cols: 3, rows: 2, colFr: [2, 1, 3], rowFr: [0.5, 1.5] };
      resetFractions(state);
      expect(state.colFr).toEqual([1, 1, 1]);
      expect(state.rowFr).toEqual([1, 1]);
    });

    it('handles null or undefined state gracefully', () => {
      expect(() => resetFractions(null)).not.toThrow();
    });
  });

  describe('buildGridTemplates', () => {
    it('builds CSS grid templates with gutters correctly', () => {
      const state = { cols: 2, rows: 2, colFr: [1, 2], rowFr: [1, 1] };
      const res = buildGridTemplates(state);
      expect(res.colTemplate).toBe('1fr 6px 2fr');
      expect(res.rowTemplate).toBe('1fr 6px 1fr');
      expect(res.cols).toBe(2);
      expect(res.rows).toBe(2);
    });
  });
});
