'use strict';

import {
  getFocusedPaneId,
  toggleFocusPane,
  updateFocusState,
  clearFocusIfMatches,
} from './src/focus-manager.js';
import {
  calculatePaneLayout,
  computeGridDims,
  resetFractions,
  GUTTER_PX,
} from './src/grid-layout.js';
import { DEFAULT_URL } from './src/config-state.js';
import { applyTheme, isValidTheme, nextThemePreference, resolveTheme } from './src/theme.js';
import type { ThemePreference } from './src/theme.js';
import {
  applyEqualPreset,
  applyAutoPreset,
  applyColumnsPreset,
  applyRowsPreset,
  applyFocusPreset,
  snapshotPreset,
  normalizeCustomPreset,
  fitPresetToPaneCount,
} from './src/layout-presets.js';
import type { Config, LayoutPreset } from './src/types.js';

let state: Config = {
  panes: [],
  nextId: 1,
  cols: 1,
  rows: 1,
  colFr: [1],
  rowFr: [1],
  gameUrlDefault: DEFAULT_URL,
  customPresets: [],
};
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let syncScheduled = false;

function persist() {
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    window.api.saveConfig(state).catch(() => {});
  }, 400);
}

// Le a posicao/tamanho real (em pixels) de cada painel na tela e manda pro
// processo principal, que usa esses numeros pra posicionar a BrowserView de
// cada conta exatamente no lugar certo. Chamado sempre que o layout muda:
// depois de montar a grade, durante o arrasto das divisorias e no resize
// da janela.
function syncLayoutToMain() {
  if (syncScheduled) return;
  syncScheduled = true;
  requestAnimationFrame(() => {
    syncScheduled = false;
    const rects = calculatePaneLayout(document.getElementById('grid-container'));
    window.api.syncLayout(rects);
  });
}

// ---------------------------------------------------------------------
// Tela de setup
// ---------------------------------------------------------------------

function showSetup() {
  const setupScreen = document.getElementById('setup-screen');
  if (setupScreen) setupScreen.classList.remove('hidden');
  const gridContainer = document.getElementById('grid-container');
  if (gridContainer) gridContainer.classList.add('hidden');
}

function hideSetup() {
  const setupScreen2 = document.getElementById('setup-screen');
  if (setupScreen2) setupScreen2.classList.add('hidden');
  const gridContainer2 = document.getElementById('grid-container');
  if (gridContainer2) gridContainer2.classList.remove('hidden');
}

function initFromScratch(n: number, url: string) {
  const dims = computeGridDims(n);
  state = {
    gameUrlDefault: url,
    nextId: n + 1,
    cols: dims.cols,
    rows: dims.rows,
    colFr: new Array(dims.cols).fill(1),
    rowFr: new Array(dims.rows).fill(1),
    panes: [],
    customPresets: state.customPresets ?? [],
  };
  for (let i = 1; i <= n; i++) {
    state.panes.push({ id: i, label: 'Conta ' + i, partition: 'persist:conta' + i, url });
  }
  render();
  syncLayoutToMain();
  persist();
}

// ---------------------------------------------------------------------
// Adicionar / remover contas
// ---------------------------------------------------------------------

async function addPane() {
  const id = state.nextId++;
  const pane = {
    id,
    label: 'Conta ' + id,
    partition: 'persist:conta' + id,
    url: state.gameUrlDefault || DEFAULT_URL,
  };
  state.panes.push(pane);

  const dims = computeGridDims(state.panes.length);
  state.cols = dims.cols;
  state.rows = dims.rows;
  resetFractions(state);

  render(); // paineis existentes NAO sao recriados, so o novo espaco abre
  await window.api.createPane(pane);
  syncLayoutToMain();
  persist();
}

async function removePane(id: number) {
  clearFocusIfMatches(id);
  state.panes = state.panes.filter(p => p.id !== id);
  await window.api.removePane(id);

  if (state.panes.length === 0) {
    render();
    persist();
    return;
  }

  const dims = computeGridDims(state.panes.length);
  state.cols = dims.cols;
  state.rows = dims.rows;
  resetFractions(state);

  render(); // os paineis que sobraram continuam rodando, sem recarregar
  syncLayoutToMain();
  persist();
}

