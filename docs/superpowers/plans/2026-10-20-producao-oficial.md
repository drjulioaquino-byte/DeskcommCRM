# Plano de implantação do DeskcommCRM em produção

**Estado:** proposta para revisão da Claude e decisão do Júlio.

**Submissão:** publicação no GitHub autorizada posteriormente pelo Human; ver seção 14.

**Autora:** Codex, implementadora.

**Data:** 20/10/2026, horário de Brasília.

**Destino da entrega:** infraestrutura e operação da instalação. O núcleo do produto permanece na versão oficial selecionada.

**Branch deste plano:** `codex/plano-producao-oficial`.

O objetivo é colocar uma instalação oficial do DeskcommCRM em operação, com atendimento por WhatsApp, IA, continuidade para humanos e recuperação comprovada. A entrega inclui homologação isolada, testes das jornadas essenciais, backup externo, ensaio de restauração, entrada controlada em produção e passagem da operação ao responsável.

O sucesso depende de três provas diferentes: o artefato instalado corresponde à release escolhida; uma pessoa consegue realizar as jornadas pela interface; uma instalação perdida pode ser recuperada com os dados e arquivos necessários. Aprovar este plano libera a preparação autorizada pelo Júlio; a abertura do atendimento real tem uma decisão própria ao final.

## 1. Decisão já tomada e limites de autorização

O Júlio escolheu nesta conversa: **“Versão oficial primeiro (recomendado)”**. Registro da decisão em 20/10/2026, às 19h28 BRT, durante a elaboração do plano; esse é o horário do registro, pois a interface não forneceu o horário individual da mensagem.

| Papel | Responsabilidade |
|---|---|
| Júlio, Human | Decide arquitetura, despesas, acessos, prioridades, tratamento dos achados e abertura da produção. Faz os merges de eventuais PRs. |
| Codex, implementadora | Prepara os ambientes autorizados, executa o plano aprovado, reúne evidências e propõe correções em branch própria. |
| Claude, revisora | Revisa o plano e as evidências; recomenda com justificativa. Sua revisão não constitui autorização operacional. |

A autorização atual cobre produzir este plano. Não cobre contratar serviços, alterar DNS, provisionar banco, instalar na VPS ou enviar mensagens. As credenciais serão fornecidas pelo mecanismo seguro do ambiente escolhido, sem publicação no chat ou no Git. O envio externo de testes deve nomear o número controlado e ser autorizado antes de ocorrer.

O plano será entregue ao Júlio para encaminhamento à revisora. Não haverá mensagem automática à Claude, publicação de comentário ou abertura de PR apenas por constar aqui um destinatário.

## 2. Base técnica e versão candidata

| Item | Estado conferido nesta sessão |
|---|---|
| Repositório de trabalho | `drjulioaquino-byte/DeskcommCRM`, fork de `melgarafael/DeskcommCRM`. |
| Commit de referência do plano | `ff5b55c0a007a28637b3c7a348534decad31d3ed`, igual ao `main` remoto consultado. |
| Releases do fork | A consulta à coleção de releases retornou vazia. Não é uma declaração sobre todos os pacotes ou tags possíveis. |
| Checks do commit no fork | Foram retornados seis checks de análise/dependências; não constaram `verify`, `invariants`, `build-and-size`, `e2e` ou `imagens-ok`. Isso não demonstra a causa da ausência. |
| Release oficial candidata | `v1.86.0`, publicada em 19/10/2026 às 20h04 BRT; era a release estável mais recente retornada pela consulta. |
| Commit da release candidata | `70a8c2775567f7daea721c77d34a9881190397bc`, resolvido pela tag anotada oficial. |
| Artefatos no registro e arquitetura da VPS | A verificar na fase 1. Existência da release não comprova disponibilidade das imagens. |
| VPS, domínio, banco, número e responsável operacional | Ainda não informados. A fase 0 resolve essas escolhas. |

O commit usado para ler e planejar é diferente do commit da release candidata. A implantação usará **kit, compose, baseline e imagens da mesma release oficial**. Não se aplica o baseline do `main` sobre uma imagem antiga. Os caminhos de testes mencionados adiante foram localizados no checkout de referência e deverão ser reconferidos no checkout da release antes de executar.

A versão candidata será reconfirmada no início da execução. Trocar a versão exige registrar novo SHA, diferenças relevantes, imagens e critérios de aceite afetados. Nenhuma atualização para o topo do desenvolvimento será feita por conveniência.

### Fontes verificáveis

