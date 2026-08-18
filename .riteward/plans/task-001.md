# Plano: Migrar projeto para TypeScript

- task: task-001
- author: Antigravity
- created_at: 2026-08-18

## Contexto

O aplicativo atualmente utiliza JavaScript puro (.js) divididos entre processo principal do Electron (`main.js`), contexto seguro do preload (`preload.js`), gerenciador da interface (`renderer.js`) e módulos utilitários em `src/`. A migração para TypeScript trará verificação de tipos em tempo de compilação, prevenindo erros de runtime e melhorando o autocomplete.

## Objetivo

Converter os arquivos `.js` da aplicação para `.ts`, definir interfaces e tipos compartilhados em `src/types.ts`, configurar o `tsconfig.json` e scripts no `package.json` para compilar para JS compatível com Electron 31.

## Abordagem

1. Instalar `typescript`, `@types/node` e `@types/electron` como `devDependencies`.
2. Criar `tsconfig.json` com `target: "ES2022"`, `module: "CommonJS"`, `moduleResolution: "node"`, `strict: true`, `skipLibCheck: true`, `outDir: "."` (compilação in-place dos arquivos JS consumidos pelo Electron e HTML).
3. Criar `src/types.ts` definindo as interfaces:
   - `Pane`: `{ id: number; label: string; partition: string; url: string; }`
   - `Config`: `{ gameUrlDefault?: string; nextId: number; cols: number; rows: number; colFr: number[]; rowFr: number[]; panes: Pane[]; }`
   - `WinState`: `{ width: number; height: number; x?: number; y?: number; isMaximized?: boolean; }`
   - `LayoutItem`: `{ id: number; x: number; y: number; width: number; height: number; }`
   - `PaneStatusPayload`: `{ id: number; status: string; extra?: Record<string, unknown>; }`
   - `WindowApi`: interface exposta pelo `preload.js` no `window.api`
4. Converter arquivos `.js` para `.ts`:
   - `logger.js` -> `logger.ts`
   - `src/config.js` -> `src/config.ts`
   - `src/win-state.js` -> `src/win-state.ts`
   - `src/retry.js` -> `src/retry.ts`
   - `src/grid-layout.js` -> `src/grid-layout.ts`
   - `src/pane-manager.js` -> `src/pane-manager.ts`
   - `preload.js` -> `preload.ts`
   - `main.js` -> `main.ts`
   - `renderer.js` -> `renderer.ts`
5. Atualizar `package.json` com o script `"build": "tsc"`, `"start": "npm run build && electron ."` e `"dist": "npm run build && electron-builder"`.
6. Executar o build (`npm run build`), verificar compilação sem erros e validar qualidade com `riteward check`.

## Passos

1. Criar este plano em `.riteward/plans/task-001.md`.
2. Avançar workflow do Riteward para `PLANNING`.
3. Criar a branch `feat/task-001` e avançar workflow para `IMPLEMENTATION`.
4. Instalar dependências dev de TypeScript.
5. Criar `tsconfig.json` e `src/types.ts`.
6. Converter todos os módulos para `.ts`.
7. Ajustar `package.json` com scripts de build e start.
8. Executar `npm run build` e `riteward check`.
9. Criar documento de revisão em `.riteward/reviews/task-001.md`.
10. Avançar workflow para `READY_FOR_COMMIT`.

## Riscos

- **Incompatibilidade com o browser renderer (index.html)**: `index.html` carrega scripts via `<script src="...">`.
  *Mitigação*: O `tsc` compilará `renderer.ts`, `src/config.ts`, etc. gerando `renderer.js`, `src/config.js`, preservando a estrutura de carregamento no HTML.
- **Tipagem global de `window.api`**:
  *Mitigação*: Definir a interface em `src/types.ts` e declarar no namespace global `Window` para que `renderer.ts` tenha autocomplete sem erros do compilador.

## Critérios de sucesso

- [x] `tsconfig.json` configurado para ES module resolution e target Electron 31
- [x] `main.js` e `preload.js` convertidos para `.ts` com tipagem forte de Electron IPC
- [x] `renderer.js` e utilitários de `src/` convertidos para `.ts`
- [x] Interfaces `Pane`, `Config`, `WinState`, `LayoutItem`, `WindowApi` definidas
- [x] `npm run build` compila com sucesso sem erros de tipo
- [x] Quality gates (`riteward check`) passam sem avisos/erros
