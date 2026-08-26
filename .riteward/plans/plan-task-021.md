# Plano: Capturar erros de JavaScript nos logs (logger.init nunca chamado)

- task: task-021
- author: muse-spark
- created_at: 2026-08-26

## Contexto

`logger.ts:7` exporta `init(userDataPath, isPackaged)` que define `logFile` e registra handlers `process.on('uncaughtException')` / `unhandledRejection`. O handler grava em `logs/errors.jsonl` via `logger.error`. Porém `main.ts:1-213` importa `logger` mas **nunca chama `logger.init()`** — confirmado por grep e por review da task-005. Consequência: `logFile === null`, `write()` retorna cedo em `logger.ts:31` e **todos** os `logger.info/error` existentes (pane-manager, retry, updater, win-state, config) são descartados. `logs/errors.jsonl` contém só 2 linhas antigas `level: info` filtradas pelo `riteward logs check`. Erros JS do main aparecem só como dialog do Electron; erros do renderer (window.onerror) são perdidos.

## Objetivo

Garantir que qualquer erro JS não tratado — no main (uncaughtException/unhandledRejection) e no renderer (onerror/unhandledrejection) — seja persistido em `logs/errors.jsonl` como JSONL `level: error` e visível via `riteward logs check`.

## Abordagem

Correção mínima, sem novas dependências, seguindo padrão existente (preload bridge + ipcMain):

1. **Main (`main.ts`)**: chamar `logger.init(app.getPath('userData'), app.isPackaged)` o mais cedo possível dentro de `app.whenReady()` (antes de `createWindow()` e `migrateLegacyConfig`). `app.getPath` só é seguro após ready; registrar handlers antes disso seria frágil. Documentar por que não no topo do módulo.

2. **Logger (`logger.ts`)**: tornar `init` idempotente — guard `initialized` para não registrar handlers duplicados em caso de chamada dupla ou HMR de teste. Manter `logDir` creation com `fs.mkdirSync` e try/catch existente.

3. **Preload (`preload.ts`)**: expor `logRendererError(payload)` via `contextBridge` que faz `ipcRenderer.send('renderer-error', payload)`. Usar `send` (fire-and-forget) para não bloquear UI em caso de erro.

4. **Main handler**: `ipcMain.on('renderer-error', (_e, data) => logger.error('renderer', data.message ?? 'renderer error', {stack, url, ...}))` com validação e truncamento para evitar payload gigante.

5. **Renderer (`renderer.ts`)**: instalar no topo do módulo (antes de qualquer outro código) `window.onerror` e `window.addEventListener('unhandledrejection')` que serializam erro e chamam `window.api.logRendererError`. Guard para `window.api` existir em testes (vitest/jsdom).

6. **Types (`src/types.ts`)**: adicionar `logRendererError` à `WindowApi`.

Alternativa considerada e descartada: chamar `logger.init` no topo do módulo com fallback `path.join(__dirname,'logs')` antes de ready — introduz duplicidade e path diferente do userData em dev; preferir chamada única dentro de `whenReady` que já é o primeiro ponto confiável.

## Passos

1. Ajustar `logger.ts` para idempotência + export de tipo compatível.
2. Alterar `main.ts`: importar se necessário `app` já importado, adicionar `logger.init(...)` dentro de `whenReady().then` antes de `migrateLegacyConfig`, e registrar `ipcMain.on('renderer-error', ...)`.
3. Alterar `preload.ts`: adicionar `logRendererError` ao bridge.
4. Alterar `src/types.ts`: estender `WindowApi` com `logRendererError`.
5. Alterar `renderer.ts`: adicionar helpers `reportRendererError` + handlers globais no topo.
6. Criar/atualizar testes: `tests/logger.test.ts` cobre `init` idempotente e `write` após init (mock fs/process), e/ou teste do handler renderer (unitário puro).
7. Rodar `npm run build && npm test && npm run lint && npm run typecheck` e `riteward check`.
8. Verificar manualmente que `logs/errors.jsonl` recebe linha `level: error` após forçar `throw` no renderer e `process.emit('uncaughtException')` no main (teste manual fora de CI).
9. Escrever review em `.riteward/reviews/task-021.md` e avançar.

## Riscos

- **Duplicidade de handlers**: mitigado com flag `initialized` em `logger.ts`.
- **Handler antes de ready perde erros muito precoces**: aceito; código antes de ready é só definição/import, sem lógica que lance exceções; alternativa seria init duplo mas adiciona complexidade.
- **Flood de erros do renderer**: mitigado truncando `stack`/`message` para 2k chars e enviando só primeiro erro por tick se necessário.
- **Segurança do IPC**: `renderer-error` recebe dados do renderer (sandbox true) — validar tipo `string` e ignorar payload malformado, não executar código.
- **Path em teste**: `app.getPath` mockado nos testes; logger usa `fs` real com diretório temporário, limpo após teste.

## Critérios de sucesso

- [ ] `main.ts` chama `logger.init(app.getPath('userData'), app.isPackaged)` dentro de `whenReady` antes de `createWindow`
- [ ] `logger.init` é idempotente (segunda chamada não duplica listeners)
- [ ] `preload.ts` expõe `logRendererError` e `main.ts` registra `ipcMain.on('renderer-error', ...)` que grava `level: error` em `logs/errors.jsonl`
- [ ] `renderer.ts` captura `window.onerror` e `unhandledrejection` e encaminha via IPC
- [ ] `src/types.ts` atualizado e `npm run typecheck` passa
- [ ] `logs/errors.jsonl` contém entrada `level: error` após simulação de erro (validado por teste ou inspeção manual)
- [ ] `riteward logs check` passa a exibir erros relevantes (não filtra `level: error`)
- [ ] `npm test`, `npm run lint`, `npm run typecheck` e `riteward check` verdes
