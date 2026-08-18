# AGENTS.md

## Contexto do Projeto

**Multi-Conta Grid** é um aplicativo Electron para gerenciar múltiplas sessões/contas simultâneas em uma grade flexível dentro de uma única janela, com sessões isoladas (`persist:session_<id>`), divisórias arrastáveis e recuperação automática de travamentos.

- **Stack**: Electron, Node.js, JavaScript, HTML/CSS.
- **Componentes**: `main.js` (processo principal e gerenciamento de WebContentsView), `renderer.js` (interface e controle do grid), `preload.js` (ponte IPC segura), `logger.js` (logs do sistema em `logs/errors.jsonl`), `src/` (módulos e utilitários).

---

Este projeto usa o Riteward para governança de workflow e qualidade.

## Como trabalhar neste projeto

Antes de qualquer alteração, entenda o contexto:

1. Leia `.riteward/constitution.md` para conhecer as regras e políticas.
2. Execute `riteward status` para ver o estado atual do projeto, tarefas e workflows ativos.
3. Verifique se há uma tarefa atribuída com `riteward task list`. Se precisar de detalhes sobre uma tarefa, use `riteward task show <task-id>`.

## Fluxo de trabalho

Se houver uma tarefa atribuída, siga o workflow:

1. Inicie o workflow: `riteward workflow start <task-id>`
2. Avance pelos estados conforme completar cada etapa: `riteward workflow advance <task-id> --to <estado> --reason "motivo"`
3. Consulte o estado e o histórico a qualquer momento: `riteward workflow show <task-id>`
4. Quando o workflow estiver em READY_FOR_COMMIT, solicite aprovação antes de prosseguir.
5. Após aprovação, crie o commit: `riteward workflow commit <task-id>`
6. Se o push estiver habilitado na configuração (`permissions.push`), envie as alterações ao remoto: `riteward workflow push <task-id>`

Estados do workflow (na ordem típica): DISCOVERY, PLANNING, IMPLEMENTATION, TESTING, REVIEW, READY_FOR_COMMIT, COMPLETED.

O workflow pode ir para BLOCKED a qualquer momento e voltar ao estado anterior quando o bloqueio for resolvido. Para encerrar uma tarefa sem concluí-la, cancele o workflow: `riteward workflow cancel <task-id> --reason "motivo"` (estado terminal CANCELLED).

## Artefatos por estado

- **DISCOVERY**: explore o código, entenda o problema, documente riscos.
- **PLANNING**: crie um plano técnico usando `.riteward/templates/plan.md` como modelo.
- **IMPLEMENTATION**: implemente a solução conforme o plano.
- **TESTING**: execute `riteward check` para rodar os quality gates. Corrija falhas antes de avançar.
- **REVIEW**: faça uma revisão crítica usando `.riteward/templates/review.md` como modelo. Se encontrar problemas, volte para IMPLEMENTATION.
- **READY_FOR_COMMIT**: todos os critérios de aceitação devem estar cumpridos. Aguarde aprovação humana.
- **COMPLETED**: tarefa finalizada.

## Registros

Decision records devem usar `.riteward/templates/decision.md` como modelo e ser salvos em `.riteward/records/`.

## Qualidade

Execute `riteward check` antes de solicitar revisão ou commit. Este comando roda os quality gates configurados em `.riteward/config.yaml`.

## Monitoramento de Logs

**Não leia arquivos de log manualmente nem tente contar linhas/offsets.** No início de cada sessão ou tarefa, execute:

```bash
riteward logs check
```

Este comando lê apenas os logs ainda não processados (controlado por offset automático), filtra o ruído conhecido (configurado em `.riteward/config.yaml` na seção `logs`), ignora mensagens informativas (`INFO`, `WARN`, `DEBUG`) e exibe apenas os erros relevantes (linhas com `ERROR`, `TypeError`, `ReferenceError`, `Exception`, `FATAL`, etc., ou campo `level: error` em JSONL). Para criar tarefas de manutenção automaticamente a partir dos erros encontrados, use:

```bash
riteward logs check --create-tasks
```

A configuração de logs é opcional. Se nenhum arquivo de log estiver configurado, o comando não fará nada.

## Regras

- Antes de avançar para o estado `IMPLEMENTATION`, crie e faça checkout para uma branch isolada (ex: `feat/<task-id>`).
- Não escreva código nem faça commits diretamente na branch `main` ou `master`.
- Não pule estados do workflow.
- Não faça commit sem aprovação quando o workflow exigir.
- Documente decisões relevantes usando o modelo de decision record.
- Se encontrar um bloqueio, avance o workflow para BLOCKED e registre o motivo.