// Reordena a grade: move a conta de fromId para a posicao de toId. So a
// ordem no array muda (a posicao de cada BrowserView vem do indice no
// render()), entao nenhuma sessao e recriada no processo.
function movePane(fromId: number, toId: number) {
  const fromIdx = state.panes.findIndex(p => p.id === fromId);
  const toIdx = state.panes.findIndex(p => p.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
  const [moved] = state.panes.splice(fromIdx, 1);
  state.panes.splice(toIdx, 0, moved);
  render();
  syncLayoutToMain();
  persist();
}

// ---------------------------------------------------------------------
// Construcao de cada painel (cabecalho + area reservada + overlay de erro)
// ---------------------------------------------------------------------

function createPaneElement(pane: { id: number; label: string; partition: string; url: string }) {
  const el = document.createElement('div');
  el.className = 'pane';
  el.dataset.id = String(pane.id);

  const header = document.createElement('div');
  header.className = 'pane-header';

  header.addEventListener('dragstart', (e: DragEvent) => {
    e.dataTransfer!.setData('text/plain', String(pane.id));
    header.classList.add('drag-over');
  });

  header.addEventListener('dragend', () => header.classList.remove('drag-over'));

  header.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    header.classList.add('drag-over');
  });

  header.addEventListener('dragleave', () => header.classList.remove('drag-over'));

  header.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
    header.classList.remove('drag-over');
    const fromId = Number(e.dataTransfer!.getData('text/plain'));
    if (fromId !== pane.id) movePane(fromId, pane.id);
  });

  header.addEventListener('dblclick', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest('button') || target?.closest('.label')) return;
    toggleFocusPane(pane.id);
    updateFocusState(state, document.getElementById('grid-container'));
    syncLayoutToMain();
  });

  const labelWrap = document.createElement('div');
  labelWrap.className = 'label-wrap';

  const dot = document.createElement('span');
  dot.className = 'status-dot';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = pane.label;
  label.contentEditable = 'true';
  label.spellcheck = false;
  label.title = 'Clique para renomear';
  label.addEventListener('blur', () => {
    pane.label = label.textContent.trim() || pane.label;
    label.textContent = pane.label;
    persist();
  });
  label.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      label.blur();
    }
  });

  labelWrap.appendChild(dot);
  labelWrap.appendChild(label);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const backBtn = document.createElement('button');
  backBtn.textContent = '<';
  backBtn.title = 'Voltar';

  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = '\u21BB';
  reloadBtn.title = 'Recarregar';

  const isFocused = pane.id === getFocusedPaneId();
  const focusBtn = document.createElement('button');
  focusBtn.textContent = isFocused ? '\u2922' : '\u26F6';
  focusBtn.title = isFocused ? 'Restaurar grid (Sair do Foco)' : 'Focar painel (Modo Foco)';
  focusBtn.className = isFocused ? 'focus-btn is-active' : 'focus-btn';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '\u232B'; // "⌫" (apagar)
  clearBtn.title = 'Limpar dados desta conta (reset do login)';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u2715';
  closeBtn.title = 'Fechar conta';

  const overlay = document.createElement('div');
  overlay.className = 'pane-overlay hidden';
  const overlayMsg = document.createElement('span');
  overlayMsg.className = 'overlay-msg';
  const overlayBtn = document.createElement('button');
  overlayBtn.textContent = 'Recarregar';
  overlay.appendChild(overlayMsg);
  overlay.appendChild(overlayBtn);

  const body = document.createElement('div');
  body.className = 'pane-body';

  backBtn.addEventListener('click', () => window.api.backPane(pane.id));
  reloadBtn.addEventListener('click', () => window.api.reloadPane(pane.id));
  focusBtn.addEventListener('click', () => {
    toggleFocusPane(pane.id);
    updateFocusState(state, document.getElementById('grid-container'));
    syncLayoutToMain();
  });
  clearBtn.addEventListener('click', () => {
    if (
      window.confirm(
        'Limpar todos os dados (login, cookies, cache) desta conta? O painel será recarregado.'
      )
    ) {
      window.api.clearPaneData(pane.id);
    }
  });
  closeBtn.addEventListener('click', () => removePane(pane.id));
  overlayBtn.addEventListener('click', () => window.api.reloadPane(pane.id));

  actions.appendChild(backBtn);
  actions.appendChild(reloadBtn);
  actions.appendChild(focusBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(closeBtn);
  header.appendChild(labelWrap);
  header.appendChild(actions);
  el.appendChild(header);
  el.appendChild(body);
  el.appendChild(overlay);
  return el;
}

// ---------------------------------------------------------------------
// Grade (CSS Grid com "trilhos" de 6px intercalados para os resizers)
// ---------------------------------------------------------------------

