# Revisão

- task: task-013
- reviewer: ox-alpha
- type: critical
- created_at: 2026-08-22

## Resumo

Revisão da implementação dos presets de layout: novo módulo puro `src/layout-presets.ts`
(presets Igual/Colunas/Linhas/Focar, snapshot, normalização e ajuste de capacidade), controles na
toolbar (`index.html`), estilos (`style.css`) e wiring no `renderer.ts`. 18 testes novos em
`tests/layout-presets.test.ts`.

## Itens verificados

- [x] **Critério — Botão "Resetar layout"**: presente na toolbar; chama `applyEqualPreset`
      (delega para `resetFractions` existente) → `applyGridTemplate()` → `syncLayoutToMain()` →
      `persist()`.
- [x] **Critério — Presets acessíveis**: select com grupos "Presets" (Igual/Colunas/Linhas) e
      "Focar conta" (dinâmico por painel aberto); aplicação instantânea sem arrasto.
- [x] **Critério — Prioridade do layout manual**: nada é aplicado automaticamente no carregamento;
      presets só mutam estado quando explicitamente selecionados; drag manual continua usando o
      mesmo caminho de frações.
- [x] **Critério — Presets personalizados**: salvar (popover com nome, fallback "Meu layout N"
      porque `window.prompt` não existe no Electron), aplicar e excluir (botão × + confirm).
      Persistência via `saveConfig` existente com campo opcional `Config.customPresets`.
- [x] **Corretude das funções puras**: 18 testes cobrindo casos felizes, idempotência do Focar,
      entradas inválidas (dims/frações corrompidas), deep-copy de snapshots e
      `fitPresetToPaneCount` (adiciona linhas fr=1 quando há mais painéis que células).
- [x] **Presets estruturais**: Colunas/Linhas/custom passam por `render()`, necessário pois a
      posição dos painéis deriva do índice no array; a lógica de última linha incompleta
      (renderer.ts:560-571) continua válida.
- [x] **CSP**: nenhum handler inline; todo o comportamento fica em `renderer.js` compilado.
- [x] **Modo foco**: `render()` reaplica `updateFocusState`; preset durante foco altera frações
      que valem ao sair do foco (comportamento aceito e documentado no plano).
- [x] **Retrocompatibilidade**: `customPresets` é opcional; configs antigas carregam sem erro e
      presets inválidos são descartados/corrigidos por `normalizeCustomPreset`.
- [x] **Quality gates**: `npm test` (42 testes), `npm run lint`, `npm run typecheck`,
      `npm run build` e `riteward check` — todos passando.

## Problemas encontrados

- **warning (corrigido)**: Teste manual identificou redundância — o preset "Igual" do menu e o
  botão "Resetar layout" executavam exatamente a mesma ação (`resetFractions`), dando a impressão
  de que "Igual" não funcionava. **Correção**: `applyAutoPreset(st, n)` novo no módulo puro; o
  botão Resetar restaura agora o layout automático da grade (dims via `computeGridDims(n)` +
  frações 1) passando por `render()`; o preset Igual permanece igualando apenas as frações,
  preservando colunas/linhas atuais. 3 testes novos cobrindo `applyAutoPreset` (45 no total).
- **info**: O app hoje não restaura o `config.json` no startup (fluxo atual sempre passa pela
  tela de setup) — pré-condição anterior a esta task, sem regressão. Os presets salvos ficam no
  config e voltam a valer quando a restauração de sessão for implementada (task-008).
- **info**: Renomear um painel não atualiza na hora os labels do grupo "Focar conta" do select;
  atualiza no próximo `render()` (adição/remoção/reordenação). Impacto cosmético mínimo.

## Veredicto

**Aprovado** — critérios de aceitação obrigatórios e opcionais atendidos; sem problemas blocker
ou warning.

## Próximo passo

Avançar para READY_FOR_COMMIT e aguardar aprovação humana para commit.
