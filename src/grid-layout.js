const GUTTER_PX = 6;

function computeGridDims(n) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows };
}

function resetFractions(st) {
  if (!st) return;
  st.colFr = new Array(st.cols).fill(1);
  st.rowFr = new Array(st.rows).fill(1);
}

function buildGridTemplates(state) {
  const colTemplate = [];
  state.colFr.forEach((fr, idx) => {
    if (idx > 0) colTemplate.push(GUTTER_PX + 'px');
    colTemplate.push(fr + 'fr');
  });

  const rowTemplate = [];
  state.rowFr.forEach((fr, idx) => {
    if (idx > 0) rowTemplate.push(GUTTER_PX + 'px');
    rowTemplate.push(fr + 'fr');
  });

  return {
    colTemplate: colTemplate.join(' '),
    rowTemplate: rowTemplate.join(' '),
    cols: state.cols,
    rows: state.rows
  };
}

function calculatePaneLayout(gridEl) {
  if (!gridEl) return [];
  const rects = [];
  gridEl.querySelectorAll('.pane').forEach((paneEl) => {
    const id = Number(paneEl.dataset.id || paneEl.getAttribute('data-id'));
    if (!id) return;
    const header = paneEl.querySelector('.pane-header');
    if (!header) return;
    const paneRect = paneEl.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const width = Math.round(paneRect.width);
    const height = Math.round(paneRect.bottom - headerRect.bottom);
    if (width > 0 && height > 0) {
      rects.push({
        id,
        x: Math.round(paneRect.left),
        y: Math.round(headerRect.bottom),
        width,
        height
      });
    }
  });
  return rects;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GUTTER_PX,
    computeGridDims,
    resetFractions,
    buildGridTemplates,
    calculatePaneLayout
  };
}
