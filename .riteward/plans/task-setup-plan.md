# Plano Técnico: Configuração Inicial do Riteward (task-setup)

## Objetivo
Finalizar a integração e configuração do Riteward no projeto.

## Ações Executadas
1. **AGENTS.md** (raiz): Mesclado com o template `.riteward/AGENTS.md` — manteve o contexto do projeto e incorporou todas as seções/comandos atualizados (com `--yes` nos workflows, seções de Artefatos, Registros, Qualidade, Monitoramento de Logs e Regras). Arquivo temporário `.riteward/AGENTS.md` removido.

2. **Logs**: Diretório `logs/` já existia com `errors.jsonl`. Bloco `logs` no `.riteward/config.yaml` já configurado corretamente. `riteward logs check` validado (sem saída = OK).

3. **Refactor scan**: `renderer.js` estava com 511 linhas (acima do limite 500). Em vez de aumentar o limite, extraí a lógica de foco (adicionada pela task-012) para novo módulo `src/focus-manager.js`. `renderer.js` reduziu de 510 → 395 linhas. `max_lines` restaurado para 500. Adicionado `coverage` ao `ignore_dirs`. `riteward refactor scan` validado (sem saída = OK).

4. **Quality gates**: Todos os 3 gates (`test`, `lint`, `typecheck`) sincronizados com `package.json`. `riteward check` validado (todos PASS).

5. **.gitignore**: Já continha `logs/` e `.riteward/state/`. Nenhuma alteração necessária.

6. **Notas na task-009**: Atualizadas documentando o problema e a solução aplicada.

## Validações
- ✅ `riteward logs check` — OK
- ✅ `riteward refactor scan` — Nenhum arquivo monolítico detectado
- ✅ `riteward check` — 3/3 quality gates PASS