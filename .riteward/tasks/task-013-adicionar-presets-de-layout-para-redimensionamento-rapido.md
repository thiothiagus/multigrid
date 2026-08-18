---
id: task-013
title: Adicionar presets de layout para redimensionamento rapido
status: todo
priority: high
created_at: 2026-08-15
---

# Adicionar presets de layout para redimensionamento rapido

## Descrição

Reportado por usuário no `inbox.md`: "Ficar arrastando o tamanho das telas as vezes é um pouco dificil. como podemos resolver? presets de tamanho ou algo melhor."

Hoje o redimensionamento só é feito arrastando as divisórias (gutters). O usuário quer uma forma mais rapida e precisa de ajustar o layout sem precisar arrastar.

### Escopo

- Adicionar presets de layout na toolbar ou em um menu de cada painel
- Presets podem incluir: "Igual" (resetar todas as fracoes para 1), "FocarConta N" (aumentar o painel N para 60-70% e dividir o resto igualmente), "Colunas iguais", "Linhas iguais"
- Permitir reset rapido do layout inteiro para proporcoes iguais (botao na toolbar)
- Opcional: permitir que o usuario salve seu proprio preset personalizado

## Critérios de aceitação

- [ ] Botao "Resetar layout" na toolbar (volta todas as fracoes para 1)
- [ ] Presets rapidos acessiveis (menu ou botoes): Igual, Focar N, Colunas, Linhas
- [ ] Presets aplicam instantaneamente sem precisar arrastar
- [ ] Layout manual (fracoes arrastadas) continua funcionando e tem prioridade sobre presets ate um preset ser explicitamente selecionado
- [ ] Opcional: usuario pode salvar e nomear um preset personalizado

## Notas

_Origem: `inbox.md` linha 7._
