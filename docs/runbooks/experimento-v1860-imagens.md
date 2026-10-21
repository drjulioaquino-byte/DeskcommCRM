# Experimento de fixação das imagens na versão 1.86.0

**Estado:** roteiro preparado; instalação em máquina descartável ainda não executada. Este experimento encerra R-02 apenas quando tiver prova operacional aprovada. Usa o original, preserva o código oficial e antecede a Fase 1.

## Por que fixar o checkout é insuficiente

No [`install.sh` da release](https://github.com/melgarafael/DeskcommCRM/blob/70a8c2775567f7daea721c77d34a9881190397bc/hostgator-setup-kit/install.sh#L1406), o caminho não ARM consulta novamente a última release do original. A seleção pode cair para `stable` ou `latest`. Exportar apenas `VERSAO_ALVO=1.86.0` não constitui solução: essa linha pode sobrescrevê-la.

O campo `APP_IMAGE` é editável na entrevista e na conferência final. Nas linhas 1742–1779, o instalador obtém `TAG_ALVO` da referência **selecionada de APP_IMAGE** e escreve worker, scheduler e voice-agent com essa tag, além de `PULL_POLICY=missing` para tag numérica. Fixar só o app por digest é inadequado nesta versão: esse ramo deriva `stable` para os demais componentes.

Portanto, o mecanismo a provar é selecionar explicitamente a referência numerada do app e comprovar as referências derivadas, sem aceitar defaults ou alterar o fonte oficial.

## Pré-condições

- Máquina Linux descartável autorizada, arquitetura igual à pretendida para a instalação e Docker/Compose funcionais. Recursos e custos aprovados pelo Human.
- Banco e credenciais exclusivos de teste, sem dados reais; nenhum canal final pareado.
- Código original de `v1.86.0`, com HEAD `70a8c2775567f7daea721c77d34a9881190397bc`.
- Referências e digests das imagens `1.86.0` registrados antes do teste. Conferir os manifestos para a arquitetura correta; digest do índice multiarch e digest da plataforma são registros distintos.
- Evidências completas em destino privado. No fork público, publicar apenas manifesto sanitizado com comandos, status e hashes.

## Procedimento G0

1. Clonar o **original**, fazer checkout da release e conferir `git remote get-url origin` e `git rev-parse HEAD`. O teste falha se o remoto for o fork ou o SHA divergir.
2. Consultar os manifestos das imagens próprias `:1.86.0`, conferir a arquitetura, registrar os digests e executar pull real. Consultar a versão disponível no remoto separadamente: a instalação deverá continuar em `1.86.0` mesmo se houver versão mais recente.
3. Executar `bash hostgator-setup-kit/install.sh` **interativamente**. No campo `APP_IMAGE`, informar explicitamente `ghcr.io/melgarafael/deskcommcrm:1.86.0`; se já vier preenchido, usar a correção numerada da tela de conferência. Confirmar o valor literal antes de autorizar a gravação. Não aceitar o default calculado a partir de `VERSAO_ALVO`.
4. A configuração final deve conter exatamente:

```text
APP_IMAGE=ghcr.io/melgarafael/deskcommcrm:1.86.0
WORKER_IMAGE=ghcr.io/melgarafael/deskcomm-worker:1.86.0
SCHEDULER_IMAGE=ghcr.io/melgarafael/deskcomm-scheduler:1.86.0
VOICE_AGENT_IMAGE=ghcr.io/melgarafael/deskcomm-voice-agent:1.86.0
APP_PULL_POLICY=missing
WORKER_PULL_POLICY=missing
SCHEDULER_PULL_POLICY=missing
VOICE_AGENT_PULL_POLICY=missing
```

5. Conferir somente essa allowlist no `.env` gerado, por verificador que não imprima outras chaves. Aspas equivalentes no formato gerado são aceitáveis; chave repetida, valor ausente ou tag móvel reprovam. Esta leitura de referências de imagens foi autorizada explicitamente pelo Human em R-02; não autoriza abrir, copiar ou logar segredos do restante do arquivo.
6. Usar `docker compose` com os mesmos overlays do instalador e `config --images` para conferir a configuração **efetiva**. Não usar `docker compose config` sem filtro, pois expõe variáveis e segredos. A inspeção deve capturar overrides do ambiente que poderiam prevalecer sobre o arquivo.
7. Para app, worker e scheduler, registrar referência configurada no contêiner, image ID local e RepoDigests da imagem. Confrontar o digest da plataforma com o manifesto aprovado, sem confundir com o digest do índice. Telefone/SIP permanece desligado, mas sua referência gravada deve continuar numerada.
8. Verificar a versão reportada pelo app, a procedência das imagens e o marcador de versão da instalação. O instalador chama `marcar_instalacao_feita "$VERSAO_ALVO"` perto da linha 2545, enquanto a tag das imagens deriva de `APP_IMAGE`: se o default remoto mudar, é necessário detectar eventual divergência desse marcador. `APP_VERSION=1.86.0` sozinho não substitui o confronto dos digests nem comprova a configuração do agente de atualização.
9. Reexecutar o instalador no mesmo alvo descartável e reconferir a allowlist, as imagens efetivas e os digests. A reexecução não pode devolver o ambiente a uma tag móvel.
10. Em outra cópia descartável, testar registro indisponível/imagem ausente e default mais recente. A tentativa deve ser registrada como falha e nunca liberar o ambiente como `1.86.0` por inspeção apenas do checkout. Não habilitar `DESKCOMM_BUILD_LOCAL=1`. Se o kit subir uma combinação incorreta, parar, guardar a prova privada e submeter a correção do procedimento antes de repetir em homologação.

## Critério de resultado

PASS exige remoto/SHA corretos, seleção explícita registrada, três imagens ativas numeradas, referências finais sem duplicatas, compose efetivo coerente e digests correspondentes, inclusive após reexecução. Falha em qualquer item mantém R-02 aberto. Smoke que passou com tag diferente da aprovada é FAIL.

O manifesto público registra a arquitetura, release/commit oficial, referências, digests públicos, resultados de G0 e hash do relatório privado. Não publica `.env`, logs brutos, capturas, traces, IDs de clientes, projetos ou credenciais.

## Limite desta entrega

A leitura do instalador confirma o mecanismo de seleção e derivação; não prova o ambiente completo. Docker CLI não foi localizado no PATH do Windows usado para preparar o roteiro. Nenhuma VPS/VM foi criada e nenhum banco foi provisionado para este experimento.
