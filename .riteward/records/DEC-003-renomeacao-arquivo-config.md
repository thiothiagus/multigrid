# Decisão

- id: DEC-003
- task: task-016
- status: accepted
- created_at: 2026-08-23

## Contexto

A DEC-002 manteve deliberadamente o nome interno do arquivo de dados
(`multiconta-config.json`, `src/config.ts:getConfigPath`) por compatibilidade,
registrando isso como consequência negativa. Com a renomeação do projeto já
consolidada, decidiu-se concluir o trabalho e alinhar também o nome do arquivo.

## Decisão

Renomear o arquivo de configuração para **`pokegrid-config.json`** com migração
automática na inicialização:

- `getConfigPath` retorna o novo nome (constante `CONFIG_FILENAME`);
- novo helper `migrateLegacyConfig(userDataPath, logger?)` em `src/config.ts`:
  se o arquivo novo não existir e o legado existir, renomeia legado para novo;
  caso contrário é no-op. O novo sempre vence quando ambos existem;
- `main.ts` invoca a migração em `app.whenReady()`, antes de qualquer leitura
  do config (IPC load/save e export);
- `.gitignore` mantém as duas entradas (legado ignorado durante transição);
- `README.md` documenta o comportamento da migração automática.

## Alternativas consideradas

1. **Copiar em vez de renomear** - rejeitado: deixaria arquivo órfão duplicando
   dados e gerando dúvida sobre a fonte da verdade.
2. **Fallback de leitura sem renomear** - rejeitado: mantém dois nomes vivos
   para sempre e adia o problema em vez de resolvê-lo.
3. **Migração manual pelo usuário** - rejeitado: risco de perda de config e
   atrito desnecessário; a migração é trivial e transparente.

## Consequências

- (+) Identidade do projeto consistente de ponta a ponta (código, dados, docs).
- (+) Migração transparente: a primeira execução após o update preserva painéis,
  layout e tema sem intervenção.
- (-) Código de migração permanente no bundle (~20 linhas); pode ser removido
  no futuro quando não houver mais instalação com arquivo legado.
- (-) Se a migração falhar por I/O (arquivo travado), o app inicia com config
  default - mesmo comportamento atual para arquivo ausente/corrompido; o erro
  é registrado no logger.

## Referências

- DEC-002-renomeacao-pokegrid.md (consequência negativa revertida)
- `.riteward/plans/plan-task-016.md`