function applyGridTemplate() {
  const gridEl = document.getElementById('grid-container')!;
  const colTemplate: string[] = [];
  state.colFr.forEach((f, i) => {
    colTemplate.push(f.toFixed(4) + 'fr');
    if (i < state.colFr.length - 1) colTemplate.push(GUTTER_PX + 'px');
  });
  const rowTemplate: string[] = [];
  state.rowFr.forEach((f, i) => {
    rowTemplate.push(f.toFixed(4) + 'fr');
    if (i < state.rowFr.length - 1) rowTemplate.push(GUTTER_PX + 'px');
  });
  gridEl.style.gridTemplateColumns = colTemplate.join(' ');
  gridEl.style.gridTemplateRows = rowTemplate.join(' ');
  return { colTemplate, rowTemplate };
}

function startColResize(g: number) {
  const gridEl = document.getElementById('grid-container')!;
  return function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startFrG = state.colFr[g];
    const startFrG1 = state.colFr[g + 1];
    const totalFr = state.colFr.reduce((a, b) => a + b, 0);
    const gutterPx = GUTTER_PX * (state.colFr.length - 1);
    const contentWidth = gridEl.clientWidth - gutterPx;
    const minFr = totalFr * 0.08;

    function onMove(ev: MouseEvent) {
      const deltaFr = ((ev.clientX - startX) / contentWidth) * totalFr;
      let newG = startFrG + deltaFr;
      let newG1 = startFrG1 - deltaFr;
      if (newG < minFr) {
        newG = minFr;
        newG1 = totalFr - newG;
      }
      if (newG1 < minFr) {
        newG1 = minFr;
        newG = totalFr - newG1;
      }
      state.colFr[g] = newG;
      state.colFr[g + 1] = newG1;
      applyGridTemplate();
      syncLayoutToMain();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      persist();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
}

function startRowResize(g: number) {
  const gridEl = document.getElementById('grid-container')!;
  return function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startFrG = state.rowFr[g];
    const startFrG1 = state.rowFr[g + 1];
    const totalFr = state.rowFr.reduce((a, b) => a + b, 0);
    const gutterPx = GUTTER_PX * (state.rowFr.length - 1);
    const contentHeight = gridEl.clientHeight - gutterPx;
    const minFr = totalFr * 0.08;

    function onMove(ev: MouseEvent) {
      const deltaFr = ((ev.clientY - startY) / contentHeight) * totalFr;
      let newG = startFrG + deltaFr;
      let newG1 = startFrG1 - deltaFr;
      if (newG < minFr) {
        newG = minFr;
        newG1 = totalFr - newG;
      }
      if (newG1 < minFr) {
        newG1 = minFr;
        newG = totalFr - newG1;
      }
      state.rowFr[g] = newG;
      state.rowFr[g + 1] = newG1;
      applyGridTemplate();
      syncLayoutToMain();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      persist();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
}

// ---------------------------------------------------------------------
// Presets de layout (toolbar)
// ---------------------------------------------------------------------

function getCustomPresets(): LayoutPreset[] {
  if (!state.customPresets) state.customPresets = [];
  return state.customPresets;
}

function updateDeleteBtnVisibility(selectedValue: string) {
  const btn = document.getElementById('delete-preset-btn');
  if (btn) btn.classList.toggle('hidden', !selectedValue.startsWith('custom:'));
}

// Reconstrui as opcoes do select de presets: basicos, "Focar conta" (uma por
// painel aberto) e "Meus presets" (personalizados salvos no config).
function refreshPresetSelect() {
  const sel = document.getElementById('layout-preset-select') as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Layout…';
  sel.appendChild(placeholder);

  const basics: Array<[string, string]> = [
    ['equal', 'Igual'],
    ['columns', 'Colunas'],
    ['rows', 'Linhas'],
  ];
  const basicGroup = document.createElement('optgroup');
  basicGroup.label = 'Presets';
  basics.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    basicGroup.appendChild(opt);
  });
  sel.appendChild(basicGroup);

  if (state.panes.length > 1) {
    const focusGroup = document.createElement('optgroup');
    focusGroup.label = 'Focar conta';
    state.panes.forEach(p => {
      const opt = document.createElement('option');
      opt.value = 'focus:' + p.id;
      opt.textContent = 'Focar ' + p.label;
      focusGroup.appendChild(opt);
    });
    sel.appendChild(focusGroup);
  }

  const customs = getCustomPresets();
  if (customs.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Meus presets';
    customs.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = 'custom:' + i;
      opt.textContent = p.name;
      customGroup.appendChild(opt);
    });
    sel.appendChild(customGroup);
  }
}

