---
id: task-setup
title: Configuração inicial do Riteward
status: done
priority: high
created_at: 2026-08-19
---

# Configuração inicial do Riteward

## Descrição

Esta tarefa orienta o agente de código a finalizar a integração e configuração do Riteward no projeto. Siga as etapas abaixo na ordem indicada:

### Etapa 1: Integrar / Enriquecer o AGENTS.md

Mescle e integre o `AGENTS.md` de acordo com a situação do projeto:

- **Cenário A (`.riteward/AGENTS.md` existe)**: O projeto já possuía um `AGENTS.md` pré-existente na raiz que foi preservado. O comando `init` então criou temporariamente um `AGENTS.md` em `.riteward/AGENTS.md`.

  1. **Leia integralmente** o `.riteward/AGENTS.md` (use `cat` ou `Get-Content -Raw`) para capturar **todas** as seções até o final do arquivo.
  2. Analise o projeto para identificar seu contexto, propósito e especificidades (ex: tipo de aplicação, domínio, arquitetura).
  3. Reescreva o `AGENTS.md` na raiz mesclando:
     - Contexto do projeto (nome, stack, componentes, arquitetura)
     - Instruções do Riteward de `.riteward/AGENTS.md` (workflow, artefatos, registros, qualidade, logs, regras, verificação de quality gates)
     - Referência explícita a `.riteward/constitution.md`
  4. **Valide a mesclagem**: Compare seção por seção entre o `AGENTS.md` final e o `.riteward/AGENTS.md` temporário — nenhuma seção do template pode faltar.
  5. Remova o arquivo temporário `.riteward/AGENTS.md`.

- **Cenário B (`.riteward/AGENTS.md` NÃO existe)**: O projeto não possuía `AGENTS.md` prévio e o `riteward init` criou o `AGENTS.md` inicial na raiz.

  1. Analise o projeto para identificar seu contexto, propósito e especificidades (ex: tipo de aplicação, domínio, arquitetura).
  2. Enriqueça o `AGENTS.md` da raiz adicionando a seção de contexto do projeto.
  3. **Valide**: O `AGENTS.md` final deve conter todas as seções do template padrão do Riteward.

### Etapa 2: Configurar e ativar o sistema de monitoramento de logs

Configure o sistema de monitoramento de logs do Riteward:

1. **Criar estrutura de diretórios de logs**: Garanta a existência do diretório de logs do projeto (ex: `logs/` na raiz) para armazenar os arquivos de log monitorados (ex: `logs/errors.log` ou `logs/agents.jsonl`).
2. **Configurar o bloco de logs**: Edite o arquivo `.riteward/config.yaml` para adicionar a seção `logs`, definindo os caminhos dos arquivos a serem monitorados (`logs.files`) e padrões a ignorar (`logs.ignore_patterns`).
3. **Validar monitoramento**: Verifique a configuração executando `riteward logs check`.

### Etapa 3: Configurar o scanner de arquivos monolíticos (refactor scan)

Configure a verificação automática de tamanho e complexidade de arquivos no projeto:

1. **Configurar parâmetros no config**: No arquivo `.riteward/config.yaml`, defina a seção `refactor` especificando o limite máximo aceitável de linhas por arquivo (`refactor.max_lines`, ex: 300) e os diretórios a serem ignorados pela varredura (`refactor.ignore_dirs`, ex: `["node_modules", "dist", "coverage", ".git"]`).
2. **Validar a varredura**: Execute o comando `riteward refactor scan` para garantir que o scanner funcione adequadamente no projeto.

### Etapa 4: Verificar e configurar quality gates

Garanta que os `quality_gates` em `.riteward/config.yaml` estejam corretos e completos:

1. **Auditar gates existentes**: Verifique se os gates configurados correspondem aos scripts disponíveis no projeto (ex: `test`, `lint`, `typecheck`). Compare com os scripts em `package.json` (ou equivalente) e remova gates cujos comandos não existam.
2. **Adicionar gates ausentes**: Se o projeto possui scripts de qualidade que não estão como gates (ex: `typecheck` existe no `package.json` mas não há gate correspondente), adicione-os à seção `quality_gates` do config.
3. **Validar**: Execute `riteward check` para confirmar que todos os gates executam corretamente.

### Etapa 5: Adicionar o Riteward ao .gitignore do projeto

Garanta a integridade do controle de versão ao trabalhar com o Riteward:

1. Verifique se o arquivo `.gitignore` existe na raiz do projeto (crie-o se necessário).
2. Adicione a pasta `.riteward` (que contém os arquivos de estado local em `.riteward/state/`) e o diretório de logs (`logs/`) ao `.gitignore` para evitar o versionamento de dados temporários e logs locais.

## Critérios de aceitação

- [ ] `AGENTS.md` unificado na raiz do projeto contendo o contexto/propósito do projeto, diretrizes do Riteward e referência explícita a `.riteward/constitution.md`.
- [ ] Arquivo temporário `.riteward/AGENTS.md` removido com sucesso (se aplicável ao Cenário A).
- [ ] Diretório de logs criado e bloco `logs` configurado em `.riteward/config.yaml` com validação bem-sucedida via `riteward logs check`.
- [ ] Bloco `refactor` configurado em `.riteward/config.yaml` (`max_lines` e `ignore_dirs`) com validação bem-sucedida via `riteward refactor scan`.
- [ ] `quality_gates` em `.riteward/config.yaml` sincronizados com os scripts do projeto, validados com `riteward check`.
- [ ] Arquivo `.gitignore` atualizado para ignorar o diretório `.riteward/` (estado local) e o diretório de logs (`logs/`).