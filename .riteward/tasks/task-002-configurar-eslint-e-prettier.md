---
id: task-002
title: Configurar ESLint e Prettier
status: todo
priority: high
created_at: 2026-08-15
---

# Configurar ESLint e Prettier

## Descrição

Adicionar ESLint com regras recomendadas para Electron/Node e Prettier para formatação. Criar arquivos .eslintrc e .prettierrc. Configurar scripts npm run lint e npm run format. Isso estabelece um quality gate de código limpo e consistente.

## Critérios de aceitação

- [ ] ESLint instalado e configurado com regras recommended + electron plugin
- [ ] Prettier instalado e configurado
- [ ] eslint-config-prettier integrado para evitar conflitos
- [ ] Scripts npm run lint e npm run format adicionados ao package.json
- [ ] npm run lint executa sem erros no código atual
- [ ] .eslintrc/.prettierrc commitados

## Notas

_Pode ser feita em paralelo com task-001 (TS). Se TS for feito primeiro, usar @typescript-eslint._
