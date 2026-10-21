# Ficha da Fase 0 da implantação oficial

Preparação autorizada pelo Human em 20/10/2026, 20h33 BRT: “A Fase 0 pode começar. A Fase 1 depende de R-01, R-02 e R-03 resolvidos.” O preenchimento desta ficha não fecha a governança nem autoriza contratar, instalar ou enviar mensagens.

Plano: `docs/superpowers/plans/2026-10-20-producao-oficial.md`.

| Campo | Valor ou pendência |
|---|---|
| Distribuição | Oficial, conforme decisão do Human. |
| Origem na VPS | `https://github.com/melgarafael/DeskcommCRM.git`. O fork é para governança/documentação. |
| Release | `v1.86.0`. |
| Commit da release | `70a8c2775567f7daea721c77d34a9881190397bc`. |
| Imagens app, worker e scheduler | Namespace `ghcr.io/melgarafael`, todas em `:1.86.0`; comprovar pelo experimento de R-02. |
| Máquina descartável do experimento | Não informada; nenhuma criada. Docker CLI não localizado no PATH do ambiente Windows consultado. |
| VPS de produção | Aguardando informação do Human sobre hospedagem, sistema, arquitetura e serviços existentes. |
| Domínio/proxy | A definir no inventário privado; não publicar configurações detalhadas de acesso. |
| Banco de homologação e produção | Projetos separados; conta/plano/região a definir. |
| Supabase Free | D3 exige aceitação da pausa por inatividade e da ausência de PITR; backups externos e metas de perda/recuperação a compatibilizar. |
| Uso próprio ou terceiros | A definir. |
| Canal/número controlado | A definir no inventário privado; nenhum pareamento ou envio autorizado por esta ficha. |
| IA/modelo/orçamento | A definir; nenhuma credencial solicitada em texto público. |
| E-mail/MFA/recuperação | A definir conforme operação e política aprovadas. |
| Backup externo e recuperação de chaves | A definir no inventário privado. |
| Evidências reais | Destino privado ainda não escolhido; fork recebe somente manifesto sanitizado. |
| Carga/horários/responsável por incidentes | A definir. |
| Custo e despesas | Ainda não aprovados. |
| Abertura de produção | Não autorizada nesta fase. |

## Pendências de governança

| Requisito | Estado na consulta inicial desta atualização |
|---|---|
| Human sincroniza `main` por FF | Pendente: fork `ff5b55c0a…`; original consultado `b00fe79b6…`. Reconsultar no ato do Human. |
| `integracao` e checkpoint no SHA sincronizado | Ainda ausentes na consulta; criar somente após confirmação do FF. |
| Ruleset sem bypass nas duas branches | Consulta retornou lista vazia. Configuração reservada ao Human. |
| PRs habilitados | `has_pull_requests=false`; necessário para submeter o plano contra `integracao`. |
| Actions somente com quatro workflows | Ainda não comprovado. O produtor de `imagens-ok` precisa de solução compatível com essa restrição. |
| Gatilhos para `integracao` | `perf` e `mysql-integracao` filtram `main` no checkout consultado; adequação precisa de revisão. |
| Dependabot sem atualizações automáticas | Configuração rastreada ainda agenda npm e GitHub Actions; desligamento efetivo a comprovar. |
| Token fine-grained só para o fork | Seleção/validade não verificadas. Não publicar token ou capturas de segredo. |
| Hook local | Ativo em `scripts/fork/hooks`; 13 casos passaram em remotos locais descartáveis. Retirar o bloqueio de `integracao` faz a suíte reprovar no caso previsto. |
| Autoria própria | Nome/e-mail locais da agente conferidos para autor e committer; histórico anterior preservado. |
| Credencial atual de CLI | Status indica OAuth, que não atende ao token fine-grained aprovado. Nenhuma publicação desta atualização usará essa credencial. |
| Dependabot version updates | Limites preparados em zero para npm e GitHub Actions; só passam a valer após integração do arquivo na branch default. Security updates ainda requerem controle próprio. |

Estados deste arquivo devem ser atualizados com evidência. Campo vazio ou “a definir” não conta como aceite.
