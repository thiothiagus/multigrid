import { Config } from './types.js';

let focusedPaneId: number | null = null;

function getFocusedPaneId(): number | null {
  return focusedPaneId;
}

function setFocusedPaneId(id: number | null): void {
  focusedPaneId = id;
}

function toggleFocusPane(id: number): number | null {
  if (focusedPaneId === id) {
    focusedPaneId = null;
  } else {
    focusedPaneId = id;
  }
  return focusedPaneId;
}

function updateFocusState(state: Config, gridEl: HTMLElement | null): void {
  if (!gridEl) return;

  if (focusedPaneId !== null && state.panes.some(p => p.id === focusedPaneId)) {
    gridEl.classList.add('has-focused-pane');
  } else {
    focusedPaneId = null;
    gridEl.classList.remove('has-focused-pane');
  }

  gridEl.querySelectorAll('.pane').forEach(paneEl => {
    const pId = Number((paneEl as HTMLElement).dataset.id || paneEl.getAttribute('data-id'));
    const isFocused = pId === focusedPaneId;
    paneEl.classList.toggle('is-focused', isFocused);
    const focusBtn = paneEl.querySelector('.focus-btn');
    if (focusBtn) {
      focusBtn.classList.toggle('is-active', isFocused);
      (focusBtn as HTMLElement).title = isFocused
        ? 'Restaurar grid (Sair do Foco)'
        : 'Focar painel (Modo Foco)';
      focusBtn.textContent = isFocused ? '\u2922' : '\u26F6';
    }
  });
}

function clearFocusIfMatches(id: number): void {
  if (focusedPaneId === id) {
    focusedPaneId = null;
  }
}

export {
  getFocusedPaneId,
  setFocusedPaneId,
  toggleFocusPane,
  updateFocusState,
  clearFocusIfMatches,
};
