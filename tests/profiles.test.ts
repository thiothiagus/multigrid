import { describe, it, expect } from 'vitest';
import {
  GAME_PROFILES,
  DEFAULT_PROFILE_ID,
  getProfile,
  isValidProfileId,
  resolveProfileTitle,
  resolveProfileUrl,
} from '../src/profiles.ts';

describe('game profiles', () => {
  it('exposes PIW as the default profile', () => {
    expect(DEFAULT_PROFILE_ID).toBe('piw');
    expect(getProfile(DEFAULT_PROFILE_ID).label).toBe('MultiGrid PIW');
    expect(resolveProfileUrl('piw')).toBe('https://poke.idleworld.online/play');
  });

  it('falls back to the first profile for unknown ids', () => {
    expect(getProfile('jogo-que-nao-existe').id).toBe(GAME_PROFILES[0].id);
    expect(getProfile(null).id).toBe(GAME_PROFILES[0].id);
    expect(resolveProfileTitle(undefined)).toBe(GAME_PROFILES[0].label);
  });

  it('validates profile ids', () => {
    expect(isValidProfileId('piw')).toBe(true);
    expect(isValidProfileId('generic')).toBe(true);
    expect(isValidProfileId('pokegrid')).toBe(false);
    expect(isValidProfileId(null)).toBe(false);
  });

  it('keeps a generic profile without a fixed URL', () => {
    expect(resolveProfileUrl('generic')).toBe('');
    expect(resolveProfileTitle('generic')).toBe('MultiGrid');
  });
});
