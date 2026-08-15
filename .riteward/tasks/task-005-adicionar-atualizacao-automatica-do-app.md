# Task-005: Adicionar atualização automática do app

- **id:** task-005
- **título:** Adicionar atualização automática do app
- **status:** todo
- **prioridade:** medium
- **criado em:** 2026-08-15

## Descrição

Integrar electron-updater para permitir auto-update do app. Configurar publicação no GitHub Releases. Adicionar código de verificação e instalação de updates no main process. Notificar usuário quando houver update disponível.

## Critérios de aceitação

- [ ] Dependência electron-updater adicionada
- [ ] Código de checkForUpdates integrado no main process
- [ ] Notificação de update disponível exibida na UI
- [ ] Configuração de publish no GitHub Releases no build config
- [ ] Teste de update flow manual (publicar versão de teste)

## Notas

_Requer configurar GitHub Releases como provider. Considerar code signing para Windows._
