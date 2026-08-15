const fs = require('fs');
const path = require('path');

let logDir = null;
let logFile = null;

function init(userDataPath, isPackaged = false) {
  logDir = isPackaged ? path.join(userDataPath, 'logs') : path.join(__dirname, 'logs');
  logFile = path.join(logDir, 'errors.jsonl');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch (_) {}

  process.on('uncaughtException', (err) => {
    error('uncaughtException', err.message, { stack: err.stack });
  });

  process.on('unhandledRejection', (reason) => {
    error('unhandledRejection', String(reason));
  });
}

function write(level, category, message, extra) {
  if (!logFile) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...extra
  };
  try {
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (_) {}
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
