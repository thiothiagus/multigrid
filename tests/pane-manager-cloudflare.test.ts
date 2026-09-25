import { describe, it, expect } from 'vitest';
import { isCloudflareChallengeUrl, shouldSuppressRetry } from '../src/pane-manager.ts';

// NOTA: o spoof de identidade (UA customizado + Sec-CH-UA) foi revertido:
// plausivelmente fez o Google tratar o app como "navegador novo" e travar
// o login Google (passkey + "app pode não ser seguro"). Fingerprint
// original do Electron restaurado. Resta aqui só o anti-retry, que não
// mexe em identidade.

describe('cloudflare anti-retry (sem reload no meio do challenge)', () => {
  it('detecta URLs de challenge da Cloudflare', () => {
    expect(
      isCloudflareChallengeUrl('https://poke.idleworld.online/cdn-cgi/challenge-platform/h/g')
    ).toBe(true);
    expect(isCloudflareChallengeUrl('https://challenges.cloudflare.com/turnstile/v0/api.js')).toBe(
      true
    );
    expect(isCloudflareChallengeUrl('https://example.com/?__cf_chl_tk=abc')).toBe(true);
    expect(isCloudflareChallengeUrl('https://example.com/turnstile/widget')).toBe(true);
    expect(isCloudflareChallengeUrl('https://poke.idleworld.online/play')).toBe(false);
    expect(isCloudflareChallengeUrl(null)).toBe(false);
    expect(isCloudflareChallengeUrl(undefined)).toBe(false);
  });

  it('suprime retry em ERR_ABORTED (-3) e challenge Cloudflare', () => {
    expect(shouldSuppressRetry(-3, 'https://poke.idleworld.online/play')).toBe(true);
    expect(
      shouldSuppressRetry(-501, 'https://poke.idleworld.online/cdn-cgi/challenge-platform/h/g')
    ).toBe(true);
    expect(shouldSuppressRetry(-105, 'https://poke.idleworld.online/play')).toBe(false);
    expect(shouldSuppressRetry(-106, 'https://poke.idleworld.online/play')).toBe(false);
  });
});
