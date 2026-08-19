---
id: task-001
title: Completar migração para TypeScript (renderer, grid-layout, pane-manager)
status: todo
priority: high
created_at: 2026-08-15
updated_at: 2026-08-19
---

# Completar migração para TypeScript

## Descrição

Converter os arquivos de código-fonte que ainda permanecem em JavaScript para TypeScript, completando a migração iniciada anteriormente. A migração original converteu apenas parte dos arquivos e foi encerrada como concluída sem que todo o escopo fosse cumprido (ver `Notas`). Esta task foi reaberta para concluir a conversão dos arquivos restantes e garantir que a migração seja verificável de ponta a ponta.

## Estado atual

Já convertidos (não refazer):

- `logger.ts`, `main.ts`, `preload.ts`
- `src/config.ts`, `src/retry.ts`, `src/win-state.ts`, `src/types.ts`

Pendentes (escopo desta task):

- `renderer.js` -> `renderer.ts` (arquivo mais extenso, fortemente acoplado ao DOM/`index.html`)
- `src/grid-layout.js` -> `src/grid-layout.ts` (substituir o shim `src/grid-layout.d.ts`)
- `src/pane-manager.js` -> `src/pane-manager.ts` (substituir o shim `src/pane-manager.d.ts`)

## Critérios de aceitação

Cada critério é verificável por inspeção direta no repositório, não apenas pelo relatório do executor:

- [ ] Existir `renderer.ts` no repositório (`git ls-files` retorna `renderer.ts`)
- [ ] Existir `src/grid-layout.ts` no repositório (`git ls-files` retorna `src/grid-layout.ts`)
- [ ] Existir `src/pane-manager.ts` no repositório (`git ls-files` retorna `src/pane-manager.ts`)
- [ ] Os shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts` removidos do repositório (`git ls-files` não os retorna)
- [ ] `tsconfig.json` inclui **todos** os `.ts` da aplicação no `include` (incluindo `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts`)
- [ ] `npm run build` (tsc) compila sem erros de tipo e gera os `.js` consumidos pelo Electron (`main.js`) e pelo `index.html` (`renderer.js`)
- [ ] Tipos compartilhados definidos em `src/types.ts` para `Pane`, `Config`, `WinState`, `LayoutState` e `WindowApi`
- [ ] Quality gates aprovados: `npm test`, `npm run lint`, `npm run typecheck` (ou `riteward check`)
- [ ] App funcional após a migração: criar, remover e arrastar panes funciona sem erros de runtime
- [ ] Revisão técnica (`.riteward/reviews/task-001.md`) conferiu os arquivos no disco e o `git diff`, não apenas o relatório verbal

## Notas

- **Por que a task foi reaberta**: o workflow anterior foi marcado como COMPLETED sem que `renderer.js`, `src/grid-layout.js` e `src/pane-manager.js` fossem convertidos; a revisão foi aprovada sem conferir o estado real dos arquivos.
- **Não alterar** os `.js` já gerados pelo `tsc` para os módulos convertidos — eles são output de build e devem ser regenerados pelo próprio `tsc`.
- Manter os tipos compartilhados em `src/types.ts` como fonte única de verdade.
- Registrar qualquer decisão relevante em `.riteward/records/` usando o template de decision record.

## Dependências

Recomenda-se concluir esta task antes de novas features que dependam de tipos (ex.: presets de layout - task-013), pois a conversão completa desbloqueia tipagem do renderer e dos módulos de layout/pane.