---
id: task-023
title: Corrigir loop de captcha Cloudflare no login do Poke Idle World
status: done
priority: 75
created_at: 2026-09-25
---

# Corrigir loop de captcha Cloudflare no login do Poke Idle World

## Contexto

Usuário reportou em 2026-09-25: captcha da Cloudflare fica se resolvendo sozinho em loop na página de login do Poke Idle World (`https://poke.idleworld.online/play`), impedindo login nas contas do PokeGrid. Origem: pedido direto do usuário no chat.

## Descrição

Captcha da Cloudflare fica se resolvendo sozinho em loop na pagina de login, impedindo login nas contas. Investigar User-Agent Electron, retry automatico interrompendo challenge e multiplas sessoes simultaneas.

Causas prováveis identificadas em DISCOVERY:
1. `src/pane-manager.ts:createPaneView` cria `BrowserView` sem `userAgent` customizado — o UA padrão do Electron contém token `Electron/31.7.7`, que a Cloudflare classifica como bot e responde com challenge interminável (Managed Challenge / Turnstile em loop).
2. `did-fail-load` em `pane-manager.ts` trata QUALQUER falha como erro e agenda `scheduleRetry` (reload em 2s-15s), o que pode interromper o challenge no meio da verificação e reiniciar o loop.
3. Múltiplos painéis carregando `poke.idleworld.online/play` ao mesmo tempo, do mesmo IP, aumentam o score de bot da Cloudflare.

## Escopo

**Dentro do escopo:**

- `src/pane-manager.ts` (UA realista + filtro de retry para challenge Cloudflare)
- `src/retry.ts` se necessário para expor cancelamento
- Testes unitários para o filtro de challenge

**Fora do escopo:**

- Migração BrowserView → WebContentsView
- Bypass de captcha / automação de resolução (não fazer)
- Mudança de layout/grid

## Critérios de aceitação

- [x] Painéis usam User-Agent Chrome/Windows realista sem token `Electron/` (+ `Sec-CH-UA` consistentes)
- [x] `did-fail-load` com `ERR_ABORTED (-3)` ou URL de challenge Cloudflare não dispara retry automático
- [x] `npm run build`, `riteward check` passam
- [x] Fluxo login-via-navegador: botão 🌐 abre o jogo no Chrome; botão 🔑 importa `cf_clearance` (plano B, validado como inerte por padrão)
- [x] `riteward check` passa com os novos testes (86 → 82 após revert, todos PASS)
- [x] Login Google volta a funcionar sem janela USB; captcha resolve 1x sem loop (validado pelo usuário)

## Plano de testes manuais

1. Abrir PokeGrid com 1 conta — Esperado: botões 🌐 e 🔑 visíveis no cabeçalho do painel — Verificar: visual
2. Clicar 🌐 — Esperado: jogo abre no Chrome padrão — Verificar: visual
3. No Chrome, passar pelo challenge; F12 > Application > Cookies, copiar valor de `cf_clearance` — Esperado: token copiado — Verificar: visual
4. Clicar 🔑 e colar o valor — Esperado: painel recarrega e chega na tela de login/ENTRAR sem "Falha na verificação" — Verificar: visual + fazer login da conta
5. Repetir 🔑 nos demais painéis (o mesmo valor pode servir para todos — clearance é por máquina/IP, não por conta) — Esperado: todos logados — Verificar: visual

## Notas

- v1 (UA estático + anti-retry) testada pelo usuário em 2026-09-25: loop virou falha explícita `600010` + `socket_manager.cc -105` (STUN). Evidência em `docs/audits/falha-auth.txt`.
- Diagnóstico v2: trocar só a string do UA não basta — o Turnstile cruza UA x Client Hints (`Sec-CH-UA` / `navigator.userAgentData`), que seguem com fingerprint do Electron → 600010. STUN `-105` é ruído do Chromium (DNS local resolve `stun.*` normalmente; task-014 cobre a supressão).
- v2: UA dinâmico alinhado ao Chromium real (`process.versions.chrome`) + reescrita de `Sec-CH-UA*` via webRequest por sessão + `app.userAgentFallback` sem tokens `Electron/`/`PokeGrid/` + anti-retry mantido. `riteward check` PASS (82 testes).
- Teste manual v2 pelo usuário (1 conta só): 600010 persiste SÓ no app, Chrome passa. Direção escolhida pelo usuário: "Login pelo navegador".
- v3: botões por painel 🌐 (abre jogo no Chrome via `shell.openExternal`) e 🔑 (importa `cf_clearance` colado para a sessão do painel via `session.cookies.set`, recarrega). Login da conta continua dentro do painel. `riteward check` PASS (86 testes).
- Retorno do usuário: consegue logar mesmo com a verificação falhando; incerto se o fluxo 🌐/🔑 foi o que destravou. Dúvida de segurança: risco de ban das contas (respondida: Cloudflare ≠ ban; risco real seria regra anti-multis do jogo).
- Esclarecimento: usuário usou o fluxo, mas o captcha continua falhando ao clicar mesmo com clearance importado; nunca tentou logar antes do fluxo. Hipótese: backend não exige o token (falha é cosmética) e o verdadeiro bloqueador era o loop de reload (v1/v2). Experimento proposto: limpar dados de 1 painel (⌫) e logar SEM o 🔑 para testar causalidade.
- Novo achado: após limpar, usuário tentou "Continuar com o Google" e caiu no bloqueio do Google ("navegador ou app pode não ser seguro", após prompt de chave USB/passkey). Causa: Google proíbe OAuth em navegadores embutidos (política deles, não bug nosso).
- Correção de rota: usuário SEMPRE usou login Google; TODAS as contas são Google-created (sem senha). Funcionava porque sessões antigas persistiam nas partitions; limpar forçou re-auth, que o Google barra no app. Orientação: NÃO limpar os demais painéis; testar "ESQUECI MINHA SENHA" em 1 conta para criar senha nativa. Plano B (se o jogo não permitir senha em conta Google): generalizar o importador 🔑 para cookies de sessão do Google.
- REGRESSÃO ASSUMIDA: usuário afirma que login Google sempre funcionou e quebrou com nossas mudanças (janela USB/passkey inédita). Mecanismo plausível: UA/Client Hints alterados → Google viu "navegador novo não reconhecido" → step-up passkey + "app pode não ser seguro". Ação: REVERT total do spoof de identidade (UA customizado, Sec-CH-UA, userAgentFallback) — fingerprint volta a ser byte-idêntico ao original. Mantidos: anti-retry (não mexe em identidade) e botões 🌐/🔑 (opt-in, inertes por padrão). Gates PASS (82 testes). Experimento: usuário retesta login Google no painel limpo; se voltar → causa confirmada; se não → causa é re-auth embutido e segue plano senha-nativa.
- RESOLVIDO (teste manual do usuário): após o revert, login Google volta a funcionar, sem janela USB; captchas resolvem uma única vez, sem resetar. Causa confirmada. Documentado em `docs/captcha-cloudflare-e-login-google.md`.
