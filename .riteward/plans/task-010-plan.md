# Plano: Ativar sistema de logs no Riteward

- task: task-010
- author: opencode
- created_at: 2026-08-15

## Contexto

O projeto Electron atual não grava logs em disco nem em formato estruturado. A ferramenta Riteward possui o comando `riteward logs check` que lê e filtra arquivos de log (JSONL ou texto plano) para encontrar erros e opcionalmente criar tarefas de manutenção.

## Objetivo

Implementar um sistema de logging nativo em JSONL no main process do Electron e configurar o Riteward (`.riteward/config.yaml`) para monitorar o arquivo `logs/errors.jsonl`.

## Abordagem

1. Criar um módulo simples de log em JavaScript puro (usando `fs` do Node.js) que escreva no formato JSONL (`logs/errors.jsonl`).
2. Integrar o logger nos eventos críticos do Electron (crashes de BrowserView, falhas de I/O, IPC e pop-ups).
3. Atualizar `.riteward/config.yaml` com a seção `logs` apontando para `logs/errors.jsonl`.
4. Criar branch `feat/task-010` para o desenvolvimento.

## Passos

1. Avance o workflow do Riteward para PLANNING.
2. Criar e trocar para a branch `feat/task-010`.
3. Avance o workflow do Riteward para IMPLEMENTATION.
4. Adicionar módulo `logger.js` para gerenciar gravações em `logs/errors.jsonl`.
5. Integrar `logger.js` em `main.js`.
6. Configurar `.riteward/config.yaml` ativando a propriedade `logs.files`.
7. Testar a geração de logs e validar via `riteward logs check`.
8. Avançar para TESTING e depois REVIEW.

## Riscos

- Arquivo de log crescendo indefinidamente: limitar tamanho ou apenas append simples.
- Excesso de I/O bloqueante: usar métodos assíncronos (`fs.appendFile`) para escrita de log.

## Critérios de sucesso

- [ ] `logs/errors.jsonl` é criado ao registrar erros.
- [ ] `.riteward/config.yaml` possui a seção `logs` configurada.
- [ ] `riteward logs check` executa sem erros e lê o log corretamente.
