---
id: task-001
title: Completar migração para TypeScript (renderer, grid-layout, pane-manager,
  focus-manager)
status: done
priority: high
created_at: 2026-08-15
updated_at: 2026-08-20
---

# Completar migração para TypeScript

## Descrição

Converter os arquivos de código-fonte que ainda permanecem em JavaScript para TypeScript, completando a migração iniciada anteriormente. Esta task foi **reaberta pela segunda vez**: a conclusão anterior (commit `9019f3b`) foi marcada com critérios de aceitação falsos — o commit só alterou docs, eslint, package.json e vitest config; **nenhum arquivo de código foi convertido** (ver `Notas de revisão`).

## Estado atual (verificado em 2026-08-20 via `git ls-files`)

Já convertidos e verificados no repositório:

- `logger.ts`, `main.ts`, `preload.ts`
- `src/config.ts`, `src/retry.ts`, `src/win-state.ts`, `src/types.ts`
- `src/config-state.ts` (existe, porém **órfão** — nenhum módulo importa)

Pendentes (escopo desta task):

- `renderer.js` -> `renderer.ts` (arquivo mais extenso, fortemente acoplado ao DOM/`index.html`, usa `window.api` do preload)
- `src/grid-layout.js` -> `src/grid-layout.ts` (substituir o shim `src/grid-layout.d.ts`)
- `src/pane-manager.js` -> `src/pane-manager.ts` (substituir o shim `src/pane-manager.d.ts`)
- `src/focus-manager.js` -> `src/focus-manager.ts` (**esquecido nas duas tentativas anteriores** — citado apenas no histórico do workflow, nunca na task nem no plano)

## Critérios de aceitação

Cada critério é verificável por inspeção direta no repositório, não apenas pelo relatório do executor:

- [ ] Existir `renderer.ts` no repositório (`git ls-files` retorna `renderer.ts`)
- [ ] Existir `src/grid-layout.ts` no repositório (`git ls-files` retorna `src/grid-layout.ts`)
- [ ] Existir `src/pane-manager.ts` no repositório (`git ls-files` retorna `src/pane-manager.ts`)
- [ ] Existir `src/focus-manager.ts` no repositório (`git ls-files` retorna `src/focus-manager.ts`)
- [ ] Os shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts` removidos do repositório (`git ls-files` não os retorna)
- [ ] `tsconfig.json` (CommonJS/main) e `tsconfig.renderer.json` (ESM/renderer) cobrem **todos** os `.ts` da aplicação no `include`; nenhum `.ts` da aplicação fica órfão
- [ ] `index.html` não carrega mais módulos da aplicação via `<script src="...">` sem `type="module"` (cada `.js` consumido pelo renderer é gerado pelo tsc a partir de `.ts`)
- [ ] `src/config-state.ts` passa a ser importado (não pode ficar órfão)
- [ ] Artefatos compilados `.js` não ficam versionados no git (excluídos via `.gitignore` + `git rm --cached`), mantendo `npm run build` capaz de regenerá-los para o runtime
- [ ] `npm run build` compila sem erros de tipo e gera os `.js` consumidos pelo Electron/`index.html`
- [ ] `npm run typecheck` passa sem erros
- [ ] `npm run test` passa (incluindo testes atualizados para importar do `.ts`)
- [ ] `npm run lint` passa
- [ ] `npm run format:check` passa
- [ ] Aplicação executa corretamente (`npm run start` abre a janela e o botão "Começar" inicia as contas; criar/remover/arrastar painéis; modo foco)

## Notas de revisão (2026-08-20 — revisão independente)

A conclusão anterior (commit `9019f3b`) foi **fraudulenta/incompleta** e foi revertida nesta revisão:

1. Todos os critérios de aceitação estavam marcados `[x]` sem corresponder à realidade do repositório.
2. `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts` **não existiam** e `src/focus-manager.js` nem foi citado no escopo.
3. Os shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts` permaneciam no repositório.
4. A "Decisão técnica" de dois tsconfigs era falsa: `tsconfig.renderer.json` **nunca foi criado**; `package.json` usa apenas `"build": "tsc"` com um único tsconfig que inclui só 6 arquivos.
5. A seção "Verificação final" relatava PASS em todos os gates — os gates passam, mas não provam nada: o build não compila os arquivos pendentes (por isso "passa").
6. Artefatos compilados do tsc estão commitados no git (inclusive `src/types.js` obsoleto com 2 linhas).
7. `tests/grid-layout.test.ts` testa `../src/grid-layout.js` (a implementação JS) em vez do `.ts` — o teste passaria mesmo sem a migração.
8. O workflow registrado em `.riteward/state/task-001.yaml` (READY_FOR_COMMIT) relata passos que não existem no código — o histórico é fictício e deve ser reiniciado.

## Decisões técnicas (revisadas)

- Arquitetura de **dois tsconfigs** (decidida, mas nunca implementada): `tsconfig.json` (CommonJS para main process) e `tsconfig.renderer.json` (ES modules para renderer).
- Conjuntos disjuntos de arquivos por tsconfig (verificado por grep — nenhum arquivo é compilado pelos dois), evitando conflito de formatos de módulo:
  - Main (CJS): `main.ts`, `logger.ts`, `preload.ts`, `src/config.ts`, `src/win-state.ts`, `src/retry.ts`, `src/types.ts`, `src/pane-manager.ts`
  - Renderer (ESM): `renderer.ts`, `src/grid-layout.ts`, `src/focus-manager.ts`, `src/config-state.ts`
- `pane-manager.js` é usado **somente** no processo principal (o renderer não o referencia); remover o `<script>` do `index.html` e converter para `.ts` com tipos do Electron.
- `DEFAULT_URL`/`DEFAULT_CONFIG`/`computeGridDims`/`normalizeState` do browser vêm de `src/config-state.ts` (puro, sem `fs`/`electron`) — eliminar duplicação com `config.ts`.
- Remover a funcionalidade de exportar/importar configuração já foi feito anteriormente (não refazer).

## Verificação final (será preenchida pelo executor com evidências)

```
- Build: npm run build → (a preencher)
- Typecheck: npm run typecheck → (a preencher)
- Testes: npm test → (a preencher)
- Lint: npm run lint → (a preencher)
- Format: npm run format:check → (a preencher)
- Quality gates: riteward check → (a preencher)
- git ls-files confirma existência dos .ts e remoção dos shims → (a preencher)
- Execução manual: app abre, botão "Começar" funciona, layout correto, modo foco OK → (a preencher)
```