- [Repositório de trabalho](https://github.com/drjulioaquino-byte/DeskcommCRM) e [commit de referência](https://github.com/drjulioaquino-byte/DeskcommCRM/commit/ff5b55c0a007a28637b3c7a348534decad31d3ed).
- [Release oficial candidata](https://github.com/melgarafael/DeskcommCRM/releases/tag/v1.86.0) e [commit da release](https://github.com/melgarafael/DeskcommCRM/commit/70a8c2775567f7daea721c77d34a9881190397bc).
- Doutrina e operação no checkout de referência: `CLAUDE.md`, `AGENTS.md`, `docs/runbooks/deploy.md`, `docs/doctrine/packaging.md`, `docs/doctrine/sistema-vivo.md` e `docs/doctrine/prova-em-par.md`.
- Código de operação: `hostgator-setup-kit/install.sh`, `_common.sh`, `backup.sh`, `restore.sh`, `update.sh`, `preflight-upgrade.sh` e `app/api/v1/health/route.ts`.
- [Backups no Supabase](https://supabase.com/docs/guides/platform/backups): backup do banco não inclui os objetos do Storage; projetos gratuitos devem manter exportações e cópias externas.
- [Checklist de produção do Supabase](https://supabase.com/docs/guides/deployment/going-into-prod): revisar isolamento, acesso, autenticação, entrega de e-mails, capacidade e disponibilidade.

`docs/current-state.md` é um retrato histórico declarado. Contagens, pendências e versões nele não serão usadas como diagnóstico da instalação nova. Trechos antigos do mapa de jornadas que descrevem MFA obrigatório também cedem à política atual e ao comportamento da release escolhida.

## 3. Escopo e arquitetura proposta

### Incluído

- Uma instalação inicial, com uma organização piloto e contas de teste identificadas.
- Domínio, HTTPS, acesso administrativo, banco, Storage, autenticação e e-mails de acesso.
- App, worker de IA, scheduler, Redis e canal WhatsApp previstos pelo kit.
- Configuração do agente pela tela: credencial, conhecimento sintético, funil, limites de gasto, transferência e retorno humano.
- Isolamento entre organizações, permissões, trilha de atividade e recuperação de acesso.
- Backup do banco, arquivos e sessão de WhatsApp, cópia externa e restauração ensaiada.
- Monitoramento, atualização, resposta a incidentes, piloto e decisão de abertura.

### Fora desta entrega

Distribuição de imagens do fork; novas funcionalidades; alterações preventivas no schema; importação em massa; migração de uma instalação existente; cobrança SaaS; campanhas; telefonia SIP; módulos de voz e integrações de anúncios/e-commerce não necessárias ao piloto. Descobrir que algum desses itens é indispensável exige reavaliar o escopo com o Júlio.

### Topologia para a primeira implantação

Proposta para decisão na fase 0: VPS Linux com Docker e Supabase gerenciado externo, com recursos separados para homologação e produção. As aplicações não compartilharão banco, buckets, tokens, sessões WhatsApp ou credenciais de IA. O kit selecionará o proxy compatível com o servidor; um proxy já existente será preservado.

O fluxo esperado é: pessoa no WhatsApp → canal → ingresso validado → fila e worker → ferramentas e conhecimento da organização → cadeia de envio → resposta ou continuidade humana. O navegador acompanha Inbox, funil, execuções e alertas. Scheduler e mecanismos de vigilância devem continuar processando a operação sem uma sessão de terminal aberta.

Para essa topologia, o kit recomenda 4 GB de RAM para o servidor da aplicação. É uma referência do projeto, não uma prova de capacidade para a carga do Júlio. A fase 3 medirá consumo com o volume e as sessões aprovados. Supabase na mesma VPS exige outro dimensionamento e plano de recuperação; sua adoção altera esta proposta antes da instalação.

## 4. Decisões de entrada

Todas devem ter dono, valor e evidência registrados, sem segredos, antes das fases dependentes.

| ID | Decisão | Responsável | Momento limite |
|---|---|---|---|
| D1 | Servidor existente ou novo, sistema, arquitetura, hospedagem e acesso SSH. | Júlio | Antes da fase 1 na VPS. |
| D2 | Domínio de produção, endereço de homologação, gestão do DNS e proxy atual. | Júlio | Antes de publicar endpoints. |
| D3 | Conta e projeto Supabase de cada ambiente, região, plano e responsável pelo pagamento. | Júlio | Antes de criar ou aplicar schema. |
| D4 | Uso próprio ou implantação para terceiros; quem administra a conta e os dados. | Júlio | Antes de solicitar credenciais. |
| D5 | Número controlado para testes e número final, canal escolhido, autorização dos destinatários de teste. | Júlio | Antes do pareamento ou envio. |
| D6 | Provedor/modelo de IA, teto de gasto, funcionalidades de áudio e conhecimento necessárias. | Júlio | Antes dos testes com IA real. |
| D7 | Método de entrega de e-mails, contas administrativas, MFA e recuperação. | Júlio | Antes do teste de convite e recuperação de senha. |
| D8 | Destino externo dos backups, retenção, chaves de criptografia e quem pode restaurar. | Júlio | Antes da fase 4. |
| D9 | Carga esperada, horários de atendimento, responsáveis por alertas e indisponibilidade. | Júlio | Antes do teste de capacidade e do piloto. |
| D10 | Janela de entrada, critérios de interrupção e metas de perda e recuperação de dados. | Júlio | Antes da fase 5. |
| D11 | Telemetria e serviços opcionais permitidos, com escolha explícita do operador. | Júlio | Na instalação. |

Sugestões para revisão, sem constituir SLA: perda máxima de dados de 24 horas e recuperação em até 4 horas; piloto de 72 horas antes da ampliação. Se perder um dia de conversas for inaceitável, aumentar a frequência e a consistência dos backups antes da abertura. O tempo de recuperação só será aceito após ensaio, incluindo DNS, acesso e validação pela tela.

Nenhum custo recorrente será aprovado por este documento. A fase 0 apresenta os valores atuais dos serviços escolhidos ao Júlio antes de contratar ou aumentar plano.

## 5. Etapas de execução

### Fase 0 — Fechar o escopo operacional

1. Revisora analisa este plano; Júlio decide o que incorporar e autoriza as fases seguintes com escopo explícito.
2. Registrar D1–D11, os responsáveis e os limites financeiros.
3. Identificar se já existe instalação em uso. Se existir, preservar serviços e dados e produzir um plano de atualização/migração específico; o roteiro de banco vazio não será aplicado.
4. Definir se homologação terá servidor próprio ou isolamento equivalente comprovado. A referência preferencial é infraestrutura separada.
5. Escolher release, arquitetura e endpoints; listar apenas capacidades necessárias ao primeiro atendimento.

**Entrega:** ficha de implantação, mapa de dependências, versão candidata e lista de acessos disponíveis.

**Aceite:** nenhuma escolha que afete custo, dados ou envio permanece presumida.

**Interrupção:** ausência de acesso ao ambiente não será tratada como autorização para usar produção como laboratório.

### Fase 1 — Conferir a release e preparar a infraestrutura

1. Criar checkout separado da release oficial, resolver a tag até o commit e comparar com o SHA aprovado. Ler o `CLAUDE.md`, as instruções do kit e as notas de atualização dessa versão.
2. Consultar os resultados de CI e publicação **do SHA e da tag escolhidos**. Exigir evidências de `verify`, `invariants`, `build-and-size`, `e2e` e `imagens-ok`, ou investigar a estrutura equivalente da release. Job cancelado, ignorado ou apenas citado não comprova execução.
3. Conferir imagens próprias previstas pela matriz da release. O checkout atual lista app, worker, scheduler e voice-agent; este último não será ativado no piloto. Verificar disponibilidade, plataforma e vínculo das imagens com a revisão de origem, e registrar os digests.
4. Fazer a sonda pelo mesmo namespace e referência que a VPS consumirá. Registrar que WAHA e demais dependências vêm dos seus fornecedores, com referências aprovadas. Não republicá-las.
5. Conferir recursos, arquitetura, espaço, relógio, conectividade e proxy da VPS. Liberar acesso administrativo pela porta SSH efetiva e preservar uma sessão de recuperação durante mudanças de firewall.
6. Preparar DNS, HTTPS e os projetos separados do banco. Verificar que portas administrativas, banco e painel do WAHA não ficam expostos além do necessário.
7. Verificar o modo de ligação ao banco compatível com a rede real e com o kit da release; testar TLS e privilégios. Não presumir que um host funciona apenas porque o formato parece correto.

**Entrega:** manifesto de implantação com origem, tag, commit, arquitetura, imagens/digests, composes, domínios e projetos por ambiente.

**Aceite:** imagens recuperáveis, recursos suficientes para o ensaio e conexões reais validadas.

**Interrupção:** artefato ausente, revisão diferente ou arquitetura incompatível; não substituir por `latest` nem construir silenciosamente na VPS.

### Fase 2 — Instalar a homologação pela jornada oficial

1. Executar o instalador da release em ambiente isolado e acompanhar sua conferência antes dos efeitos. Usar os pontos de configuração previstos por ele.
2. Aplicar o baseline da mesma release pelo kit. A cadeia histórica de migrations não será usada para construir um banco fresco.
3. Criar o dono, configurar domínio, fuso `America/Sao_Paulo`, marca pela tela e opções de telemetria. Definir os módulos opcionais desativados conforme o escopo.
4. Confirmar app, worker e scheduler em funcionamento e persistência após reinicialização controlada. Conferir a combinação de arquivos compose efetivamente escolhida pelo instalador.
5. Configurar Auth e e-mail: remetente, URLs de confirmação/recuperação, convites e comportamento quando algum serviço opcional estiver ausente. Um convite copiável é uma capacidade distinta da entrega de e-mail.
6. Testar onboarding sem credenciais opcionais, depois cadastrar a credencial de IA pela interface. Verificar MFA conforme a política selecionada e o fluxo de recuperação.
7. Parear apenas o número de teste aprovado. Conferir sessão efetivamente operacional, recebimento e envio; QR exibido não basta.
8. Configurar agente, ferramentas, conhecimento sintético, funil, responsáveis, transferência humana e próximo passo. Aplicar limite de gasto antes das conversas de teste.

**Entrega:** instalação reproduzível e inventário sanitizado da configuração.

**Aceite:** HTTPS válido; `/` responde como a aplicação; `/app` sem sessão conduz ao login; login/onboarding funcionam; serviços retomam após reinício.

**Interrupção:** configuração depende de alteração manual no código do produto ou a interface não permite completar a jornada essencial; abrir achado para decisão.

### Fase 3 — Provar atendimento, isolamento e recuperação de falhas

1. Executar os casos da seção 7 com contas, organizações e números controlados.
2. Relacionar cada recebimento ao evento, execução, ferramenta, mensagem e atividade observável. Usar IDs de correlação, com dados pessoais removidos dos registros compartilhados.
3. Para cada aceite que passa pela IA, medir o par: entrada crua pela interface e chamada direta da ferramenta adequada, sob o mesmo contexto de teste. A medição direta usa o contrato de entrada da ferramenta; resultados com escrita são executados em fixtures independentes para não duplicar efeitos.
4. Testar transferência IA→humano e retomada humano→IA, incluindo contexto, autoridade, atribuição e próximo passo.
5. Interromper controladamente worker, scheduler e dependências, uma de cada vez. Medir detecção, visibilidade, retomada da fila e ausência de reenvio indevido. Nunca fazer sabotagem na instalação com clientes.
6. Simular token inválido, organização diferente, assinatura inválida e repetição de evento. Usar testes existentes primeiro e estabelecer um controle negativo que efetivamente reprove quando a guarda é removida em uma cópia descartável.
7. Medir CPU, RAM, disco, fila, latência de atendimento e custo para a carga aprovada em D9. O lote de testes usará destinatários autorizados e limites do canal; não haverá disparo de carga contra pessoas.

**Entrega:** matriz PASS/FAIL/BLOQUEADO, rastros sanitizados, medidas de consumo e lista de defeitos.

**Aceite:** todos os casos obrigatórios passam e cada falha tem encaminhamento visível; nenhum risco crítico de isolamento, segredo, envio ou perda de dados permanece aberto.

**Interrupção:** divergência entre agente e ferramenta, vazamento entre organizações, perda/duplicação injustificada de mensagens ou fila abandonada. A correção volta à revisora e ao Júlio.

### Fase 4 — Comprovar backup e recuperação

1. Inventariar o que precisa sobreviver: banco com dados e identidades necessárias, objetos do Storage, configurações protegidas, referências das imagens, sessões e mídias locais do canal que a operação precisa preservar.
2. Executar `backup.sh` da release e conferir integridade, conteúdo, permissões e avisos. O script atual pode terminar com banco salvo e snapshot do WhatsApp ausente; seu código de saída sozinho não prova backup completo.
3. Para Supabase externo, providenciar cópia separada dos **objetos** do Storage, com inventário e integridade verificáveis. O dump leva metadados, não esses arquivos. Conferir também as montagens locais de mídia do canal.
4. Guardar segredos e configuração em cofre ou cópia cifrada, com recuperação de chaves separada dos arquivos. Não incluir segredos no pacote de evidências.
5. Configurar cópia externa ao servidor, retenção e detecção de falha. Reutilizar a ferramenta de backup da infraestrutura, se existir. Se for necessário desenvolver automação, abrir o escopo específico para revisão antes de escrever código.
6. Restaurar em destino descartável **com o banco vazio antes do restore**, sem executar antes o instalador que cria tabelas. Ler as limitações do `restore.sh` dessa release e manter o ambiente original preservado.
7. Conferir o estado restaurado: tabelas e registros esperados, autenticação, papéis, grants, isolamento, anexos abertos pela tela, configuração e associação dos arquivos. Analisar os erros do restore; saída zero não substitui essas verificações.
8. Garantir que a cópia restaurada não possa disparar mensagens, webhooks ou tarefas concorrentes com a original. Restaurar snapshot de WhatsApp apenas em alvo isolado e definido; alternativamente ensaiar novo pareamento com número de teste.
9. Cronometrar recuperação completa e medir a idade do ponto restaurado contra D10. Documentar a ordem entre banco, arquivos, configuração, app e liberação de workers.

**Entrega:** relatório de restauração e runbook com procedimento realmente executado.

**Aceite:** recuperação compatível com as metas aprovadas; conteúdo e objetos comprovados; cópia externa acessível pelo responsável.

**Interrupção:** backup incompleto, chave de recuperação indisponível, restore parcialmente funcional ou cópia de homologação capaz de falar em nome da produção.

### Fase 5 — Preparar a instalação final e decidir a abertura

1. Instalar produção com o mesmo conjunto aprovado de artefatos, em projeto de dados e credenciais próprios. Repetir os testes de borda e configuração específicos desse ambiente.
2. Migrar somente configurações revisadas necessárias ao início, pela superfície suportada. Não levar usuários, conversas, número ou dados sintéticos da homologação por dump completo.
3. Configurar monitoramento e backup antes de admitir clientes. Confirmar o destinatário e o mecanismo efetivo de alerta por teste autorizado.
4. Preparar o plano de interrupção e a janela de mudança. Se o número final já estiver em outro atendimento, documentar a transição e sua alternativa manual antes de pareá-lo.
5. Executar teste de fumaça com o número final e destinatário autorizado: receber, responder, transferir, visualizar histórico e próximo passo.
6. Entregar à revisora as evidências e o checklist de abertura; receber recomendações. Júlio decide sobre os achados e autoriza a entrada do piloto real.

**Entrega:** checkpoint de abertura descrito na seção 11.

**Aceite:** identidade dos artefatos, atendimento e recuperação aprovados; responsáveis disponíveis.

**Interrupção:** qualquer critério obrigatório pendente. DNS público e contêiner saudável não significam atendimento liberado.

### Fase 6 — Acompanhar o piloto e transferir a operação

1. Operar pelo período aprovado em D10; a proposta inicial é 72 horas com equipe e volume limitados.
2. Acompanhar diariamente mensagens recebidas/enviadas, fila mais antiga, transferências sem responsável, demandas sem próximo passo, erros, gasto de IA, uso de disco e idade do último backup externo válido.
3. Fazer uma revisão das primeiras conversas com dados protegidos. Erro recorrente vira ajuste em rascunho, caso de teste e decisão humana antes de publicar novo comportamento.
4. Treinar o responsável para assumir atendimento, interromper IA, localizar falhas, recuperar acesso, executar backup e chamar o procedimento de recuperação.
5. Entregar inventário, contatos de suporte, runbooks e lista de pendências com responsável. Júlio decide a ampliação da operação.

**Entrega:** relatório do piloto, aceite operacional e backlog priorizado.

**Aceite:** operação sem falha crítica em aberto, backups válidos e equipe capaz de executar os procedimentos essenciais sem depender desta conversa.

## 6. Arquivos e sistemas afetados

| Local | Uso previsto |
|---|---|
| `docs/superpowers/plans/2026-10-20-producao-oficial.md` | Plano atual para revisão. |
| `docs/runbooks/` | Runbook específico da instalação, recuperação, atualização e escalada, se o Júlio decidir versioná-lo. Sem identificadores sensíveis. |
| `docs/testing/user-journey-map.md` | Acrescentar apenas casos, resultados e referências de evidência realmente medidos. |
| `evidence/producao-oficial/<execucao>/` | Resultados sintéticos, imagens sanitizadas e manifesto de validação. Revisar antes de versionar porque o fork é público. |
| Checkout oficial da instalação | Kit, composes e baseline da release; configuração operacional protegida fora do Git. |
| Infraestrutura | DNS, proxy, projetos Supabase, SMTP, segredos, canal, armazenamento de backup e monitoramento autorizados. |
| `app/`, `lib/`, `workers/`, `supabase/` e workflows | Leitura e validação. Alteração somente se um defeito concreto justificar nova proposta aprovada. |

Não estão planejadas migrations nem mudanças de API. Se um achado exigir alteração no núcleo, propor PR próprio com arquivos exatos, teste que reproduz a falha, destino núcleo/extensão/infraestrutura e validações correspondentes. Toda migration nova deverá seguir a tripla vigente; nenhum SQL corretivo avulso será aplicado na produção.

## 7. Matriz de aceite funcional e adversarial

Todos os casos abaixo são obrigatórios para o escopo WhatsApp com IA. Uma capacidade opcional retirada do piloto exige decisão explícita e atualização da matriz antes da execução.

| ID | Caso | Resultado necessário |
|---|---|---|
| T01 | HTTPS, rotas pública e privada, login errado e acesso sem sessão. | Domínio correto; fluxo de autenticação sem loop, sem dados expostos. |
| T02 | Primeiro acesso, onboarding interrompido e retomado, MFA conforme política. | Operador conclui o fluxo e sabe recuperar o acesso. |
| T03 | Convite, confirmação e recuperação de senha com destinatário de teste. | Link chega ao domínio certo; fallback informado quando não houver entrega. |
| T04 | Criar contato e negócio; mover etapa e consultar histórico. | Estado persiste e aparece no funil/timeline, com responsável e autoria. |
| T05 | Mensagem real de entrada e resposta humana no WhatsApp. | Mensagem íntegra e única nos dois lados, com associação correta à conversa. |
| T06 | IA consulta conhecimento e executa ferramenta permitida. | Par interface/ferramenta concorda; resultado e execução auditáveis, sem invenção de dado. |
| T07 | IA transfere ao humano; humano atende e devolve à IA. | Contexto e autoridade preservados; sem resposta concorrente da IA fora de hora. |
| T08 | Silêncio, próximo passo, follow-up e cancelamento por resposta. | Próximo passo visível; retomada respeita horário e intervenção humana. |
| T09 | Opt-out e mensagem ambígua sobre outro assunto. | Pedido inequívoco interrompe envio; frase não relacionada não bloqueia indevidamente. |
| T10 | Duas organizações, papéis humanos e token de uma contra a outra. | Leituras e efeitos indevidos recusados em REST, MCP e mídia; trilha sem vazamento. |
| T11 | Token/assinatura inválidos e reentrega do mesmo evento. | Rejeição coerente e ausência de efeito duplicado; limites e respostas de erro verificáveis. |
| T12 | Worker/scheduler reiniciados, dependência indisponível e retomada. | Falha aparece; trabalho retoma sem perder ou repetir envio já concluído. |
| T13 | Limite de IA ou credencial indisponível. | Operador recebe motivo acionável e há continuidade, sem repetição infinita de tentativas. |
| T14 | Anexo no atendimento e arquivo na base de conhecimento. | Acesso autorizado funciona, acesso cruzado falha e objetos sobrevivem à recuperação. |
| T15 | Backup e restore em destino vazio isolado. | Banco, acesso e arquivos conferem; nenhuma tarefa fala pelo ambiente original. |
| T16 | Reinicialização da VPS e monitor externo com falha simulada. | Serviços e agenda voltam; alerta chega ao responsável pelo canal aprovado. |
| T17 | Carga aprovada e observação do piloto. | Recursos, latência, fila e custo dentro dos limites definidos em D6/D9/D10. |
| T18 | Atualização e retorno ao conjunto anterior em homologação. | Caminho executável com backup e compatibilidade verificada, sem depender de edição improvisada. |

### Comandos de verificação

O ambiente de QA terá Node/pnpm nas versões exigidas **pela release**, dependências reais e banco descartável. O manifesto atual declara Node `>=22` e `pnpm@9.15.9`; reconferir no checkout da release. Os comandos abaixo são roteiro de execução, não resultados já obtidos:

```bash
pnpm install --frozen-lockfile
pnpm gov:verify
pnpm test:db
pnpm test:db:update
pnpm test:shell
pnpm e2e:env
pnpm e2e:build
pnpm test:e2e
```

Antes dos três últimos, subir a stack de QA conforme o kit e confirmar que `.env.e2e` aponta somente para o banco local de teste. A suite E2E pode depender de serviços e seeds adicionais; preparar os mesmos recursos exigidos pelos workflows da release. `gov:verify` não substitui as suites de banco, shell e interface. Cada log preservará comando, versões, SHA, código de saída, resumo e falhas completas.

Os cenários existentes a reutilizar incluem `tests/e2e/vps-fresh-onboarding.spec.ts`, `auth.spec.ts`, `inbox-scope.spec.ts`, `inbox-quem-manda.spec.ts` e `followup-journey.spec.ts`, além de `tests/invariants/mcp-nao-alcanca-outro-tenant.test.ts`, `gov-6-ai-handoff.test.ts` e `envio-nao-alcanca-conversa-de-outro-tenant.test.ts`. Confirmar presença e finalidade no SHA selecionado; nome de arquivo não prova cobertura.

Consultar CI evita atribuir ao fork as provas do upstream, mas não substitui o teste da configuração real. Provas com WhatsApp, e-mail e IA reais serão feitas com limites e destinatários aprovados. Simulação de provedor ou QR exibido será identificada como tal.

## 8. Operação, monitoramento e recuperação

O monitor externo observará domínio/TLS e respostas da aplicação. O endpoint `/api/v1/health` será interpretado pelo corpo e status: no código de referência, HTTP 200 pode representar `degraded`; os checks abrangem Supabase, Redis e WAHA, não provam atendimento completo nem avanço de todos os workers. Detalhes verbosos exigem segredo interno, que permanecerá fora dos URLs e logs.

| Sinal | Ação operacional |
|---|---|
| Domínio indisponível ou versão diferente da aprovada. | Verificar proxy e artefatos; suspender abertura ou ampliar atendimento manual conforme o incidente. |
| Fila parada, worker/scheduler ausente ou demanda sem próximo passo. | Designar responsável humano, conferir causa e só retomar automação após medir a recuperação. |
| Canal desconectado, envio duplicado ou mensagem em destino indevido. | Interromper envios automatizados; preservar a trilha e recuperar o canal pelo procedimento aprovado. |
| IA sem saldo, resposta incorreta ou falha de ferramenta. | Assumir atendimento, limitar o comportamento e transformar o achado em caso de validação. |
| Backup externo atrasado ou falho. | Avisar responsável, proteger o último ponto válido e corrigir antes da próxima mudança. |
| Disco/RAM/cota próximos dos limites aprovados. | Reduzir carga ou ampliar capacidade por decisão do Júlio, preservando histórico e retenções aprovadas. |

Intervalos, limiares e destinatários serão configurados a partir de D9/D10 e comprovados na fase 3. Não haverá agendamento de alertas nesta etapa de planejamento.

### Atualização e reversão

1. Toda atualização tem release numerada, SHA, imagens, notas, backup validado e ensaio em homologação.
2. Usar o `update.sh` da release/caminho aprovado, mantendo os overrides de proxy necessários e conferindo a arquitetura antes dos efeitos persistentes. Não prometer pré-voo ARM novo em um kit antigo sem verificar sua presença.
3. Registrar a versão anterior e o mecanismo de retorno **antes** de mudar produção. A retomada das imagens anteriores depende da compatibilidade com o schema existente.
4. Reverter imagens não reverte banco. Diante de mudança incompatível, escolher correção progressiva ou restauração em destino vazio, com a perda de dados e janela aprovadas. Preservar o estado pós-incidente para conciliação.
5. Na recuperação, impedir workers e canais duplicados; reconciliar mensagens posteriores ao backup antes de liberar envio.
6. O primeiro ensaio de atualização usará um par de releases numeradas cuja compatibilidade seja conferida. A candidata final é reinstalada/confirmada antes do piloto.

## 9. Checklist do Sistema Vivo

| Pergunta | Artefato ou prova da implantação |
|---|---|
| Quem alimenta e quem recebe? | Canal → ingresso → `event_log`/fila → worker → ferramentas → cadeia de envio; T05/T06/T12 medem entrada, processamento e resultado. |
| Qual a continuidade IA e humano? | `lib/agent-engine/agent/human-handoff.ts`, atribuição no Inbox e retomada pelo worker; T07 comprova os dois sentidos. |
| Que registro e onde é visto? | `api_audit_log`, `crm_lead_activities`, execuções e timeline; T04/T06 relacionam efeito e leitura pela interface. |
| Qual o próximo passo? | `lib/followup/`, cron do motor e `/app/radar`; T08/T12 medem agendamento, cancelamento e demanda sem andamento. |
| Onde se configura? | `/app/connections`, `/app/ai/agents`, `/app/ai/credentials`, `/app/ai/knowledge/sources`, `/app/ai/followups` e configurações da organização; conferir rótulos/capacidades da release. |
| Por qual porta se chega? | Catálogo em `lib/navigation/catalogo.ts`; `registry.ts` deriva/reexporta. Não haverá tela nova nesta entrega. |
| Qual retorno muda a operação? | Revisão do piloto → achado → teste reproduzível → ajuste em rascunho → decisão humana → nova medição. Sem publicação automática de prompt ou aprendizado presumido. |
| O mapa precisa mudar? | Topologia específica documentada no runbook. Os JSONs em `docs/architecture/` só serão alterados se houver peça nova do produto, com entrada e saída reais. |
| Qual o tempo apropriado? | Operador observa estado atualizado; ações respeitam janela do canal, orçamento e possibilidade de interrupção. T07/T08 testam a autoridade humana. |

## 10. Riscos e critérios de bloqueio

| Risco | Medida prevista | Bloqueia entrada quando |
|---|---|---|
| Misturar código, kit, baseline e imagens de versões diferentes. | Manifesto único e comparação SHA/tag/digests. | Qualquer componente não corresponde ao conjunto aprovado. |
| Artefato indisponível ou incompatível com a arquitetura. | Sonda no registro e pull real das referências. | Não há imagem utilizável; sem fallback para desenvolvimento. |
| Isolamento ou privilégio indevido. | Duas organizações, papéis, tokens e RLS com controles negativos. | Qualquer dado/efeito cruza o limite autorizado. |
| Segredo em Git, captura ou log. | Variáveis protegidas, sanitização e varredura antes de compartilhar. | Há exposição não contida ou credencial ainda válida vazada. |
| Proxy saudável por dentro e domínio quebrado. | Teste externo da aplicação e da jornada de autenticação. | Operador não consegue alcançar o fluxo real. |
| Scheduler/worker sem avanço. | Interrupção e retomada medidas, monitoramento de fila. | Demanda fica sem processamento ou próximo passo visível. |
| Mensagens duplicadas ou autoridade humana ignorada. | Replay, reinício, handoff e retomada com destinatários controlados. | Há envio indevido, duplicado sem explicação ou concorrência de atendimento. |
| IA inventa informação ou consome gasto ilimitado. | Base sintética, prova em par, orçamento e teste de falha. | Há ação crítica incorreta ou ausência de interrupção por limite. |
| Banco salvo e arquivos perdidos. | Cópia de objetos e restauração por conteúdo. | Anexos/identidades necessários não são recuperáveis. |
| Cópia restaurada envia em nome do ambiente original. | Isolamento de egress, tarefas e sessão de canal. | Existem consumidores concorrentes ou sessão ativa duplicada. |
| Falta de responsável por incidente ou limite financeiro. | D6/D8/D9/D10 e treino de operação. | Responsável, alerta ou teto continuam indefinidos. |
| Serviço externo ou quota incompatível com o uso. | Rever limites atuais da conta escolhida e medir consumo. | Dependência pausa, bloqueia entrega ou excede o orçamento aprovado. |

Os mesmos riscos serão lidos pelas lentes da revisora: engenharia, dados, fullstack, conectores, segurança, autorização, privacidade, impacto humano, evidência, contra-hipótese, concorrência e recuperação. A revisão deve priorizar modos de falha concretos e suas provas.

## 11. Checkpoints de revisão e decisão humana

| Marco | Material para a revisora | Decisão do Júlio |
|---|---|---|
| C0 — Plano | Este arquivo, versão candidata e D1–D11. | Aprovar escopo e preparação; decidir recomendações da revisora. |
| C1 — Homologação | Manifesto, CI do SHA, T01–T18, falhas e restauração. | Autorizar preparação final ou exigir correções. |
| C2 — Abertura | Artefatos realmente instalados, testes do ambiente final, backup, responsáveis e plano de interrupção. | Liberar piloto real e seus destinatários/limites. |
| C3 — Ampliação | Resultado do piloto, custos, incidentes, treino e pendências. | Ampliar, manter restrito ou interromper. |

O checkpoint C2 deve conter: origem, tag, SHA completo, digests, arquitetura, resultado de cada gate, limites dos testes, pendências e riscos aceitos pelo Júlio, revisão válida para esse estado e data da decisão. Se houver PR, acrescentar head e base completos, CI naquele head e comentários/revisões sem resposta. Codex não faz merge nem push na `main`.

Registros distinguirão o que foi decidido pelo Human, recomendado pela Claude e medido pela implementadora. Correções de decisões já registradas serão acrescentadas com referência ao registro anterior. Para conteúdo publicado no GitHub, citar o link do comentário correspondente; mensagens deste chat serão identificadas como tal.

### Ordem e esforço de referência

F0 → F1 → F2 → F3 → F4 → C1 → F5 → C2 → F6 → C3. Preparação documental, inventário e escolha de backup podem avançar em conjunto; testes com efeitos e mudanças de ambiente obedecem suas dependências.

Estimativa de planejamento, sujeita a ambiente e acesso: um dia para fechar decisões e conferir artefatos; um a dois dias para instalar e configurar homologação; dois a três dias para jornadas e recuperação; um dia para preparação final e passagem inicial, mais o piloto proposto de 72 horas. Correções de produto, contratação, DNS, espera de revisão e indisponibilidade de terceiros não estão embutidos. Não é compromisso de prazo.

## 12. Pedido de revisão à Claude

> [Codex — implementadora] Solicito revisão do plano de implantação oficial do DeskcommCRM. A decisão do Human é começar pela versão oficial. Base documental: `ff5b55c0a007a28637b3c7a348534decad31d3ed`; candidata de implantação: `v1.86.0`, commit `70a8c2775567f7daea721c77d34a9881190397bc`, ainda sujeita a pré-voo. Revise coerência entre release e artefatos, isolamento dos ambientes, autorização de efeitos, jornadas pela tela, prova em par, recuperação de banco e arquivos, risco de envio duplicado, atualização e critérios de abertura. Classifique os achados por prioridade, com ID, evidência, impacto e recomendação. Indique também quais condições impedem executar a primeira etapa. Nenhuma implantação, teste funcional ou restauração foi executada para este plano. Suas recomendações serão submetidas ao Human antes de alterar o escopo ou implementar correções.

## 13. Estado desta entrega

Foram feitas leituras do repositório e consultas somente de leitura à origem, releases, tag e checks. A branch deste plano foi criada para manter o trabalho separado. A elaboração não executou build, suites, instalação, alteração de DNS, criação de projeto, pareamento, envio ou restauração. CI do fork não será apresentado como prova da release oficial.

As etapas permanecem planejadas. O próximo ato é a revisão deste documento e a decisão do Júlio sobre C0.

## 14. Autorização de publicação para revisão

Registro acrescentado em 20/10/2026, às 20h01 BRT, após o horário de elaboração inicial. O Human solicitou neste chat: **“Coloque no GitHub para a revisor Ver não é assim na skill?”**.

Essa solicitação autoriza publicar este plano em branch própria do fork `drjulioaquino-byte/DeskcommCRM` e abrir o PR de documentação com o pedido de revisão à Claude. Atualiza o limite de publicação registrado na seção 1, preservando o registro da autorização inicial. A implantação e o atendimento real continuam sujeitos aos checkpoints do plano.

O PR terá o SHA completo do head final, os comandos de verificação efetivamente executados e o estado dos checks desse SHA. Esse checkpoint fica no PR para evitar citar o SHA do próprio commit dentro dele mesmo. O link do PR será entregue ao Human; a publicação do pedido não constitui revisão já realizada nem aprovação da revisora.