function handlePresetSelection(value: string) {
  if (value === 'equal') {
    applyEqualPreset(state);
    applyGridTemplate();
  } else if (value === 'columns' || value === 'rows') {
    const n = Math.max(1, state.panes.length || 1);
    if (value === 'columns') applyColumnsPreset(state, n);
    else applyRowsPreset(state, n);
    render();
  } else if (value.startsWith('focus:')) {
    const paneId = Number(value.slice(6));
    const idx = state.panes.findIndex(p => p.id === paneId);
    // Com uma unica celula nao ha o que destacar.
    if (idx >= 0 && state.cols * state.rows > 1) applyFocusPreset(state, idx);
    else return;
    applyGridTemplate();
  } else if (value.startsWith('custom:')) {
    const preset = normalizeCustomPreset(getCustomPresets()[Number(value.slice(7))]);
    if (!preset) return;
    const fitted = fitPresetToPaneCount(preset, Math.max(1, state.panes.length));
    state.cols = fitted.cols;
    state.rows = fitted.rows;
    state.colFr = fitted.colFr;
    state.rowFr = fitted.rowFr;
    render();
  } else {
    return;
  }
  syncLayoutToMain();
  persist();
}

function openSaveBox() {
  const box = document.getElementById('preset-save-box');
  const input = document.getElementById('preset-name-input') as HTMLInputElement | null;
  if (box && input) {
    box.classList.remove('hidden');
    input.focus();
    input.select();
  }
}

function closeSaveBox() {
  const box = document.getElementById('preset-save-box');
  const input = document.getElementById('preset-name-input') as HTMLInputElement | null;
  if (box) box.classList.add('hidden');
  if (input) input.value = '';
}

function saveCustomPreset() {
  const input = document.getElementById('preset-name-input') as HTMLInputElement | null;
  if (state.panes.length === 0) {
    closeSaveBox();
    return;
  }
  const name =
    input && input.value.trim()
      ? input.value.trim()
      : 'Meu layout ' + (getCustomPresets().length + 1);
  getCustomPresets().push(snapshotPreset(state, name));
  closeSaveBox();
  refreshPresetSelect();
  persist();
}

// Reconstroi a grade (cabecalhos + areas reservadas + resizers). So chamada
// em mudancas estruturais (iniciar, adicionar, remover conta). As
// BrowserViews em si nao sao recriadas aqui -- so posicionadas depois via
// syncLayoutToMain().
function render() {
  const gridEl = document.getElementById('grid-container')!;
  gridEl.innerHTML = '';

  if (state.panes.length === 0) {
    showSetup();
    return;
  }
  hideSetup();

  const { colTemplate, rowTemplate } = applyGridTemplate();
  const cols = state.cols;
  const rows = state.rows;

  state.panes.forEach((pane, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const colLine = 2 * col + 1;
    const rowLine = 2 * row + 1;

    const paneEl = createPaneElement(pane);
    paneEl.style.gridColumnStart = String(colLine);
    paneEl.style.gridRowStart = String(rowLine);

    const isLastRow = row === rows - 1;
    const itemsInLastRow = state.panes.length - (rows - 1) * cols;
    if (isLastRow && itemsInLastRow < cols) {
      // Linha incompleta: distribui os itens pela largura total sem
      // sobreposição e sem deixar espaço vazio (bug das 5 telas).
      const colInRow = idx - (rows - 1) * cols;
      const colsPerItem = cols / itemsInLastRow;
      const startCol = Math.round(colInRow * colsPerItem);
      const endCol = Math.round((colInRow + 1) * colsPerItem);
      paneEl.style.gridColumnStart = String(2 * startCol + 1);
      paneEl.style.gridColumnEnd = String(2 * endCol);
    } else {
      paneEl.style.gridColumnEnd = String(colLine + 1);
    }
    paneEl.style.gridRowEnd = String(rowLine + 1);

    gridEl.appendChild(paneEl);
  });

  for (let g = 0; g < cols - 1; g++) {
    const r = document.createElement('div');
    r.className = 'v-resizer';
    r.style.gridColumnStart = String(2 * g + 2);
    r.style.gridColumnEnd = String(2 * g + 3);
    r.style.gridRowStart = '1';
    r.style.gridRowEnd = String(rowTemplate.length + 1);
    r.addEventListener('mousedown', startColResize(g));
    gridEl.appendChild(r);
  }

  for (let g = 0; g < rows - 1; g++) {
    const r = document.createElement('div');
    r.className = 'h-resizer';
    r.style.gridRowStart = String(2 * g + 2);
    r.style.gridRowEnd = String(2 * g + 3);
    r.style.gridColumnStart = '1';
    r.style.gridColumnEnd = String(colTemplate.length + 1);
    r.addEventListener('mousedown', startRowResize(g));
    gridEl.appendChild(r);
  }

  updateFocusState(state, gridEl);
  refreshPresetSelect();
}

