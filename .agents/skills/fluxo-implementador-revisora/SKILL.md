# Fluxo implementadora ↔ revisora Claude — adaptação local do DeskcommCRM

**Adaptação local do fork `drjulioaquino-byte/DeskcommCRM`.** Complementa a skill global `fluxo-implementadora` 2.0.0, com o ajuste de **execução de ordens equivalente à 2.0.1**, conforme decisão humana; não altera nem publica a skill global. **Ordem de origem:** O-20261120-1208-AF, 20/11/2026 12:08 (Brasília). **Assinatura dos registros:** `[Codex · Integrações]` nesta sessão, ou a assinatura correspondente da sessão expressamente designada. Branch exclusiva por sessão, com prefixo `codex/integracoes/` para Integrações.

## 1. Origem, precedência e sincronização do fork

O Human (Júlio) decidiu em **20/11/2026 às 11:38, Brasília**: **“A delegação de merge… sim”**; e em **20/11/2026 às 12:01, Brasília**: **“aplicar o ajuste 2.0.1 também no DeskcommCRM? sim”** e **“ordem permanente de merge para PRs só de documentação? sim”**. Esta adaptação registra essas decisões para o fork. A fonte imediata da autorização de escrita deste arquivo é **O-20261120-1208-AF**.

**Precedência:** `AGENTS.md` do repositório → esta adaptação local → skill global `fluxo-implementadora` 2.0.0; respeitar também as restrições explícitas do `CLAUDE.md`, cuja autoridade é declarada pelo próprio `AGENTS.md`. Divergência ou exigência de autoridade adicional implica parada e comunicação ao Human. Esta adaptação fica **fora de `AGENTS.md`** para que a sincronização semanal do repositório original não sobrescreva as regras próprias do fork. Não alterar `AGENTS.md` ou `CLAUDE.md` para registrar estas decisões.

A sessão Integrações responde pelas integrações/DeskcommCRM e pelos arquivos que a ordem do Human lhe atribuir expressamente. Arquivos de outra sessão ou não atribuídos exigem designação humana. Nenhuma sessão assume área por presunção.

## 2. Executar a ordem até o fim (ajuste equivalente à 2.0.1)

1. Conferir origem humana da ordem (não confundir comentário assinado da Revisora Claude com ordem do Human), ID `O-AAAAMMDD-HHMM-...`, repositório, sessão, escopo e histórico de execução. **Nunca executar duas vezes o mesmo ID**; retomar o PR já existente quando aplicável.
2. Depois dessa conferência, **executar todos os itens autorizados da ordem, na sequência indicada, até concluir**, sem pedir reconfirmação entre itens. Detalhe rotineiro não essencial admite suposição razoável documentada.
3. Uma ação de produção ou irreversível **expressamente escrita na ordem** já foi autorizada por essa ordem, sujeita às suas condições e às demais cercas de governança; não exigir segunda confirmação apenas por ser irreversível.
4. **Parar** se a própria ordem escrever condição de parada; se surgir fato não previsto numa ação de produção/irreversível; ou se existir qualquer outra condição de parada no `AGENTS.md`, `CLAUDE.md` ou neste arquivo: área alheia, dados reais, segredos, ordem sem origem/autoria confiável, commits de agentes não designados, ordem vencida, alteração de head não autorizada, conflito não deliberado, revisão inaplicável ou requisito de aprovação do sistema. Não presumir liberação de Guardian/AgentOS quando exigida e não comprovada.
5. **Ao concluir ou parar, registrar o resultado no GitHub** com ID, sessão, head/base completos, verificações, resultado de cada item, limitações e pendências. Usar o PR da ordem; se não houver PR, abrir PR de registro em rascunho contendo documento em `docs/`, sem código ou merge; se o PR pertencer a outra sessão, deixar só comentário assinado, **sem commit** nesse PR. Resultado apenas no chat **não conta** como registro.
6. Pedir revisão independente da Claude para o head exato. O parecer da própria Codex não é revisão independente. Recomendações da revisora exigem decisão humana antes de implementação fora de ciclo previamente autorizado.

## 3. Merge por ordem humana específica

A **decisão de merge é sempre do Júlio**. A Codex só executa o merge quando a ordem do Human **cita o número do PR e o SHA completo do head**, sob as condições expressamente autorizadas.

