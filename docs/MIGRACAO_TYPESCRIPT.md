# Migração para TypeScript — Documentação Completa

> **Status:** ✅ Concluída (task-001) — 2026-08-20
> **Leitura obrigatória** para qualquer pessoa que for corrigir bugs ou adicionar features.

---

## 1. O que foi feito

O projeto foi **100% migrado de JavaScript para TypeScript**. Todo código de aplicação agora é `.ts`; os `.js` são apenas saída de compilação.

### Arquivos convertidos

| Fonte (EDITAR ESTE) | Artefato gerado (NÃO EDITAR) | tsconfig responsável |
|---|---|---|
| `main.ts` | `main.js` | `tsconfig.json` (CommonJS) |
| `preload.ts` | `preload.js` | `tsconfig.json` |
| `logger.ts` | `logger.js` | `tsconfig.json` |
| `renderer.ts` | `renderer.js` | `tsconfig.renderer.json` (ESNext/bundler) |
| `src/config.ts` | `src/config.js` | `tsconfig.json` |
| `src/config-state.ts` | `src/config-state.js` | `tsconfig.json` |
| `src/grid-layout.ts` | `src/grid-layout.js` | `tsconfig.json` |
| `src/pane-manager.ts` | `src/pane-manager.js` | `tsconfig.json` |
| `src/focus-manager.ts` | `src/focus-manager.js` | `tsconfig.json` |
| `src/win-state.ts` | `src/win-state.js` | `tsconfig.json` |
| `src/retry.ts` | `src/retry.js` | `tsconfig.json` |
| `src/profiles.ts` | `src/profiles.js` | ambos |
| `src/types.ts` | (apenas tipos, sem JS) | ambos |

Shims removidos: `src/grid-layout.d.ts` e `src/pane-manager.d.ts` (eram gambiarras JS→TS, substituídos pelos `.ts` reais).

---

## 2. Regra de ouro — NUNCA edite `.js`

### Por quê?

```
.ts  ──(npm run build: tsc)──▶  .js  ──(Electron)──▶  app em execução
 ▲                              │
 │ fonte                        └─ sobrescrito a cada build
 └─ versionado no git              não versionado (.gitignore:18-23)
```

- `.js` **não aparece em `git ls-files`** e **não aparece em `git status`** após edição — está no `.gitignore`.
- `npm run build` **sobrescreve** todo `.js` a partir do `.ts` correspondente.
- Editar `.js` = trabalho perdido no próximo build.

### Caso real que motivou este documento

Durante a correção do layout da grade (bug visual com 5 janelas deixando espaço vazio na última linha), o arquivo editado foi `renderer.js:359-360`:

```js
// renderer.js (ARTEFATO — NÃO EDITAR)
paneEl.style.gridColumnEnd =
    isLastRow && itemsInLastRow < cols ? String(2 * cols) : String(colLine + 1);
```

A correção funcionou localmente, mas **sumiu após `npm run build`** porque o compilador regenerou `renderer.js` a partir de `renderer.ts`. Foi necessário refazer o fix em `renderer.ts:413-416` (fonte) e recompilar. Para evitar retrabalho, a equipe decidiu **manter o comportamento atual do layout** e focar esta etapa em documentar a migração.

**Lição:** sempre confirme que o arquivo que você está editando termina em `.ts` e aparece em `git ls-files`.

### Como verificar que está no arquivo certo

```bash
# 1. O arquivo aparece no git? (deve aparecer)
git ls-files | grep renderer
# esperado: renderer.ts  (NÃO renderer.js)

# 2. O arquivo está ignorado? (se estiver, é artefato)
git check-ignore -v renderer.js
# esperado: .gitignore:19:renderer.js

# 3. Qual arquivo o build consome?
cat tsconfig.json          # include: main.ts, preload.ts, src/*.ts
cat tsconfig.renderer.json # include: renderer.ts
```

Se `git check-ignore` disser que o arquivo é ignorado, **pare e abra o `.ts` correspondente**.

---

## 3. Arquitetura de build — dois `tsconfig`

O Electron exige dois formatos de módulo diferentes:

| tsconfig | `module` | `target` | Para quem | Saída |
|---|---|---|---|---|
| `tsconfig.json` | `CommonJS` | `ES2022` | Main process (`main.ts`, `preload.ts`, `logger.ts`, `src/*.ts`) | `*.js` CommonJS, `require()` funciona, `fs`/`electron` disponíveis |
| `tsconfig.renderer.json` | `ESNext` | `ES2022` | Renderer (`renderer.ts`) | `renderer.js` ES module, carregado via `<script type="module">` em `index.html` |

