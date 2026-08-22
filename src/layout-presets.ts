import { resetFractions, computeGridDims } from './grid-layout.js';
import type { LayoutPreset } from './types.js';

// Fator de destaque do preset "Focar conta": a celula do painel escolhido
// passa a ter esse multiplo da media das irmaos na mesma coluna/linha.
const FOCUS_FACTOR = 2.5;

interface PresetState {
  cols: number;
  rows: number;
  colFr: number[];
  rowFr: number[];
}

function applyEqualPreset(st: PresetState): void {
  if (!st) return;
  resetFractions(st);
}

// Reset completo: volta ao layout automatico da grade (mesmas dims usadas ao
// adicionar/remover contas) com fracoes iguais. Diferente do preset "Igual",
// que preserva a estrutura atual de colunas/linhas.
function applyAutoPreset(st: PresetState, n: number): void {
  if (!st || !Number.isInteger(n) || n < 1) return;
  const { cols, rows } = computeGridDims(n);
  st.cols = cols;
  st.rows = rows;
  resetFractions(st);
}

function applyColumnsPreset(st: PresetState, n: number): void {
  if (!st || !Number.isInteger(n) || n < 1) return;
  st.cols = n;
  st.rows = 1;
  st.colFr = new Array(n).fill(1);
  st.rowFr = [1];
}

function applyRowsPreset(st: PresetState, n: number): void {
  if (!st || !Number.isInteger(n) || n < 1) return;
  st.cols = 1;
  st.rows = n;
  st.colFr = [1];
  st.rowFr = new Array(n).fill(1);
}

// Deterministico e idempotente: a celula focada recebe FOCUS_FACTOR x a media
// das fracoes das outras celulas da mesma coluna/linha (as irmas nao mudam),
// entao reaplicar o preset produz sempre o mesmo resultado.
function applyFocusPreset(st: PresetState, paneIndex: number, factor = FOCUS_FACTOR): void {
  if (!st) return;
  const { cols, rows } = st;
  const idxOk = Number.isInteger(paneIndex) && paneIndex >= 0 && paneIndex < cols * rows;
  const factorOk = Number.isFinite(factor) && factor > 0;
  if (!idxOk || !factorOk) return;

  const col = paneIndex % cols;
  const row = Math.floor(paneIndex / cols);

  if (cols > 1) {
    const others = st.colFr.reduce((acc, fr, i) => (i === col ? acc : acc + fr), 0);
    if (others > 0) st.colFr[col] = factor * (others / (cols - 1));
  }
  if (rows > 1) {
    const others = st.rowFr.reduce((acc, fr, i) => (i === row ? acc : acc + fr), 0);
    if (others > 0) st.rowFr[row] = factor * (others / (rows - 1));
  }
}

// Snapshot do layout atual como preset personalizado (copia profunda das
// fracoes para nao compartilhar referencias com o estado vivo).
function snapshotPreset(st: PresetState, name: string): LayoutPreset {
  return {
    name: name && name.trim() ? name.trim() : 'Meu layout',
    cols: st.cols,
    rows: st.rows,
    colFr: [...st.colFr],
    rowFr: [...st.rowFr],
  };
}

function sanitizeFractions(arr: unknown[], len: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    const v = Number(arr[i]);
    out.push(Number.isFinite(v) && v > 0 ? v : 1);
  }
  return out;
}

// Valida um preset vindo do config.json persistido. Valores ruins sao
// corrigidos (fracao invalida -> 1); dims invalidas descartam o preset.
function normalizeCustomPreset(raw: unknown): LayoutPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<LayoutPreset>;
  const cols = Math.floor(Number(p.cols));
  const rows = Math.floor(Number(p.rows));
  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 1 || rows < 1) return null;
  const colFrSrc = Array.isArray(p.colFr) ? p.colFr : [];
  const rowFrSrc = Array.isArray(p.rowFr) ? p.rowFr : [];
  return {
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Meu layout',
    cols,
    rows,
    colFr: sanitizeFractions(colFrSrc, cols),
    rowFr: sanitizeFractions(rowFrSrc, rows),
  };
}

// Garante capacidade minima de celulas para os paineis abertos no momento em
// que o preset e aplicado (linhas extras recebem fracao 1).
function fitPresetToPaneCount(p: LayoutPreset, paneCount: number): LayoutPreset {
  const fitted: LayoutPreset = { ...p, colFr: [...p.colFr], rowFr: [...p.rowFr] };
  while (fitted.cols * fitted.rows < paneCount) {
    fitted.rows++;
    fitted.rowFr.push(1);
  }
  return fitted;
}

export {
  FOCUS_FACTOR,
  applyEqualPreset,
  applyAutoPreset,
  applyColumnsPreset,
  applyRowsPreset,
  applyFocusPreset,
  snapshotPreset,
  normalizeCustomPreset,
  fitPresetToPaneCount,
};
