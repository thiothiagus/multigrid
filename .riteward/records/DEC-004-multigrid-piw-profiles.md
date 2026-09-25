# Decisão

- id: DEC-004
- task: task-025
- status: accepted
- created_at: 2026-09-25

## Contexto

Colisão de nome com o projeto público `soufoka/PokeGrid-source` (mesmo
`package.json:name`, mais maduro, focado em Poke Idle World). O plano B de
DEC-002 previa a reserva **MultiGrid** (`com.usuario.multigrid`) para risco
de marca ("Poke" → Nintendo/The Pokémon Company) em distribuição pública.
O app já operava com URL padrão do Poke Idle World, mas o nome impedia
suportar N jogos.

## Decisão

1. Nome principal do app passa a ser **MultiGrid**: `package.json:name`
   `multigrid`, `productName` `MultiGrid`, `appId` `com.usuario.multigrid`,
   títulos da UI, `multigrid-config.json` com migração em cadeia
   (`multiconta-config.json` → `pokegrid-config.json` → `multigrid-config.json`).
2. Interfaces por jogo como **perfis de dados** em `src/profiles.ts`
   (catálogo `GAME_PROFILES`): a primeira dedicada é **MultiGrid PIW**
   (Poke Idle World, padrão atual preservado); o perfil `generic` aceita
   qualquer URL. Novo jogo = nova entrada no catálogo, sem fork.
3. Repositório GitHub (`thiothiagus/pokegrid`), pasta `C:\Apps\pokegrid` e
   pasta `%APPDATA%` NÃO mudam nesta tarefa (updater e sessões intactos).

## Alternativas consideradas

1. **Um app/fork por jogo** — rejeitado: multiplica instalador, auto-update,
   userData e testes por jogo; correções no grid teriam de ser portadas N
   vezes. Fork só se um jogo exigir runtime incompatível (ex.: outro engine).
2. **Manter "PokeGrid"** — rejeitado: colisão com projeto público mais
   conhecido + risco de marca ao distribuir.
3. **Renomear repo/pastas junto** — rejeitado nesta tarefa: quebraria URLs de
   release e o updater; fica para tarefa futura dedicada, com redirect.

## Consequências

- (+) Nome neutro comporta N jogos; PIW vira um perfil, não o app inteiro.
- (+) Migração de config sem perda; testes cobrem a cadeia de legados.
- (-) `%APPDATA%` e repo ainda carregam o nome antigo (dívida registrada).
- (-) Partições `persist:conta<N>` inalteradas — nenhum impacto nos logins.

## Referências

- DEC-002-renomeacao-pokegrid.md (plano B executado)
- DEC-003-renomeacao-arquivo-config.md (migração anterior, cadeia estendida)
- task-025 + `.riteward/plans/task-025.md`
