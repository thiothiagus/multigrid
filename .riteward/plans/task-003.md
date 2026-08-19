# Plano: Testes Automatizados

- task: task-003
- author: opencode
- created_at: 2026-08-18

## Contexto

O projeto Multi-Conta Grid não possui suíte de testes automatizados para validar o comportamento de funções puras e utilitários cruciais, como cálculo de dimensões da grade (`computeGridDims`), normalização e persistência de configurações (`normalizeState`, `loadConfig`, `saveConfig`), manipulação de posição de janelas (`ensureVisibleBounds`, `loadWinState`, `saveWinState`) e controle de reconexão (`scheduleRetry`, `cancelRetry`).

## Objetivo

Configurar o Vitest como runner de testes unitários no projeto, criar suítes de testes para cobrir as funções utilitárias puras e lógica de negócio de `src/`, adicionar scripts `npm test` e `npm run test:coverage` no `package.json`, e garantir coverage mínimo de 70% nas funções testadas.

## Abordagem

1. Instalar `vitest` e `@vitest/coverage-v8` em `devDependencies`.
2. Criar arquivo de configuração `vitest.config.ts`.
3. Escrever arquivos de testes unitários sob a pasta `tests/` ou `src/__tests__/`:
   - `tests/grid-layout.test.ts`: testes para `computeGridDims` (1 a 9 contas, 0 contas, números grandes).
   - `tests/config.test.ts`: testes para `normalizeState` (vazia, corrompida, válida), `getConfigPath`, `loadConfig`, `saveConfig`.
   - `tests/win-state.test.ts`: testes para `ensureVisibleBounds` (monitor válido, monitor removido/fora de limites), `getWinStatePath`, `loadWinState`, `saveWinState`.
   - `tests/retry.test.ts`: testes para `scheduleRetry` (delays escalonados 2s-15s, limite de 6 tentativas com status `error-final`) e `cancelRetry`.
4. Adicionar scripts `test` e `test:coverage` em `package.json`.

## Passos

1. Criar branch isolada `feat/task-003`.
2. Instalar `vitest` e `@vitest/coverage-v8`.
3. Criar `vitest.config.ts`.
4. Desenvolver os testes em `tests/*.test.ts`.
5. Validar execução dos testes e relatório de cobertura.
6. Executar `riteward check`.

## Riscos

- **Dependência de módulos Electron**: `win-state.ts` importa tipos do Electron (`import('electron').Screen`). No ambiente de testes do Node com Vitest, a API do Electron deve ser simulada/mockada para os testes de `ensureVisibleBounds`.
  *Mitigação*: Passar objeto mockado satisfazendo a interface de `Screen`.
- **Timers em `scheduleRetry`**: `scheduleRetry` usa `setTimeout`.
  *Mitigação*: Utilizar `vi.useFakeTimers()` do Vitest para avançar o tempo e asserções sem atrasos na suíte de testes.

## Critérios de sucesso

- [ ] Script `npm test` configurado e funcional.
- [ ] Testes passando 100% para `computeGridDims`, `normalizeState`, `ensureVisibleBounds` e `scheduleRetry`.
- [ ] Cobertura de código superior a 70% nas funções puras/utilitárias de `src/`.
- [ ] Quality gates de `riteward check` passando com sucesso.
