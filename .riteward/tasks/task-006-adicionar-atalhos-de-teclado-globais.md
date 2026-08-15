# Task-006: Adicionar atalhos de teclado globais

- **id:** task-006
- **título:** Adicionar atalhos de teclado globais
- **status:** todo
- **prioridade:** medium
- **criado em:** 2026-08-15

## Descrição

Mapear atalhos de teclado: Ctrl+R (recarregar painel ativo), Ctrl+Shift+R (recarregar todos), Ctrl+T (adicionar conta), Ctrl+W (fechar painel ativo), F11 (fullscreen), Ctrl+1..9 (focar painel N). Registrar globalShortcuts no main process e comunicar via IPC.

## Critérios de aceitação

- [ ] Atalhos registrados no main process via Menu.setApplicationMenu ou globalShortcut
- [ ] Foco de painel ativo rastreado (onClick/onFocus)
- [ ] IPC handlers para focar/recarregar/fechar painel via atalho
- [ ] F11 alterna fullscreen
- [ ] Atalhos documentados no LEIA-ME.md

## Notas

_Cuidado para não sobrescrever atalhos do jogo dentro das BrowserViews. Atalhos só devem funcionar quando o foco esta na UI host._
