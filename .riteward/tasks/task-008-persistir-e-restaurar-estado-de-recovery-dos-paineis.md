---
id: task-008
title: Persistir e restaurar estado de recovery dos paineis
status: todo
priority: low
created_at: 2026-08-15
---

# Persistir e restaurar estado de recovery dos paineis

## Descrição

Salvar o estado de retry/recovery dos paines no config para que apos restart do app paineis que estavam em retry continuem tentando reconectar. Atualmente o retryCount e retryTimer sao perdidos ao fechar o app.

## Critérios de aceitação

- [ ] retryCount e status de cada pane persistidos no config
- [ ] Ao reabrir o app, paineis em retry retomam as tentativas
- [ ] O timer de retry nao duplica apos restart
- [ ] Status visual (bolinha amarela/vermelha) restaurado corretamente

## Notas

_Trabalho de escopo pequeno. Depende de entender bem a lógica de retry atual em main.js._
