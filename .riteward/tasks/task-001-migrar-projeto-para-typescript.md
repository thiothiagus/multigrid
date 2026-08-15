# Task-001: Migrar projeto para TypeScript

- **id:** task-001
- **título:** Migrar projeto para TypeScript
- **status:** todo
- **prioridade:** high
- **criado em:** 2026-08-15

## Descrição

Converter main.js, renderer.js e preload.js para TypeScript (.ts). Adicionar tsconfig.json, tipagens para APIs do Electron, e configurar build. Benefícios: type safety, autocomplete, detecção de erros em tempo de compilação, melhor DX.

## Critérios de aceitação

- [ ] tsconfig.json configurado para ES module resolution e target compatível com Electron 31
- [ ] main.js convertido para main.ts com tipagem de BrowserWindow, BrowserView, IPC
- [ ] renderer.js convertido com tipagem do estado e funções de layout
- [ ] preload.js convertido com tipagem do contextBridge/ipcRenderer
- [ ] Tipos definidos para Pane, Config, WinState, LayoutState
- [ ] Build configurado (tsc ou toolchain) gerando JS para produção
- [ ] package.json scripts atualizados (build, start)
- [ ] App funcional após migração (testar criar/remover/arrastar panes)

## Notas

_Recomenda-se fazer antes de task-002 (ESLint) e task-003 (testes), pois ambos se beneficiam de tipos._
