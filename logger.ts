import fs from 'fs';
import path from 'path';

let logDir: string | null = null;
let logFile: string | null = null;

export function init(userDataPath: string, isPackaged: boolean = false): void {
  logDir = isPackaged ? path.join(userDataPath, 'logs') : path.join(__dirname, 'logs');
  logFile = path.join(logDir, 'errors.jsonl');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch (_) {}

  process.on('uncaughtException', (err: Error) => {
    error('uncaughtException', err.message, { stack: err.stack });
  });

  process.on('unhandledRejection', (reason: unknown) => {
    error('unhandledRejection', String(reason));
  });
}

export function write(level: string, category: string, message: string, extra?: Record<string, unknown>): void {
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

export function error(category: string, message: string, extra?: Record<string, unknown>): void {
  write('error', category, message, extra);
}

export function warn(category: string, message: string, extra?: Record<string, unknown>): void {
  write('warn', category, message, extra);
}

export function info(category: string, message: string, extra?: Record<string, unknown>): void {
  write('info', category, message, extra);
}

export function getLogPath(): string | null {
  return logFile;
}

module.exports = { init, error, warn, info, getLogPath };
