# Revisão

- task: task-025
- reviewer: agent
- type: critical
- created_at: 2026-09-25

## Resumo

Revisão crítica do rename PokeGrid → MultiGrid + perfis (PIW/genérico) na
branch `feat/multigrid-rename-piw-profile`. Diff cobre `package.json`,
`package-lock.json`, `main.ts`, `index.html`, `renderer.ts`, `src/config.ts`,
`src/types.ts`, `src/profiles.ts` (novo), `tests/`, `.gitignore`,
`.riteward/config.yaml`, `README.md`, `AGENTS.md` + DEC-004.

## Itens verificados

- [x] `package.json:2,35-36` name multigrid / appId com.usuario.multigrid / productName MultiGrid; `build.publish.repo` INTACTO (updater não quebra)
- [x] `main.ts:52` title MultiGrid; `main.ts:194` export defaultPath multigrid-config.json
- [x] `index.html:13,20,41` títulos MultiGrid; seletor `setup-profile` com PIW default
- [x] `src/profiles.ts` sem imports runtime (CommonJS-safe); `renderer.ts` importa via `.js` e `main` não importa (sem risco ESM-vs-CJS)
- [x] Migração em cadeia: `src/config.ts` tenta `pokegrid-config.json` depois `multiconta-config.json`; só renomeia se o novo não existir (sem perda)
- [x] `Config.activeProfile?` opcional — configs antigas sem o campo continuam válidas; título restaurado no boot se presente
- [x] `renderer.ts`: troca de perfil preenche URL; genérico não sobrescreve digitação; fallback para DEFAULT_URL
- [x] `riteward check` PASS: 87 testes (82 + 4 profiles + 1 migração v0), lint, typecheck; `npm run build` OK; artefatos conferidos via grep
- [x] Sem segredos no diff; sem mudança em updater, retry, pane-manager

## Problemas encontrados

- info: pasta `C:\Apps\pokegrid`, repo `thiothiagus/pokegrid` e `%APPDATA%` ainda têm o nome antigo — dívida registrada em DEC-004, fora de escopo por decisão (não quebrar updater/sessões).
- info: app ainda não restaura painéis no boot (task-008 pendente) — o título por perfil já é restaurado, os painéis aguardam aquela tarefa.
- info: `src/config-state.ts` duplica `DEFAULT_URL` em vez de importar de `profiles.ts` — intencional (mesmo motivo de `THEME_VALUES`: evitar dependência runtime entre grafo main e ESM do renderer).

## Veredicto

**Aprovado** — critérios de aceitação da task-025 atendidos; testes manuais pendem validação do usuário (plano na tarefa).

## Próximo passo

Avançar task-025 para FINALIZATION e aguardar aprovação humana antes de commit (permissão `commit: false`); testes manuais 1-4 da tarefa pelo usuário.

## Aprovação do usuário

- [x] Aprovado pelo usuário em 2026-09-25 (testes manuais 1-4 executados com sucesso; hash da migração `True`; pedido: gitignore em `docs/audits`, docs atualizadas, bump para 0.2.0 e lançamento).
