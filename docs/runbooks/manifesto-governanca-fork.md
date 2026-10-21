# Manifesto sanitizado da preparação de governança

## Decisão aplicável

Human, 20/10/2026, 20h33 BRT: “Revisão aprovada”; “A Fase 0 pode começar. A Fase 1 depende de R-01, R-02 e R-03 resolvidos.” A revisão da Claude foi transmitida pelo Human com os IDs R-01 a R-03 e N-01 a N-04. O relato público anterior é o [pedido da implementadora](https://github.com/drjulioaquino-byte/DeskcommCRM/commit/c8f2a83a6cab24f7d33e9c0a59c817f1b5943869#commitcomment-205885458), não a revisão independente.

## Verificações locais executadas

| Verificação | Resultado |
|---|---|
| Sintaxe Bash de pre-commit, pre-push e teste | PASS para os três arquivos. |
| `bash tests/shell/fork-governanca-hooks.test.sh` | 13 casos PASS, com pushes reais para remoto local descartável. |
| Controle negativo | PASS: cópia do hook sem a alternativa `refs/heads/integracao` fez a suíte sair com erro no caso “criação de integracao bloqueada: push foi aceito”. Hook de trabalho permaneceu intacto. |
| Guarda de criação/atualização/exclusão | PASS para `main` e `integracao`; `master` preservado. |
| Push em lote | PASS: lote contendo ref protegida não enviou a ref comum. |
| Delegação | PASS para pre-commit e pre-push; veto do hook original também bloqueou o envio. |
| Ativação | `core.hooksPath=scripts/fork/hooks`. |
| Autor e committer | Identidade local própria `Codex (implementadora)`, endereço de agente em domínio reservado `.invalid`; sem e-mail pessoal do Human nos novos commits. |
| CLI autenticado | Status indica OAuth; não comprova nem satisfaz seleção fine-grained exclusiva deste fork. Escritas remotas desta atualização ficam suspensas até sua substituição/verificação. |

O primeiro ensaio no sandbox falhou antes de executar a suíte porque o Git Bash não conseguiu criar seu objeto MSYS. A mesma suíte foi executada fora do sandbox com a aprovação da ferramenta, sempre em repositórios descartáveis. Isso não é resultado de CI.

## Estado remoto observado

- Fork `main`: `ff5b55c0a007a28637b3c7a348534decad31d3ed`.
- Original consultado: `b00fe79b6417ecaacd8e808adb9bf9f7244d08a0`.
- `integracao`: ausente na consulta.
- Rulesets: coleção consultada retornou vazia.
- PRs: `has_pull_requests=false`.
- Nenhuma ref de `main`, `integracao` ou checkpoint foi criada ou alterada pela implementadora nesta atualização. O SHA do checkpoint será o do fast-forward efetivamente concluído pelo Human, não uma reserva do SHA acima.

## Pendências para a próxima publicação

1. Human conclui o fast-forward do fork e informa seu SHA; então criar `integracao` e `checkpoint/2026-10-20-base` apontando para esse commit.
2. Human habilita PRs e configura os rulesets sem bypass. Resolver produtor de `imagens-ok` e filtros para PRs destinados a `integracao` sem liberar publicação de imagens.
3. Verificar token fine-grained restrito ao fork, com expiração e permissões mínimas, sem publicá-lo ou capturá-lo.
4. Integrar a configuração de version updates em zero e confirmar o desligamento dos security updates separadamente, preservando alertas.
5. Publicar a branch de trabalho e abrir PR somente contra `integracao`, com head, base e checks daquele head. CI local não será chamado de CI do GitHub.

## Limites da entrega

Preparados: plano revisado, ficha F0, roteiro G0 e hooks. Executados: verificações locais descritas acima. Pendente: experimento completo do instalador em máquina descartável, seleção da VPS e recursos externos. Nenhuma instalação, alteração de DNS, contratação, envio, restauração ou publicação de imagem foi executada.
