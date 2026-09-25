# Plano — Corrigir loop de captcha Cloudflare no login do Poke Idle World (task-023)

- task: task-023
- author: opencode
- created_at: 2026-09-25

## Contexto

PokeGrid cria um `BrowserView` por conta (`persist:contaN`) sem customizar User-Agent. O UA padrão do Electron 31 (`... Electron/31.7.7`) é sinal clássico de bot para a Cloudflare, que responde com Managed Challenge em loop. Além disso, todo `did-fail-load` agenda reload automático, podendo interromper a verificação no meio.

## Objetivo

Fazer o challenge da Cloudflare resolver uma única vez e permitir login, sem remover proteções nem automatizar captcha.

## Abordagem

1. Spoof de UA: definir UA Chrome 126 / Windows 10 realista (mesmo major do Chromium do Electron 31) em cada `BrowserView` via `webContents.setUserAgent`, removendo token Electron. Centralizar em constante exportada para teste.
2. Anti-loop: no handler `did-fail-load`, ignorar `ERR_ABORTED (-3)` e URLs de challenge (`cdn-cgi/challenge-platform`, `challenges.cloudflare.com`, `cf_clearance`, `turnstile`, `__cf_`) — não enviar `error`, não agendar retry.
3. Manter retry para falhas reais de rede/DNS.

## Passos

1. Adicionar `CHROME_USER_AGENT` + `isCloudflareChallengeUrl()` + `shouldSuppressRetry()` em `src/pane-manager.ts` (exportados para teste).
2. Aplicar `view.webContents.setUserAgent(CHROME_USER_AGENT)` e também nos popups OAuth/Poképédia.
3. Filtrar `did-fail-load` antes de `sendStatus`/`onLoadError`.
4. Adicionar testes em `tests/` cobrindo o filtro.
5. Rodar `npm run build` + `riteward check`.

## Riscos

- UA fixo desatualiza com novas versões do Electron — mitigação: comentário indicando Chromium correspondente + fácil atualização.
- Cloudflare pode continuar desafiando por rate-limit de N contas no mesmo IP — mitigação: orientar login sequencial, não paralelo; fora do código.

## Critérios de sucesso

- [ ] UA sem token `Electron/` aplicado a todos os views
- [ ] Challenge Cloudflare / abort não dispara retry automático
- [ ] `riteward check` passa

## Aprovação

- [x] Aprovado pelo usuário em 2026-09-25 (via prompt: "Aprovar e implementar")
