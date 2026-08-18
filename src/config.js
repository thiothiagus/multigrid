const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://poke.idleworld.online/play';

function getConfigPath(app) {
  return path.join(app.getPath('userData'), 'multiconta-config.json');
}

function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveConfig(configPath, config, logger) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    if (logger) logger.error('io', 'Falha ao salvar configuracao', { error: e.message });
    return false;
  }
}

function computeGridDims(n) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows };
}

function normalizeState(saved) {
  const st = { ...saved };
  if (!Array.isArray(st.panes)) st.panes = [];
  st.panes = st.panes.filter((p) => p && typeof p.id === 'number');
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
    st.nextId = 1 + st.panes.reduce((max, p) => Math.max(max, p.id), 0);
  }
  if (!st.gameUrlDefault) st.gameUrlDefault = DEFAULT_URL;
  st.panes.forEach((p) => {
    if (!p.label) p.label = 'Conta ' + p.id;
    if (!p.partition) p.partition = 'persist:conta' + p.id;
    if (!p.url) p.url = st.gameUrlDefault;
  });
  return st;
}

module.exports = {
  DEFAULT_URL,
  getConfigPath,
  loadConfig,
  saveConfig,
  normalizeState
};
