---
id: task-025
title: Renomear app para MultiGrid com interface PIW
status: in_progress
priority: 75
created_at: 2026-09-25
---

# Renomear app para MultiGrid com interface PIW

## Contexto

Colisão de nome com o projeto público `soufoka/PokeGrid-source` (mesmo nome, mais maduro, v1.5.x, focado em Poke Idle World). Plano B já registrado em `.riteward/records/DEC-002-renomeacao-pokegrid.md`: nome reserva **MultiGrid** (`com.usuario.multigrid`). Origem: pedido direto do usuário no chat em 2026-09-25.

## Descrição

Renomear o app de PokeGrid para **MultiGrid** (nome, productName, appId, títulos da UI, arquivo de config com migração em cadeia) e introduzir **perfis de jogo**: a primeira interface dedicada é **MultiGrid PIW** (Poke Idle World), preservando o comportamento atual como padrão. Arquitetura preparada para N perfis (um por jogo idle) sem forks.

## Escopo

(Liste arquivos e áreas; seja explícito no que fica de fora.)

**Dentro do escopo:**

- `package.json` / `package-lock.json`: name, productName, appId, description
- `main.ts`: título da janela, defaultPath de export
- `index.html`: title, toolbar, setup-screen (seletor de perfil)
- `src/config.ts`: CONFIG_FILENAME + migração em cadeia (multiconta → pokegrid → multigrid)
- `src/profiles.ts` (novo): catálogo de perfis de jogo (PIW primeiro + genérico)
- `src/types.ts`: `Config.activeProfile?`
- `renderer.ts`: seletor de perfil, título da toolbar por perfil
- `tests/config.test.ts` + `tests/profiles.test.ts` (novo)
- `.gitignore`, `.riteward/config.yaml`, `README.md`, `AGENTS.md`
- Decision record da renomeação + arquitetura de perfis

**Fora do escopo:**

- Renomear o repositório GitHub / URLs de release (`thiothiagus/pokegrid` permanece; updater intacto)
- Mover a pasta `C:\Apps\pokegrid` ou `%APPDATA%` (só o arquivo de config migra; pasta do userData migra sozinha via appId no próximo install)
- Novos perfis além de PIW + genérico; features específicas do jogo (tierlist, eco, etc.)

## Critérios de aceitação

- [x] `npm run build` gera `productName MultiGrid` e `appId com.usuario.multigrid`
- [x] Abrir o app mostra "MultiGrid" na toolbar e "MultiGrid PIW" quando o perfil PIW está ativo
- [x] Setup exibe seletor de perfil (PIW padrão) e a URL acompanha o perfil
- [x] Config legada `pokegrid-config.json` migra sozinha para `multigrid-config.json` com conteúdo idêntico (a restauração dos painéis no boot é a task-008, fora deste escopo)
- [x] `riteward check` (test+lint+typecheck) passa

## Plano de testes manuais

1. Copiar `pokegrid-config.json` (com 2 painéis) para `%APPDATA%\multigrid\` sem `multigrid-config.json`, abrir o app e fechar — Esperado: o arquivo vira `multigrid-config.json` com conteúdo idêntico (mesmo hash) e o setup aparece — Verificar: `Get-FileHash` igual + tela de setup visível (os painéis voltarem sozinhos no boot é a task-008, não esta)
2. Abrir setup (sem config) — Esperado: seletor mostra "MultiGrid PIW", URL PIW preenchida — Verificar: visual
3. Trocar perfil para genérico — Esperado: campo URL limpa/permite digitar — Verificar: visual
4. Criar 2 contas no perfil PIW — Esperado: toolbar exibe "MultiGrid PIW", contas abrem o jogo — Verificar: visual + grade

## Notas

_Notas sobre o progresso aqui; decisões relevantes viram registros via `riteward decision create`._
