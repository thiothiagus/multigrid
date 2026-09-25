# Captcha Cloudflare em loop + login Google barrado — causa e solução

Data: 2026-09-25 · Tarefa: task-023 · Evidência bruta: `docs/audits/falha-auth.txt`

## Sintomas

1. Captcha/checkbox da Cloudflare ("Confirme que é humano") se resolvia sozinho
   em loop na tela de login do Poke Idle World, atrapalhando o login.
2. Depois de uma primeira tentativa de correção, o widget passou a falhar com
   erro `600010` ("Falha na verificação").
3. Após limpar os dados de um painel, o login Google ("Continuar com o Google")
   passou a pedir chave USB/passkey e em seguida barrava com
   "Esse navegador ou app pode não ser seguro".

## Causas (uma para cada sintoma)

### 1. Loop: reload automático no meio do challenge

Todo `did-fail-load` (qualquer frame, qualquer erro, inclusive `ERR_ABORTED`
de subrecursos do challenge) disparava overlay de erro + `scheduleRetry`
(reload em 2–15 s). Recarregar durante o "Verifying you are human" reinicia
a verificação — loop infinito.

**Fix (mantido):** em `src/pane-manager.ts`, o handler agora ignora falhas de
subframes (`isMainFrame === false`) e suprime retry para `ERR_ABORTED (-3)` e
URLs de challenge (`isCloudflareChallengeUrl` / `shouldSuppressRetry` cobrem
`/cdn-cgi/`, `challenges.cloudflare.com`, `turnstile`, `cf_clearance`).

### 2. Erro 600010: fingerprint inconsistente não resolve

A primeira hipótese foi o token `Electron/` no User-Agent. Só trocar a string
do UA (e depois reescrever os headers `Sec-CH-UA` para combinar) **não**
resolveu: o Turnstile lê também `navigator.userAgentData` e outros sinais JS
que continuam denunciando o Chromium embutido. Pior: ver item 3.

### 3. Login Google barrado: REGRESSÃO do spoof de identidade (o ponto central)

O login Google sempre funcionou porque as sessões antigas persistiam nas
partitions (`persist:contaN`). Ao trocar UA + Client Hints, o Google passou a
ver um **"navegador novo, nunca visto"** na conta → pediu step-up de
passkey (janela USB inédita) → barrou o app embutido ("pode não ser seguro").
O spoof foi **revertido por completo**; fingerprint do Electron restaurado
byte-idêntico ao original — e o login Google voltou, sem janela USB, com o
captcha resolvendo uma única vez.

**Lição registrada:** não mascarar a identidade do navegador (UA/Client
Hints) neste app. O Google interpreta qualquer mudança como dispositivo novo
e trava o OAuth; a Cloudflare detecta o mismatch de qualquer jeito. Correções
aceitas aqui são as que **não mexem em identidade**: anti-retry e fluxos
opt-in explícitos do usuário.

## Fluxo opt-in "login pelo navegador" (plano B, inerte por padrão)

Botões no cabeçalho de cada painel (`renderer.ts`, IPC em `main.ts`,
ponte em `preload.ts`, tipos em `src/types.ts`):

- **🌐** `open-external-login`: abre a URL do jogo no navegador padrão
  (onde o challenge passa) via `shell.openExternal`.
- **🔑** `import-clearance`: cola o valor do cookie `cf_clearance` (copiado
  no Chrome em F12 > Application > Cookies) na sessão isolada do painel via
  `session.cookies.set` (`secure` + `httpOnly`) e recarrega.
  Helpers puros em `src/pane-manager.ts`: `parseClearanceValue`,
  `clearanceCookieUrl`, `importClearanceToPane`.

Só age quando clicado; não altera fingerprint nem sessões sozinho.

## Limitações conhecidas (não são bugs do app)

- `socket_manager.cc ... stun.* ... error -105` no terminal: ruído do
  Chromium (WebRTC/STUN); DNS local resolve esses hosts normalmente.
  Supressão é a task-014, separada.
- Google proíbe OAuth em navegadores embutidos por política deles; sessões
  estabelecidas continuam valendo — **não limpar os painéis** (`⌫`)
  sem necessidade, pois força re-auth.
- `cf_clearance` é por máquina/IP e expira; se expirar, basta repetir o 🔑.
- Falhar no challenge Cloudflare **não** bane conta de jogo (Cloudflare é o
  "porteiro", não o dono do jogo). Risco real de ban viria de regra
  anti-multicontas do próprio jogo (N contas no mesmo IP) — ver os termos.
