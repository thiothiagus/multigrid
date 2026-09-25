# Plano — Renomear app para MultiGrid com interface PIW (task-025)

- task: task-025
- author: agent
- created_at: 2026-09-25

## Contexto

Colisão de nome com `soufoka/PokeGrid-source` (mesmo `package.json:name= pokegrid`, mais maduro). Plano B em DEC-002 prevê reserva **MultiGrid** (`com.usuario.multigrid`). Hoje o app já é PIW por padrão (`DEFAULT_URL = poke.idleworld.online/play` em `src/config.ts:11`, `src/config-state.ts:3`, `index.html:51`), mas o nome carrega "Poke" (risco de marca) e não comporta N jogos.

## Objetivo

App passa a chamar-se **MultiGrid**; perfil dedicado **MultiGrid PIW** vira o padrão atual; arquitetura de perfis permite adicionar um jogo por entrada de catálogo, sem forks.

## Abordagem

Rename mecânico + migração em cadeia do config + módulo novo `src/profiles.ts` (constantes puras, CommonJS-safe como `src/theme.ts`) + `Config.activeProfile?` opcional (sem quebrar configs antigas) + seletor no setup que preenche a URL e ajusta o título da toolbar. Repo GitHub e pasta userData inalterados nesta tarefa (updater intacto).

## Passos

1. `package.json` / `package-lock.json`: name→multigrid, productName→MultiGrid, appId→com.usuario.multigrid, description sem "Poke".
2. `src/profiles.ts` novo + `tests/profiles.test.ts`: `GAME_PROFILES` (piw + generic), `getProfile`, `isValidProfileId`, `resolveProfileTitle`, `resolveProfileUrl`.
3. `src/config.ts`: `CONFIG_FILENAME=multigrid-config.json`, legados `pokegrid-config.json` + `multiconta-config.json`, `migrateLegacyConfig` tenta em cadeia.
4. `src/types.ts`: `activeProfile?: string`.
5. `main.ts`: title MultiGrid, export defaultPath multigrid-config.json.
6. `index.html`: titles MultiGrid + `<select id="setup-profile">` (PIW padrão).
7. `renderer.ts`: wiring do seletor (troca preenche URL), `initFromScratch(n, url, profileId)`, título da toolbar por perfil, restaura título ao carregar config salva.
8. `tests/config.test.ts`, `.gitignore`, `.riteward/config.yaml`, `README.md`, `AGENTS.md`.
9. Decision record DEC-004 (rename + arquitetura de perfis).
10. `npm run build` + `riteward check`.

## Riscos

- Quebrar updater se trocar `build.publish.repo` — mitigação: NÃO trocar nesta tarefa.
- `src/*.ts` do main são CommonJS e o build ESM do renderer sobrescreve `src/*.js` — mitigação: `profiles.ts` sem imports runtime (só types), igual ao padrão de `theme.ts`.
- Perder config do usuário — mitigação: migração só renomeia se o novo não existir; cobre os dois legados; testes cobrem.

## Critérios de sucesso

- [ ] Toolbar mostra MultiGrid / MultiGrid PIW conforme perfil
- [ ] Migração pokegrid→multigrid preserva painéis
- [ ] `riteward check` passa

## Aprovação

- [x] Aprovado pelo usuário em 2026-09-25 (pedido direto no chat: "Pode fazer a migração então").