// ---------------------------------------------------------------------
// Tema (claro/escuro)
// ---------------------------------------------------------------------

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let themePref: ThemePreference = 'system';

const themeToggleBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement | null;

// Icone mostra o tema DESTINO do clique (sol quando esta escuro, lua quando claro)
function refreshThemeToggle() {
  if (!themeToggleBtn) return;
  const goingLight = resolveTheme(themePref, systemDarkQuery.matches) === 'dark';
  themeToggleBtn.textContent = goingLight ? '\u2600' : '\u263E';
  themeToggleBtn.title = goingLight ? 'Mudar para tema claro' : 'Mudar para tema escuro';
}

function setTheme(pref: ThemePreference) {
  themePref = pref;
  applyTheme(document.documentElement, pref, systemDarkQuery.matches);
  refreshThemeToggle();
}

themeToggleBtn?.addEventListener('click', () => {
  setTheme(nextThemePreference(themePref, systemDarkQuery.matches));
  persist();
});

// Enquanto a preferencia e "seguir o SO", mudancas de tema do sistema sao
// aplicadas na hora; escolha explicita do usuario ignora o evento.
systemDarkQuery.addEventListener('change', () => {
  if (themePref === 'system') {
    applyTheme(document.documentElement, 'system', systemDarkQuery.matches);
    refreshThemeToggle();
  }
});

setTheme('system');

// A preferencia salva no config sobrepoe a deteccao do SO assim que chegar
window.api
  .loadConfig()
  .then(saved => {
    if (saved && isValidTheme(saved.theme)) setTheme(saved.theme);
  })
  .catch(() => {});

// ---------------------------------------------------------------------
// Inicializacao
// ---------------------------------------------------------------------

document.getElementById('add-pane-btn')!.addEventListener('click', addPane);

// --- Presets de layout ---

// Resetar layout = volta ao layout automatico da grade (dims padrao para o
// numero de contas abertas + fracoes iguais). O preset "Igual" do menu, por
// sua vez, apenas iguala as fracoes mantendo a estrutura atual.
document.getElementById('reset-layout-btn')!.addEventListener('click', () => {
  applyAutoPreset(state, Math.max(1, state.panes.length || 1));
  render();
  syncLayoutToMain();
  persist();
});

const presetSelect = document.getElementById('layout-preset-select') as HTMLSelectElement;
let lastSelectedPreset = '';
presetSelect.addEventListener('change', () => {
  const value = presetSelect.value;
  if (!value) return;
  lastSelectedPreset = value.startsWith('custom:') ? value : '';
  handlePresetSelection(value);
  presetSelect.value = ''; // volta ao placeholder para permitir reaplicar
  updateDeleteBtnVisibility(lastSelectedPreset);
});

document.getElementById('delete-preset-btn')!.addEventListener('click', () => {
  if (!lastSelectedPreset.startsWith('custom:')) return;
  const idx = Number(lastSelectedPreset.slice(7));
  const presets = getCustomPresets();
  const preset = presets[idx];
  if (!preset) return;
  if (window.confirm(`Excluir o preset "${preset.name}"?`)) {
    presets.splice(idx, 1);
    lastSelectedPreset = '';
    updateDeleteBtnVisibility('');
    refreshPresetSelect();
    persist();
  }
});

document.getElementById('save-preset-btn')!.addEventListener('click', openSaveBox);
document.getElementById('preset-save-confirm')!.addEventListener('click', saveCustomPreset);
document.getElementById('preset-name-input')!.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveCustomPreset();
  if (e.key === 'Escape') closeSaveBox();
});
// Fecha o popover de salvamento ao clicar fora dele
document.addEventListener('click', e => {
  const target = e.target as HTMLElement;
  if (target.closest('#preset-save-box') || target.closest('#save-preset-btn')) return;
  closeSaveBox();
});

refreshPresetSelect();

document.getElementById('setup-start-btn')!.addEventListener('click', async () => {
  const n = Math.max(
    1,
    Math.min(
      9,
      parseInt((document.getElementById('setup-count') as HTMLInputElement).value, 10) || 4
    )
  );
  const url =
    (document.getElementById('setup-url') as HTMLInputElement).value.trim() || DEFAULT_URL;
  initFromScratch(n, url);
  for (const pane of state.panes) {
    await window.api.createPane(pane);
  }
  syncLayoutToMain();
});

// --- Backup / restauracao da configuracao (dialogos nativos no processo) ---
