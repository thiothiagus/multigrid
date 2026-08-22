# Revisão

- task: task-007
- reviewer: ox-alpha
- type: critical
- created_at: 2026-08-22

## Resumo

Revisão crítica da implementação do sistema de temas claro/escuro: diff completo de
`style.css`, `index.html`, `renderer.ts`, `src/theme.ts` (novo), `src/config.ts`,
`src/types.ts`, `tests/theme.test.ts` (novo) e `tests/config.test.ts`.

## Itens verificados

- [x] Paleta clara em CSS variables (`[data-theme='light']`) cobre todas as 13 variáveis do `:root`
- [x] Nenhuma cor hardcoded fora das definições de variáveis (verificado por grep em style.css)
- [x] Toggle sol/lua na toolbar; ícone mostra o tema destino do clique; título acessível atualizado
- [x] Preferência persistida (`theme?: 'light'|'dark'|'system'` em Config; `persist()` no toggle; validação em `normalizeState`)
- [x] Primeira execução usa o tema do SO (`matchMedia('(prefers-color-scheme: dark)')`; listener reativo só em modo `system`)
- [x] Cobertura visual: toolbar, setup-screen, headers dos panes e gutters/resizers herdam das variáveis
- [x] `color-scheme: dark/light` evita controles nativos ilegíveis no select de presets
- [x] Compatível com CSP (`data-theme` é atributo, não inline style)
- [x] Módulo `theme.ts` puro (sem DOM) e testado; sem dependências novas
- [x] Quality gates: test (56), lint, typecheck — todos PASS
- [x] Build TS→JS regenerado após correções

## Problemas encontrados

- ~~blocker~~ **CORRIGIDO**: definição circular `--border-strong: var(--border-strong)` em
  `:root` (replace em massa havia substituído o valor hex dentro da própria variável).
- ~~info~~ **CORRIGIDO**: `--on-accent` definida mas não utilizada; agora todos os botões
  com fundo accent usam `color: var(--on-accent)`.
- ~~blocker~~ **CORRIGIDO** (2ª rodada, teste manual): crash no boot do processo main —
  `SyntaxError: Unexpected token 'export'` em `src/theme.js`. Causa raiz: o build tem duas
  etapas que emitem para os mesmos caminhos (`tsc -p tsconfig.json` em CJS; 
  `tsc -p tsconfig.renderer.json` em ESNext/ESM sobrescrevendo `src/*.js` do grafo do
  renderer). O import runtime `config.ts → theme.ts` fez o main (CJS) depender de um
  módulo reemitido como ESM. Correção: validação de tema duplicada localmente em
  `config.ts` (com comentário explicando a invariante), restaurando o princípio do
  projeto de que módulos do grafo main não têm dependências runtime com o grafo renderer.
  Verificado: `src/config.js` carrega via `require()` puro no Node e `main.js` não
  referencia theme.
- info: o erro do diálogo NÃO foi capturado pelo sistema de logs (`riteward logs check`
  vazio) — exceções de parse no processo main ocorrem antes de qualquer handler do
  logger. Sugestão de task futura: capturar `uncaughtException`/`unhandledRejection`
  no main para registrar em `logs/errors.jsonl`.
- info: o renderer nunca carregava o config no boot (gap pré-existente); aqui o
  `loadConfig()` passou a ser chamado apenas para restaurar o tema, sem alterar o
  comportamento de sessão.

## Veredicto

**Aprovado** (2ª rodada — crash de boot corrigido e verificado via require CJS direto)

## Próximo passo

Avançar para READY_FOR_COMMIT e aguardar aprovação humana.
