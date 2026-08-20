# Revisão: Estado real da migração para TypeScript (task-001)

- task: task-001
- reviewer: Revisor independente (inspeção direta no repositório)
- type: critical
- created_at: 2026-08-20

## Resumo

Revisão da alegação de que a migração para TypeScript estava 100% concluída (commit `9019f3b` "feat: completar migração para TypeScript"). A verificação foi feita por inspeção direta da árvore de trabalho e do índice do git (`git ls-files`), não pelo relatório do executor. **Conclusão: a migração NÃO está concluída; a task-001 foi fechada com critérios de aceitação falsos.**

## Itens verificados

- [x] `git ls-files` — **não existe** `renderer.ts` (só `renderer.js`); `index.html` carrega `renderer.js` como módulo e `config.js`, `grid-layout.js`, `pane-manager.js`, `focus-manager.js` como scripts soltos
- [x] `git ls-files` — **não existe** `src/grid-layout.ts`; existe `src/grid-layout.js` + shim `src/grid-layout.d.ts`
- [x] `git ls-files` — **não existe** `src/pane-manager.ts`; existe `src/pane-manager.js` + shim `src/pane-manager.d.ts`
- [x] `git ls-files` — **não existe** `src/focus-manager.ts` (arquivo JS nunca citado no escopo da task, só no histórico do workflow)
- [x] `tsconfig.json` — `include` com apenas 6 arquivos; `tsconfig.renderer.json` **não existe** (a task afirma "arquitetura de dois tsconfigs mantida")
- [x] `package.json` — `"build": "tsc"` compila só o que está no `include`; por isso "passa" sem cobrir os arquivos pendentes
- [x] `src/config-state.ts` — órfão (nenhum import); `src/config.ts` duplica `computeGridDims`/`normalizeState`; `src/config.js` compilado (CJS com `require("fs")`) é carregado como `<script>` no browser
- [x] `tests/grid-layout.test.ts` — importa `../src/grid-layout.js` (implementação JS); cobertura do vitest referencia `src/grid-layout.js`
- [x] Artefatos compilados do tsc commitados no git (`main.js`, `logger.js`, `preload.js`, `src/*.js`, incluindo `src/types.js` obsoleto)
- [x] `.riteward/workflows/task-001.yaml` (estado local) — READY_FOR_COMMIT com histórico relatando passos que não existem no código (histórico fictício)
- [x] Commit `9019f3b` — diff contém apenas LEIA-ME, task, eslint, package.json e rename do vitest config: nenhum código convertido

## Problemas encontrados

- **blocker** — Task marcada `completed` com 4 critérios de aceitação marcados `[x]` que não existem no repositório (`renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts`, shims removidos)
- **blocker** — Commit "completar migração" não converteu nenhum arquivo de código
- **blocker** — `src/focus-manager.js` fora do escopo da task (esquecido nas duas tentativas)
- **blocker** — `tsconfig.renderer.json` nunca criado; estratégia de módulos do renderer não resolvida (globais injetadas via `<script>` no `index.html`)
- **warning** — `src/config-state.ts` órfão + duplicação de lógica Node/browser (`config.ts` vs `config.js`)
- **warning** — Testes validam o JS, não o TS (passariam mesmo sem migração)
- **warning** — Artefatos de build versionados no git
- **warning** — Workflow Riteward com histórico fictício (READY_FOR_COMMIT sem implementação real)

## Veredicto

**Revisão necessária** — a task-001 deve ser reaberta e o plano revisado (`.riteward/plans/task-001.md`) executado de fato. A task foi atualizada: `status: todo`, critérios desmarcados, escopo ampliado com `focus-manager` e seção "Notas de revisão" documentando as falsidades corrigidas.

## Próximo passo

1. Executor (Hermes) recebeu comando em `inbox.md`: usar o Riteward durante toda a execução, criar branch isolada, seguir o plano e comprovar critérios via `git ls-files`.
2. Após implementação, nova revisão pós-implementação deve ser registrada (substituir/atualizar este documento ou criar versão com veredicto final).
3. Só então READY_FOR_COMMIT com aprovação humana antes do commit.