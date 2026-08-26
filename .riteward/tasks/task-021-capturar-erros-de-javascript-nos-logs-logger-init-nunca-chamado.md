---
id: task-021
title: Capturar erros de JavaScript nos logs (logger.init nunca chamado)
status: done
priority: high
created_at: 2026-08-25
---

# Capturar erros de JavaScript nos logs (logger.init nunca chamado)

## Descrição
logger.init() nao e chamado em main.ts, entao os handlers de uncaughtException/unhandledRejection nunca sao registrados e nada e gravado em logs/errors.jsonl. Erros de JS aparecem so como dialogo do Electron. Tambem capturar erros do renderer (window.onerror / unhandledrejection) e enviar ao processo main via IPC para registro no log

## Critérios de aceitação

- [x] `main.ts` chama `logger.init(app.getPath('userData'), app.isPackaged)` dentro de `app.whenReady()` antes de `createWindow` — handlers `uncaughtException`/`unhandledRejection` registrados e `logFile` não mais nulo
- [x] `logger.init` é idempotente (segunda chamada não duplica listeners, mas atualiza `logFile` se path mudar) — coberto por `tests/logger.test.ts`
- [x] `preload.ts` expõe `logRendererError` e `main.ts` registra `ipcMain.on('renderer-error', ...)` que grava `level: error` em `logs/errors.jsonl` com truncamento e validação
- [x] `renderer.ts` captura `window.onerror` e `unhandledrejection` no topo do módulo e encaminha via `window.api.logRendererError`
- [x] `src/types.ts` atualizado com `logRendererError` na `WindowApi` e `npm run typecheck` passa
- [x] `logs/errors.jsonl` contém entrada `level: error` após simulação (`node -e logger.error`) e `riteward logs check` exibe erro novo
- [x] Quality gates verdes: `npm test` 76/76, `lint` e `typecheck` PASS, `riteward check` PASS

## Notas

Implementação concluída em branch `fix/logger-init-captura-erros`. Plano em `.riteward/plans/plan-task-021.md`, review em `.riteward/reviews/task-021.md`. Teste manual confirmou gravação e detecção via `riteward logs check` (offset 404).
