# Revisão

- task: task-021
- reviewer: muse-spark
- type: critical
- created_at: 2026-08-26

## Resumo

Revisão crítica da correção de captura de erros JS nos logs: diff de `logger.ts`, `main.ts`, `preload.ts`, `renderer.ts`, `src/types.ts` e novo `tests/logger.test.ts` (8 testes). Objetivo era garantir que `logger.init()` seja chamado e que erros do renderer sejam encaminhados via IPC para `logs/errors.jsonl`.

## Itens verificados

- [x] `main.ts:192-193` chama `logger.init(app.getPath('userData'), app.isPackaged)` dentro de `app.whenReady()` antes de `migrateLegacyConfig` e `createWindow` — garante que `logFile` não é mais null para todos os `logger.error/info` subsequentes
- [x] `logger.ts:6,16-17` guarda `initialized` e torna `init` idempotente (segunda chamada atualiza `logDir/logFile` mas não duplica `process.on` listeners) — verificado por `tests/logger.test.ts:94-110`
- [x] `logger.ts:29-33` helper `__resetForTests` limpa estado entre testes; `module.exports` atualizado para expor helper
- [x] `main.ts:208-228` registra `ipcMain.on('renderer-error',...)` com validação de tipos, truncamento (message 2k, stack 4k, source/url 500) e try/catch para payload malformado
- [x] `preload.ts:30-38` expõe `logRendererError` via `contextBridge` usando `ipcRenderer.send('renderer-error', data)` (fire-and-forget, sem bloquear UI)
- [x] `src/types.ts:104-112` estende `WindowApi` com `logRendererError` tipado
- [x] `renderer.ts:30-73` instala `window.onerror` e `window.addEventListener('unhandledrejection')` no topo do módulo, antes de qualquer outro código, com guard `window.api?.logRendererError?.` para ambiente de teste jsdom/node
- [x] `renderer.ts` serializa `message, source, lineno, colno, stack, url, reason` corretamente; `location.href` guardado com `typeof location !== 'undefined'`
- [x] Testes `tests/logger.test.ts` (8): não grava antes de init, grava após init, init usa userDataPath quando packaged, warn/info, idempotência de listeners, atualização de path, handlers de uncaughtException/unhandledRejection gravam `level: error`
- [x] Quality gates: `npm test` 76/76 (68+8), `npm run lint` PASS (0 errors), `npm run typecheck` PASS, `riteward check` PASS
- [x] Build `npm run build` regenera `logger.js`, `main.js`, `preload.js`, `renderer.js` com grep confirmando `logger.init` e `renderer-error` nos artefatos
- [x] Verificação manual: `node -e "logger.init(...); logger.error('renderer',...)"` grava linha `level: error` em `logs/errors.jsonl`; `riteward logs check` passa a exibir 1 erro novo (antes: OK nenhum erro) e no segundo run marca como processado (offset 404)
- [x] Segurança: `renderer-error` valida campos string e ignora payload malformado; `sandbox: true` e `contextIsolation: true` mantidos

## Problemas encontrados

- Nenhum blocker
- info: `logs/errors.jsonl` contém agora 1 linha de teste manual `renderer error` (404 bytes) marcada como processada no `logs_state.json` offset 404 — arquivo é gitignored, não afeta commit, mas deixa rastro de verificação manual. Opcional: limpar ou manter como evidência de funcionamento.
- info: `__resetForTests` exposto em `module.exports` apenas para testes; não usado em produção, sem risco.
- info: erros muito precoces antes de `app.whenReady()` (definições de módulo) ainda não seriam capturados — aceito no plano, código antes de ready é só definição sem lógica que lance.

## Veredicto

**Aprovado** — todos os critérios de sucesso atendidos e gates verdes. Pronto para READY_FOR_COMMIT.

## Próximo passo

Avançar para READY_FOR_COMMIT e aguardar aprovação humana para commit. Após aprovação, `riteward workflow commit task-021 --yes` criará o commit. Push permanece desabilitado por constituição.
