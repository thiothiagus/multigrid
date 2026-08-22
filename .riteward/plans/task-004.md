# Plano: Configurar pipeline de CI/CD

- task: task-004
- author: muse-spark
- created_at: 2026-08-22

## Contexto

O projeto multi-conta-grid possui quality gates locais (`npm test`, `npm run lint`, `npm run typecheck`) validados manualmente via `riteward check`, mas não há pipeline automatizado que garanta qualidade em push/PR. Não existe diretório `.github/workflows/`, nenhum workflow CI, e o README não exibe badges de status. O `package.json:10-14` já expõe scripts de `test` (vitest), `lint` (eslint), `typecheck` (tsc --noEmit) e `build` (tsc + electron-builder). A task depende de task-002 e task-003, ambas já concluídas (ESLint + Vitest com 56 testes), portanto todos os jobs têm o que executar.

## Objetivo

Criar workflow GitHub Actions `.github/workflows/ci.yml` que execute em `push` e `pull_request` nas branches `main`/`master`/`feat/*` os jobs: lint, typecheck, testes e build (electron-builder) para Windows e Linux. Adicionar badges de status no README e garantir que o pipeline passe com o código atual.

## Abordagem

Workflow único `ci.yml` com 4 jobs paralelos (ubuntu-latest + Node 20), estratégia já usada em projetos Electron similares:

1. `lint` — `npm ci` + `npm run lint`
2. `typecheck` — `npm ci` + `npm run typecheck` (equivale a `npm run build` sem emit, mas usa `tsc --noEmit`)
3. `test` — `npm ci` + `npm test` (vitest run)
4. `build` — `npm ci` + `npm run build` + validação do `electron-builder --linux --win` (ou pelo menos `npm run build`; build completo requer Wine no Linux runner, então condicionar ao OS ou fazer dry-run)

Decisão: build validado via `npm run build` (compilação TS) no ubuntu; job separado `build` tenta `electron-builder --linux dir` sem publish (`--publish never`) para validar config sem gerar artefato pesado. Para Windows, usar `windows-latest` apenas se cache for rápido; caso contrário, validar só no ubuntu com `--win` em modo `dir` simulado.

Badges no `README.md:1` usando `https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg` — como repo ainda não tem remote, usar placeholder `USER/REPO` e documentar necessidade de substituir.

Alternativa considerada: 3 workflows separados (lint.yml, test.yml, build.yml) — descartada por ser mais verbosa sem benefício.

## Passos

1. Criar diretório `.github/workflows/` e arquivo `ci.yml` com triggers `push`/`pull_request` e 4 jobs.
2. Ajustar `package.json` build.files se necessário para garantir `electron-builder` encontra artefatos compilados.
3. Adicionar badges de CI no topo do `README.md` (logo após título, antes do aviso CAUTION).
4. Validar localmente: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` já passam (verificado em 2026-08-22).
5. Simular workflow local: rodar `riteward check` e `npm run build` para garantir pipeline passaria.
6. Avançar workflow para TESTING e executar `riteward check` como gate final.

## Riscos

- **electron-builder no CI sem Wine/dependências** pode falhar no Linux ao tentar build Windows. *Mitigação*: usar `electron-builder --linux --publish never --config.extraMetadata` ou limitar build job a `npm run build` apenas; documentar limitação e usar `if: matrix.os` se necessário.
- **Remote git ausente** — badges apontarão para URL placeholder. *Mitigação*: incluir comentário no README indicando substituição de `USER/REPO`.
- **Node version drift** — projeto usa Node 20 implícito. *Mitigação*: fixar `node-version: '20'` e `cache: 'npm'` no setup-node.
- **Tempo de CI** — `npm ci` + build pode ser lento. *Mitigação*: cache de npm e paralelismo de jobs; build só roda se lint/typecheck/test passarem? optar por jobs independentes para feedback rápido.

## Critérios de sucesso

- [ ] Workflow `.github/workflows/ci.yml` criado com triggers push/PR
- [ ] Job `lint` executa `npm run lint` e passa
- [ ] Job `typecheck` executa `npm run typecheck` e passa
- [ ] Job `test` executa `npm test` e passa (56 testes)
- [ ] Job `build` valida `npm run build` (e opcionalmente `electron-builder --linux dir`) para Windows/Linux sem erro
- [ ] `riteward check` passa localmente após alterações
- [ ] Badges de status adicionados no README.md
