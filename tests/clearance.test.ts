import { describe, it, expect } from 'vitest';
import {
  clearanceCookieUrl,
  importClearanceToPane,
  parseClearanceValue,
} from '../src/pane-manager.ts';

describe('importacao de cf_clearance (login pelo navegador)', () => {
  it('aceita token limpo e rejeita vazio/curto/com espacos', () => {
    expect(parseClearanceValue('abc123def456ghi789')).toBe('abc123def456ghi789');
    expect(parseClearanceValue('  abc123def456ghi789  ')).toBe('abc123def456ghi789');
    expect(parseClearanceValue('cf_clearance=abc123def456ghi789')).toBe('abc123def456ghi789');
    expect(parseClearanceValue('"abc123def456ghi789"')).toBe('abc123def456ghi789');
    expect(parseClearanceValue(null)).toBeNull();
    expect(parseClearanceValue('')).toBeNull();
    expect(parseClearanceValue('curto')).toBeNull();
    expect(parseClearanceValue('com espaco no meio do token')).toBeNull();
  });

  it('deriva a URL do cookie da origem do painel', () => {
    expect(clearanceCookieUrl('https://poke.idleworld.online/play')).toBe(
      'https://poke.idleworld.online/'
    );
    expect(clearanceCookieUrl('url-invalida')).toBe('https://poke.idleworld.online/');
    expect(clearanceCookieUrl(null)).toBe('https://poke.idleworld.online/');
  });

  it('grava cf_clearance seguro/httpOnly na sessao do painel', async () => {
    const setMock = async (details: Record<string, unknown>) => {
      expect(details).toMatchObject({
        url: 'https://poke.idleworld.online/',
        name: 'cf_clearance',
        value: 'abc123def456ghi789',
        secure: true,
        httpOnly: true,
      });
    };
    const entry = {
      view: { webContents: { session: { cookies: { set: setMock } } } },
    } as unknown as Parameters<typeof importClearanceToPane>[0];
    const res = await importClearanceToPane(
      entry,
      'https://poke.idleworld.online/play',
      'abc123def456ghi789'
    );
    expect(res).toEqual({ ok: true });
  });

  it('rejeita token invalido e painel inexistente sem tocar nos cookies', async () => {
    let called = false;
    const entry = {
      view: {
        webContents: {
          session: {
            cookies: {
              set: async () => {
                called = true;
              },
            },
          },
        },
      },
    } as unknown as Parameters<typeof importClearanceToPane>[0];
    expect(await importClearanceToPane(entry, 'https://poke.idleworld.online/play', '')).toEqual({
      ok: false,
      reason: 'invalid-token',
    });
    expect(
      await importClearanceToPane(null, 'https://poke.idleworld.online/play', 'abc123def456ghi789')
    ).toEqual({
      ok: false,
      reason: 'no-pane',
    });
    expect(called).toBe(false);
  });
});
