import { BrowserView } from 'electron';
import type { Logger, PaneEntry } from './types';
import { scheduleRetry, cancelRetry } from './retry';

export interface PaneViewParams {
  win: import('electron').BrowserWindow | null;
  panes: Map<number, PaneEntry>;
  id: number;
  partition: string;
  url: string;
  logger: Logger;
  sendStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onLoadError?: (id: number, fromCrash: boolean) => void;
}

// NOTA (revert v1/v2): o app já tentou se passar por Chrome real (UA
// customizado + `Sec-CH-UA` reescritos). Isso plausivelmente fez o Google
// enxergar um "navegador novo/não reconhecido" e travar o login Google com
// step-up de passkey + "app pode não ser seguro". Fingerprint original do
// Electron restaurado de propósito: login Google funcionava com ele.
// Mantido apenas o que não mexe em identidade: anti-retry do challenge e
// importação de `cf_clearance` (opt-in explícito do usuário).
// ---------------------------------------------------------------------
// Importação de `cf_clearance` (fluxo "login pelo navegador").
// O challenge da Cloudflare só passa no navegador real; o usuário resolve
// lá uma vez, copia o cookie `cf_clearance` (F12 > Application > Cookies)
// e cola no painel. O login da conta em si continua dentro do painel.
// ---------------------------------------------------------------------

export function parseClearanceValue(input: string | undefined | null): string | null {
  if (!input) return null;
  let v = input.trim().replace(/^["']|["']$/g, '');
  const prefix = /^cf_clearance\s*=\s*/i;
  v = v.replace(prefix, '');
  // token opaco longo, sem espaços
  if (!v || /\s/.test(v) || v.length < 16) return null;
  return v;
}

export function clearanceCookieUrl(paneUrl: string | undefined | null): string {
  try {
    if (paneUrl) return new URL(paneUrl).origin + '/';
  } catch {
    // URL inválida — usa fallback abaixo
  }
  return 'https://poke.idleworld.online/';
}

export async function importClearanceToPane(
  entry: PaneEntry | undefined | null,
  paneUrl: string,
  value: string
): Promise<{ ok: boolean; reason?: string }> {
  const token = parseClearanceValue(value);
  if (!token) return { ok: false, reason: 'invalid-token' };
  if (!entry) return { ok: false, reason: 'no-pane' };
  try {
    await entry.view.webContents.session.cookies.set({
      url: clearanceCookieUrl(paneUrl),
      name: 'cf_clearance',
      value: token,
      secure: true,
      httpOnly: true,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'set-failed' };
  }
}

export function isCloudflareChallengeUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('cdn-cgi/challenge-platform') ||
    u.includes('challenges.cloudflare.com') ||
    u.includes('/cdn-cgi/') ||
    u.includes('cf_clearance') ||
    u.includes('__cf_') ||
    u.includes('turnstile')
  );
}

// Retorna true quando o `did-fail-load` NÃO deve disparar retry automático:
// - ERR_ABORTED (-3): abort normal durante redirects do challenge / subresources
// - URLs de challenge da Cloudflare: recarregar no meio da verificação
//   reinicia o "Verifying you are human" e causa o loop infinito.
export function shouldSuppressRetry(errorCode: number, validatedURL: string): boolean {
  if (errorCode === -3) return true;
  return isCloudflareChallengeUrl(validatedURL);
}

export function removePaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = false;
  entry.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  entry.view.webContents.close();
}

export function removePaneEntry(panes: Map<number, PaneEntry>, id: number): void {
  const entry = panes.get(id);
  if (entry) {
    removePaneView(entry);
    panes.delete(id);
  }
}

export function clearAllPanes(panes: Map<number, PaneEntry>): void {
  panes.forEach(entry => {
    removePaneView(entry);
  });
  panes.clear();
}

export function reloadPaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.view.webContents.reload();
}

export function backPaneView(entry: PaneEntry): void {
  if (!entry) return;
  if (entry.view.webContents.canGoBack()) {
    entry.view.webContents.goBack();
  }
}

export function clearPaneDataView(entry: PaneEntry): void {
  if (!entry) return;
  entry.view.webContents.session.clearStorageData();
  entry.view.webContents.reload();
}

function showPaneView(entry: PaneEntry): void {
  if (!entry) return;
  entry.visible = true;
  if (entry.bounds) entry.view.setBounds(entry.bounds);
}

function createPaneView({
  win,
  panes,
  id,
  partition,
  url,
  logger,
  sendStatus,
  onLoadError,
}: PaneViewParams): boolean {
  if (!win || panes.has(id)) return false;

  const view = new BrowserView({
    webPreferences: {
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // Fingerprint original do Electron preservado de propósito (ver nota
  // no topo do arquivo): spoof de identidade quebrou o login Google.
  win.addBrowserView(view);
  view.webContents.loadURL(url);

  view.webContents.setWindowOpenHandler(({ url: popupUrl }) => {
    if (!popupUrl || !/^https?:/i.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up bloqueado (URL invalida)', { paneId: id, popupUrl });
      return { action: 'deny' };
    }
    const authDomains =
      /accounts\.google\.com|discord\.com\/oauth2|facebook\.com\/dialog|github\.com\/login/i;
    if (authDomains.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up OAuth permitido', { paneId: id, popupUrl });
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    const pokepediaDomain = /pokeapi\.co|bulbapedia\.bob\.ee|serebii\.net|pokemondb\.net/i;
    if (pokepediaDomain.test(popupUrl)) {
      if (logger) logger.info('popup', 'Pop-up Poképédia permitido', { paneId: id, popupUrl });
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1000,
          height: 800,
          webPreferences: { partition, nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    if (logger) logger.info('popup', 'Pop-up bloqueado', { paneId: id, popupUrl });
    return { action: 'deny' };
  });

  view.webContents.on(
    'did-fail-load',
    (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignora falhas de subframes/recursos: só o frame principal deve
      // disparar overlay de erro + retry. Isso evita que um abort de
      // subrecurso do challenge reinicie a verificação.
      if (isMainFrame === false) return;
      // Não interrompe o challenge da Cloudflare no meio da verificação:
      // recarregar aqui reinicia o "Verifying you are human" em loop.
      if (shouldSuppressRetry(errorCode, validatedURL)) {
        if (logger)
          logger.info('load', 'Falha ignorada (challenge Cloudflare/abort)', {
            paneId: id,
            url: validatedURL,
            errorCode,
          });
        return;
      }
      if (logger)
        logger.error('load', `Falha ao carregar: ${errorDescription}`, {
          paneId: id,
          url: validatedURL,
          errorCode,
        });
      sendStatus(id, 'error', { errorCode, errorDescription, validatedURL });
      if (onLoadError) onLoadError(id, false);
    }
  );

  view.webContents.on('did-finish-load', () => {
    sendStatus(id, 'loaded');
  });

  view.webContents.on('page-title-updated', (_, title) => {
    sendStatus(id, 'title', { title });
  });

  panes.set(id, {
    view,
    visible: true,
    bounds: undefined,
    retryCount: 0,
  });
  return true;
}

export { createPaneView, showPaneView, scheduleRetry, cancelRetry };
