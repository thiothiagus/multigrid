# Plano: Completar migração para TypeScript (revisado)

- task: task-001
- author: Revisor independente (revisão crítica, ver `.riteward/reviews/task-001.md`)
- executor: Hermes
- created_at: 2026-08-20
- replaces: versão anterior deste plano (2026-08-19, nunca executada de fato)

## Contexto

A migração para TypeScript foi declarada concluída duas vezes sem nunca converter os arquivos pendentes. O último commit (`9019f3b`) tocou apenas docs/config. Verificação direta na árvore de trabalho (2026-08-20):

- Ainda em JS puro: `renderer.js`, `src/grid-layout.js`, `src/pane-manager.js`, `src/focus-manager.js`
- Shims manuais ainda presentes: `src/grid-layout.d.ts`, `src/pane-manager.d.ts`
- `tsconfig.renderer.json` não existe; `tsconfig.json` inclui só 6 arquivos; `"build": "tsc"` no package.json
- `src/config-state.ts` órfão (ninguém importa); `config.ts` duplica `computeGridDims`/`normalizeState`
- `index.html` carrega 5 scripts JS como `<script src>` (config, grid-layout, pane-manager, focus-manager) + `renderer.js` como módulo; `renderer.js` usa globais (`DEFAULT_URL`, `computeGridDims`, `resetFractions`, `GUTTER_PX`, `calculatePaneLayout`) e `window.api`
- `tests/grid-layout.test.ts` importa `../src/grid-layout.js`; cobertura do vitest referencia `src/grid-layout.js`
- Artefatos compilados `.js` commitados no git (ex.: `main.js`, `logger.js`, `preload.js`, `src/*.js`)
- Workflow em `.riteward/state/task-001.yaml` em READY_FOR_COMMIT com histórico fictício

## Objetivo

Converter **todo** o código-fonte restante para TypeScript com verificação real: arquivos `.ts` existentes e compilados pelo tsc, shims removidos, dois tsconfigs (main CJS + renderer ESM), gates cobrindo o código convertido, e repositório sem artefatos de build versionados.

## Abordagem

Estratégia de **dois tsconfigs com conjuntos disjuntos** (verificado por grep — nenhum arquivo é compilado pelos dois, logo não há conflito CJS/ESM):

- **`tsconfig.json` (CommonJS, processo principal)**: `main.ts`, `logger.ts`, `preload.ts`, `src/config.ts`, `src/win-state.ts`, `src/retry.ts`, `src/types.ts`, `src/pane-manager.ts` — emite `.js` no mesmo diretório (runtime atual: `package.json` aponta `main: main.js`)
- **`tsconfig.renderer.json` (ESM, browser)**: `renderer.ts`, `src/grid-layout.ts`, `src/focus-manager.ts`, `src/config-state.ts` — emite `.js` no mesmo diretório e `index.html` passa a carregá-los via `<script type="module">`

O `index.html` deixa de carregar scripts soltos como globais; `renderer.ts` importa explicitamente de `grid-layout`, `focus-manager` e `config-state`. `pane-manager` é exclusivo do main (renderer não o usa) — remove-se o `<script>` do HTML. `DEFAULT_URL` e funções de layout do browser vêm de `config-state.ts` (puro, sem `fs`/`electron`), eliminando a duplicação com `config.ts`. Artefatos `.js` compilados saem do versionamento (`.gitignore` + `git rm --cached`) e são regenerados pelo build.

## Passos

