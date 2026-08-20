# Multi-Conta Grid v2

App de desktop (Electron) para jogar várias contas ao mesmo tempo, em uma
única janela, cada quadrante com sessão de login independente.

## Novidades desta versão

- **Tela inicial**: escolha quantas contas quer (1 a 9) e a URL do jogo.
- **Divisórias arrastáveis**: passe o mouse na linha entre dois painéis e
  arraste para redimensionar.
- **+ Conta / ×**: adicione contas a qualquer momento pelo botão no topo,
  ou feche uma clicando no × do cabeçalho dela.
- **Renomear**: clique no nome de cada conta (ex: "Conta 1") pra editar.
- **Reordenar**: arraste a alça `⠿` no cabeçalho de uma conta para trocar
  a posição dela na grade — a sessão não é recriada, só a ordem muda.
- **Limpar dados de uma conta**: botão `⌫` no cabeçalho apaga cookies/login
  daquela conta (recupera login travado) e recarrega só esse painel.
- **Janela persistente**: posição, tamanho e estado maximizado da janela
  voltam do jeito que você deixou da última vez.
- **Pop-ups de login**: se o jogo/site abrir login em janela nova
  (`window.open`, comum em OAuth), a janela extra é bloqueada e o login é
  carregado dentro do próprio painel, mantendo a sessão da conta.
- **Layout salvo automaticamente**: número de contas, nomes e tamanho dos
  painéis voltam do jeito que você deixou da última vez.
- **Recuperação automática**: se um painel travar ou perder conexão, ele
  tenta reconectar sozinho (bolinha ao lado do nome fica amarela/vermelha
  pra indicar o status). Se não conseguir depois de várias tentativas,
  aparece um botão "Tentar novamente".
- **Mais seguro**: janela agora roda com `sandbox: true` e uma política de
  CSP restritiva. Cada conta roda em `BrowserView` isolada com partição
  `persist:conta<N>`.

## Como rodar

```bash
npm install
npm run start
```

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run start` | Build + abre o app (Electron) |
| `npm run build` | Compila TypeScript → JavaScript (roda `tsc`) |
| `npm run typecheck` | Verifica tipos sem emitir arquivos |
| `npm run test` | Roda testes com Vitest |
| `npm run lint` | ESLint + Prettier |
| `npm run format` | Formata código com Prettier |
| `npm run dist` | Gera instalador Windows (electron-builder) |

## Estrutura do projeto

```
multiconta-grid-v3/
├── multiconta/           # App Electron (este diretório)
│   ├── main.ts           # Processo principal (cria janela, gerencia BrowserViews)
│   ├── preload.ts        # Ponte IPC segura (contextBridge)
│   ├── renderer.ts       # UI do grid (setup, render, eventos)
│   ├── logger.ts         # Logger JSONL em logs/errors.jsonl
│   ├── index.html        # Shell da UI (toolbar, setup-screen, grid-container)
│   ├── style.css         # Estilos (grid, painéis, divisórias, overlays)
│   ├── src/
│   │   ├── config.ts           # Caminhos de arquivo, DEFAULT_URL
│   │   ├── config-state.ts     # Estado padrão, normalização, computeGridDims
│   │   ├── grid-layout.ts      # Cálculo de layout CSS Grid, frações, resizers
│   │   ├── pane-manager.ts     # Criação/remoção/atualização de BrowserViews
│   │   ├── pane-ui.ts          # Atualização de status (bolinha, overlay)
│   │   ├── focus-manager.ts    # Estado de foco (modo foco painel)
│   │   ├── win-state.ts        # Persistência de geometria da janela
│   │   ├── retry.ts            # Lógica de retry com backoff exponencial
│   │   ├── types.ts            # Interfaces TypeScript compartilhadas
│   │   └── win-state.ts        # Estado da janela
│   ├── tests/           # Testes automatizados (Vitest)
│   │   ├── config.test.ts
│   │   ├── grid-layout.test.ts
│   │   ├── retry.test.ts
│   │   └── win-state.test.ts
│   ├── tsconfig.json          # Main process (CommonJS)
│   ├── tsconfig.renderer.json # Renderer (ES modules)
│   ├── package.json
│   └── .eslintrc.cjs          # Config ESLint (CommonJS)
└── ... (outros arquivos de config)
```

## Arquitetura rápida

- **Main process** (`main.ts`): cria `BrowserWindow`, gerencia `BrowserView`s
  (uma por conta), posiciona via `setBounds`, lida com IPC.
- **Preload** (`preload.ts`): expõe `window.api` com métodos tipados
  (`createPane`, `removePane`, `syncLayout`, `onPaneStatus`, etc.).
- **Renderer** (`renderer.ts`): monta a grade CSS Grid, cria elementos
  de painel (header + área reservada), escuta redimensionamento
  das divisórias (`mousedown`/`mousemove`/`mouseup`), sincroniza layout
  com main process via `window.api.syncLayout()`.

## Isolamento de sessão

Cada conta usa partição `persist:conta<N>` — cookies, localStorage,
cache e sessionStorage ficam **completamente separados** entre painéis.
Não há vazamento de sessão entre contas.

## Recuperação de travamentos

- Heartbeat a cada 30s via `webContents.on('render-process-gone')` e
  `webContents.on('unresponsive')`.
- Se painel travar: status fica vermelho, overlay "O painel travou...
  Reiniciando...", recria `BrowserView` na mesma partição (mantém login).
- Se perder conexão: status amarelo, overlay "Tentando reconectar em Xs...",
  recarrega a URL do painel.
- Após 5 falhas: status vermelho final, botão "Tentar novamente" manual.

## Configuração persistida

Arquivo: `%APPDATA%/Multi-Conta Grid/config.json`

Contém:
- `gameUrlDefault`: URL padrão para novas contas
- `nextId`: próximo ID sequencial
- `cols`, `rows`: grade atual
- `colFr`, `rowFr`: frações CSS Grid (1fr = tamanho igual)
- `panes[]`: array de `{id, label, partition, url}`

## Desenvolvimento

- Código-fonte em **TypeScript** (`.ts`)
- Build gera `.js` na raiz e em `src/` (artefatos, não versionados)
- Dois `tsconfig`:
  - `tsconfig.json` → `module: CommonJS` (main process)
  - `tsconfig.renderer.json` → `module: ES2022` (renderer, carrega via `<script type="module">`)

## Qualidade

- `npm run typecheck` — `tsc --noEmit` nos dois tsconfig
- `npm run test` — Vitest (24 testes cobrindo config, grid-layout, retry, win-state)
- `npm run lint` — ESLint + Prettier (regras TypeScript recomendadas)
- `npm run format:check` — Prettier check
- `riteward check` — executa todos os quality gates acima

## Limitações conhecidas

- Janelas pop-up (`window.open`) são bloqueadas e carregadas no painel.
  Alguns fluxos OAuth complexos podem não funcionar.
- Não há suporte a múltiplos monitores (janela única).
- Backup/restore de configuração foi removido (funcionalidade problemática).