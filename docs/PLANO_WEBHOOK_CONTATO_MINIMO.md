# Plano — projeção mínima opcional de contato por regra de webhook

## 1. Autorização, fontes e entrega

Ordem direta do Human Júlio de **18/11/2026, 19:00 (Brasília)**, Tarefa 4: preparar somente o plano no fork `drjulioaquino-byte/DeskcommCRM`, em PR próprio em rascunho, e pedir revisão independente A1 da Claude. **Base CRM examinada: `9ff58fb354779df65d586b674f0f155edd462e87`**, main do fork. Este PR modifica somente este documento. Não é uma contribuição de código ao repositório upstream nem uma configuração de integração real.

Fontes compartilhadas:

- [Plano ClinicOS, seção “Etapa futura no CRM”](https://github.com/drjulioaquino-byte/ClinicOS/blob/461978ce585f15c1895318217a2422ecac3224ef/docs/PLANO_CRM_CONTRATOS.md#etapa-futura-no-crm-e-limite-de-privacidade), na main resultante do PR #91, `461978ce585f15c1895318217a2422ecac3224ef`.
- [DCRM-1, confirmação registrada pela revisora](https://github.com/drjulioaquino-byte/ClinicOS/pull/83#issuecomment-6946258133): decisão do Human **“Limitar no CRM”**; [registro inicial DCRM-1 a DCRM-5](https://github.com/drjulioaquino-byte/ClinicOS/pull/83#issuecomment-6946116849).
- [N-13: grafia da etiqueta](https://github.com/drjulioaquino-byte/ClinicOS/pull/83#issuecomment-6947406023) e [gate registrado pela implementadora](https://github.com/drjulioaquino-byte/ClinicOS/pull/83#issuecomment-6947461961).
- D-001 do ClinicOS: opção d renovada até **22/11/2026, 13:25 (Brasília)**. A agenda/contratos ficam no ClinicOS administrativo. Esta tarefa vem da ordem direta do Human, não transfere identidade/autoridade de outra implementadora registrada numa decisão antiga.

Esta etapa **a** só prepara o plano. Código, configuração de regra, integração ativa e teste com contato real continuam bloqueados até A1 e ordens próprias do Human. O plano não implementa a importação no ClinicOS, não concede papel `crm_import` e não altera a Lia.

## 2. Inspeção e viabilidade na base fixada

Referências abaixo são código observado na base, não comprovação de comportamento em produção:

| Fonte CRM | Observação |
| --- | --- |
| `lib/schemas/webhooks.ts`, ação `call_webhook` | Cada ação tem `config` próprio; hoje URL, segredo/segredo cifrado e `include_owner`. `automation_rules.actions` já guarda a configuração em JSONB. Um campo opcional de configuração pode ser persistido sem nova coluna/migração. |
| `lib/automation/actions/call-webhook.ts:196–244` | `CONTACT_PUBLIC_FIELDS` e `LEAD_PUBLIC_FIELDS` definem a projeção padrão. Devem permanecer intactas, inclusive o comportamento das regras já existentes. |
| Mesmo arquivo, `executeCallWebhook`, linhas 414–432 | Além dos objetos projetados, o corpo atual espalha `event.payload` em `data`. Reduzir somente a lista do contato deixaria sair `tags`, `service_origin` e campos arbitrários do payload. O modo mínimo exige construir `data` do zero, sem esse spread. |
| `lib/automation/engine.ts`, `buildContext` | Contato é hidratado por ID e organização; lead carrega contato por `lead.contact_id`, também filtrando organização. Reutilizar esse vínculo, nunca inferir contato por telefone, nome ou `data.lead.id`. |
| `app/app/webhooks/_components/ActionConfigForm.tsx`, `CallWebhookForm` | Já há configuração opcional por ação, com opt-in de responsável. A opção de projeção precisa de superfície aqui, sem default global/env. |
| `app/api/v1/automation-rules/route.ts` e `[id]/route.ts` | Schema/guards atuais validam e salvam ações; segredos são cifrados pelo caminho existente. PATCH precisa avaliar o estado final mesclado quando o gatilho ou as ações mudarem. |
| `call-webhook.ts`, `idDaEntrega`/`assinaturaComCarimbo`, e rota `runs/[runId]/resend` | Entrega deriva de evento/regra/posição/lista de ações, excetuando segredos; reenvio usa o mesmo executor. Corpo é serializado uma vez por execução e assinado depois, com timestamp por tentativa. |

**Conclusão de viabilidade arquitetural:** há ponto de seleção local em `config` da ação, dentro de uma regra. É possível propor um ramo explícito sem alterar as constantes globais. Não está implementado nem testado como recurso novo. Se a implementação exigir mudar os padrões globais, outras regras, cadeia de canal ou schema de banco, **parar e informar o Human**, sem contornar a restrição.

O contrato de projeção/privacidade pertence ao núcleo genérico do emissor. Não codificar nomes de cliente, ClinicOS, endpoint real ou etiqueta “contrato” como regra fixa do produto. Uma extensão declarativa de cards não modifica o construtor do envelope. A configuração da integração específica será um uso futuro e separado dessa capacidade genérica.

## 3. Contrato proposto, opcional e local à ação

Acrescentar **somente como proposta** a seguinte configuração opcional em uma ação `call_webhook`:

```json
{
  "type": "call_webhook",
  "config": {
    "url": "https://example.invalid/contratos",
    "projection": {
      "mode": "contact_minimal",
      "tag": "contrato"
    }
  }
}
```

O exemplo é inerte, sem segredo nem endpoint de produção. `projection.tag` identifica a etiqueta de disparo a preservar como metadado; impede transmitir outras etiquetas do contato. O perfil não é uma seleção livre de campos e não aceita templates, URLs ou caminhos de objeto como lista de projeção.

- **Ausência de `projection`: caminho atual integral.** Não acrescentar default no JSON gravado de regras legadas, não regravar todas as regras e não modificar `CONTACT_PUBLIC_FIELDS`, `LEAD_PUBLIC_FIELDS` ou seus consumidores padrão.
- `projection` presente deve ser objeto estrito com `mode="contact_minimal"` e etiqueta não vazia válida. Valor desconhecido/malformado não pode cair silenciosamente no caminho amplo; falhar fechado antes do POST.
- O perfil vale somente para `contact.tag_added` e `lead.tag_added`. Outra combinação deve ser recusada na validação da regra e no executor, inclusive regra antiga/injetada que não passou pela UI. Nada muda para outros gatilhos sem o perfil.
- `include_owner=true` é incompatível com esse perfil: recusar com erro específico sem enviar, nunca ignorar a restrição, incluir responsável ou buscar seus dados como fallback. Na UI, explicar a incompatibilidade e exigir ajuste explícito para salvar.
- Manter a estrutura atual: uma regra tem um `trigger_event`. Para cobrir os dois eventos serão necessárias **duas regras**, cada uma com a ação/opção explícita. Não criar gatilho múltiplo, migração ou alteração automática de regras nesta etapa.

## 4. Dados mínimos e envelope fechado

Os **únicos campos pessoais** que atravessam esse perfil são `data.contact.id`, `data.contact.name` e `data.contact.phone_number`. O formato mantém os metadados operacionais já necessários à entrega/assinatura e à verificação DCRM-5: `event`, `occurred_at`, `happened_at`, `delivery_id` e `data.added_tags` limitado à etiqueta configurada efetivamente adicionada. São metadados do protocolo/gatilho, não autorização para enviar outros dados do contato ou lead.

Forma proposta para fixture fictícia, substituindo apenas `event` pelo outro gatilho quando aplicável:

```json
{
  "event": "lead.tag_added",
  "occurred_at": "2026-11-18T22:00:00.000Z",
  "happened_at": "2026-11-18T22:00:00.000Z",
  "delivery_id": "20000000-0000-4000-8000-000000000001",
  "data": {
    "added_tags": ["contrato"],
    "contact": {
      "id": "10000000-0000-4000-8000-000000000001",
      "name": "Contato fictício",
      "phone_number": "+5511000000000"
    }
  }
}
```

Procedimento futuro do ramo mínimo:

1. Verificar tipo de evento, perfil, etiqueta e incompatibilidades antes do efeito. Ler `added_tags` somente como lista de strings; normalizar para comparação conforme seção 5. Se a etiqueta configurada não foi adicionada, não enviar; resultado `skipped` com motivo fixo. Não inferir a adição a partir da lista completa atual de etiquetas.
2. Resolver contato exclusivamente de `ctx.context.contact`, hidratado pelo motor e filtrado pela organização. Em `lead.tag_added`, exigir o vínculo `lead.contact_id` e coerência com esse contato; ausência/contato de outro tenant não permite fallback para objeto do payload ou ID do lead.
3. Exigir os três valores do contato no formato/tipo previsto pelo cadastro. Dados ausentes/inválidos produzem falha tipada sem POST; nunca preencher com e-mail, `display_name`, nome/telefone do lead ou objeto serializado. Transmitir telefone do cadastro; normalização para armazenamento no ClinicOS é responsabilidade da etapa do receptor.
4. Construir **novo** objeto `data` com apenas `added_tags:[etiqueta_canonica]` e `contact:{id,name,phone_number}`. Não espalhar `event.payload`, `leadPublic`, `contactPublic` amplo, `ownerPublic` ou contexto de compromisso. Não modificar `ctx.context`/`event.payload`: outra ação/regra que usa o mesmo contexto conserva seu resultado.
5. Não gerar `data.lead`, nem como `null`, `{}` ou campo aninhado. Não enviar lead_id, contact_id duplicado do payload, e-mail, `display_name`, tags completas, outras etiquetas adicionadas, custom_fields, consent, service_origin, organização, responsável, conversa, mensagem ou observações. A lista fechada da forma JSON acima é o critério, inclusive para chaves inesperadas/adversariais.
6. Serializar e assinar o corpo **já mínimo** pelo procedimento existente. Preservar HMAC moderno, assinatura legada existente, timestamp, cabeçalhos, timeout, retries, validação de URL/DNS e `redirect:manual`; não ampliar permissões nem ajustar esses controles como parte da projeção.

`projection` participa naturalmente da impressão das ações usada por `idDaEntrega`; não mudar o algoritmo. Mesma regra/configuração/evento conserva a identidade nas tentativas e no Reenviar; mudança explícita de perfil/etiqueta é mudança de configuração e pode gerar novo delivery_id. O consumidor ClinicOS continua responsável pela idempotência por **ID do contato**, inclusive entre os dois tipos de evento. Não confundir delivery_id com ID de paciente ou lead.

Não reprocessar runs nem enviar retroativamente dados nesta entrega. A análise de filas/reenvios antigos antes de uma ativação futura exigirá ordem própria; reenvio manual deve passar pelo executor com a projeção vigente e nunca aproveitar um corpo amplo persistido como atalho.

## 5. N-13 — “Contrato” × “contrato”, observado e proposto

**Não há uma normalização uniforme em todos os caminhos observados:**

- `lib/contacts/tag-normalizada.ts`: `normalizarTag` aplica `trim().toLowerCase().slice(0,40)`; `normalizarTags` descarta vazios/deduplica e preserva a primeira ordem. `lib/schemas/contacts.ts` usa esse caminho na escrita/filtro de contato. **“Contrato”, “ contrato ” e “CONTRATO” viram “contrato” nesse caminho.**
- `lib/schemas/leads.ts`: create/patch de tags aceitam lista de strings sem aquela transformação. `app/api/v1/leads/_handler.ts` calcula `addedTags` por comparação exata e emite a lista recebida. Não prometer que todo evento de lead já chega em minúsculas.
- `lib/automation/actions/add-tag.ts` e migração `20261019000001_0682_add_tag_atomico_entre_eventos.sql`: a união atômica preserva a lista recebida e devolve a adição efetiva; a função declara que **não normaliza o vocabulário**. Isso também impede assumir normalização universal só porque o evento é de contato.
- `lib/automation/conditions.ts`: `contains` em array compara o elemento inteiro, mas a forma ignora caixa, acentos e pontuação, além de aparar/juntar espaços. Por isso “contráto” ou “contrato!” também podem casar com essa condição. `eq` continua comparação exata. Não mudar esses operadores globais neste trabalho.

**Proposta limitada ao novo perfil:** reutilizar `normalizarTag` para comparar cada etiqueta adicionada com a configurada, depois de validar tipo/tamanho. Para a regra desta integração, configuração canônica `contrato`. Aceitar as diferenças de caixa/espaços das três grafias acima e emitir só `added_tags:["contrato"]` quando realmente presente. Não aceitar substring (“contrato anual”, “contratox”) nem ampliar a equivalência para acentos/pontuação (“contráto”, “contrato!”). Se uma condição geral mais permissiva selecionar o evento, essa guarda específica ainda não envia quando a etiqueta exata normalizada não corresponde, registrando motivo em vez de silêncio operacional. Não regravar etiquetas do banco nem alterar normalização global.

**Sonda local efetivamente executada**, Node v24.14.1 com suporte nativo a TypeScript: importação das funções reais `normalizarTag`, `normalizarTags` e `evaluateConditions`, sem dependência instalada, banco, env ou rede. Saída observada:

| Entrada | Normalizador do contato | Condição atual `contains` de `event.added_tags` |
| --- | --- | --- |
| `Contrato` | `contrato` | true |
| `contrato` | `contrato` | true |
| ` contrato ` | `contrato` | true |
| `CONTRATO` | `contrato` | true |
| `contratox` | `contratox` | false |
| `contrato anual` | `contrato anual` | false |
| `contráto` | `contráto` | true |
| `contrato!` | `contrato!` | true |

Asserções de “Contrato” e deduplicação das três variantes passaram, exit 0. O Node emitiu aviso `MODULE_TYPELESS_PACKAGE_JSON` ao carregar TS; não houve mudança em package.json para eliminá-lo. A sonda comprova essas funções existentes, não o perfil proposto nem um evento real enviado pelo CRM.

## 6. Arquivos propostos para implementação futura

Nenhum arquivo abaixo é alterado neste PR de plano. A lista delimita um futuro pedido; não é autorização de implementação.

| Arquivo | Mudança futura proposta |
| --- | --- |
| `lib/schemas/webhooks.ts` e `lib/schemas/webhooks.test.ts` | Campo opcional estrito de projeção, incompatibilidade com responsável, validação por gatilho e regressão das ações legadas. |
| `lib/automation/actions/call-webhook.ts` e `call-webhook.test.ts` no mesmo diretório | Ramo local/puro de projeção por lista fechada antes de serializar/assinar; padrão integral preservado; erros/motivos sem conteúdo pessoal. |
| `app/api/v1/automation-rules/route.ts` e `app/api/v1/automation-rules/[id]/route.ts` | Validar configuração final por regra no create/PATCH, sem novo endpoint, escopo, query de dados ou migração. Reutilizar guard/RBAC/tenant/auditoria/segredo existentes. |
| `app/app/webhooks/_components/ActionConfigForm.tsx` | Tipo e opção visível por ação, etiqueta configurável e ajuda; padrão e `include_owner` legados preservados; não criar rota/menu novo. |
| `app/app/webhooks/_components/ActivityTab.tsx` | Somente se necessário para mensagem legível dos motivos tipados novos; manter status/request/delivery sem payload pessoal. |
| `tests/unit/webhook-de-saida-mesma-entrega.test.ts` | Regressões de config/ID e Reenviar; comportamento sem perfil permanece igual. |
| Novo `tests/unit/webhook-projecao-minima.test.ts` | Contrato fechado, normalização por caminho, falha fechada, duas ações/regras e dois tenants, sem efeitos externos. |
| Novo `tests/e2e/webhook-projecao-minima.spec.ts` | Configurar/salvar/reabrir o opt-in e erros de combinação em instalação fictícia fresca; mock/receptor local, sem CRM real. |
| `.github/workflows/e2e.yml` | Somente registrar a nova spec na matriz conforme regra do projeto, sem reduzir checks/partições; não alterar workflow nesta etapa documental. |
| `docs/integracao/webhooks-de-saida.md`, `docs/architecture/designer-de-automacoes.architecture.json`, `.changes/webhook-projecao-minima.md` | Documentar novo opt-in/forma, atualizar nó existente/arestas e fragmento de release da capacidade futura; sem release ou publicação nesta ordem. |

`lib/automation/engine.ts`, normalizadores de etiquetas, emissores contact/lead, tabelas, baseline/migrações e constantes globais são referências/regressões, sem mudança planejada. Preservar traduções/convenções existentes da UI; eventual arquivo adicional indispensável precisa entrar em novo escopo autorizado antes de editar.

## 7. Critérios de aceite e testes futuros — NOT_RUN

| ID | Critério | Evidência planejada |
| --- | --- | --- |
| P-01 | Somente a ação/regra com opt-in usa o perfil; ausência conserva defaults e constantes. | Dois tenants, duas regras do mesmo evento e duas ações na mesma regra; congelar relógio/ID e comparar corpo/headers padrão com a base. Constantes globais sem diff. Contexto original imutável. |
| P-02 | Ambos os eventos produzem exatamente os três campos do contato, sem `data.lead` e sem spread. | Fixture com campos pessoais extras em payload/lead/contact, service_origin/owner/compromisso e chaves injetadas; comparar igualdade profunda com contrato fechado. |
| P-03 | ID de contato deriva do contato/vínculo correto, nunca do lead. | `lead.id != contact.id`; falta de contact_id/contato, vínculo cruzado entre organizações e campos inválidos: falha sem POST, sem fallback. |
| P-04 | N-13 fica explícita e não depende de a origem já ter normalizado. | Evento vindo de contato, PATCH de lead e ação add_tag; variantes da seção 5, mistura `["Outra", "Contrato"]` emite só `["contrato"]`; sem etiqueta exata, sem envio. Nenhuma etiqueta armazenada é alterada. |
| P-05 | Config inválida não degrada para o payload amplo. | Perfil desconhecido, ausente de modo/tag, gatilho incompatível, `include_owner=true`, PATCH parcial/troca de gatilho e regra antiga injetada: validação e executor recusam antes do POST. Ausência total de perfil conserva comportamento anterior. |
| P-06 | Assinaturas/retries/reenvio continuam correspondendo ao corpo mínimo. | Conferir HMAC sobre bytes reais serializados, timestamp por tentativa, entrega estável sob retry/config fixa e mudança de config distinguível. Reenviar usa mesmo caminho; URL/DNS/redirect/timeout continuam protegidos. Nenhuma chamada a URL real. |
| P-07 | Configuração é visível, persistida e administrável com RBAC/tenant atuais. | Create/PATCH/GET e editor: salvar/reabrir/manter/remover opção sem perder outros campos/segredo cifrado; espectador não altera, outro tenant não lê/escreve. Teste E2E local com dados fictícios. |
| P-08 | Falha/ausência não vira sucesso nem vaza conteúdo. | Falta de contato/etiqueta/config e falha HTTP exibem status/motivo em Atividade; logs/results não têm nome, telefone, payload, assinatura ou segredo. Sem novo evento clínico, mensagem ou alteração em outras regras. |

A futura implementação deve executar os novos testes contra a base e observar falha pela ausência do perfil (hoje ele é ignorado/não existe e o executor monta a projeção ampla). Regressões do padrão e dos controles continuam obrigatórias; não remover, pular ou relaxar testes existentes. Golden fixtures não serão geradas pela própria função de projeção. A sonda da seção 5 não é um teste dessa implementação futura.

Validação futura: `pnpm cercas`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:channels`, `pnpm lint:role-rank`, `pnpm test:unit`, `pnpm test:shell` quando aplicável, `pnpm build`, prova E2E local e CI do head. Sem alteração de schema/RLS, `test:db` não é prova substituta da projeção; se ela se tornar necessária, suspender/ampliar plano antes de schema. Testes da API/tenant devem usar portas/fixtures isoladas. Nunca carregar `.env`/contatos reais para provar o perfil.

## 8. Operação, segurança e Living System Checklist

| Pergunta | Resposta delimitada para a futura peça |
| --- | --- |
| Quem alimenta? | `event_log` → `lib/automation/engine.ts`/`buildContext`, pelas regras de tag e organização confiável. |
| Quem recebe? | `executeCallWebhook` → endpoint da regra; ClinicOS é um consumidor futuro e ainda não autorizado para ativação. |
| Que registro emite? | Resultado existente em `automation_rule_runs.actions_result`: status, motivo tipado, tentativa e delivery_id; sem conteúdo pessoal. Auditoria de edição da regra já existente. |
| Onde aparece? | `ActivityTab.tsx`, em `/app/webhooks`, e editor da ação em `ActionConfigForm.tsx`. |
| Porta de navegação? | Usar a página/editor de automações já existentes; nenhuma rota ou entrada de menu nova. |
| Anti-morte? | Retries limitados e ação Reenviar existentes; falha visível exige revisão do responsável pela regra. Não criar reenvio automático infinito, nova fila ou promessa de importação concluída. |
| Onde configura? | Opt-in explícito na ação da regra, salvo em JSONB; ausência mantém padrão. Erros de configuração visíveis, sem ajuste direto no banco. |
| Continuidade humana/IA? | Gestor autorizado inspeciona motivo e corrige/revisa a regra. Nenhuma nova ação da Lia/IA é acionada ou ganha autoridade. |
| Laço de retorno? | Sucesso HTTP confirma só entrega; falha fica em Atividade com motivo/tentativa. Importação/aceite do paciente dependem da futura etapa ClinicOS, não são inferidos pelo CRM. |
| Mapa? | Plano descreve as arestas existentes evento → regra → executor → endpoint. Na implementação, atualizar o nó/arestas pertinentes em `designer-de-automacoes.architecture.json`; não alterar mapa de runtime neste PR somente documental. |

Preservar autorização mínima, tenant, URL/anti-SSRF, assinatura e registros existentes. Os metadados bastam para correlação sem armazenar corpo/nome/telefone nos logs. Não há novo secret, OAuth, serviço, rotina paga, migração ou concessão de acesso. As propriedades observadas na base podem exigir reavaliação se a main mudar antes da implementação.

## 9. Desfazer, exclusões e conclusão

**Desfazer o plano:** fechar este PR sem merge. Nenhum ambiente ou dado terá sido alterado. Depois de eventual integração humana do documento, reversão documental somente por ordem própria, sem reescrever histórico.

**Reversão futura da implementação:** propor reversão dos commits e ordem própria para integração/publicação; não reverter automaticamente uma regra mínima para a projeção ampla. Isso restauraria tráfego pessoal excedente. Antes de qualquer remoção do recurso, o Human precisará decidir sobre desativar/revisar as regras opt-in e reenvios pendentes. Nada disso é executado neste plano.

**Exclusões desta ordem:** código, runtime, alteração de CONTACT_PUBLIC_FIELDS/LEAD_PUBLIC_FIELDS, mudanças em outras regras/condições globais, API ativa do ClinicOS, banco/baseline/migração/SQL remoto, deploy/release/publicação, flags/segredos/.env, webhook real, contato/paciente real, mensagens/WhatsApp/Lia, Google Cloud e merge. Não atualizar upstream nem personalizações do fork; não alterar documento de autoridade, índice, skill ou fragmento de release nesta entrega somente de plano.

**Condição de entrega:** um PR em rascunho neste fork, só com este documento, base/head e validações reais informados, pedido A1 publicado. O plano requer parecer real da Claude e decisão posterior do Human para código. Ativação e contato real continuam bloqueados; este plano não remove os gates de privacidade DCRM-1 nem autoriza fases seguintes.
