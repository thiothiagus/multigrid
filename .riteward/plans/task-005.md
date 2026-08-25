# Plano: Atualização automática do app (electron-updater)

- task: task-005
- author: ox-alpha
- created_at: 2026-08-25

## Contexto

O PokeGrid é distribuído via GitHub Releases: o workflow `release.yml` roda
`npx electron-builder --publish always` em push de tag `v*`, gerando instaladores NSIS
(Windows) e AppImage (Linux). O `package.json` já tem a configuração de publish no
electron-builder (`build.publish`: provider github, thiothiagus/pokegrid) — parte do
critério de aceitação já atendida. Porém:

1. Não existe `electron-updater`: cada nova versão exige download e reinstalação manual.
2. O workflow publica releases como **draft** (comentário "(draft)" no step). Releases
   draft não ficam visíveis para o GitHub API público, logo o autoUpdater nunca as
   encontraria — é preciso garantir release publicada (`draft: false` explícito).
3. Alvos atuais (NSIS e AppImage) são suportados pelo electron-updater.

Arquitetura atual relevante: TypeScript compilado para a raiz (`tsconfig.json` com
`include` explícito), comunicação renderer↔main via contextBridge (`preload.ts`) +
IPC, eventos empurrados ao renderer via `webContents.send` (padrão de
`sendStatus`/`pane-status`), UI construída dinamicamente em `renderer.ts` com classes
CSS em `style.css` (variáveis de tema claro/escuro).

## Objetivo

Integrar atualização automática com electron-updater:

- Verificar updates no GitHub Releases ao iniciar (e periodicamente).
- Notificar o usuário na UI quando houver update disponível.
- Permitir baixar e instalar (reiniciar) pela UI.
- Garantir que releases publicadas sejam detectáveis pelo autoUpdater.

## Abordagem

Dependência **`electron-updater` em `dependencies`** (não devDependencies) — precisa ser
empacotada junto do app. Lógica fina no main, separação entre integração e lógica pura
testável, seguindo convenção do projeto (módulos puros em `src/` testados com Vitest):

1. **`src/update-status.ts`** (puro, sem electron): tipos `UpdateStatusPayload`
   (`status`: `checking | available | not-available | downloading | downloaded | error`,
   `version?`, `progress?`, `message?`) e função pura `mapUpdaterEventToPayload(event)`
   que converte eventos do autoUpdater em payload estável para a UI. Testável sem mock.

2. **`src/updater.ts`** (integração): `initUpdater({ getWin, logger })` configura
   `autoUpdater.autoDownload = false` (usuário decide baixar), `autoUpdater.logger = null`,
   assina eventos (`checking-for-update`, `update-available`, `update-not-available`,
   `download-progress`, `update-downloaded`, `error`) e envia payload via
   `getWin().webContents.send('update-status', payload)` (mesmo padrão de `sendStatus`).
   Expõe `checkForUpdates()`, `downloadUpdate()`, `quitAndInstall()` com try/catch +
   logger. Guarda `app.isPackaged`: fora do app empacotado nada é executado (em dev o
   electron-updater falha). Checagem inicial ~10s após ready + `setInterval` de 12h.

3. **`main.ts`**: importa updater; chama `initUpdater` dentro de `whenReady` após
   `createWindow()`; IPC handlers `updates-check`, `updates-download`, `updates-install`.

4. **`preload.ts`**: expõe `checkUpdates()`, `downloadUpdate()`, `installUpdate()`,
   `onUpdateStatus(cb)`.

5. **`src/types.ts`**: `UpdateStatusPayload` reexportado/declarado + entradas na
   `WindowApi`. Adicionar os dois módulos novos ao `include` do `tsconfig.json`.

6. **UI (`renderer.ts` + `style.css`)**: banner discreto dentro da toolbar
   (`#toolbar-actions`), criado dinamicamente (padrão do projeto, HTML estático intocado):
   - `available`: "Nova versão X disponível" + botão "Baixar".
   - `downloading`: progresso % (texto simples, sem barra).
   - `downloaded`: botão "Reiniciar e atualizar".
   - `error` / `not-available`: banner some (erro vai só pro log); discreto por padrão.
   Estilos usam variáveis existentes (`--ok`, `--warn`, `--accent`, etc.), herdam tema.

7. **Release publicável**: `"draft": false` no `build.publish` do `package.json` e
   ajuste do comentário do step no `release.yml`. Sem mudança de scripts → quality gates
   de `.riteward/config.yaml` permanecem válidos.

## Passos

1. Avançar workflow para IMPLEMENTATION (branch `feat/auto-update` já criada).
2. `npm i electron-updater` (dependencies).
3. Criar `src/update-status.ts` + `tests/update-status.test.ts`.
4. Criar `src/updater.ts`; integrar em `main.ts` (init + IPC handlers + agendamento).
5. Expor API no `preload.ts` e tipar em `src/types.ts`.
6. Banner de update no `renderer.ts` + estilos em `style.css`.
7. Ajustar `package.json` (`draft: false`) e comentário do `release.yml`.
8. Atualizar `include` do `tsconfig.json`; rodar gates (`npm test`, lint, typecheck,
   `riteward check`).
9. Revisão crítica (`.riteward/reviews/task-005.md`) e avanço para READY_FOR_COMMIT.
10. Teste manual do fluxo de update (publicar versão de teste) fica pendente de
    aprovação/push pelo usuário (constituição proíbe push sem aprovação).

## Riscos

- **Releases draft invisíveis ao autoUpdater**: mitigado com `draft: false` explícito;
  releases antigas em draft continuam invisíveis (esperado).
- **App não assinado (Windows)**: update funciona, mas SmartScreen pode alertar na
  primeira instalação — fora de escopo desta tarefa.
- **Dev mode**: electron-updater lança erro fora do empacotado → guard `app.isPackaged`
  + try/catch com log; nenhum efeito no `npm start`.
- **Primeira detecção exige versão publicada > instalada** (hoje 0.1.0): teste manual só
  é possível após publicar tag nova ≥ 0.1.1.
- **Falha de rede no startup**: eventos de erro são silenciosos na UI (só log) para não
  incomodar quem está offline.

## Critérios de sucesso

- [ ] `electron-updater` adicionado como dependência de produção
- [ ] Verificação de updates integrada no main process (startup + intervalo + IPC manual)
- [ ] Notificação de update disponível exibida na UI, com fluxo baixar → reiniciar
- [ ] Publish configurado para release publicada (não-draft) no GitHub Releases
- [ ] Testes unitários do módulo puro passam; lint, typecheck e `riteward check` limpos
