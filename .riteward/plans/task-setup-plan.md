# Plano

- task: task-setup
- author: opencode
- created_at: 2026-08-18

## Contexto

O `riteward init` criou as estruturas básicas (`.riteward/`, `AGENTS.md` raiz, `.riteward/AGENTS.md` temporário, `config.yaml` parcial). Resta finalizar a integração: enriquecer o `AGENTS.md` raiz com o contexto do projeto (Cenário A), remover o arquivo temporário, configurar logs e refactor no `config.yaml`, e atualizar o `.gitignore`.

## Objetivo

Cumprir todos os critérios de aceitação da task-setup, deixando o Riteward operacional com logs, refactor e AGENTS.md unificado.

## Abordagem

Cenário A: `.riteward/AGENTS.md` existe e será mesclado no `AGENTS.md` raiz (contexto do projeto + instruções Riteward) e depois removido. As demais etapas (logs, refactor, .gitignore) são edits pontuais.

## Passos

1. Enriquecer `AGENTS.md` raiz com contexto do projeto + instruções do Riteward.
2. Remover `.riteward/AGENTS.md` (temporário).
3. Garantir `logs/` e `logs/errors.jsonl` existentes; bloco `logs` em `config.yaml`.
4. Descomentar/preencher bloco `refactor` em `config.yaml` (`max_lines`, `ignore_dirs`).
5. Atualizar `.gitignore` com `.riteward/state/` (já tem `logs/`).
6. Validar: `riteward logs check`, `riteward refactor scan` e `riteward status`.
7. Avançar workflow: IMPLEMENTATION → TESTING → REVIEW → READY_FOR_COMMIT.

## Riscos

- Configuração YAML inválida → validar com `riteward status` após cada edit.

## Critérios de sucesso

- [x] `AGENTS.md` unificado na raiz com contexto + Riteward + referência à constitution.
- [ ] `.riteward/AGENTS.md` removido.
- [x] `logs/` criado e `riteward logs check` executa sem erros.
- [x] `refactor` configurado e `riteward refactor scan` limpo.
- [x] `.gitignore` ignora `.riteward/state/` e `logs/`.
