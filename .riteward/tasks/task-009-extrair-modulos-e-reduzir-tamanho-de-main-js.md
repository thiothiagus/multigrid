---
id: task-009
title: Extrair módulos e reduzir tamanho de arquivos monolíticos
status: done
priority: high
created_at: 2026-08-15
---

# Extrair módulos e reduzir tamanho de arquivos monolíticos

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

_task-009 foi executada depois de task-001 e task-003, contrariando a recomendação acima. Como consequência, a refatoração não foi tão efetiva quanto poderia ser._

_Após a task-009, a task-012 (modo foco) adicionou ~70 linhas ao renderer.js (397 → 510 linhas), ultrapassando novamente o limite de 500. Na task-setup, foi criado src/focus-manager.js e a lógica de foco extraída do renderer.js (reduzindo de 510 para 395 linhas), trazendo o arquivo novamente abaixo do limite de 500 linhas._
