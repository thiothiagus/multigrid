'use strict';

let state = { panes: [] };
let persistTimer = null;
let syncScheduled = false;

function persist() {
  clearTimeout(persistTimer);
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
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('grid-container').classList.add('hidden');
}

function hideSetup() {
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('grid-container').classList.remove('hidden');
}

function initFromScratch(n, url) {
  const dims = computeGridDims(n);
  state = {
    gameUrlDefault: url,
    nextId: n + 1,
    cols: dims.cols,
    rows: dims.rows,
    colFr: new Array(dims.cols).fill(1),
    rowFr: new Array(dims.rows).fill(1),
    panes: []
  };
  for (let i = 1; i <= n; i++) {
    state.panes.push({ id: i, label: 'Conta ' + i, partition: 'persist:conta' + i, url });
  }
  render();
  persist();
}

// ---------------------------------------------------------------------
// Adicionar / remover contas
// ---------------------------------------------------------------------

async function addPane() {
  const id = state.nextId++;
  const pane = { id, label: 'Conta ' + id, partition: 'persist:conta' + id, url: state.gameUrlDefault || DEFAULT_URL };
  state.panes.push(pane);

  const dims = computeGridDims(state.panes.length);
  state.cols = dims.cols;
  state.rows = dims.rows;
  resetFractions();

  render(); // paineis existentes NAO sao recriados, so o novo espaco abre
  await window.api.createPane(pane);
  syncLayoutToMain();
  persist();
}

async function removePane(id) {
  state.panes = state.panes.filter((p) => p.id !== id);
  await window.api.removePane(id);

  if (state.panes.length === 0) {
    render();
    persist();
    return;
  }

  const dims = computeGridDims(state.panes.length);
  state.cols = dims.cols;
  state.rows = dims.rows;
  resetFractions();

  render(); // os paineis que sobraram continuam rodando, sem recarregar
  syncLayoutToMain();
  persist();
}

