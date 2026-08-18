"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
exports.write = write;
exports.error = error;
exports.warn = warn;
exports.info = info;
exports.getLogPath = getLogPath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let logDir = null;
let logFile = null;
function init(userDataPath, isPackaged = false) {
    logDir = isPackaged ? path_1.default.join(userDataPath, 'logs') : path_1.default.join(__dirname, 'logs');
    logFile = path_1.default.join(logDir, 'errors.jsonl');
    try {
        if (!fs_1.default.existsSync(logDir))
            fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    catch {
        // ignorar falha ao criar diretorio de log
    }
    process.on('uncaughtException', (err) => {
        error('uncaughtException', err.message, { stack: err.stack });
    });
    process.on('unhandledRejection', (reason) => {
        error('unhandledRejection', String(reason));
    });
}
function write(level, category, message, extra) {
    if (!logFile)
        return;
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        ...extra,
    };
    try {
        fs_1.default.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    }
    catch {
        // ignorar erro ao gravar log no arquivo
    }
}
function error(category, message, extra) {
    write('error', category, message, extra);
}
function warn(category, message, extra) {
    write('warn', category, message, extra);
}
function info(category, message, extra) {
    write('info', category, message, extra);
}
function getLogPath() {
    return logFile;
}
module.exports = { init, error, warn, info, getLogPath };
