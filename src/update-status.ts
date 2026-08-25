import type { UpdateStatusPayload } from './types';

type RawInfo = { version?: string } | null | undefined;

// Converte os eventos do electron-updater em um payload estavel para a UI.
// Mantido puro (sem electron) para ser testado sem mocks pesados.
// Este modulo e usado apenas no processo principal (CommonJS); os tipos do
// payload ficam em src/types.ts para nao entrar no programa ESM do renderer.
export function mapUpdaterEventToPayload(
  event:
    | 'checking-for-update'
    | 'update-available'
    | 'update-not-available'
    | 'download-progress'
    | 'update-downloaded'
    | 'error',
  info?: RawInfo,
  extra?: { percent?: number; message?: string }
): UpdateStatusPayload {
  switch (event) {
    case 'checking-for-update':
      return { status: 'checking' };
    case 'update-available':
      return { status: 'available', version: info?.version };
    case 'update-not-available':
      return { status: 'not-available', version: info?.version };
    case 'download-progress': {
      const percent = typeof extra?.percent === 'number' ? Math.round(extra.percent) : 0;
      const clamped = Math.max(0, Math.min(100, percent));
      return { status: 'downloading', version: info?.version, progress: clamped };
    }
    case 'update-downloaded':
      return { status: 'downloaded', version: info?.version };
    case 'error':
      return {
        status: 'error',
        message: extra?.message ? String(extra.message) : undefined,
      };
  }
}
