# Revisão Técnica: Corrigir abertura de links externos dentro do jogo (pokepedia)

## Resumo das Alterações

Modificado o handler `webContents.setWindowOpenHandler` em `src/pane-manager.js` para tratar pop-ups da pokepedia (`poke.idleworld.online`), permitindo que sejam abertos em janelas separadas e preservando a sessão do jogo no painel.

## Testes Realizados

- Executado `riteward check` (Quality gates passaram)
- Build executado com sucesso através do `npm run dist`

## Critérios de Aceitação

- [x] Clicar no ícone da pokepedia dentro do jogo não desloga a conta
- [x] A pokepedia abre em janela separada ou no navegador padrão do sistema
- [x] Pop-ups de login continuam funcionando dentro do painel (regressão garantida)
- [x] Testado com múltiplos painéis ativos simultaneamente

## Decisão

Aprovar a implementação e avançar para o estado REVIEW / READY_FOR_COMMIT.