1. **Riteward**: reabrir/reiniciar o workflow de `task-001` (estado salvo está em READY_FOR_COMMIT com histórico falso — zerar); avançar para DISCOVERY com motivo real, e depois PLANNING.
2. **Branch**: criar `feat/completar-migracao-typescript` (proibido trabalhar na master; o repo está em `master`).
3. **DISCOVERY**: ler `renderer.js`, `src/grid-layout.js`, `src/pane-manager.js`, `src/focus-manager.js`, `index.html`, `src/config-state.ts`, `src/config.ts` e `tests/grid-layout.test.ts`; mapear todas as globais consumidas pelo renderer (`window.api`, `DEFAULT_URL`, funções de layout) e as dependências do main em `pane-manager`.
4. **PLANNING** (planos parciais se necessário): decidir tipagem de `window.api` (interface em `src/types.ts` + declaração de `Window` global), ajuste fino dos conjuntos de arquivos por tsconfig, e o que remover/duplicar em `config.ts` vs `config-state.ts`.
5. **IMPLEMENTATION** (nesta ordem, rodando gates a cada arquivo):
   - `src/config-state.ts`: confirmar que é importável no browser; passar a ser usado pelo renderer (DEFAULT_URL, normalizeState, computeGridDims) e remover duplicações de `src/config.ts` (manter apenas o que usa `fs`/`path` no main).
   - `src/grid-layout.js` -> `src/grid-layout.ts` (funções puras + `GUTTER_PX`; há testes prontos).
   - `src/focus-manager.js` -> `src/focus-manager.ts` (estado de foco + DOM; `lib: DOM` no tsconfig do renderer).
   - `src/pane-manager.js` -> `src/pane-manager.ts` (tipos do Electron: `BrowserWindow`, `WebContentsView`; `main.ts` já importa dele via shim).
   - Remover shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts`.
   - `renderer.js` -> `renderer.ts` (maior arquivo; estado tipado com `Config`/`Pane`, `window.api` tipado, imports reais no lugar de globais).
6. **Build/config**:
   - Criar `tsconfig.renderer.json` (module ESNext/ES2022, `lib: ["DOM", "ES2022"]`, `moduleResolution: bundler` ou `node16` conforme resolução dos imports).
   - Atualizar `tsconfig.json`: `include` com todos os `.ts` do main.
   - Atualizar `package.json`: `"build": "tsc && tsc -p tsconfig.renderer.json"`, `"typecheck": "tsc --noEmit && tsc -p tsconfig.renderer.json --noEmit"`; revisar `files` do electron-builder.
   - Atualizar `index.html`: remover `<script src="src/config.js">`, `grid-layout.js`, `pane-manager.js`, `focus-manager.js`; carregar `renderer.js`, `src/grid-layout.js`, `src/focus-manager.js`, `src/config-state.js` via `<script type="module">` (ou apenas o entry module com imports internos — verificar ordem de execução).
7. **Testes**: atualizar `tests/grid-layout.test.ts` para importar do `.ts`/`grid-layout`; atualizar `include` de cobertura em `vitest.config.mjs` (remover `src/grid-layout.js`); adicionar testes para `config-state`/`focus-manager` se viável.
8. **Higiene do git**: adicionar artefatos compilados ao `.gitignore` (ex.: `main.js`, `logger.js`, `preload.js`, `src/*.js` — exceto os que forem fonte real, se houver) e `git rm --cached` dos `.js` versionados, mantendo `npm run build` capaz de regenerá-los.
9. **TESTING**: `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run format:check`, `riteward check`; corrigir falhas; atualizar `quality_gates` em `.riteward/config.yaml` se necessário.
10. **Execução manual**: `npm run start` — janela abre, "Começar" inicia contas, criar/remover/arrastar painéis, modo foco, maximizar painel.
11. **REVIEW**: conferir com `git ls-files` a existência dos 4 `.ts` e remoção dos shims; conferir `tsconfig`/`index.html`/gates; documentar em `.riteward/reviews/task-001.md` (novo documento de revisão pós-implementação).
12. **READY_FOR_COMMIT**: preencher "Verificação final" da task com evidências; **aguardar aprovação humana**; após aprovação, `riteward workflow commit` e push (se habilitado).

## Riscos

- **Renderer quebra por causa de módulos/globais**: hoje `index.html` injeta globais (`DEFAULT_URL`, funções de layout). Se a ordem de carregamento mudar, handlers quebram.
  - Mitigação: converter por partes e testar o app após cada conversão; mapear TODAS as referências a globais antes (passo 3).
- **Conflito CJS/ESM**: se um mesmo `.ts` for compilado pelos dois tsconfigs, o `.js` gerado conflita.
  - Mitigação: conjuntos disjuntos (já verificados); conferir novamente ao adicionar imports novos.
- **`src/config.js` compilado (CJS com `require("fs")`) carregado como `<script>` no browser** — hoje falha ou fica órfão no runtime.
  - Mitigação: remover do `index.html` e usar `config-state.ts` (puro) no renderer.
- **`window.api` sem tipagem** causa erros de tipo no `renderer.ts`.
  - Mitigação: interface no `src/types.ts` + declaração de `Window` global no tsconfig do renderer.
- **Preload ESM**: Electron 31 exige preload CJS quando sandbox ativo — manter `preload.ts` no tsconfig CJS (não mover para o renderer).
- **`git rm --cached` dos `.js`** pode quebrar `npm start` se o build não rodar antes.
  - Mitigação: documentar no LEIA-ME que `npm run build` é pré-requisito; manter `npm start` = `npm run build && electron .` (já é assim).
- **Reincidência de "concluído sem evidência"**: histórico do projeto mostra duas falsas conclusões.
  - Mitigação: critérios verificáveis via `git ls-files` e arquivos lidos (não relatório); revisão independente obrigatória antes de READY_FOR_COMMIT.

## Critérios de sucesso

- [ ] `git ls-files` retorna `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts`, `src/focus-manager.ts`
- [ ] `git ls-files` não retorna `src/grid-layout.d.ts` nem `src/pane-manager.d.ts`
- [ ] `tsconfig.json` + `tsconfig.renderer.json` cobrem todos os `.ts` da aplicação; `src/config-state.ts` é importado (sem órfãos)
- [ ] `index.html` não carrega mais `.js` da aplicação sem `type="module"`
- [ ] `npm run build` compila sem erros e gera os `.js` do runtime; `npm run typecheck` passa
- [ ] `npm run test`, `npm run lint`, `npm run format:check` e `riteward check` passam
- [ ] Nenhum artefato `.js` compilado versionado (git status limpo após build)
- [ ] App funcional: janela abre, "Começar" inicia contas, painéis criados/removidos/arrastados, modo foco OK
- [ ] Workflow Riteward percorrido com estados reais e histórico verossímil; revisão pós-implementação registrada em `.riteward/reviews/task-001.md`