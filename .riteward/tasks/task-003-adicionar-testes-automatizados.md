# Task-003: Adicionar testes automatizados

- **id:** task-003
- **título:** Adicionar testes automatizados
- **status:** todo
- **prioridade:** high
- **criado em:** 2026-08-15

## Descrição

Configurar framework de testes (ex: Vitest ou Jest) e escrever testes unitários para as funções principais: computeGridDims, normalizeState, ensureVisibleBounds, saveWinState/loadWinState, retry logic, config export/import. Criar scripts npm test e configurar coverage.

## Critérios de aceitação

- [ ] Framework de testes configurado (Vitest ou Jest)
- [ ] Testes para computeGridDims (1 a 9 contas, casos limite)
- [ ] Testes para normalizeState (config vazia, corrompida, válida)
- [ ] Testes para ensureVisibleBounds (monitor válido, monitor removido)
- [ ] Testes para lógica de retry (delays escalonados, limite de tentativas)
- [ ] Script npm test funcional
- [ ] Coverage mínimo de 70% nas funções puras de layout/config

## Notas

_Depende idealmente de task-009 (extrair modulos) para que as funções sejam testáveis isoladamente. Se nao, mockar Electron._
