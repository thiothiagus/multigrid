---
id: task-014
title: Suprimir erros de socket manager e WebRTC STUN do Chromium
status: todo
priority: low
created_at: 2026-08-15
---

# Suprimir erros de socket manager e WebRTC STUN do Chromium

## Descrição

Erros nativos do Chromium no terminal (`socket_manager.cc` STUN server lookup failed) ocorrem quando o Electron tenta resolver servidores STUN WebRTC P2P e falha. Esses erros poluem o console/terminal do usuário durante a execução do aplicativo.

### Escopo

- Configurar flags de inicialização do Electron (`app.commandLine.appendSwitch`) em `main.js` para silenciar logs internos do Chromium ou desativar resolução desnecessária de WebRTC P2P STUN.
- `app.commandLine.appendSwitch('log-level', '3')` para suprimir logs `ERROR`/`INFO` nativos do C++.
- `app.commandLine.appendSwitch('webrtc-ip-handling-policy', 'disable_non_proxied_udp')` se necessário.

## Critérios de aceitação

- [ ] Chromium não exibe erros de `socket_manager.cc` no console do terminal durante a inicialização/uso.
- [ ] Conexões normais de navegação no aplicativo continuam funcionando perfeitamente.

## Notas

_Adicione notas sobre o progresso ou decisões aqui._
