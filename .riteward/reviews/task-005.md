# Revisão

- task: task-005
- reviewer: ox-alpha
- type: critical
- created_at: 2026-08-25

## Resumo

Revisão crítica da implementação de auto-update com electron-updater: módulo puro
(`src/update-status.ts`), integração no main (`src/updater.ts` + `main.ts`), ponte IPC
segura (`preload.ts`/`src/types.ts`), UI (`renderer.ts` + `style.css`) e config de
release (`package.json`, `.github/workflows/release.yml`). Diff revisado linha a linha;
gates executados antes e depois dos ajustes de revisão.

## Itens verificados

- [x] Dependência em `dependencies` (não dev) — empacotada pelo electron-builder
- [x] Guard `app.isPackaged`: nenhum código de update roda em dev (`npm start` intacto)
- [x] Segurança IPC: handlers sem argumentos do renderer; eventos só main→renderer;
      preload sandbox não ganhou requires extras (imports de tipo são apagados na compilação)
- [x] CSP respeitada: banner usa `textContent`/classes, nada inline
- [x] Temas claro/escuro herdam variáveis CSS existentes (`--warn`, `--input-bg`, etc.)
- [x] Erros silenciosos para o usuário, logados via logger (categoria `updater`)
- [x] Timers com `unref()` não interferem no encerramento; `before-quit` segue limpando panes
- [x] `autoInstallOnAppQuit = true`: update baixado instala mesmo se usuário só fechar o app
- [x] `draft: false` explícito no publish (releases draft são invisíveis ao autoUpdater)
- [x] Quality gates: npm test (68 testes, 6 novos), lint, typecheck, build e riteward check PASS

## Problemas encontrados

- blocker (encontrado e corrigido no smoke test pós-revisão): `src/update-status.ts` era
  puxado para o programa do renderer (via import de tipo em `types.ts`) e reemitido como
  ESM pelo `tsconfig.renderer.json`, sobrescrevendo a saída CommonJS do build principal —
  `require("./update-status")` estourava `SyntaxError: Unexpected token 'export'` ao
  iniciar o app. Correção: tipos `UpdateStatus`/`UpdateStatusPayload` movidos para
  `src/types.ts`; `update-status.ts` ficou só com o mapper (main-only). Smoke test com
  stderr capturado: limpo.
- warning (corrigido): erro no download escondia o banner sem chance de nova tentativa até
  a próxima checagem (12h). Corrigido: banner agora oferece "Tentar novamente".
- info (corrigido): classe CSS `.update-btn` morta no renderer removida.
- info (fora de escopo, preexistente): jobs paralelos do release.yml (win/linux) publicam na
  mesma release; corrida possível já existia antes desta tarefa.
- info (fora de escopo, preexistente): `logger.init()` nunca é chamado — handlers globais
  de erro não são registrados e nada é gravado em `errors.jsonl`. Foi o motivo do erro do
  smoke test aparecer como diálogo em vez de log. Tarefa criada: task-021 (high).
- info (pendente pós-merge): teste manual do fluxo completo exige publicar tag ≥ 0.1.1
  (release publicada > versão instalada); depende de push aprovado pelo usuário.

## Veredicto

**Aprovado** — critérios de aceitação implementáveis em código estão atendidos; o teste
manual do update flow é inerentemente pós-publicação e fica registrado como próximo passo.

## Próximo passo

Avançar para READY_FOR_COMMIT e aguardar aprovação humana. Após commit/push aprovado:
bump de versão, criar tag `v0.1.1`, validar release publicada no GitHub e instalar a
versão anterior para confirmar detecção/download/restart do update.
