# Plano

- task: task-016
- author: ox-alpha (agente)
- created_at: 2026-08-23

## Contexto

A DEC-002 renomeou o projeto para PokeGrid, mas manteu deliberadamente o nome
interno do arquivo de dados (`multiconta-config.json`, definido em
`src/config.ts:getConfigPath`) por compatibilidade. O usuário deseja concluir a
renomeação. O risco central: existe config real em
`%APPDATA%\pokegrid\multiconta-config.json`; trocar apenas a constante faria o
app iniciar com grade vazia na próxima execução.

Referências atuais ao nome antigo (fora de artefatos históricos):
- `src/config.ts:14` — `getConfigPath`
- `main.ts:161` — `defaultPath` do diálogo de salvar
- `tests/config.test.ts:31` — expectativa do teste de path
- `.gitignore:50` e `README.md:135`

## Objetivo

Arquivo de configuração passa a chamar-se `pokegrid-config.json`, com migração
automática e transparente do arquivo legado na inicialização, sem perda de dados
nem mudança de comportamento visível.

## Abordagem

Migração por renomeação no startup (não cópia), concentrada em uma única função
pura e testável em `src/config.ts`:

1. Novo helper `migrateLegacyConfig(userDataPath): boolean`:
   - se novo existe → no-op (retorna false); legado nunca sobrescreve o novo;
   - se só legado existe → `fs.renameSync` legado → novo (retorna true);
   - se nenhum existe → no-op.
2. `getConfigPath` passa a retornar `pokegrid-config.json`.
3. `main.ts` chama `migrateLegacyConfig(app.getPath('userData'))` uma vez no
   startup, antes do primeiro acesso ao config (load via IPC, save via IPC e o
   recovery read de main.ts:157).
4. `defaultPath` do diálogo (main.ts:161) atualizado para o novo nome.

Renomear (e não copiar) evita duplicidade: depois da primeira execução não há
arquivo legado restante. O `renameSync` na mesma partição/volume é atômico o
suficiente para uso pessoal; falha cai no catch existente e o app segue com
config default sem quebrar (comportamento já esperado para arquivo ausente).

## Passos

1. Criar branch `chore/rename-config-file` a partir de `chore/renomeacao-pokegrid`.
2. `src/config.ts`: adicionar constante `CONFIG_FILENAME = 'pokegrid-config.json'`
   e `LEGACY_CONFIG_FILENAME = 'multiconta-config.json'`; implementar
   `migrateLegacyConfig`; atualizar `getConfigPath`; exportar via ESM e no bloco
   CommonJS.
3. `main.ts`: importar e invocar `migrateLegacyConfig` no startup (antes de
   `createWindow()`/primeiro IPC); atualizar `defaultPath`.
4. `tests/config.test.ts`: atualizar teste de path; adicionar casos de migração
   (usando diretórios temporários).
5. `.gitignore`: substituir entrada; `README.md:135`: atualizar documento.
6. Registrar DEC-003 em `.riteward/records/`.
7. Rodar `npm test`, `npm run lint`, `npm run typecheck` / `riteward check`.

## Riscos

- **Perda de config se migração falhar silenciosamente**: mitigado porque
  `loadConfig` já tolera ausência (retorna null → defaults) e o rename preserva
  o conteúdo integralmente; logger registra erro de I/O.
- **Ambos os arquivos presentes** (ex.: execução anterior já criou o novo):
  regra explícita — novo sempre vence; legado fica órfão (sem leitura dupla).
- **Windows + arquivo travado** (app aberto em outra instância): `renameSync`
  pode lançar EPERM/EBUSY; catch transforma em fallback para defaults — mesmo
  cenário de hoje com arquivo corrompido. Aceitável para uso pessoal.
- **Testes de filesystem** podem sofrer interferência de ambiente: usar
  `fs.mkdtempSync` e cleanup no afterEach.

## Critérios de sucesso

- [ ] `getConfigPath('/x')` retorna `/x/pokegrid-config.json`
- [ ] Migração renomeia legado quando só ele existe
- [ ] No-op quando só o novo existe ou nenhum existe
- [ ] Suíte completa verde (`riteward check`)
