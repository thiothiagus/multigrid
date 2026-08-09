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
- **Backup / Restaurar**: botões **Exportar** / **Importar** na barra do topo
  salvam a configuração completa (contas, nomes, tamanhos) em um arquivo
  `.json` e restauram de lá, substituindo as contas atuais.
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
  segurança de conteúdo (CSP) restritiva na interface do app.

## Requisitos

- **Node.js**: https://nodejs.org (baixe a versão LTS)

## Como rodar (modo desenvolvimento, via terminal)

```
npm install
npm start
```

O primeiro `npm install` baixa o Electron (~200 MB) e pode demorar alguns
minutos.

## Como gerar um instalador (.exe / AppImage)

Depois de testar com `npm start` e estar satisfeito:

```
npm run dist
```

Isso gera um instalador em `dist/` (`.exe` no Windows, `.AppImage` no
Linux) usando o ícone incluso em `build/icon.ico` / `build/icon.png`.
Rode esse comando no mesmo sistema operacional do instalador que você
quer gerar (gerar `.exe` funciona melhor rodando no Windows). Para macOS,
adicione um bloco `"mac"` na seção `build` do `package.json` com um ícone
`.icns` próprio.

**Se o build falhar com `Cannot create symbolic link ... privilégio
necessário`**: é o `electron-builder` tentando extrair suas ferramentas
(`winCodeSign`) e o Windows negando criação de symlink. Ative o **Modo de
desenvolvedor** (Configurações → Sistema → Para desenvolvedores) ou rode o
comando em um terminal **como Administrador**, e rode `npm run dist` de
novo. Com o cache já baixado (pasta `%LOCALAPPDATA%\electron-builder\Cache`),
o build funciona normalmente sem privilégio extra.

## Como funciona por baixo dos panos

Cada quadrante é uma `BrowserView` nativa do Electron (não uma tag
`<webview>` de HTML) com uma `partition` própria (`persist:conta1`,
`persist:conta2`...), o que dá a cada uma seu próprio conjunto de
cookies/armazenamento — por isso dá pra logar em contas diferentes ao
mesmo tempo, na mesma janela, com cada login salvo entre
reinicializações. O processo principal do app posiciona cada
`BrowserView` diretamente em cima da área reservada pra ela (via
`setBounds`, calculado a partir da posição real na tela), o que evita o
bug de "conteúdo pequeno com espaço em branco ao redor" que a tag
`<webview>` tinha.

A configuração completa (contas, nomes, tamanhos dos painéis) fica salva
localmente em:
- Windows: `%APPDATA%\multi-conta-grid\multiconta-config.json`
- Mac/Linux: `~/.config/multi-conta-grid/multiconta-config.json`

A posição/tamanho da janela fica em `window-state.json` na mesma pasta. Os
dois são o que os botões **Exportar / Importar** copiam/restauram (o backup
cobre o `multiconta-config.json`).

Nada é enviado para nenhum servidor externo — o único destino de rede é a
própria URL do jogo que você configurou.

## Personalizações

- **Trocar o jogo padrão**: mude o valor pré-preenchido no campo da tela
  inicial, ou edite a constante `DEFAULT_URL` em `renderer.js`.
- **Cores/tema**: edite as variáveis no topo de `style.css` (`:root`).
- **Limite de contas**: hoje o máximo é 9 na tela inicial (`max="9"` em
  `index.html`); pode aumentar se seu PC aguentar.

## Sobre os avisos que aparecem no terminal

- `npm warn deprecated ...` durante o `npm install`: são de bibliotecas
  internas do `electron-builder` (o gerador de instalador). Não afetam o
  funcionamento do app, pode ignorar.
- `Failed to resolve address for stun.cloudflare.com` / `stun.l.google.com`
  ao rodar `npm start`: é o Chromium tentando abrir uma conexão WebRTC
  (provavelmente algum script de anúncio/analytics da própria página do
  jogo) e falhando por DNS. Também é inofensivo — o jogo não depende disso
  pra funcionar.

## Observação

Continua sendo só um gerenciador de janelas/sessões — não automatiza
nada dentro do jogo (sem clique automático, sem farm, sem macro). Isso é
o que mantém o risco de detecção baixo; se quiser adicionar automação no
futuro, saiba que isso muda de categoria de risco em relação ao que
conversamos.

Bônus da nova arquitetura: adicionar ou remover uma conta agora **não**
recarrega mais as outras — cada uma continua rodando normalmente, só o
espaço na grade é que muda.
