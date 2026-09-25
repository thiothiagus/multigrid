# Revisão — Corrigir loop de captcha Cloudflare no login do Poke Idle World (task-023)

- task: task-023
- reviewer: opencode
- type: critical
- created_at: 2026-09-25

## Resumo

Revisão v3 da correção do loop/falha de captcha Cloudflare. v1/v2 (UA + `Sec-CH-UA` + anti-retry) insuficientes: teste manual com 1 conta mostra 600010 só no app (Chrome passa) — fingerprint JS do Electron além dos headers. Direção aprovada pelo usuário: fluxo "login pelo navegador" (`main.ts`, `preload.ts`, `src/types.ts`, `renderer.ts`, `src/pane-manager.ts`, `tests/clearance.test.ts`).

## Itens verificados

- [x] v1/v2 mantidos: UA dinâmico + `Sec-CH-UA*` por sessão + anti-retry challenge/abort — 6 testes passando
- [x] `parseClearanceValue` aceita token puro, com prefixo `cf_clearance=` e com aspas; rejeita vazio/curto/com espaços
- [x] `clearanceCookieUrl` usa a origem da URL do painel, com fallback para o domínio do jogo
- [x] `importClearanceToPane` grava cookie `secure`/`httpOnly` na sessão isolada do painel (sem vazar entre contas)
- [x] IPC `open-external-login` valida `https?` antes de `shell.openExternal`; `import-clearance` loga ok/falha
- [x] Botões 🌐/🔑 no cabeçalho de cada painel com prompt de cola guiado e alerta em caso de falha
- [x] `npm run build` + `riteward check` (test/lint/typecheck) — todos PASS, 86 testes
- [x] Sem bypass de captcha: o humano resolve no navegador real; o app só reaproveita o `cf_clearance`

## Problemas encontrados

Nenhum blocker. Warnings: (1) `cf_clearance` expira/limita por IP — se expirar, é só repetir o fluxo; (2) se o jogo amarrar o clearance ao UA exato do Chrome do usuário, pode ser preciso repetir após updates — observar no teste manual.

## Veredicto

**Aprovado** — teste manual do usuário confirmou a resolução.

## Próximo passo

FINALIZATION → commit mediante aprovação explícita (push/commit exigem aprovação; `permissions.push/commit: false`).

## Aprovação do usuário

- [x] Teste manual aprovado pelo usuário em 2026-09-25: login Google funciona, sem janela USB; captcha resolve 1x sem resetar ("Aparentemente o problema foi resolvido")
