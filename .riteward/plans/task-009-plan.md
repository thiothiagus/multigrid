# Plano: Extrair módulos e reduzir tamanho de arquivos monolíticos

- task: task-009
- author: Antigravity
- created_at: 2026-08-18

## Contexto

Os arquivos `main.js` (396 linhas) e `renderer.js` (562 linhas) concentram toda a lógica da aplicação em estruturas monolíticas, dificultando a manutenção, testes e linting.

## Objetivo

Extrair responsabilidades em módulos independentes na pasta `src/`, deixando `main.js` e `renderer.js` focados apenas na orquestração.

## Abordagem

Criar os seguintes módulos em `src/`:
1. `src/win-state.js`: Gerenciamento de estado e persistência da janela (`setupWindowState`, `saveWindowState`).
2. `src/config.js`: Carregamento, salvamento e normalização de configurações (`loadConfig`, `saveConfig`, `getStoragePath`, `normalizeConfig`).
3. `src/grid-layout.js`: Cálculo de dimensões e posições da grade (`computeGridDims`, `computeDimensions`).
4. `src/pane-manager.js`: Criação, remoção, atualização e recarga dos webviews/panes.
5. `src/retry.js`: Lógica de auto-recovery de panes quebrados.

Refatorar `main.js` e `renderer.js` usando `require` para utilizar os novos módulos.

## Passos

1. Criar diretório `src/`.
2. Extrair `src/win-state.js` de `main.js`.
3. Extrair `src/config.js` de `main.js` e `renderer.js`.
4. Extrair `src/grid-layout.js` de `main.js` e `renderer.js`.
5. Extrair `src/pane-manager.js` de `renderer.js`.
6. Extrair `src/retry.js` de `renderer.js`.
7. Atualizar `main.js` e `renderer.js` para importar e utilizar os módulos extraídos.
8. Executar `riteward check` e testar a aplicação.

## Riscos

- Quebra de referências a variáveis globais ou estado compartilhado entre IPCs.
  - *Mitigação*: Garantir exportações/importações limpas e manter as assinaturas de funções idênticas.

## Critérios de sucesso

- [ ] Funções de layout extraídas para `src/grid-layout.js`
- [ ] Gestão de panes extraída para `src/pane-manager.js`
- [ ] Persistência de config extraída para `src/config.js`
- [ ] Window state extraído para `src/win-state.js`
- [ ] Lógica de retry extraída para `src/retry.js`
- [ ] `main.js` e `renderer.js` reduzidos a orquestração
- [ ] `riteward check` executado com sucesso e app funcional
