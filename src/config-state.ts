import type { Config, Pane } from './types.js';

export const DEFAULT_URL = 'https://poke.idleworld.online/play';

export const DEFAULT_CONFIG: Config = {
  gameUrlDefault: DEFAULT_URL,
  nextId: 1,
  cols: 1,
  rows: 1,
  colFr: [1],
  rowFr: [1],
  panes: [],
};

export function computeGridDims(n: number): { cols: number; rows: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows };
}

export function normalizeState(saved: Partial<Config>): Config {
  const st: Config = {
    gameUrlDefault: DEFAULT_URL,
    nextId: 1,
    cols: 1,
    rows: 1,
    colFr: [1],
    rowFr: [1],
    panes: [],
    ...saved,
  };
  if (!Array.isArray(st.panes)) st.panes = [];
  st.panes = st.panes.filter((p: Pane) => p && typeof p.id === 'number');
  const dims = computeGridDims(st.panes.length);
  if (st.cols !== dims.cols || !Array.isArray(st.colFr) || st.colFr.length !== dims.cols) {
    st.cols = dims.cols;
    st.colFr = new Array(dims.cols).fill(1);
  }
  if (st.rows !== dims.rows || !Array.isArray(st.rowFr) || st.rowFr.length !== dims.rows) {
    st.rows = dims.rows;
    st.rowFr = new Array(dims.rows).fill(1);
  }
  if (typeof st.nextId !== 'number') {
    st.nextId = 1 + st.panes.reduce((max: number, p: Pane) => Math.max(max, p.id), 0);
  }
  if (!st.gameUrlDefault) st.gameUrlDefault = DEFAULT_URL;
  st.panes.forEach((p: Pane) => {
    if (!p.label) p.label = 'Conta ' + p.id;
    if (!p.partition) p.partition = 'persist:conta' + p.id;
    if (!p.url) p.url = st.gameUrlDefault || DEFAULT_URL;
  });
  return st as Config;
}
