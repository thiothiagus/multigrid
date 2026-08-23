# Revisão

- task: task-016
- reviewer: ox-alpha (agente)
- type: critical
- created_at: 2026-08-23

## Resumo

Revisão crítica da implementação da troca do nome do arquivo de configuração
(`multiconta-config.json` → `pokegrid-config.json`) com migração automática,
conforme plano `.riteward/plans/plan-task-016.md`.

## Itens verificados

- [x] **Escopo do diff**: apenas os arquivos previstos no plano (`src/config.ts`,
  `main.ts`, `tests/config.test.ts`, `.gitignore`, `README.md`, registros
  Riteward). Nenhuma mudança colateral.
- [x] **Migração correta**: `migrateLegacyConfig` só renomeia quando o novo não
  existe e o legado existe; o novo sempre vence quando ambos existem; no-op
  quando nenhum existe. Coberto por 6 testes novos em `tests/config.test.ts`.
- [x] **Ponto de invocação**: chamada única em `app.whenReady()` antes de
  `createWindow()`, garantindo que qualquer leitura posterior (IPC load/save,
  export) já veja o arquivo no nome novo.
- [x] **Sem perda de dados**: usa `renameSync` (mesmo volume, conteúdo intacto);
  falha de I/O é logada e degrada para config default — comportamento idêntico
  ao atual para arquivo ausente. Partições de sessão não são tocadas.
- [x] **Consistência de exports**: ESM e bloco CommonJS atualizados juntos
  (padrão do arquivo, necessário porque `config.ts` roda no processo main).
- [x] **Docs e ignore**: `README.md` documenta o novo nome e a migração;
  `.gitignore` cobre os dois nomes durante a transição.
- [x] **Quality gates**: `riteward check` verde (62 testes, eslint, tsc).

## Problemas encontrados

- **info**: `dist/main.js` (artefato de build commitado) ainda contém o nome
  antigo até que `npm run build` seja reexecutado; artefatos de build não fazem
  parte do escopo do commit de código.

## Veredicto

**Aprovado** — implementação fiel ao plano, riscos mitigados e gates verdes.

## Próximo passo

Teste manual pelo usuário: rodar o app uma vez com o arquivo legado presente em
`%APPDATA%\pokegrid\` e confirmar que os painéis carregam normalmente e o
arquivo passa a chamar-se `pokegrid-config.json`. Em seguida, aprovar commit.
