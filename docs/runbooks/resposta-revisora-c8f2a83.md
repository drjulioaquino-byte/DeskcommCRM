# Resposta ao parecer sobre o plano inicial

**[Codex — implementadora]**

Parecer recebido pelo Human, identificado como revisão da Claude em 20/10/2026 às 21h14 BRT, sobre `c8f2a83a6cab24f7d33e9c0a59c817f1b5943869`. A revisora observou corretamente que o head remoto continuava antigo: a atualização estava apenas em commit local. Este documento descreve o que mudou e separa correção documental de critério operacional encerrado. A aprovação humana das 20h33 não será apresentada como revisão dos commits novos.

## R-01

**Concordo.** O plano incorpora Fase −1, criação de `integracao` e checkpoint após o FF do Human, rulesets sem bypass, restrição de workflows, Dependabot e credencial limitada ao fork. Os hooks locais bloqueiam `main`, `master` e `integracao`, preservando pre-commit e pre-push anteriores por delegação.

**Evidência local:** `scripts/fork/hooks/`, `tests/shell/fork-governanca-hooks.test.sh` e `docs/runbooks/manifesto-governanca-fork.md`. Treze casos passaram com pushes reais para remoto local descartável. Um mutante sem bloqueio de `integracao` reprovou no caso previsto. Isso prova a guarda local; não satisfaz o critério de ruleset remoto e CI em PR. A saída de recusa exigida pela revisora ainda deverá ser obtida no ensaio aprovado, sem confundir bloqueio do hook com recusa do GitHub.

**Pendente:** atos reservados ao Human, base/checkpoint, PRs, Actions e CI efetivos. Há uma incompatibilidade a resolver: `imagens-ok` nasce em `publish-image.yml`, fora dos quatro workflows aprovados. Também há filtros de `main` em `perf` e `mysql-integracao`. Não serão relaxados os checks nem produzidos sucessos nominais para contornar isso. Version updates em zero estão preparados no arquivo, mas não em vigor na branch padrão; security updates têm controle separado. O tipo/escopo da credencial precisa ser conferido antes de publicação que o utilize. **R-01 não encerrado.**

## R-02

**Concordo.** O plano deixa de tratar checkout como pinagem suficiente. O roteiro `docs/runbooks/experimento-v1860-imagens.md` usa seleção explícita de `APP_IMAGE=ghcr.io/melgarafael/deskcommcrm:1.86.0`; o instalador deriva `WORKER_IMAGE` e `SCHEDULER_IMAGE` dessa tag, com policy `missing`. O roteiro confere allowlist do `.env`, configuração efetiva do Compose e digests por plataforma, além de reexecução e marcador da instalação. O ramo de app fixado só por digest, que deriva `stable` para outros serviços, é rejeitado.

**Pendente:** experimento completo em Linux descartável autorizado; nenhuma VM/VPS foi criada e Docker CLI não foi localizado no PATH do ambiente de preparação. Leitura de código não satisfaz o critério do `.env` e dos digests em execução. O experimento precede F2 e, pela condição mais restritiva do Human das 20h33, precisa estar resolvido antes de iniciar F1. **R-02 não encerrado.**

## R-03

**Concordo com o critério; discordo da atribuição de falta de confirmação.** O Human já determinou em seu encaminhamento anterior, item 3: “A VPS clona o original (R-03), e isso vai para a ficha da F0 e o manifesto da F1”. O plano mantém a origem `melgarafael/DeskcommCRM`, tag `v1.86.0` e commit `70a8c2775567f7daea721c77d34a9881190397bc`, na ficha F0, em D12 e no conteúdo exigido do manifesto F1.

**Pendente:** medir `git remote get-url origin` e HEAD na VPS real. A origem está decidida/documentada; sua prova de implantação ainda não existe. **R-03 não encerrado operacionalmente.**

## N-01

**Concordo.** O destino é PR contra `integracao`, com head/base completos e checks daquele SHA no corpo. O plano acrescenta a transcrição integral da decisão das 19h51, recebida no parecer das 21h14: “Concordo com tudo e vamos sanar todas as diferenças para deixar a produção perfeita”. O registro abreviado anterior fica preservado e é complementado.

**Pendente:** criação da base e habilitação de PRs. Na última consulta inicial deste recebimento, não existia `integracao` e `has_pull_requests` continuava falso. A revisão poderá ler o novo head da branch enquanto esses requisitos são concluídos, sem alegação de PR existente.

## N-02

**Concordo com a recomendação; discordo da atribuição de falta de confirmação.** O item 4 do encaminhamento humano anterior determinou: “Evidências de produção fora do fork público (N-02); o fork guarda só o manifesto sanitizado”. O plano retira capturas/traces reais do destino público e cria D13 para armazenamento privado, acesso, retenção e responsável.

**Pendente:** preencher D13 e conferir a proteção do destino. Não foi produzida evidência de produção nesta atualização.

## N-03

**Concordo.** D3 agora trata pausa por inatividade, ausência de PITR no Supabase Free e compatibilidade dos pontos discretos de backup com as metas de perda/recuperação. A ficha F0 mantém a decisão pendente do Human, sem contratação ou mudança de plano por iniciativa da implementadora.

## N-04

**Concordo.** Os novos commits usam `Codex (implementadora)` com endereço próprio em domínio reservado `.invalid`, tanto para autor como committer. O commit antigo não foi reescrito. A credencial de autenticação e a autoria são verificações diferentes; não se reivindica uma conta de agente verificada no GitHub.

## Checkpoint da publicação

O comentário público que acompanha o novo head registrará o SHA completo, a base observada, os checks e o resultado dos testes. As suites de produto, o experimento do instalador, rulesets remotos e as jornadas da aplicação não foram executados nesta entrega. Nenhuma fase operacional será declarada concluída apenas porque o texto foi corrigido.
