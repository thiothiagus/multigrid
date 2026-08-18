# Task-010: Ativar sistema de logs no Riteward

- **id:** task-010
- **título:** Ativar sistema de logs no Riteward
- **status:** done
- **prioridade:** high
- **criado em:** 2026-08-15

## Descrição

O projeto atualmente não possui nenhum sistema de logs — não há arquivos de log nem biblioteca de logging no código. O `riteward logs check` não tem o que ler. Esta task implementa:

1. Um sistema de logging leve no app (main process) que registra eventos relevantes em arquivos
2. A configuração do Riteward (`.riteward/config.yaml`) para que `riteward logs check` encontre e filtre esses logs

### Escopo do logging no app

- **Crashes de BrowserView** — registrar quando um pane crasha
- **Falhas de conexão/retry** — registrar cada tentativa de reconexão e falhas exhaustas
- **Erros de I/O** — falhas ao salvar/carregar config, window state
- **Erros de IPC** — handlers que falham inesperadamente
- **Pop-ups bloqueados/permitidos** — registrar decisões de window.open

### Formato

Usar JSONL (`logs/errors.jsonl`) com campos: `timestamp`, `level`, `category`, `message`, `paneId` (quando aplicável), `error` (stack/substring). JSONL é fácil de parsear e já suportado pelo Riteward.

### Configuração do Riteward

Descomentar e preencher a seção `logs` em `.riteward/config.yaml`:

```yaml
logs:
  files:
    - path: logs/errors.jsonl
  ignore_patterns:
    - "Exemplo de ruído a ignorar"
```

## Critérios de aceitação

- [ ] Biblioteca de logging leve implementada no main process (sem dependências externas pesadas — usar `fs` nativo ou electron-log)
- [ ] Arquivo `logs/errors.jsonl` criado automaticamente na primeira execução
- [ ] Eventos de crash de BrowserView registrados
- [ ] Eventos de retry/falha de conexão registrados
- [ ] Eventos de erro de I/O (config, window state) registrados
- [ ] Eventos de erro de IPC registrados
- [ ] Rotação de log simples (não crescer infinitamente — truncar ou rotacionar em N MB)
- [ ] Seção `logs` descomentada e configurada em `.riteward/config.yaml`
- [ ] `riteward logs check` executa sem erro e encontra entradas relevantes
- [ ] Mensagens INFO/WARN/DEBUG não aparecem no output do `riteward logs check` (só ERROR e above)

## Notas

_Idealmente feita antes de outras tasks de feature, pois os logs ajudam a diagnosticar bugs durante o desenvolvimento._
