---
id: task-021
title: Capturar erros de JavaScript nos logs (logger.init nunca chamado)
status: todo
priority: high
created_at: 2026-08-25
---

# Capturar erros de JavaScript nos logs (logger.init nunca chamado)

## Descrição
logger.init() nao e chamado em main.ts, entao os handlers de uncaughtException/unhandledRejection nunca sao registrados e nada e gravado em logs/errors.jsonl. Erros de JS aparecem so como dialogo do Electron. Tambem capturar erros do renderer (window.onerror / unhandledrejection) e enviar ao processo main via IPC para registro no log

## Critérios de aceitação

- [ ] Critério de aceitação 1
- [ ] Critério de aceitação 2

## Notas

_Adicione notas sobre o progresso ou decisões aqui._