**Por que dois?**
- Tentativa anterior usava `tsc` único (CommonJS): o `renderer.js` gerado continha `exports`/`require`, que quebrou no browser com `Uncaught ReferenceError: exports is not defined`. O layout parou de renderizar e as divisórias arrastáveis congelaram.
- Solução: `tsconfig.renderer.json` com `module: ESNext` + `moduleResolution: bundler`. Agora `renderer.js` é um ES module puro e `index.html` carrega apenas ele (`<script type="module" src="./renderer.js">`); os módulos de `src/` são importados com extensão `.js` (exigência do ESM no browser).

**Comando de build (package.json):**

```json
"build": "tsc -p tsconfig.json && tsc -p tsconfig.renderer.json"
```

Ambos precisam rodar. Se rodar só o primeiro, o `renderer.js` fica desatualizado.

---

## 4. Fluxo de trabalho correto

### Corrigir um bug

```bash
# 1. Edite o .ts
code renderer.ts        # ou src/grid-layout.ts, etc.

# 2. Compile
npm run build           # gera todos os .js

# 3. Verifique tipos
npm run typecheck       # tsc --noEmit nos dois projetos

# 4. Rode testes e lint
npm test                # Vitest — 24 testes
npm run lint            # ESLint + Prettier
npm run format:check    # só checa formatação

# 5. Teste manual
npm start               # abre o Electron

# 6. Quality gates (Riteward)
riteward check          # roda test + lint + typecheck
```

### Adicionar um arquivo novo

1. Crie `src/meu-modulo.ts` (sempre `.ts`).
2. Adicione em `tsconfig.json` → `include` se for usado no main, ou `tsconfig.renderer.json` se for no renderer.
3. Importe com extensão `.js` no renderer: `import { foo } from './src/meu-modulo.js'` (obrigatório para ESM no browser).

### O que NÃO fazer

- ❌ `code renderer.js` e editar — será sobrescrito.
- ❌ `tsc --outFile` manual — use `npm run build`.
- ❌ Commitar `.js` — `git add` vai ignorar silenciosamente (`.gitignore`).
- ❌ Criar `src/foo.d.ts` shim — crie `src/foo.ts` direto.

---

## 5. `.gitignore` — artefatos

```gitignore
# Build / dist
dist/
main.js
logger.js
preload.js
renderer.js
src/*.js
```

Essas 5 linhas garantem que nenhum artefato entre no repositório. Se você editar um `.js` e `git status` não mostrar nada, é porque ele está ignorado — abra o `.ts`.

---

## 6. `index.html` — como o renderer é carregado

Antes (quebrado):

```html
<script src="./src/config.js"></script>       <!-- CommonJS com require → quebra -->
<script src="./src/pane-manager.js"></script>
<script src="./renderer.js"></script>
```

Depois (correto):

```html
<script type="module" src="./renderer.js"></script>  <!-- único entry ESM -->
```

`renderer.js` (ESM) faz `import { ... } from './src/grid-layout.js'` — o browser resolve os imports. Nenhum script CommonJS é carregado direto no renderer.

---

## 7. Verificação da migração (critérios task-001)

Todos verificáveis por inspeção:

```bash
git ls-files | grep -E '\.ts$'          # deve listar renderer.ts, src/grid-layout.ts, src/pane-manager.ts
git ls-files | grep -E '\.d\.ts$'       # deve NÃO listar grid-layout.d.ts / pane-manager.d.ts (removidos)
npm run build        # sem erros, gera .js
npm run typecheck    # PASS
npm test             # 24/24 PASS
npm run lint         # PASS
npm run format:check # PASS
riteward check       # PASS
npm start            # janela abre, "Começar" funciona, layout correto
```

---

## 8. FAQ

**P: Editei `renderer.js` e `git status` não mostra nada. O que houve?**
R: `renderer.js` está no `.gitignore`. Edite `renderer.ts` e rode `npm run build`.

**P: Meu import `from './src/foo'` não funciona no renderer.**
R: No renderer (ESM) use extensão `.js`: `from './src/foo.js'` — o arquivo fonte é `foo.ts`, mas o browser carrega `foo.js`.

**P: `npm run build` só compilou o main, o renderer continua antigo.**
R: O script `build` roda dois `tsc`. Verifique `package.json`: deve ser `tsc -p tsconfig.json && tsc -p tsconfig.renderer.json`.

**P: Posso deletar os `.js` da raiz?**
R: Pode, mas `npm run build` vai recriá-los. Eles são necessários para `npm start`/`npm run dist`. Apenas não os versione.

---

## 9. Referências

- Task: `.riteward/tasks/task-001-migrar-projeto-para-typescript.md`
- Decision record: `.riteward/records/DEC-001-migracao-typescript.md`
- Constituição: `.riteward/constitution.md` — regra de sincronizar `quality_gates`
- tsconfigs: `tsconfig.json`, `tsconfig.renderer.json`, `tsconfig.base.json`
- Histórico de correções: seção "Problemas resolvidos durante a migração" em `task-001`
