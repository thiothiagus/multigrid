# Plano: Migrar projeto para TypeScript

- task: task-001
- author: Antigravity
- created_at: 2026-08-18
- updated_at: 2026-08-19

## Contexto

O aplicativo atualmente utiliza JavaScript puro (.js) divididos entre processo principal do Electron (`main.js`), contexto seguro do preload (`preload.js`), gerenciador da interface (`renderer.js`) e módulos utilitários em `src/`. A migração para TypeScript trará verificação de tipos em tempo de compilação, prevenindo erros de runtime e melhorando o autocomplete.

## Objetivo

Converter **todos** os arquivos `.js` de código-fonte da aplicação para `.ts`, definir interfaces e tipos compartilhados em `src/types.ts`, configurar o `tsconfig.json` e scripts no `package.json` para compilar para JS compatível com Electron 31.

## Progresso atual (2026-08-19)

> A task foi reaberta porque a migração ficou incompleta: o workflow havia sido marcado como COMPLETED
> sem que todos os arquivos previstos fossem convertidos. Este plano registra o estado real.

Já convertidos para `.ts` (commit 45329a1):

- [x] `logger.ts`
- [x] `src/config.ts`
- [x] `src/win-state.ts`
- [x] `src/retry.ts`
- [x] `src/types.ts`
- [x] `preload.ts`
- [x] `main.ts`

Ainda **pendentes** (continuam como JS de código-fonte):

- [ ] `renderer.js` -> `renderer.ts` (arquivo mais extenso, fortemente acoplado ao DOM/`index.html`)
- [ ] `src/grid-layout.js` -> `src/grid-layout.ts` (atualmente só existe shim `src/grid-layout.d.ts`)
- [ ] `src/pane-manager.js` -> `src/pane-manager.ts` (atualmente só existe shim `src/pane-manager.d.ts`)

Observações:

- Os arquivos `.js` com equivalente `.ts` listados acima são **output compilado** do `tsc` e devem permanecer no runtime (o `package.json` aponta `main: main.js`).
- Os shims `.d.ts` de `grid-layout` e `pane-manager` são apenas declarações manuais; a implementação real segue em JS e deve ser convertida.
- O `tsconfig.json` ainda **não inclui** `renderer.ts`, `src/grid-layout.ts` e `src/pane-manager.ts` na compilação.

## Abordagem

1. Garantir `typescript`, `@types/node` como `devDependencies`.
2. Ajustar `tsconfig.json` para incluir **todos** os `.ts` da aplicação no `include` (incluindo `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts`).
3. Converter os arquivos pendentes para `.ts`:
   - `renderer.js` -> `renderer.ts` (com tipagem do estado e funções de layout)
   - `src/grid-layout.js` -> `src/grid-layout.ts` (remover o shim `.d.ts`)
   - `src/pane-manager.js` -> `src/pane-manager.ts` (remover o shim `.d.ts`)
4. Garantir que todos os módulos usem os tipos compartilhados de `src/types.ts`.
5. Atualizar `package.json` com os scripts `build` (`tsc`), `start` e `dist` já existentes, validando que o build gera os `.js` consumidos pelo Electron e pelo `index.html`.
6. Executar `npm run build` e validar os quality gates (`riteward check`).
7. Testar o app funcional após a migração (criar/remover/arrastar panes).

## Passos

1. Atualizar o plano com o progresso real.
2. Avançar workflow do Riteward para `PLANNING`.
3. Criar branch isolada e avançar workflow para `IMPLEMENTATION`.
4. Converter os arquivos pendentes (renderer, grid-layout, pane-manager) para `.ts`.
5. Remover os shims `.d.ts` após a conversão real.
6. Ajustar `tsconfig.json` para incluir todos os arquivos.
7. Executar `npm run build` e `riteward check`.
8. Criar documento de revisão em `.riteward/reviews/task-001.md` **conferindo o estado real dos arquivos no disco**.
9. Avançar workflow para `READY_FOR_COMMIT`.

## Riscos

- **Incompatibilidade com o browser renderer (index.html)**: `index.html` carrega scripts via `<script src="...">`.
  - Mitigação: o `tsc` deve compilar `renderer.ts` (e demais) gerando os `.js` no mesmo caminho, preservando a estrutura de carregamento no HTML.
- **Tipagem global de `window.api`**:
  - Mitigação: definir a interface em `src/types.ts` e declarar no namespace global `Window` para que `renderer.ts` tenha autocomplete sem erros do compilador.
- **Escopo ambíguo (causa da incompletude anterior)**:
  - Mitigação: esta task lista explicitamente os arquivos pendentes e exige conferência de existência dos `.ts` no disco antes da aprovação (ver critérios de aceitação em `.riteward/tasks/task-001-migrar-projeto-para-typescript.md`).

## Critérios de sucesso

- [ ] **Todos** os arquivos listados na seção "Progresso atual" estiverem convertidos para `.ts` e o `git ls-files` comprovar a existência de `renderer.ts`, `src/grid-layout.ts` e `src/pane-manager.ts`.
- [ ] Os shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts` forem removidos do repositório.
- [ ] `tsconfig.json` incluir todos os `.ts` da aplicação no `include`.
- [ ] `npm run build` compila sem erros de tipo e gera os `.js` consumidos pelo Electron/`index.html`.
- [ ] Quality gates (`riteward check`) passam.
- [ ] App funcional após a migração (criar/remover/arrastar panes).
- [ ] Revisão técnica conferir o estado real dos arquivos no disco (não apenas relatório do executor).