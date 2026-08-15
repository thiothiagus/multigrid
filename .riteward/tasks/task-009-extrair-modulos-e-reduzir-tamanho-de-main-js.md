# Task-009: Extrair módulos e reduzir tamanho de arquivos monolíticos

- **id:** task-009
- **título:** Extrair módulos e reduzir tamanho de arquivos monolíticos
- **status:** todo
- **prioridade:** medium
- **criado em:** 2026-08-15

## Descrição

main.js e renderer.js são arquivos monolíticos de 500+ linhas. Extrair lógica em módulos: grid-layout.js (computeGridDims, layout sync), pane-manager.js (criar/remover/recarregar panes), config.js (save/load/normalize), win-state.js (window persistence), retry.js (auto-recovery). Melhora manutenibilidade e testabilidade.

## Critérios de aceitação

- [ ] Funções de layout extraídas para src/grid-layout.js
- [ ] Gestão de panes extraída para src/pane-manager.js
- [ ] Persistência de config extraída para src/config.js
- [ ] Window state extraído para src/win-state.js
- [ ] Lógica de retry extraída para src/retry.js
- [ ] main.js e renderer.js reduzidos a orquestração
- [ ] App funcional após refatoração (sem regressões)

## Notas

_Tarefa fundamental para habilitar task-001 (TS) e task-003 (testes) de forma efetiva. Recomenda-se fazer como primeiro refactor._
