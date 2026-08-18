# Plano Técnico: Corrigir abertura de links externos dentro do jogo (pokepedia)

## Entendimento do Problema

O jogo contém um ícone que abre a pokepedia, mas no app esse link está abrindo na mesma aba do painel, causando o logout da conta (perda de sessão). O app já tem handler de `window.open` / pop-ups no main process, mas links externos com `target="_blank"` estão sendo carregados dentro do próprio painel em vez de abrir em janela separada ou nova aba externa.

## Abordagem da Solução

1. **Identificar como o jogo abre a pokepedia** - Investigar se é via `window.open`, `target="_blank"` ou `location.href`
2. **Modificar o handler de janelas** - Atualizar o `setWindowOpenHandler` no `pane-manager.js` para tratar adequadamente links externos à pokepedia
3. **Preservar funcionalidade existente** - Garantir que pop-ups de login continuem funcionando dentro do painel
4. **Implementar solução** - Abrir links externos à pokepedia em janela separada ou navegador padrão

## Técnologias Envolvidas

- Electron `webContents.setWindowOpenHandler`
- IPC entre processo principal e renderer
- JavaScript no `pane-manager.js`

## Passos de Implementação

1. **Investigação**
   - Identificar URL/domínio da pokepedia
   - Verificar como o jogo está tentando abrir o link (inspecionando código do jogo ou testando)

2. **Modificação do handler**
   - Atualizar o `setWindowOpenHandler` em `src/pane-manager.js` para detectar URLs da pokepedia
   - Para URLs da pokepedia, retornar `{ action: 'allow' }` com opções de janela popup apropriadas
   - Manter o tratamento existente para pop-ups de autenticação

3. **Testes**
   - Verificar que clicar no ícone da pokepedia abre em janela separada
   - Confirmar que a conta permanece logada no painel
   - Validar que pop-ups de login continuam funcionando
   - Testar com múltiplos painéis ativos

## Critérios de Aceitação

- [ ] Clicar no ícone da pokepedia dentro do jogo não desloga a conta
- [ ] A pokepedia abre em janela separada ou no navegador padrão do sistema
- [ ] Pop-ups de login continuam funcionando dentro do painel (regressão garantida)
- [ ] Testado com múltiplos painéis ativos simultaneamente

## Estimativa de Esforço

- Investigação: 1 hora
- Implementação: 2 horas
- Testes: 1 hora
- Total: 4 horas