# Decisão

- id: DEC-002
- task: n/a (manutenção — renomeação do projeto)
- status: accepted
- created_at: 2026-08-22

## Contexto

O projeto chamava-se "Multi-Conta Grid" (`multi-conta-grid`), nome genérico que
não refletia o propósito real: gerenciar múltiplas contas do jogo PokéIdle
(`https://poke.idleworld.online/play`) em uma grade de sessões isoladas.
Além disso, a estrutura de pastas `C:\Apps\multiconta-grid-v3\multiconta`
tinha um nível desnecessário de aninhamento.

## Decisão

Renomear o projeto para **PokeGrid**:

- Pasta movida para: `C:\Apps\pokegrid`
- `package.json`: `name: "pokegrid"`, `productName: "PokeGrid"`, `appId: "com.usuario.pokegrid"`
- Títulos da UI (`index.html`, `main.ts`) atualizados para "PokeGrid"
- Dados de usuário migrados: `%APPDATA%\multi-conta-grid` → `%APPDATA%\pokegrid`
  (preserva sessões, config e window-state)

**PLANO B REGISTRADO**: caso o nome "PokeGrid" gere problema no futuro
(risco de marca junto à Nintendo/The Pokémon Company, especialmente se o app
for distribuído publicamente), o nome de reserva é **MultiGrid**
(`com.usuario.multigrid`). Neste caso, repetir esta migração revertendo as
referências acima.

## Alternativas consideradas

1. **SessionGrid / MultiPane / Tessera / Bento** — bons nomes genéricos, mas
   rejeitados porque o uso real é dedicado ao jogo PokéIdle; nome temático
   comunica melhor.
2. **Multi Grid Screen** — três palavras, pesado para título/instalador;
   "Screen" redundante.
3. **Manter "Multi-Conta Grid"** — não reflete o propósito nem a identidade
   desejada pelo autor.

## Consequências

- (+) Nome curto, memorável e alinhado ao uso real do app.
- (+) Pasta direto em `C:\Apps\pokegrid`, sem aninhamento.
- (-) "Poke" remete à marca Pokémon; risco jurídico apenas se houver
  distribuição pública. Uso pessoal não é afetado.
- (-) Nome interno de arquivo de dados permanece legado:
  `multiconta-config.json` em `src/config.ts` foi mantido por compatibilidade
  (loader, testes e `.gitignore` referenciam). Renomeá-lo exigiria lógica de
  fallback na carga — desnecessário por enquanto.
- (-) Partições de sessão (`persist:conta<N>`) são independentes do nome do
  app; nenhum impacto nos logins desde que `%APPDATA%` seja migrado junto.

## Referências

- DEC-001-migracao-typescript.md (renomeações anteriores de artefatos)
- Discussão com o autor em 2026-08-22: nomes avaliados incluíram MultiGrid,
  SessionGrid, Tessera, Bento, Maestro; escolha final: PokeGrid, reserva: MultiGrid.
