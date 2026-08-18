---
id: task-012
title: Maximizar painel individual (modo foco)
status: todo
priority: high
created_at: 2026-08-15
---

# Maximizar painel individual (modo foco)

## Descrição

Reportado por usuário no `inbox.md`: "Quero poder maximizar a janela de somente uma das contas."

Hoje todos os painéis ficam sempre visíveis na grade. O usuário quer poder focar em uma única conta temporariamente, expandindo aquele painel para ocupar toda a área do grid, sem fechar ou perder os outros.

### Escopo

- Adicionar botão de "maximizar foco" no cabeçalho de cada painel (ex: ícone de expandir)
- Ao clicar, o painel selecionado ocupa 100% da área do grid; os outros ficam ocultos
- Os outros painéis continuam rodando em background (não são pausados nem fechados)
- Clicar novamente (ou botão de restaurar) volta ao layout normal
- Preservar as frações de coluna/linha anteriores ao restaurar

## Critérios de aceitação

- [ ] Botão de foco/maximizar no cabeçalho de cada painel
- [ ] Ao focar, o painel ocupa toda a área do grid
- [ ] Os outros painéis continuam ativos em background (BrowserView não é destruída)
- [ ] Botão de restaurar retorna ao layout anterior com as mesmas proporções
- [ ] Atalho de teclado para focar/desfocar (ex: double-click no cabeçalho)
- [ ] Estado de foco não é persistido (sempre abre em grade normal ao reiniciar o app)

## Notas

_Origem: `inbox.md` linha 5._
