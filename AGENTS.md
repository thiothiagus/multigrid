# AGENTS.md

## Contexto do Projeto

**Multi-Conta Grid** é um aplicativo Electron para gerenciar múltiplas sessões/contas simultâneas em uma grade flexível dentro de uma única janela, com sessões isoladas (`persist:session_<id>`), divisórias arrastáveis e recuperação automática de travamentos.

- **Stack**: Electron, Node.js, JavaScript, HTML/CSS.
- **Componentes**: `main.js` (processo principal e gerenciamento de WebContentsView), `renderer.js` (interface e controle do grid), `preload.js` (ponte IPC segura), `logger.js` (logs do sistema em `logs/errors.jsonl`), `src/` (módulos e utilitários).

---

Este projeto usa o Riteward para governança de workflow e qualidade.

## Referência de uso

Este arquivo resume o essencial. A referência completa e autoexplicativa é a própria CLI:

- `riteward docs` — guia completo embutido: conceitos de estado, fluxo típico, dúvidas frequentes e todos os comandos com flags, valores aceitos e exemplos.
- `riteward <comando> --help` — uso específico de cada comando (ex.: `riteward task update --help`).
- `riteward changelog` — novidades entre a versão do Riteward instalada neste projeto e a versão da CLI.

Não é necessário ler código-fonte do Riteward para operá-lo: o help e as mensagens de erro listam os valores válidos.

## Como trabalhar neste projeto

Antes de qualquer alteração, entenda o contexto:

1. Leia `inbox.md` na raiz do projeto (ou use `riteward show inbox`): é a fila de instruções do usuário para os agentes. Trate os itens pendentes como prioridade de entrada.
2. Leia `.riteward/constitution.md` para conhecer as regras e políticas.
3. Execute `riteward status` para ver o estado atual do projeto, tarefas e workflows ativos.
4. Verifique se há uma tarefa atribuída com `riteward task list`. Se precisar de detalhes sobre uma tarefa, use `riteward task show <task-id>`.

## Fluxo de trabalho

Se houver uma tarefa atribuída, siga o workflow:

1. Inicie o workflow: `riteward workflow start <task-id>`
2. Avance pelos estados conforme completar cada etapa: `riteward workflow advance <task-id> --to <estado> --reason "motivo"` (adicione `--yes` ou `-y` para execução não interativa)
3. Consulte o estado e o histórico a qualquer momento: `riteward workflow show <task-id>`
4. Quando o workflow estiver em READY_FOR_COMMIT, solicite aprovação antes de prosseguir.
5. Após aprovação, crie o commit: `riteward workflow commit <task-id> --yes`
6. Se o push estiver habilitado na configuração (`permissions.push`), envie as alterações ao remoto: `riteward workflow push <task-id> --yes`

Estados do workflow (na ordem típica): DISCOVERY, PLANNING, IMPLEMENTATION, TESTING, REVIEW, READY_FOR_COMMIT, COMPLETED.

O workflow pode ir para BLOCKED a qualquer momento e voltar ao estado anterior quando o bloqueio for resolvido. Para encerrar uma tarefa sem concluí-la, cancele o workflow: `riteward workflow cancel <task-id> --reason "motivo"` (estado terminal CANCELLED).

Precisou retomar uma tarefa já concluída (COMPLETED) ou cancelada (CANCELLED)? Reabra o workflow: `riteward workflow reopen <task-id> --reason "motivo"` — ele volta ao estado IMPLEMENTATION e o status da tarefa é ressincronizado.

Nota: "status" (da tarefa: todo, in_progress, blocked, done, cancelled) é diferente de "current_state" (do workflow: DISCOVERY ... CANCELLED). O status é sincronizado automaticamente a cada transição; `riteward task show <task-id>` exibe os dois lado a lado e avisa se houver divergência. `riteward status` lista inconsistências do projeto inteiro.

## Artefatos por estado

- **DISCOVERY**: explore o código, entenda o problema, documente riscos.
- **PLANNING**: crie um plano técnico usando `.riteward/templates/plan.md` como modelo.
- **IMPLEMENTATION**: implemente a solução conforme o plano.
- **TESTING**: execute `riteward check` para rodar os quality gates. Corrija falhas antes de avançar.
- **REVIEW**: faça uma revisão crítica usando `.riteward/templates/review.md` como modelo. Se encontrar problemas, volte para IMPLEMENTATION.
- **READY_FOR_COMMIT**: todos os critérios de aceitação devem estar cumpridos. Aguarde aprovação humana. Se o usuário reprovar (ex.: falha no teste manual), retorne a IMPLEMENTATION com motivo: `riteward workflow advance <task-id> --to IMPLEMENTATION --reason "motivo da reprovação"`.
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

## Atualização e versionamento do Riteward

A versão da CLI pode ser consultada com `riteward --version`; a versão que gerou a estrutura deste projeto está em `.riteward/manifest.json` e aparece em `riteward status`.

**Nunca atualize o Riteward por iniciativa própria** — nem no início da sessão, nem durante uma tarefa. Atualizar modifica arquivos gerenciados e sujaria o working tree com mudanças fora do escopo da tarefa. Se `riteward status` indicar divergência entre a versão instalada e a da CLI, apenas informe o usuário e aguarde a instrução dele.

Somente quando o usuário pedir explicitamente para atualizar, execute o fluxo:

1. Veja o que mudaria, sem gravar nada: `riteward update --dry-run`.
2. Revise os conflitos com o usuário. Arquivos editados manualmente NÃO são sobrescritos por padrão; só use `--force` com autorização explícita.
3. Aplique: `riteward update`.
4. Mostre ao usuário o que mudou entre versões: `riteward changelog`.

Regras invioláveis:

- **NUNCA atualize apagando arquivos `.riteward/` e rodando `riteward init` de novo** — isso perde configurações, tarefas e histórico de workflow.
- O merge do `config.yaml` é aditivo: chaves novas entram, valores existentes são preservados.
- Commitar o `.riteward/manifest.json` junto ao projeto: é ele que registra qual versão instalou o quê.

## Regras

- Antes de avançar para o estado `IMPLEMENTATION`, crie e faça checkout para uma branch isolada com nome descritivo, baseado na funcionalidade ou correção — não use o ID da tarefa (ex: `feat/sistema-de-logs`, `fix/erro-validacao-config`).
- Não escreva código nem faça commits diretamente na branch `main` ou `master`.
- Não pule estados do workflow.
- Não faça commit sem aprovação quando o workflow exigir.
- Documente decisões relevantes usando o modelo de decision record.
- Se encontrar um bloqueio, avance o workflow para BLOCKED e registre o motivo.

### Verificação de quality gates

Sempre que modificar arquivos que afetam a suíte de qualidade, verifique e atualize os `quality_gates` em `.riteward/config.yaml`:

- **`package.json`** (scripts: test, lint, typecheck) → atualizar gates correspondentes.
- **Instalação de devDependencies** (vitest, eslint, tsc, etc.) → verificar se há novo script e adicionar gate.
- **Criação de arquivos de teste** → confirmar que o gate `test` existe e funciona.
- **Criação de config de lint/typecheck** (`.eslintrc`, `tsconfig.json`) → confirmar que os gates `lint`/`typecheck` existem.

Após cada atualização, valide com `riteward check`.
