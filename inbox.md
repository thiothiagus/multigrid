# TAREFA URGENTE — Completar a migração para TypeScript de verdade (Hermes)

A migração para TypeScript **NÃO está concluída**. O commit `9019f3b` ("completar migração") só alterou docs, eslint e package.json — **nenhum arquivo de código foi convertido**. A task-001 foi marcada como concluída com critérios de aceitação falsos, e a revisão independente comprovou que:

- `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts` e `src/focus-manager.ts` **não existem** (todos continuam em JS puro)
- Os shims `src/grid-layout.d.ts` e `src/pane-manager.d.ts` ainda existem (deveriam ter sido removidos)
- `tsconfig.renderer.json` não existe, apesar da task afirmar que a arquitetura de dois tsconfigs foi "mantida"
- `src/config-state.ts` é código órfão (ninguém importa) e há lógica duplicada entre Node e browser
- Artefatos compilados do tsc (`main.js`, `logger.js`, `preload.js`, `src/*.js`) estão commitados no git
- `tests/grid-layout.test.ts` testa o `.js` em vez do `.ts`

**Execute agora, nesta ordem:**

1. Leia o plano revisado: `.riteward/plans/task-001.md` — siga os passos na ordem.
2. Leia a task corrigida: `.riteward/tasks/task-001-migrar-projeto-para-typescript.md` — escopo e critérios de aceitação revisados (agora com `focus-manager`).
3. Leia a revisão independente: `.riteward/reviews/task-001.md` — diagnóstico completo dos problemas.
4. **Use o Riteward durante TODA a execução** (AGENTS.md): inicie o workflow da task, avance pelos estados (DISCOVERY → PLANNING → IMPLEMENTATION → TESTING → REVIEW → READY_FOR_COMMIT) registrando o motivo de cada transição, e execute `riteward check` antes de avançar de fase. O estado local salvo em `.riteward/state/task-001.yaml` está em READY_FOR_COMMIT com histórico falso — reabra/reinicie o workflow antes de começar.
5. Crie uma branch isolada com nome descritivo (ex: `feat/completar-migracao-typescript`) — **é proibido commitar na master**. Estamos na master agora.
6. Execute os passos do plano e rode os quality gates a cada etapa: `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run format:check`, `riteward check`.
7. No final, **comprove com `git ls-files`** que `renderer.ts`, `src/grid-layout.ts`, `src/pane-manager.ts`, `src/focus-manager.ts` existem e que os shims `.d.ts` sumiram. Nada de marcar critério como cumprido sem evidência no disco.
8. Ao chegar em READY_FOR_COMMIT, **aguarde aprovação humana antes de commitar** (AGENTS.md).

Regras que não podem ser violadas: não marcar a task como concluída sem evidência verificável; não pular estados do workflow; não alterar código sem registrar no Riteward; não commitar na master.