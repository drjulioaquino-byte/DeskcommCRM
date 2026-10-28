# Pedido de melhoria — tirar contatos do Radar de risco

- **Origem:** operação real da clínica (crm.clinicoscrm.com), 28/10/2026
- **Tela:** `/app/radar`
- **Tipo:** 1 bug + 1 melhoria de UX
- **Base analisada:** `main` do fork em `9ff58fb3` (espelho de melgarafael/DeskcommCRM)

## Problema relatado

Contatos entram no Radar e não há como tirá-los dali pela própria tela. Parte deles nem é cliente (contato pessoal, fornecedor, número errado).

## Como o Radar decide quem entra (leitura do código)

`lib/leads/radar-de-risco.ts → carregaRadarDeRisco()` monta quatro listas:

| Lista | Critério de entrada | Como sai hoje |
|---|---|---|
| Itens (crítico / em risco / em voo) | `crm_leads.status = 'open'`, funil não arquivado, sem atividade além da janela do estágio (`resolveStageWindow`, padrão 24h / 72h) | negócio ganho/perdido; nova atividade; funil arquivado. Retorno agendado só muda para "em voo" — **continua na lista** (`classifyRisk` → `onRadar: bucket !== "em_dia"`) |
| Demandas sem próximo passo | `demandas.fechada_em is null and proximo_passo is null` | `PATCH /api/v1/demandas/:id` com `proximo_passo` ou `action: "encerrar"` (hoje só pelo painel lateral do inbox) |
| Propostas vencidas sem retomada | proposta vencida sem proposta mais nova no negócio aberto | nova proposta ou negócio fechado |
| Propostas esperando revisão | aviso `proposta_pronta_para_revisao` aberto | revisar a proposta |

## Bug — contato "Pessoal" (e "Bloqueado") continua no Radar e fica preso

**Esperado:** marcar o contato como Pessoal "tira o contato da operação" (`app/api/v1/contacts/[id]/personal/route.ts`, migration 0563).

**Observado no código:**

1. A rota de "Pessoal" **não fecha** o negócio nem a demanda (está documentado: "Não apaga conversa, mensagem, negócio nem histórico").
2. A listagem de negócios **exclui** pessoal (`app/api/v1/leads/_handler.ts`, ~l.389), a ficha devolve **404** (`getLeadHandler`, ~l.489) e editar/mover devolvem **403** (`recusaPessoalNaEscrita`).
3. Já `carregaRadarDeRisco` **não filtra** `contacts.is_personal` nem `is_blocked` — nem nos leads, nem em `demandas`, nem em propostas.

**Efeito:** o negócio do contato pessoal fica `open`, para de ter atividade, sobe para **crítico** e fica no Radar para sempre. O link do item leva a uma conversa/negócio que a própria aplicação esconde, e a pessoa não tem por onde encerrá-lo. Tela e agente de IA (que usa a mesma função via `lib/mcp/tools/retencao.ts`) passam a cobrar alguém que a clínica disse explicitamente que não é cliente.

**Correção sugerida (escolher uma, ou as duas):**

- **A — filtro na leitura (mínimo, sem migração):** em `carregaRadarDeRisco`, excluir contatos com `is_personal = true` ou `is_blocked = true` antes do `SCAN_CAP` (join embutido `contacts!inner(is_personal,is_blocked)` com `.eq(... , false)`, como já sugerido no comentário do corte de funil arquivado). Aplicar o mesmo corte em `demandas` e `crm_proposals`.
- **B — efeito no marcar:** na rota `personal` (e no bloqueio), encerrar as demandas abertas com desfecho `nao_procede` e marcar o negócio aberto como perdido com motivo próprio (`contato_pessoal`), registrando em auditoria. Desmarcar não reabre (mesma regra D8 dos follow-ups).

**Teste de regressão sugerido:** em `RiskRadarList.test.tsx` / teste de `carregaRadarDeRisco`: contato com negócio aberto frio → aparece; marcar `is_personal` → some de `items`, `sem_proximo_passo` e propostas; idem para `is_blocked`.

## Melhoria — ação de saída direto na linha do Radar

Hoje a linha do Radar só oferece "Assumir" e o link. Para tirar um item a pessoa precisa saber que deve ir ao kanban (ganho/perdido) ou ao painel lateral do inbox (encerrar demanda / próximo passo).

**Proposta:** menu "⋯" em cada linha (`RadarRow` e itens de `radar-sem-proximo-passo`) com:

1. **Marcar como perdido** — reaproveita `LoseLeadDialog` (`POST /api/v1/leads/:id/lose`).
2. **Encerrar demanda** — reaproveita o seletor de desfecho do `CRMSidePanel` (`action: "encerrar"`), incluindo "Não procede".
3. **Definir próximo passo** — mesmo `PATCH` de `proximo_passo`.
4. **Não é cliente (marcar como pessoal)** — chama `/api/v1/contacts/:id/personal` e, com o bug acima corrigido, o item sai.
5. **Adiar até…** (opcional) — silencia o item por N dias. Precisa de coluna nova (ex.: `crm_leads.radar_adiado_ate`) e entra em `classifyRisk` como "em voo" fora da lista; só vale a pena se 1–4 não bastarem.

Ao concluir, invalidar `["leads-at-risk"]` (já é o que o "Assumir" faz).

**Opcional:** filtro "esconder em voo" no topo, já que item com retorno agendado não exige ação.

## Contorno enquanto não há correção

- Paciente/lead real: kanban → negócio → **Perdido** (ou Ganho); inbox → painel lateral → **Encerrar demanda**.
- Contato pessoal já marcado: desmarcar "Pessoal" → marcar o negócio como perdido e encerrar a demanda como "Não procede" → marcar "Pessoal" de novo. Desmarcar não reativa follow-ups nem campanhas.