// Reordena a grade: move a conta de fromId para a posicao de toId. So a
// ordem no array muda (a posicao de cada BrowserView vem do indice no
// render()), entao nenhuma sessao e recriada no processo.
function movePane(fromId, toId) {
  const fromIdx = state.panes.findIndex((p) => p.id === fromId);
  const toIdx = state.panes.findIndex((p) => p.id === toId);
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

function createPaneElement(pane) {
  const el = document.createElement('div');
  el.className = 'pane';
  el.dataset.id = String(pane.id);

  const header = document.createElement('div');
  header.className = 'pane-header';

  // Alça de arrasto: permite reordenar a conta na grade sem recriar a
  // sessao (as BrowserViews sao chaveadas por id, nao por posicao).
  const grip = document.createElement('span');
  grip.className = 'drag-grip';
  grip.textContent = '\u283F'; // "⠿" (grip)
  grip.title = 'Arrastar para reordenar';
  grip.draggable = true;

  grip.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', String(pane.id));
    e.dataTransfer.effectAllowed = 'move';
    header.classList.add('dragging');
  });
  grip.addEventListener('dragend', () => {
    header.classList.remove('dragging');
    document.querySelectorAll('.pane-header.drag-over').forEach((h) => h.classList.remove('drag-over'));
  });

  el.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      header.classList.add('drag-over');
    }
  });
  el.addEventListener('dragleave', () => header.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    header.classList.remove('drag-over');
    const fromId = Number(e.dataTransfer.getData('text/plain'));
    if (fromId !== pane.id) movePane(fromId, pane.id);
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
  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
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

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '\u232B'; // "⌫" (apagar)
  clearBtn.title = 'Limpar dados desta conta (reset do login)';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00D7';
  closeBtn.title = 'Fechar esta conta';
  closeBtn.className = 'close-btn';

  actions.appendChild(backBtn);
  actions.appendChild(reloadBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(closeBtn);

  header.appendChild(grip);
  header.appendChild(labelWrap);
  header.appendChild(actions);

  // Area reservada para a BrowserView nativa (nao e um <webview> -- o
  // processo principal desenha o conteudo real por cima deste espaco,
  // usando setBounds com as coordenadas calculadas em syncLayoutToMain()).
  const body = document.createElement('div');
  body.className = 'pane-body';

  const overlay = document.createElement('div');
  overlay.className = 'pane-overlay hidden';
  const overlayMsg = document.createElement('span');
  overlayMsg.className = 'overlay-msg';
  const overlayBtn = document.createElement('button');
  overlayBtn.textContent = 'Tentar novamente';
  overlay.appendChild(overlayMsg);
  overlay.appendChild(overlayBtn);

  reloadBtn.addEventListener('click', () => window.api.reloadPane(pane.id));
  backBtn.addEventListener('click', () => window.api.backPane(pane.id));
  clearBtn.addEventListener('click', () => {
    if (window.confirm('Limpar todos os dados (login, cookies, cache) desta conta? O painel será recarregado.')) {
      window.api.clearPaneData(pane.id);
    }
  });
  closeBtn.addEventListener('click', () => removePane(pane.id));
  overlayBtn.addEventListener('click', () => window.api.reloadPane(pane.id));

  el.appendChild(header);
  el.appendChild(body);
  el.appendChild(overlay);
  return el;
}

// ---------------------------------------------------------------------
// Grade (CSS Grid com "trilhos" de 6px intercalados para os resizers)
// ---------------------------------------------------------------------

function applyGridTemplate() {
  const gridEl = document.getElementById('grid-container');
  const colTemplate = [];
  state.colFr.forEach((f, i) => {
    colTemplate.push(f.toFixed(4) + 'fr');
    if (i < state.colFr.length - 1) colTemplate.push(GUTTER_PX + 'px');
  });
  const rowTemplate = [];
  state.rowFr.forEach((f, i) => {
    rowTemplate.push(f.toFixed(4) + 'fr');
    if (i < state.rowFr.length - 1) rowTemplate.push(GUTTER_PX + 'px');
  });
  gridEl.style.gridTemplateColumns = colTemplate.join(' ');
  gridEl.style.gridTemplateRows = rowTemplate.join(' ');
  return { colTemplate, rowTemplate };
}

function startColResize(g) {
  const gridEl = document.getElementById('grid-container');
  return function onMouseDown(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startFrG = state.colFr[g];
    const startFrG1 = state.colFr[g + 1];
    const totalFr = state.colFr.reduce((a, b) => a + b, 0);
    const gutterPx = GUTTER_PX * (state.colFr.length - 1);
    const contentWidth = gridEl.clientWidth - gutterPx;
    const minFr = totalFr * 0.08;

    function onMove(ev) {
      const deltaFr = ((ev.clientX - startX) / contentWidth) * totalFr;
      let newG = startFrG + deltaFr;
      let newG1 = startFrG1 - deltaFr;
      if (newG < minFr) { newG = minFr; newG1 = startFrG + startFrG1 - minFr; }
      if (newG1 < minFr) { newG1 = minFr; newG = startFrG + startFrG1 - minFr; }
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

function startRowResize(g) {
  const gridEl = document.getElementById('grid-container');
  return function onMouseDown(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startFrG = state.rowFr[g];
    const startFrG1 = state.rowFr[g + 1];
    const totalFr = state.rowFr.reduce((a, b) => a + b, 0);
    const gutterPx = GUTTER_PX * (state.rowFr.length - 1);
    const contentHeight = gridEl.clientHeight - gutterPx;
    const minFr = totalFr * 0.08;

    function onMove(ev) {
      const deltaFr = ((ev.clientY - startY) / contentHeight) * totalFr;
      let newG = startFrG + deltaFr;
      let newG1 = startFrG1 - deltaFr;
      if (newG < minFr) { newG = minFr; newG1 = startFrG + startFrG1 - minFr; }
      if (newG1 < minFr) { newG1 = minFr; newG = startFrG + startFrG1 - minFr; }
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

// Reconstroi a grade (cabecalhos + areas reservadas + resizers). So chamada
// em mudancas estruturais (iniciar, adicionar, remover conta). As
// BrowserViews em si nao sao recriadas aqui -- so posicionadas depois via
// syncLayoutToMain().
function render() {
  const gridEl = document.getElementById('grid-container');
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
    paneEl.style.gridColumnStart = colLine;
    paneEl.style.gridRowStart = rowLine;

    const isLastRow = row === rows - 1;
    const itemsInLastRow = state.panes.length - (rows - 1) * cols;
    paneEl.style.gridColumnEnd = (isLastRow && itemsInLastRow < cols)
      ? String(2 * cols)
      : String(colLine + 1);
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

  syncLayoutToMain();
}

// ---------------------------------------------------------------------
// Inicializacao
// ---------------------------------------------------------------------

document.getElementById('add-pane-btn').addEventListener('click', addPane);
document.getElementById('setup-start-btn').addEventListener('click', async () => {
  const n = Math.max(1, Math.min(9, parseInt(document.getElementById('setup-count').value, 10) || 4));
  const url = document.getElementById('setup-url').value.trim() || DEFAULT_URL;
  initFromScratch(n, url);
  for (const pane of state.panes) {
    await window.api.createPane(pane);
  }
  syncLayoutToMain();
});

// --- Backup / restauracao da configuracao (dialogos nativos no processo) ---

document.getElementById('export-config-btn').addEventListener('click', async () => {
  const res = await window.api.exportConfig();
  if (res && res.ok) {
    window.alert('Configuração exportada para:\n' + res.path);
  }
});

document.getElementById('import-config-btn').addEventListener('click', async () => {
  const config = await window.api.importConfig();
  if (!config) {
    window.alert('Nenhum arquivo de backup válido selecionado.');
    return;
  }
  const msg = 'Importar vai substituir a configuração atual (' + state.panes.length +
    ' contas) pelas ' + config.panes.length + ' contas do backup. Continuar?';
  if (!window.confirm(msg)) return;
  await applyImportedConfig(config);
});

async function applyImportedConfig(config) {
  for (const pane of state.panes) {
    await window.api.removePane(pane.id);
  }
  state = normalizeState(config);
  render();
  for (const pane of state.panes) {
    await window.api.createPane(pane);
  }
  syncLayoutToMain();
  persist();
}

window.addEventListener('resize', syncLayoutToMain);

window.addEventListener('DOMContentLoaded', async () => {
  window.api.onPaneStatus(({ id, status, extra }) => updatePaneStatus(id, status, extra));

  const saved = await window.api.loadConfig();
  if (saved && Array.isArray(saved.panes) && saved.panes.length > 0) {
    state = normalizeState(saved);
    render();
    for (const pane of state.panes) {
      await window.api.createPane(pane);
    }
    syncLayoutToMain();
  } else {
    showSetup();
  }
});
