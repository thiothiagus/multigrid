# Plano: Mostrar versão atual do app na interface

- task: task-022
- author: ox-alpha
- created_at: 2026-08-25

## Contexto

Com o auto-update ativo (task-005), o usuário não tem como saber qual versão está rodando
— a toolbar só mostra "PokeGrid". Isso dificulta validar updates manualmente (ex.: confirmar
que a 0.1.1 instalada passou a 0.1.2).

## Objetivo

Exibir a versão atual (`app.getVersion()`) na toolbar, sempre refletindo a versão do
`package.json` de cada build, sem manutenção manual.

## Abordagem

Fluxo canônico Electron: main expõe `app.getVersion()` via IPC; renderer exibe.

1. `main.ts`: handler `ipcMain.handle('app-version', () => app.getVersion())`.
2. `preload.ts`: `getAppVersion: () => ipcRenderer.invoke('app-version')`.
3. `src/types.ts`: `getAppVersion: () => Promise<string>` na `WindowApi`.
4. `index.html`: `<span id="toolbar-version"></span>` ao lado do título.
5. `style.css`: cor dim (`--text-dim`), 11px.
6. `renderer.ts`: preenche o span no load com `v<versão>`.

## Passos

1. Implementar itens acima na branch `feat/versao-na-interface`.
2. Rodar gates (`npm test`, lint, typecheck) + smoke test dev com stderr capturado.
3. Revisão crítica curta e READY_FOR_COMMIT.

## Riscos

- Nenhum relevante: leitura somente, IPC sem argumentos, CSP respeitada (textContent).

## Critérios de sucesso

- [ ] Toolbar mostra "v0.1.x" vindo de `app.getVersion()` (muda automaticamente por release)
- [ ] Gates verdes
