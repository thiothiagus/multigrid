---
id: task-004
title: Configurar pipeline de CI/CD
status: done
priority: medium
created_at: 2026-08-15
---

# Configurar pipeline de CI/CD

## Descrição

Criar workflow do GitHub Actions (.github/workflows/ci.yml) que executa em push/PR: lint, typecheck (apos migrar para TS), testes, e build com electron-builder. Garantir que o build de Windows (nsis) e Linux (AppImage) sejam validados. Adicionar badges de status no README.

## Critérios de aceitação

- [ ] Workflow ci.yml criado em .github/workflows/
- [ ] Job de lint executado em push/PR
- [ ] Job de testes executado em push/PR
- [ ] Job de build (electron-builder) para Windows e Linux
- [ ] Pipeline passa em todos os jobs com codigo atual
- [ ] Badges de status adicionados no LEIA-ME.md

## Notas

_Depende de task-002 (ESLint) e task-003 (testes) para ter o que executar. Pode ser criada antes com steps de build apenas._
