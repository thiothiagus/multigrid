"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_URL = void 0;
exports.getConfigPath = getConfigPath;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.computeGridDims = computeGridDims;
exports.normalizeState = normalizeState;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.DEFAULT_URL = 'https://poke.idleworld.online/play';
function getConfigPath(userDataPath) {
    return path_1.default.join(userDataPath, 'multiconta-config.json');
}
function loadConfig(configPath) {
    try {
        const raw = fs_1.default.readFileSync(configPath, 'utf-8');
        return JSON.parse(raw);
    }
    catch (e) {
        return null;
    }
}
function saveConfig(configPath, config, logger) {
    try {
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    }
    catch (e) {
        if (logger)
            logger.error('io', 'Falha ao salvar configuracao', { error: e.message });
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
    if (!Array.isArray(st.panes))
        st.panes = [];
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
    if (!st.gameUrlDefault)
        st.gameUrlDefault = exports.DEFAULT_URL;
    st.panes.forEach((p) => {
        if (!p.label)
            p.label = 'Conta ' + p.id;
        if (!p.partition)
            p.partition = 'persist:conta' + p.id;
        if (!p.url)
            p.url = st.gameUrlDefault;
    });
    return st;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_URL: exports.DEFAULT_URL,
        getConfigPath,
        loadConfig,
        saveConfig,
        computeGridDims,
        normalizeState
    };
}
