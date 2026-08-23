---
id: task-016
title: Renomear arquivo de configuracao para pokegrid-config.json
status: done
priority: medium
created_at: 2026-08-23
---

# Renomear arquivo de configuracao para pokegrid-config.json

## Descrição
Trocar multiconta-config.json por pokegrid-config.json com migracao automatica do arquivo legado em %APPDATA%, atualizando tests, .gitignore e README (reverte consequencia documentada na DEC-002)

## Critérios de aceitação

- [ ] Nome canônico `pokegrid-config.json` em `src/config.ts` e `main.ts`
- [ ] Migração automática do arquivo legado na inicialização (renomeia `multiconta-config.json` → `pokegrid-config.json` apenas se o novo não existir e o legado existir)
- [ ] Nenhuma config de usuário é perdida após a migração (painéis, layout, tema preservados)
- [ ] Testes unitários cobrindo: migração executada, no-op quando só existe o novo, preferência pelo novo quando ambos existem
- [ ] `.gitignore` e `README.md` atualizados para o novo nome (referência ao legado mantida apenas onde descreve a migração)
- [ ] Decision record DEC-003 documentando a reversão da consequência da DEC-002
- [ ] `riteward check` passando (test, lint, typecheck)

## Notas

_Adicione notas sobre o progresso ou decisões aqui._
