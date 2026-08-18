# Plano: Maximizar Painel Individual (Modo Foco)

- task: task-012
- author: Antigravity
- created_at: 2026-08-18

## Contexto

Atualmente o aplicativo exibe todos os painéis de contas divididos em uma grade de colunas e linhas. Usuários precisam eventualmente focar em uma única conta para interagir com mais espaço na tela, sem fechar nem perder a sessão das outras contas.

## Objetivo

Permitir alternar entre a visão de grade e a visão de modo foco (painel maximizado), preservando as proporções da grade original e mantendo todas as BrowserViews ativas em background.

## Abordagem

1. Adicionar variável de estado de tempo de execução `focusedPaneId` em `renderer.js` (não persistido no `config.json`).
2. Adicionar botão de foco (`focusBtn`) na barra de ações (`.pane-header .actions`) do cabeçalho de cada painel.
3. Adicionar atalho de duplo clique (`dblclick`) no cabeçalho do painel para alternar foco.
4. Quando um painel for focado:
   - Esconder visualmente outros painéis e resizers via CSS/DOM (`display: none` ou classe CSS dedicada).
   - Expandir o painel focado para ocupar a área total de `grid-container` (`grid-column: 1 / -1; grid-row: 1 / -1;`).
   - Atualizar o layout nativo via `syncLayoutToMain()`.
5. Em `main.js`, atualizar o handler `sync-layout` para que BrowserViews de painéis não presentes no layout (ocultos pelo modo foco) recebam bounds `{ x: 0, y: 0, width: 0, height: 0 }`, mantendo o processo e a sessão vivos sem renderizar sobre o painel maximizado.
6. Ao desfocar/restaurar:
   - Remover classes de foco e exibir novamente os painéis e resizers.
   - Recalcular o layout com base nas frações `colFr` e `rowFr` preservadas em `state`.
   - Disparar `syncLayoutToMain()` para reajustar todas as BrowserViews.

## Passos

1. Criar plano em `.riteward/plans/task-012.md`.
2. Avançar workflow do Riteward para `PLANNING` e depois `IMPLEMENTATION` em branch isolada `feat/task-012`.
3. Atualizar `main.js` para garantir que `sync-layout` atribua bounds 0,0,0,0 às views não incluídas no payload de layout.
4. Atualizar `renderer.js` e `style.css` para incluir a lógica e os estilos de foco, botão no cabeçalho e manipulador de duplo clique.
5. Executar verificações de qualidade (`riteward check`).
6. Criar revisão técnica em `.riteward/reviews/task-012.md`.
7. Avançar workflow para `READY_FOR_COMMIT`.

## Riscos

- **Sobreposição de BrowserView**: BrowserViews de painéis ocultos continuarem visíveis por cima da janela focada.
  *Mitigação*: Definir explicitamente bounds zero `{ x: 0, y: 0, width: 0, height: 0 }` em `main.js` para qualquer `paneId` ativo que não esteja na lista de retângulos visíveis.
- **Perda de proporção da grade ao restaurar**: As frações da grade serem resetadas ou alteradas no foco.
  *Mitigação*: `state.colFr` e `state.rowFr` não serão modificados durante o modo foco.

## Critérios de sucesso

- [x] Botão de foco/maximizar presente no cabeçalho de cada painel
- [x] Ao focar, o painel ocupa 100% da área do grid
- [x] Demais painéis continuam rodando em background (sessões preservadas)
- [x] Botão de restaurar / duplo clique no cabeçalho faz retornar à grade com as proporções intactas
- [x] Estado de foco é volátil (reiniciar o app abre em modo grade)
