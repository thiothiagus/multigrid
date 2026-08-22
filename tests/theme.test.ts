import { describe, it, expect } from 'vitest';
import { applyTheme, isValidTheme, nextThemePreference, resolveTheme } from '../src/theme.ts';

describe('isValidTheme', () => {
  it('aceita os tres valores validos', () => {
    expect(isValidTheme('light')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('system')).toBe(true);
  });

  it('rejeita valores invalidos', () => {
    expect(isValidTheme('blue')).toBe(false);
    expect(isValidTheme('')).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(42)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('"system" segue a preferencia do SO', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('preferencia explicita ignora o SO', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
});

describe('nextThemePreference', () => {
  it('tema escuro em tela -> proxima preferencia e clara', () => {
    expect(nextThemePreference('dark', true)).toBe('light');
    expect(nextThemePreference('system', true)).toBe('light');
  });

  it('tema claro em tela -> proxima preferencia e escura', () => {
    expect(nextThemePreference('light', false)).toBe('dark');
    expect(nextThemePreference('system', false)).toBe('dark');
  });

  it('toggle binario: alternar duas vezes volta ao ponto de partida', () => {
    let pref = nextThemePreference('system', false);
    pref = nextThemePreference(pref, false);
    expect(resolveTheme(pref, false)).toBe('light');
  });
});

describe('applyTheme', () => {
  function fakeRoot() {
    const attrs = new Map<string, string>();
    return {
      setAttribute: (name: string, value: string) => attrs.set(name, value),
      removeAttribute: (name: string) => attrs.delete(name),
      has: (name: string) => attrs.has(name),
      get: (name: string) => attrs.get(name),
    };
  }

  it('marca data-theme="light" quando o resolvido e claro', () => {
    const root = fakeRoot();
    const resolved = applyTheme(root, 'light', true);
    expect(resolved).toBe('light');
    expect(root.has('data-theme')).toBe(true);
    expect(root.get('data-theme')).toBe('light');
  });

  it('remove data-theme quando o resolvido e escuro (default no CSS)', () => {
    const root = fakeRoot();
    applyTheme(root, 'light', true);
    const resolved = applyTheme(root, 'system', true);
    expect(resolved).toBe('dark');
    expect(root.has('data-theme')).toBe(false);
  });
});
