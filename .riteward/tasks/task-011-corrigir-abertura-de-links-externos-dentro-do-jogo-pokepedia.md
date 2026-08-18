---
id: task-011
title: Corrigir abertura de links externos dentro do jogo (pokepedia)
status: done
priority: high
created_at: 2026-08-15
---

# Corrigir abertura de links externos dentro do jogo (pokepedia)

## Descrição

Reportado por usuário no `inbox.md`: dentro do jogo há um ícone que abre a pokepédia em outra aba, mas no app o link está abrindo na mesma aba do painel, o que faz o jogo deslogar (perde a sessão do jogo).

O app já tem handler de `window.open` / pop-ups no main process, mas aparentemente links externos (ex: `<a href="..." target="_blank">`) estão sendo carregados dentro do próprio painel em vez de abrir em janela separada ou nova aba externa.

### Escopo

- Investigar como o jogo abre a pokepedia (`window.open` vs `target="_blank"` vs `location.href`)
- Garantir que links externos abram em uma janela popup separada (preservando a sessão do jogo no painel)
- Ou abrir no navegador padrão do sistema, dependendo do comportamento desejado
- Manter o comportamento atual de pop-ups de login (que já funcionam in-pane)

## Critérios de aceitação

- [ ] Clicar no ícone da pokepedia dentro do jogo não desloga a conta
- [ ] A pokepedia abre em janela separada ou no navegador padrão do sistema
- [ ] Pop-ups de login continuam funcionando dentro do painel (regressão garantida)
- [ ] Testado com múltiplos painéis ativos simultaneamente

## Notas

_Origem: `inbox.md` linha 3. Bug de alta prioridade pois causa perda de sessão._
