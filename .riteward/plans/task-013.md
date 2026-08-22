# Plano: Presets de Layout para Redimensionamento Rápido

- task: task-013
- author: ox-alpha
- created_at: 2026-08-22

## Contexto

O grid de contas usa CSS Grid com frações (`state.colFr` / `state.rowFr`) ajustáveis por
divisórias arrastáveis (`startColResize`/`startRowResize` em `renderer.ts:307-383`). Não existe
nenhum atalho para reorganizar a grade: o usuário precisa arrastar divisórias manualmente para
obter layouts comuns (tudo igual, uma conta grande + outras pequenas, tudo em colunas/linhas).
`resetFractions()` já existe (`src/grid-layout.ts:9-18`) mas só roda indiretamente ao
adicionar/remover painéis.

## Objetivo

Permitir aplicar layouts predefinidos instantaneamente pela toolbar:

- Botão "Resetar layout" (volta ao layout automático da grade: dims padrão via `computeGridDims`
  + frações 1).
- Menu de presets: Igual (frações = 1 mantendo a estrutura atual de colunas/linhas — distinto do
  botão Resetar, ajuste feito após teste manual), Colunas (1 linha × N colunas), Linhas
  (N linhas × 1 coluna) e "Focar <conta>" (conta escolhida ganha destaque proporcional).
- Opcional: salvar/aplicar/excluir presets personalizados (snapshot de cols/rows/frações).

## Abordagem

Lógica pura isolada em novo módulo `src/layout-presets.ts` (testável com Vitest, sem DOM):

1. `applyEqualPreset(st)` — delega para `resetFractions`.
2. `applyColumnsPreset(st, n)` — `cols = n`, `rows = 1`, frações = 1.
3. `applyRowsPreset(st, n)` — `cols = 1`, `rows = n`, frações = 1.
4. `applyFocusPreset(st, paneIndex)` — célula do painel recebe `FOCUS_FACTOR` (2.5) vezes a média
   das irmãs na mesma coluna/linha (determinístico e idempotente; não compõe ao repetir).
5. `normalizeCustomPreset(raw)` — valida snapshot salvo (dims ≥ 1, arrays com comprimento
   correto) antes de aplicar.

UI (toolbar, `index.html:20-22`): `<select id="layout-preset-select">` com grupo "Focar"
preenchido dinamicamente por painel + botão "Salvar layout" + botão "Resetar layout". Estilos
reutilizam `#toolbar button`; select ganha estilo próprio mínimo em `style.css`.

Renderer (`renderer.ts`):

- Presets que só mudam frações: `applyGridTemplate()` → `syncLayoutToMain()` → `persist()`
  (mesmo caminho do arrasto, sem reconstruir DOM).
- Presets estruturais (Colunas/Linhas/custom): atualizam `cols`/`rows` e chamam `render()`,
  pois a posição dos painéis depende do índice no array.
- Select volta ao placeholder após aplicar (permite reaplicar a mesma opção).
- Prioridade do layout manual: presets só alteram estado quando explicitamente selecionados;
  nada é aplicado automaticamente no load — comportamento já garantido pelo fluxo atual.
- Custom: `Config.customPresets?: LayoutPreset[]` (`src/types.ts`) persiste via `saveConfig`
  existente. Nome gerado automaticamente ("Meu layout N") pois `window.prompt` não é suportado
  no Electron; exclusão via botão "×" exibido quando um custom está selecionado (com
  `window.confirm`, já usado no projeto).

## Passos

1. Criar branch `feat/presets-de-layout` e avançar workflow para IMPLEMENTATION.
2. Adicionar tipos `LayoutPreset` e `customPresets?` em `src/types.ts`.
3. Criar `src/layout-presets.ts` com as funções puras.
4. Adicionar controles na toolbar (`index.html`) e estilos (`style.css`).
5. Ligar eventos no `renderer.ts` (aplicação de presets, save/delete custom, repopulação do
   select em `render()`).
6. Criar `tests/layout-presets.test.ts` seguindo padrão de `tests/grid-layout.test.ts`.
7. Rodar quality gates: `npm test`, `npm run lint`, `npm run typecheck` (+ `riteward check`).
8. Revisão crítica (`.riteward/reviews/task-013.md`) e avanço para READY_FOR_COMMIT.

## Riscos

- **Interação com modo foco**: preset aplicado durante foco muda frações invisíveis.
  *Mitigação*: `render()` já reaplica `updateFocusState`; comportamento aceito (frações valem ao
  sair do foco).
- **Config antiga sem `customPresets`**: campo opcional, retrocompatível; `normalizeCustomPreset`
  descarta snapshots inválidos.
- **Grid irregular (última linha incompleta)**: lógica de distribuição (renderer.ts:413-426)
  depende de `cols`; presets estruturais recalculam `computeGridDims`-compatível via render().
- **Select não dispara `change` repetido**: reset ao placeholder resolve.

## Critérios de sucesso

- [ ] Botão "Resetar layout" na toolbar volta todas as frações para 1
- [ ] Presets Igual, Focar N, Colunas e Linhas acessíveis pela toolbar e aplicam instantaneamente
- [ ] Layout manual continua funcionando e prevalece até um preset ser selecionado
- [ ] Usuário pode salvar e nomear (auto "Meu layout N") um preset personalizado e excluí-lo
- [ ] Testes unitários das funções puras passam; lint e typecheck limpos
