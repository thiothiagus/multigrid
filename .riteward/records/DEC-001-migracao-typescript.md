# Decisão

- id: DEC-001
- task: task-001
- status: accepted
- created_at: 2026-08-21

## Contexto

O projeto iniciou migração para TypeScript de forma parcial (logger, main, preload, parte de src) e foi marcado como concluído sem converter `renderer.js`, `src/grid-layout.js` e `src/pane-manager.js`. Permaneceram shims `*.d.ts` para tipagem e arquivos `.js` ainda eram editados como fonte. Durante correção posterior, um bug de layout (5 janelas com buraco na última linha, `renderer.ts:413-416`) foi corrigido por engano em `renderer.js` — a correção sumiu no build seguinte porque `renderer.js` é artefato gerado. Ficou evidente o risco de confusão entre fonte (`.ts`) e artefato (`.js`) e a necessidade de finalizar a migração e documentá-la de forma explícita.

A migração foi reaberta como task-001 para: converter os 3 arquivos restantes, remover shims, ajustar build em dois projetos `tsc` (CommonJS para main + ESM para renderer), corrigir `index.html` para carregar apenas ESM, e garantir que `riteward check` passe.

## Decisão

1. **Fonte única é `.ts`.** Todo código de aplicação vive em `.ts` e é versionado. Todo `.js` na raiz (`main.js`, `preload.js`, `renderer.js`, `logger.js`) e em `src/*.js` é **artefato de build**, gerado por `npm run build` e **ignorado pelo git** (`.gitignore:18-23`).

2. **Dois tsconfigs.** `tsconfig.json` (CommonJS) compila main/preload/logger + `src/*.ts`; `tsconfig.renderer.json` (`ESNext` + `bundler`) compila apenas `renderer.ts` como ES module. O script `build` roda ambos: `tsc -p tsconfig.json && tsc -p tsconfig.renderer.json`.

3. **Renderer como ESM puro.** `index.html` carrega apenas `<script type="module" src="./renderer.js">`; imports internos usam extensão `.js` (`from './src/grid-layout.js'`). Nenhum script CommonJS é carregado direto no browser — corrige `exports is not defined`.

4. **Documentação preventiva.** Adicionar aviso `CAUTION` no topo de `README.md`, tabela fonte vs. artefato na seção Desenvolvimento, e documento dedicado `docs/MIGRACAO_TYPESCRIPT.md` com caso real, diagrama, checklist e FAQ para que ninguém volte a editar `.js`.

## Alternativas consideradas

1. **Manter `.js` e `.ts` lado a lado versionados** — Rejeitada. Duplica fonte da verdade, `git diff` poluído, risco de divergência e de editar o arquivo errado (foi exatamente o incidente ocorrido). Viola princípio de simplicidade da constituição.

2. **Build único com `module: CommonJS` para tudo** — Rejeitada. Gera `renderer.js` com `exports/require`, que quebra no browser (`Uncaught ReferenceError: exports is not defined`) e congela divisórias/layout. Exigiria bundler adicional.

3. **Adotar bundler (Vite/esbuild) para unificar** — Rejeitada nesta etapa. Adiciona dependência e complexidade fora do escopo de task-001; migração deve ser verificável com `tsc` puro primeiro. Pode ser reavaliada em task futura.

## Consequências

- ✅ `git ls-files` lista apenas `.ts`; `git status` não mostra `.js` editado — feedback imediato de que o arquivo errado foi tocado.
- ✅ `npm run build` é a única forma de atualizar `.js`; `npm run typecheck` / `riteward check` validam tipos antes do commit.
- ✅ Novos contribuidores têm aviso visível no README e guia passo-a-passo em `docs/`; reduz retrabalho.
- ⚠️ Dois `tsc` precisam rodar sempre; esquecer o segundo deixa `renderer.js` desatualizado — mitigado pelo script `build` unificado e documentado.
- ⚠️ Imports no renderer precisam usar `.js` mesmo que fonte seja `.ts` (exigência ESM) — documentado e com exemplos.

## Referências

- Task: `.riteward/tasks/task-001-migrar-projeto-para-typescript.md` (critérios, problemas resolvidos, verificação final)
- Docs: `README.md` (seção Desenvolvimento), `docs/MIGRACAO_TYPESCRIPT.md`
- Config: `tsconfig.json`, `tsconfig.renderer.json`, `tsconfig.base.json`, `.gitignore:18-23`, `package.json#build`, `index.html`
- Estado workflow: `.riteward/state/task-001.yaml` (READY_FOR_COMMIT)
