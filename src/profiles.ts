// Catálogo de perfis de jogo (interfaces dedicadas) do MultiGrid.
//
// Cada perfil é UMA ENTRADA DE DADOS: id + rótulo + URL padrão. Adicionar um
// novo jogo = acrescentar um item em GAME_PROFILES (e uma <option> no setup).
// Sem forks, sem código por jogo.
//
// NOTA CommonJS: este módulo roda no main (require) e no renderer (ESM).
// Manter sem imports runtime — só tipos — igual ao padrão de src/theme.ts,
// senão o build ESM do renderer sobrescreve o src/*.js usado pelo main.

export interface GameProfile {
  id: string;
  /** Rótulo exibido na toolbar quando o perfil está ativo. */
  label: string;
  /** URL padrão preenchida no setup para este perfil. '' = genérico (usuário digita). */
  url: string;
  /** Texto curto de ajuda no setup. */
  description: string;
}

export const PIW_URL = 'https://poke.idleworld.online/play';

export const DEFAULT_PROFILE_ID = 'piw';

export const GAME_PROFILES: readonly GameProfile[] = [
  {
    id: 'piw',
    label: 'MultiGrid PIW',
    url: PIW_URL,
    description: 'Interface dedicada ao Poke Idle World.',
  },
  {
    id: 'generic',
    label: 'MultiGrid',
    url: '',
    description: 'Grade genérica — digite a URL de qualquer site/jogo.',
  },
];

export function getProfile(id: string | undefined | null): GameProfile {
  const found = GAME_PROFILES.find(p => p.id === id);
  return found ?? GAME_PROFILES[0];
}

export function isValidProfileId(id: unknown): id is string {
  return typeof id === 'string' && GAME_PROFILES.some(p => p.id === id);
}

/** Título da toolbar para o perfil (ex.: "MultiGrid PIW"). */
export function resolveProfileTitle(id: string | undefined | null): string {
  return getProfile(id).label;
}

/** URL padrão do perfil ('' quando genérico = usuário digita). */
export function resolveProfileUrl(id: string | undefined | null): string {
  return getProfile(id).url;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PIW_URL,
    DEFAULT_PROFILE_ID,
    GAME_PROFILES,
    getProfile,
    isValidProfileId,
    resolveProfileTitle,
    resolveProfileUrl,
  };
}