Antes de executar, conferir **todas** as condições:
- O PR continua aberto e o head é **exatamente o SHA autorizado**. Havendo diferença, **parar**, sem reinterpretar a ordem.
- Há comentário independente assinado **`[Revisora Claude] Revisão do commit <SHA>`** ou **`[Revisora Claude] Confirmação do head <SHA>`**, com **`Veredito: aprovado`**, aplicável exatamente ao SHA a integrar. Aceitar assinatura equivalente `[Claude — revisora]` conforme a skill global, com as mesmas exigências de conteúdo e SHA.
- A branch **inclui a `main` atual** (ancestralidade comprovada, não apenas ausência aparente de conflitos).
- **Todos os checks executados estão verdes** no head ou na prévia sintética identificada; `pending`, `skipped`, `cancelled` e não executado não devem ser declarados verdes. Um vermelho só é permitido quando **a ordem nomeia explicitamente aquele check como exceção**. Registrar os logs das exceções; outros vermelhos bloqueiam.
- Não há alerta de segredos, dados reais, commits alheios ou alteração fora da área; conflitos de PRs paralelos devem ser informados e decididos pelo Human quando alcançam mesmos arquivos/contratos.

Somente depois: **merge commit** (não squash/rebase), usando proteção de head/compare-and-swap com **SHA esperado**. Não fazer push direto à `main`. Conferir o novo SHA da `main` após o merge e registrar no PR.

## 4. Ordem permanente para PRs exclusivamente documentais

**Delegação permanente concedida pelo Human às 12:01 de 20/11/2026 (Brasília), até revogação expressa.** A sessão designada pode fazer **merge commit**, com head travado e sem nova ordem específica, **somente se todas** as condições abaixo forem comprovadas:

1. **Todo o diff está dentro de `docs/`**. Excluem-se `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.github/`, `.changes/`, código, testes, scripts, kit e qualquer configuração. **O próprio PR que cria esta adaptação local está fora da delegação**, pois altera `.agents/`.
2. Há **parecer aprovado da Revisora Claude para exatamente o head** a integrar (assinatura, formato e SHA como na seção 3).
3. A branch **inclui a `main` atual**.
4. O PR **não está em rascunho**.
5. **Todos os checks executados estão verdes**, com **única exceção** de `invariants` e `invariants-majors (*)`, **somente enquanto o fork não possuir release publicada** e **somente se o log comprovar a causa conhecida: 404 em `releases/latest`**. Falha de `release/cortar-tag` por falta de credenciais, qualquer outro vermelho ou qualquer causa diferente **bloqueia** esta delegação. Não transformar o erro do App nem qualquer ausência de CI em aprovação.

Se uma só condição falhar, **não executar o merge**; registrar o bloqueio no PR e avisar o Human. Não presumir que aprovação antiga valha a novo head.

## 5. Branch desatualizada

Se a `main` avançou e não é ancestral da branch: incorporar **`main` por merge** (não rebase, não force push), em branch exclusiva e dentro da área. Executar/aguardar o CI do **novo SHA**, registrar head/base, pedir à Revisora Claude **confirmação do novo head** e **parar nesse ponto**. Retomar somente depois da confirmação da Claude para **exatamente o head atualizado**, respeitando as demais condições de merge. Não usar o parecer anterior no SHA novo.

## 6. Depois de qualquer merge

Registrar no **PR mesclado** o SHA da nova `main` e o resultado observado do workflow **`Publicar imagem Docker (GHCR)`** (run, status, conclusão e logs pertinentes; se ainda pendente, registrar como pendente e completar o checkpoint quando houver execução autorizada). No fork, **merge na `main` publica as imagens `latest`/`main`**, quando o workflow correspondente concluir com sucesso. Isso **não move `stable`**, não cria release e **não atualiza produção**. Não confundir job verde com entrega efetiva de uma release estável.

## 7. Proibições e limites que permanecem

- **Nunca** push direto para `main`.
- **Não** criar tag, GitHub Release ou disparar `release.yml` sem ordem humana distinta e explícita; não inferir liberação do merge.
- **Não** alterar workflows, ruleset/branch protection ou credenciais/secrets sem ordem humana específica. Esta adaptação não libera essas operações.
- **Não** efetuar migração, deploy, alteração de flags, OAuth, consentimento, revogação, webhook de produção ou uso de dados reais sem ordem própria e as aprovações aplicáveis.
- **Não** fazer merge dos PRs associados a O-20261120-1208-AF nesta ordem: o Human o proibiu expressamente.

## 8. Conferência da adaptação

Aceite: arquivo único e novo neste caminho, sem tocar `AGENTS.md`/`CLAUDE.md`; PR próprio em rascunho; diff restrito a `.agents/skills/fluxo-implementador-revisora/SKILL.md`; base/head e CI registrados; revisão A1 solicitada para o SHA completo. A adoção só ocorrerá depois de revisão, autorização e merge em ordem futura apropriada.
