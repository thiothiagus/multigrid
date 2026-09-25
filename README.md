<div align="center">

<img src="build/icon.png" alt="MultiGrid" width="128"/>

# MultiGrid

**Várias contas. Uma janela. Zero dor de cabeça.**

Gerenciador de desktop (Electron) para usar múltiplas contas simultaneamente
em uma grade flexível — cada painel com sessão de login independente,
divisórias arrastáveis e recuperação automática de travamentos.

Perfis por jogo: a interface dedicada ao Poke Idle World chama-se
**MultiGrid PIW** (padrão); o perfil genérico aceita qualquer URL.
Projeto independente, sem ligação com o Poke Idle World nem com o
projeto público de mesmo nome anterior (`soufoka/PokeGrid-source`).

[![CI](https://github.com/thiothiagus/pokegrid/actions/workflows/ci.yml/badge.svg)](https://github.com/thiothiagus/pokegrid/actions/workflows/ci.yml)
[![Release](https://github.com/thiothiagus/pokegrid/actions/workflows/release.yml/badge.svg)](https://github.com/thiothiagus/pokegrid/actions/workflows/release.yml)
[![Versão](https://img.shields.io/badge/vers%C3%A3o-0.2.0-2563eb)](package.json)
[![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?logo=typescript&logoColor=white)](docs/MIGRACAO_TYPESCRIPT.md)
[![Testes](https://img.shields.io/badge/testes-Vitest-6e9f18?logo=vitest&logoColor=white)](#qualidade)
[![Plataformas](https://img.shields.io/badge/plataforma-Windows%20%7C%20Linux-0078d7?logo=windows95&logoColor=white)](#instala%C3%A7%C3%A3o)

</div>

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Arquitetura](#arquitetura)
  - [Isolamento de sessão](#isolamento-de-sessão)
  - [Recuperação de travamentos](#recuperação-de-travamentos)
  - [Configuração persistida](#configuração-persistida)
- [Desenvolvimento](#desenvolvimento)
- [Qualidade](#qualidade)
- [Limitações conhecidas](#limitações-conhecidas)

## Funcionalidades

### Grade e layout

- **Tela inicial** — escolha a interface (perfil de jogo), quantas contas quer (1 a 9) e a URL. O padrão é **MultiGrid PIW** (Poke Idle World); o perfil genérico aceita qualquer site/jogo.
- **Divisórias arrastáveis** — passe o mouse na linha entre dois painéis e arraste para redimensionar.
- **Presets de layout** — menu `Layout…` aplica arranjos prontos em um clique: Igual, Colunas (tudo em uma linha), Linhas (tudo em uma coluna) e "Focar conta N" (a conta escolhida fica ~2,5× maior que as irmãs, sem esconder ninguém). Salve seus próprios layouts com `Salvar layout`, reaplique-os pelo grupo "Meus presets" e exclua com o botão ×; `Resetar layout` devolve o arranjo automático da grade.
- **Modo foco** — duplo clique no cabeçalho (ou botão ⛶) maximiza um painel sem fechar as outras contas.
- **+ Conta / ×** — adicione contas a qualquer momento pelo botão no topo, ou feche uma clicando no × do cabeçalho dela.
- **Reordenar** — arraste a alça `⠿` no cabeçalho de uma conta para trocar a posição dela na grade; a sessão não é recriada, só a ordem muda.
- **Renomear** — clique no nome de cada conta (ex.: "Conta 1") para editar.
- **Layout salvo automaticamente** — número de contas, nomes, tamanho dos painéis e geometria da janela voltam do jeito que você deixou da última vez.

### Sessões e segurança

- **Isolamento total entre contas** — cada painel roda em partição própria (`persist:conta<N>`); cookies, localStorage e cache nunca vazam de uma conta para outra.
- **Pop-ups de login** — se o jogo/site abrir login em janela nova (`window.open`, comum em OAuth), a janela extra é bloqueada e o login é carregado dentro do próprio painel, mantendo a sessão da conta.
- **Limpar dados de uma conta** — botão `⌫` no cabeçalho apaga cookies/login daquela conta (recupera login travado) e recarrega só esse painel.
- **Mais seguro** — janela roda com `sandbox: true`, política de CSP restritiva e cada conta em `BrowserView` isolada.

### Resiliência

- **Recuperação automática** — se um painel travar ou perder conexão, ele tenta reconectar sozinho (a bolinha ao lado do nome fica amarela/vermelha indicando o status). Após várias tentativas sem sucesso, aparece um botão "Tentar novamente".

## Instalação

**Só quer usar?** Baixe o instalador mais recente na aba
[Releases](https://github.com/thiothiagus/pokegrid/releases) — não precisa de Node.js.

**Pré-requisitos (build local):** [Node.js](https://nodejs.org/) 18+

```bash
# clonar o repositório
git clone https://github.com/thiothiagus/pokegrid.git
cd pokegrid

# instalar dependências
npm install

# compilar TypeScript e abrir o app
npm run start
```

Para gerar um instalador:

| Comando        | Saída                            |
| -------------- | -------------------------------- |
| `npm run dist` | Windows → instalador NSIS (.exe) |
|                | Linux → AppImage                 |

## Scripts disponíveis

| Comando             | Descrição                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `npm run start`     | Build + abre o app (Electron)                                                             |
| `npm run build`     | Compila TypeScript → JavaScript (processo principal em CommonJS + renderer em ES modules) |
| `npm run typecheck` | Verifica tipos sem emitir arquivos                                                        |
| `npm run test`      | Roda testes com Vitest                                                                    |
| `npm run lint`      | ESLint + Prettier                                                                         |
| `npm run format`    | Formata código com Prettier                                                               |
| `npm run dist`      | Gera instalador Windows/Linux (electron-builder)                                          |

## Estrutura do projeto

```
multigrid/
├── main.ts               # Processo principal (cria janela, gerencia BrowserViews)
├── preload.ts            # Ponte IPC segura (contextBridge)
├── renderer.ts           # UI do grid (setup, render, eventos)
├── logger.ts             # Logger JSONL em logs/errors.jsonl
├── index.html            # Shell da UI (toolbar, setup-screen, grid-container)
├── style.css             # Estilos (grid, painéis, divisórias, overlays)
├── src/
│   ├── config.ts               # Caminhos de arquivo, DEFAULT_URL
│   ├── config-state.ts         # Estado padrão, normalização, computeGridDims
│   ├── grid-layout.ts          # Cálculo de layout CSS Grid, frações, resizers
│   ├── layout-presets.ts       # Presets de layout (Igual, Colunas, Linhas, Focar, personalizados)
│   ├── pane-manager.ts         # Criação/remoção/atualização de BrowserViews
│   ├── profiles.ts             # Perfis de jogo (MultiGrid PIW, genérico — sem forks)
│   ├── pane-ui.ts              # Atualização de status (bolinha, overlay)
│   ├── focus-manager.ts        # Estado de foco (modo foco painel)
│   ├── win-state.ts            # Persistência de geometria da janela
│   ├── retry.ts                # Lógica de retry com backoff exponencial
│   └── types.ts                # Interfaces TypeScript compartilhadas
├── tests/                      # Testes automatizados (Vitest)
├── tsconfig.json               # Main process (CommonJS)
├── tsconfig.renderer.json      # Renderer (ES modules)
└── .eslintrc.cjs               # Config ESLint (CommonJS)
```

> [!NOTE]
> Os arquivos `.js` listados acima não existem no repositório — são gerados pelo
> build. Veja [Desenvolvimento](#desenvolvimento).

## Arquitetura

- **Main process** (`main.ts`): cria `BrowserWindow`, gerencia `BrowserView`s (uma por conta), posiciona via `setBounds`, lida com IPC.
- **Preload** (`preload.ts`): expõe `window.api` com métodos tipados (`createPane`, `removePane`, `syncLayout`, `onPaneStatus`, etc.).
- **Renderer** (`renderer.ts`): monta a grade CSS Grid, cria elementos de painel (header + área reservada), escuta redimensionamento das divisórias (`mousedown`/`mousemove`/`mouseup`) e sincroniza o layout com a main process via `window.api.syncLayout()`.

### Isolamento de sessão

Cada conta usa partição `persist:conta<N>` — cookies, localStorage, cache e sessionStorage ficam **completamente separados** entre painéis. Não há vazamento de sessão entre contas.

### Recuperação de travamentos

- Heartbeat a cada 30s via `webContents.on('render-process-gone')` e `webContents.on('unresponsive')`.
- Painel travou → status vermelho, overlay "O painel travou… Reiniciando…" e recriação da `BrowserView` na mesma partição (mantém o login).
- Perdeu conexão → status amarelo, overlay "Tentando reconectar em Xs…" e recarga da URL do painel.
- Após 5 falhas → status vermelho final e botão manual "Tentar novamente".

### Configuração persistida

Arquivo: `%APPDATA%/multigrid/multigrid-config.json` (migra sozinho de `pokegrid-config.json` e do legado `multiconta-config.json`).

Na primeira execução após a renomeação do projeto, o arquivo legado `pokegrid-config.json` é renomeado automaticamente para o novo nome.

Contém:

- `gameUrlDefault` — URL padrão para novas contas
- `activeProfile` — perfil de jogo ativo (`piw` = MultiGrid PIW, `generic` = genérico)
- `nextId` — próximo ID sequencial
- `cols`, `rows` — grade atual
- `colFr`, `rowFr` — frações CSS Grid (`1fr` = tamanho igual)
- `panes[]` — array de `{id, label, partition, url}`
- `customPresets[]` — presets personalizados salvos pelo usuário, array de `{name, cols, rows, colFr, rowFr}`

## Desenvolvimento

### Fonte vs. artefato — regra de ouro

> [!CAUTION]
> Este projeto é **100% TypeScript**. Os arquivos `.js` na raiz (`main.js`,
> `preload.js`, `renderer.js`, `logger.js`) e em `src/*.js` são **artefatos
> gerados pelo build** (`npm run build`). Toda edição deve ser feita nos
> arquivos **`.ts` correspondentes** — qualquer alteração em `.js` será
> **sobrescrita no próximo build** e **não entra no git** (`.gitignore`).

| Edite isto                                                          | Onde   | Versionado? | Nunca edite isto                                    |
| ------------------------------------------------------------------- | ------ | ----------- | --------------------------------------------------- |
| `main.ts`, `preload.ts`, `renderer.ts`, `logger.ts`                 | raiz   | Sim         | `main.js`, `preload.js`, `renderer.js`, `logger.js` |
| `src/*.ts` (`config.ts`, `grid-layout.ts`, `pane-manager.ts`, etc.) | `src/` | Sim         | `src/*.js`                                          |

Detalhes do fluxo:

- `npm run build` compila todos os `.ts` para `.js`.
- Dois `tsconfig`:
  - `tsconfig.json` → `module: CommonJS` (main process: `main.ts`, `preload.ts`, `logger.ts`, `src/*.ts`)
  - `tsconfig.renderer.json` → `module: ESNext` + `moduleResolution: bundler` (renderer: `renderer.ts` → ES module carregado via `<script type="module">` em `index.html`)
- **Como saber se errou o arquivo?** Se `git status` não mostra o arquivo após `git add`, ele está no `.gitignore` e é artefato.
- Documentação completa da migração: [`docs/MIGRACAO_TYPESCRIPT.md`](docs/MIGRACAO_TYPESCRIPT.md)

## Qualidade

```bash
npm run typecheck    # tsc --noEmit nos dois tsconfig
npm run test         # Vitest (45 testes: config, grid-layout, layout-presets, retry, win-state)
npm run lint         # ESLint + Prettier (regras TypeScript recomendadas)
npm run format:check # Prettier check
riteward check       # executa todos os quality gates acima
```

## Limitações conhecidas

- Janelas pop-up (`window.open`) são bloqueadas e carregadas no painel; alguns fluxos OAuth complexos podem não funcionar.
- Não há suporte a múltiplos monitores (janela única).
- Backup/restore de configuração foi removido (funcionalidade problemática).
