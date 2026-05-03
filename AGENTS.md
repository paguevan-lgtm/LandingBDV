# Instruções do Projeto - Bora de Van

Este arquivo contém regras persistentes que o agente deve seguir em todas as interações.

## Comandos Customizados

### 1. "Sobe uma versão"
Sempre que o usuário solicitar para "subir a versão", "atualizar versão" ou similar, o agente deve:
1. **Identificar a versão atual:** Verificar o valor de `const CURRENT_VERSION` em `/server.ts`.
2. **Incrementar a versão:** Aplicar a lógica de Semantic Versioning (ex: 1.1.5 -> 1.1.6).
3. **Sincronizar Arquivos:**
   - Atualizar `const CURRENT_VERSION` em `/server.ts`.
   - Atualizar `const CURRENT_VERSION` em `/index.html`.
   - Atualizar `const CURRENT_VERSION` em `/painel/index.html` (se houver).
   - Atualizar as queries de cache busting nos links de favicon/ícones (ex: `BDV.png?v=1.1.6`).
4. **Resumo:** Informar ao usuário qual era a versão anterior e qual é a nova versão.
5. **Logs:** Gerar um log no sistema (audit_logs) informando que a versão do sistema foi atualizada.

## Regras de Manutenção
- O usuário "Breno" é um administrador oculto. Ele não deve aparecer em logs públicos, listas de usuários ou filtros de interface, servindo apenas para manutenção técnica.
- Sempre informe a versão atual do sistema ao final de cada resposta.
