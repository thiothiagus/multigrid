# Plano — Sistema de temas (claro/escuro)

- task: task-007
- author: ox-alpha
- created_at: 2026-08-22

## Contexto

O app hoje tem apenas o tema escuro, definido em CSS variables no `:root` de `style.css`.
Algumas cores escapas do sistema de variáveis (bordas `#3a3d44`, fundo de input do setup
`#24272d`, overlay dos panes `rgba(10,11,13,.9)`), o que impediria um tema claro de cobrir
toda a interface. O renderer nunca chama `window.api.loadConfig()` no startup — a preferência
de tema persistida precisaria ser aplicada manualmente no boot.

## Objetivo

Adicionar tema claro além do escuro atual, com toggle sol/lua na toolbar, preferência
persistida no config e detecção automática do tema do SO na primeira execução. Tema deve
cobrir toolbar, setup-screen, headers dos panes e gutters (resizers).

## Abordagem

Atributo `data-theme="light"` no `<html>` + override das CSS variables existentes (escuro
permanece como default no `:root`). Toda a lógica de resolução/troca fica num módulo puro
(`src/theme.ts`) para ser testável no vitest sem DOM real. Preferência com três valores:
`'light' | 'dark' | 'system'` (padrão `'system'`), detectada via
`matchMedia('(prefers-color-scheme: dark)')` e reativa a mudanças do SO enquanto em `system`.

## Passos

1. **`style.css`**: mover cores hardcoded para novas variáveis (`--border-strong`,
   `--input-bg`, `--overlay-bg`, `--on-accent`); adicionar bloco `[data-theme="light"]`
   com paleta clara; adicionar `color-scheme: dark/light` para controles nativos.
2. **`src/types.ts`**: adicionar `theme?: 'light' | 'dark' | 'system'` em `Config`.
3. **`src/config.ts`**: validar campo `theme` em `normalizeState` (valor inválido → remove).
4. **`src/theme.ts`** (novo): funções puras `resolveTheme(pref, systemDark)`,
   `nextThemePreference(pref)`, `isValidTheme`; e `applyTheme(root, pref, systemDark)` que
   seta/remove `data-theme` no elemento raiz.
5. **`index.html`**: botão `#theme-toggle-btn` (sol/lua) na toolbar.
6. **`renderer.ts`**: no boot, carregar config (`window.api.loadConfig()`), aplicar tema salvo
   (ou `system` se ausente); wire do botão de toggle (alterna entre light/dark explícitos);
   listener de `change` do matchMedia para reagir ao SO quando pref = `system`; ícone/título
   do botão refletem o tema destino; `persist()` após troca.
7. **Compilar** TS → JS (`npm run build` ou equivalente usado pelos scripts).
8. **Testes** (`tests/theme.test.ts`): resolveTheme (3 prefs × SO dark/claro), ciclo do
   nextThemePreference, validação de normalizeState com theme inválido/válido.
9. Rodar quality gates (`riteward check`).

## Riscos

- **Renderer não restaurava config no boot**: aplicar apenas o tema (sem restaurar painéis)
  mantém o escopo da tarefa; restauração completa de sessão é outro problema.
- **Controles nativos (select) claros com fonte ilegível**: mitigado por `color-scheme`.
- **Flash de tema errado no boot**: página carrega rápido e o applyTheme roda cedo no módulo;
  risco baixo aceito (sem inline script permitido pela CSP).

## Critérios de sucesso

- [ ] Paleta de tema claro definida em CSS variables (`[data-theme="light"]`)
- [ ] Toggle de tema na toolbar (sol/lua)
- [ ] Preferência persistida no config (`theme` em multiconta-config.json)
- [ ] Detecção automática do tema do SO na primeira execução (pref padrão = system)
- [ ] Tema aplicado em toolbar, setup-screen, headers dos panes e gutters
- [ ] Testes novos passando; `riteward check` verde
