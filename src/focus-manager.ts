// focus-manager.js - Módulo de gerenciamento de foco (Modo Foco)

let focusedPaneId = null;

function getFocusedPaneId() {
  return focusedPaneId;
}

function setFocusedPaneId(id) {
  focusedPaneId = id;
}

function toggleFocusPane(id) {
  if (focusedPaneId === id) {
    focusedPaneId = null;
  } else {
    focusedPaneId = id;
  }
  return focusedPaneId;
}

function updateFocusState(state, gridEl) {
  if (!gridEl) return;

  if (focusedPaneId !== null && state.panes.some(p => p.id === focusedPaneId)) {
    gridEl.classList.add('has-focused-pane');
  } else {
    focusedPaneId = null;
    gridEl.classList.remove('has-focused-pane');
  }

  gridEl.querySelectorAll('.pane').forEach(paneEl => {
    const pId = Number(paneEl.dataset.id || paneEl.getAttribute('data-id'));
    const isFocused = pId === focusedPaneId;
    paneEl.classList.toggle('is-focused', isFocused);
    const focusBtn = paneEl.querySelector('.focus-btn');
    if (focusBtn) {
      focusBtn.classList.toggle('is-active', isFocused);
      focusBtn.title = isFocused ? 'Restaurar grid (Sair do Foco)' : 'Focar painel (Modo Foco)';
      focusBtn.textContent = isFocused ? '\u2922' : '\u26F6';
    }
  });
}

function clearFocusIfMatches(id) {
  if (focusedPaneId === id) {
    focusedPaneId = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFocusedPaneId,
    setFocusedPaneId,
    toggleFocusPane,
    updateFocusState,
    clearFocusIfMatches,
  };
}

export {
  getFocusedPaneId,
  setFocusedPaneId,
  toggleFocusPane,
  updateFocusState,
  clearFocusIfMatches,
};
