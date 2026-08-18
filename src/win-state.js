const fs = require('fs');
const path = require('path');

let winState = { width: 1500, height: 950, isMaximized: false };
let winStateTimer = null;

function getWinStatePath(app) {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWinState(winStatePath, logger) {
  try {
    const saved = JSON.parse(fs.readFileSync(winStatePath, 'utf-8'));
    if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
      winState = { ...winState, ...saved };
    }
  } catch (e) {
    if (e.code !== 'ENOENT' && logger) {
      logger.warn('io', 'Falha ao carregar window state', { error: e.message });
    }
  }
  return winState;
}

function ensureVisibleBounds(bounds, screen) {
  const insideSomeDisplay = screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return bounds.x >= a.x - 50 && bounds.y >= a.y - 50 &&
           bounds.x < a.x + a.width && bounds.y < a.y + a.height;
  });
  if (insideSomeDisplay) return bounds;
  const primary = screen.getPrimaryDisplay().workArea;
  const width = Math.min(bounds.width, primary.width);
  const height = Math.min(bounds.height, primary.height);
  return {
    x: Math.round(primary.x + (primary.width - width) / 2),
    y: Math.round(primary.y + (primary.height - height) / 2),
    width,
    height
  };
}

function saveWinState(win, winStatePath, logger) {
  if (!win || win.isDestroyed()) return;
  winState = { ...win.getBounds(), isMaximized: win.isMaximized() };
  try {
    fs.writeFileSync(winStatePath, JSON.stringify(winState, null, 2), 'utf-8');
  } catch (e) {
    if (logger) logger.warn('io', 'Falha ao salvar window state', { error: e.message });
  }
}

function scheduleSaveWinState(win, winStatePath, logger) {
  clearTimeout(winStateTimer);
  winStateTimer = setTimeout(() => saveWinState(win, winStatePath, logger), 500);
}

function getWinState() {
  return winState;
}

module.exports = {
  getWinStatePath,
  loadWinState,
  ensureVisibleBounds,
  saveWinState,
  scheduleSaveWinState,
  getWinState
};
