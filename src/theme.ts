export type ThemePreference = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

const THEME_VALUES: readonly string[] = ['light', 'dark', 'system'];

interface ThemeRoot {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export function isValidTheme(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_VALUES.includes(value);
}

// 'system' delega para o SO; 'light'/'dark' sao escolhas explicitas do usuario.
export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark ? 'dark' : 'light';
  return pref;
}

// Toggle binario na toolbar: a proxima preferencia e sempre o oposto do tema
// que esta em tela (independe de a atual vir do SO ou de escolha explicita).
export function nextThemePreference(
  current: ThemePreference,
  systemPrefersDark: boolean
): ThemePreference {
  return resolveTheme(current, systemPrefersDark) === 'dark' ? 'light' : 'dark';
}

// O escuro e o default no CSS (:root), entao so marcamos quando o resolvido e claro.
export function applyTheme(
  root: ThemeRoot,
  pref: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  const resolved = resolveTheme(pref, systemPrefersDark);
  if (resolved === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  return resolved;
}
