import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as logger from '../logger.ts';

describe('logger module', () => {
  let tmpDir: string;
  let beforeUE: number;
  let beforeUR: number;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
    beforeUE = process.listenerCount('uncaughtException');
    beforeUR = process.listenerCount('unhandledRejection');
    // @ts-expect-error - helper de teste
    if (
      typeof (logger as unknown as { __resetForTests?: () => void }).__resetForTests === 'function'
    ) {
      (logger as unknown as { __resetForTests: () => void }).__resetForTests();
    }
  });

  afterEach(() => {
    // remover listeners adicionados pelo init
    const ueListeners = process.listeners('uncaughtException');
    for (let i = ueListeners.length - 1; i >= beforeUE; i--) {
      try {
        process.removeListener('uncaughtException', ueListeners[i] as (...args: unknown[]) => void);
      } catch {
        // ignorar
      }
    }
    const urListeners = process.listeners('unhandledRejection');
    for (let i = urListeners.length - 1; i >= beforeUR; i--) {
      try {
        process.removeListener(
          'unhandledRejection',
          urListeners[i] as (...args: unknown[]) => void
        );
      } catch {
        // ignorar
      }
    }
    // @ts-expect-error - helper de teste
    if (
      typeof (logger as unknown as { __resetForTests?: () => void }).__resetForTests === 'function'
    ) {
      (logger as unknown as { __resetForTests: () => void }).__resetForTests();
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('nao grava nada antes de init (logFile nulo)', () => {
    // garante que logFile ainda é null
    expect(logger.getLogPath()).toBeNull();
    // nao deve lancar e nao deve criar arquivo em tmp
    logger.error('test', 'mensagem antes do init');
    const logPath = path.join(tmpDir, 'logs', 'errors.jsonl');
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it('init com isPackaged=true usa userDataPath/logs', () => {
    logger.init(tmpDir, true);
    const expected = path.join(tmpDir, 'logs', 'errors.jsonl');
    expect(logger.getLogPath()).toBe(expected);
    expect(fs.existsSync(path.join(tmpDir, 'logs'))).toBe(true);
  });

  it('grava entrada level error apos init', () => {
    logger.init(tmpDir, true);
    logger.error('renderer', 'erro teste', { stack: 'stack-trace', url: 'http://ex' });
    const logPath = logger.getLogPath()!;
    const raw = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
    expect(raw.length).toBe(1);
    const entry = JSON.parse(raw[0]);
    expect(entry.level).toBe('error');
    expect(entry.category).toBe('renderer');
    expect(entry.message).toBe('erro teste');
    expect(entry.stack).toBe('stack-trace');
    expect(entry.url).toBe('http://ex');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('grava warn e info quando solicitado', () => {
    logger.init(tmpDir, true);
    logger.warn('io', 'aviso');
    logger.info('app', 'info msg');
    const logPath = logger.getLogPath()!;
    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(2);
    const warnEntry = JSON.parse(lines[0]);
    const infoEntry = JSON.parse(lines[1]);
    expect(warnEntry.level).toBe('warn');
    expect(infoEntry.level).toBe('info');
  });

  it('init e idempotente: segunda chamada nao duplica listeners', () => {
    logger.init(tmpDir, true);
    const afterFirstUE = process.listenerCount('uncaughtException');
    const afterFirstUR = process.listenerCount('unhandledRejection');
    expect(afterFirstUE).toBe(beforeUE + 1);
    expect(afterFirstUR).toBe(beforeUR + 1);

    logger.init(tmpDir, true);
    expect(process.listenerCount('uncaughtException')).toBe(afterFirstUE);
    expect(process.listenerCount('unhandledRejection')).toBe(afterFirstUR);

    // logFile ainda deve estar correto e gravar apenas uma vez por chamada
    logger.error('test', 'segunda chamada');
    const logPath = logger.getLogPath()!;
    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(1);
  });

  it('atualiza logFile mesmo quando ja inicializado (idempotencia de path)', () => {
    const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test2-'));
    try {
      logger.init(tmpDir, true);
      const firstPath = logger.getLogPath();
      logger.init(tmp2, true);
      const secondPath = logger.getLogPath();
      expect(firstPath).toBe(path.join(tmpDir, 'logs', 'errors.jsonl'));
      expect(secondPath).toBe(path.join(tmp2, 'logs', 'errors.jsonl'));
      // listeners nao duplicaram
      expect(process.listenerCount('uncaughtException')).toBe(beforeUE + 1);
    } finally {
      fs.rmSync(tmp2, { recursive: true, force: true });
    }
  });

  it('handlers de uncaughtException gravam no arquivo', () => {
    logger.init(tmpDir, true);
    const err = new Error('boom main');
    err.stack = 'stack boom';
    // emitir manualmente o evento
    process.emit('uncaughtException', err);
    const logPath = logger.getLogPath()!;
    const entry = JSON.parse(fs.readFileSync(logPath, 'utf-8').trim().split('\n').pop()!);
    expect(entry.level).toBe('error');
    expect(entry.category).toBe('uncaughtException');
    expect(entry.message).toBe('boom main');
    expect(entry.stack).toBe('stack boom');
  });

  it('handlers de unhandledRejection gravam no arquivo', () => {
    logger.init(tmpDir, true);
    process.emit('unhandledRejection', 'rejection reason', Promise.resolve());
    const logPath = logger.getLogPath()!;
    const entry = JSON.parse(fs.readFileSync(logPath, 'utf-8').trim().split('\n').pop()!);
    expect(entry.level).toBe('error');
    expect(entry.category).toBe('unhandledRejection');
    expect(entry.message).toBe('rejection reason');
  });
});
