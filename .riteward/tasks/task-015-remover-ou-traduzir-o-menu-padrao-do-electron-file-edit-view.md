---
id: task-015
title: Remover ou traduzir o menu padrao do Electron (File, Edit, View...)
status: todo
priority: low
created_at: 2026-08-22
---

# Remover ou traduzir o menu padrao do Electron (File, Edit, View...)

## Descrição
O app usa o menu default do Electron em ingles porque main.ts nunca chama Menu.setApplicationMenu(). Decidir entre: (a) remover completamente com Menu.setApplicationMenu(null), ou (b) menu customizado em pt-BR com acoes uteis (adicionar conta, alternar tema, recarregar painel, zoom, DevTools). Manter atalhos de teclado funcionais ao remover.

## Critérios de aceitação

- [ ] Critério de aceitação 1
- [ ] Critério de aceitação 2

## Notas

_Adicione notas sobre o progresso ou decisões aqui._
