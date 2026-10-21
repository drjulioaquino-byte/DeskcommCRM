#!/usr/bin/env bash
# Prova pushes reais para remoto LOCAL descartável; nunca toca o GitHub.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fonte="${1:-$raiz/scripts/fork/hooks}"
fonte="$(cd "$fonte" && pwd)"
tmp="$(mktemp -d /tmp/deskcomm-fork-hooks.XXXXXX)"
case "$tmp" in /tmp/deskcomm-fork-hooks.*) ;; *) echo 'Diretório temporário inesperado' >&2; exit 1 ;; esac
trap 'rm -rf -- "$tmp"' EXIT

# Impede que ambiente herdado ou configuração global redirecione os testes
# para o checkout real. As escritas de config são só nos dois repos abaixo.
unset $(git rev-parse --local-env-vars)
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
export GIT_CEILING_DIRECTORIES="$tmp"

git init -q --bare "$tmp/remoto.git"
git init -q -b feature/prova "$tmp/clone"
repo="$tmp/clone"
git config --file "$repo/.git/config" user.name 'Teste de hook'
git config --file "$repo/.git/config" user.email 'teste@agents.invalid'
git config --file "$repo/.git/config" core.hooksPath "$fonte"
git -C "$repo" remote add origin "$tmp/remoto.git"
mkdir -p "$repo/.agents/skills/deskcomm-contribuir/scripts/hooks"
delegado="$repo/.agents/skills/deskcomm-contribuir/scripts/hooks"
printf '#!/usr/bin/env bash\nprintf "pre-commit\\n" >> delegacao.log\n' > "$delegado/pre-commit"
printf '#!/usr/bin/env bash\ncat >/dev/null\nprintf "pre-push\\n" >> delegacao.log\n' > "$delegado/pre-push"
printf 'inicial\n' > "$repo/prova.txt"
git -C "$repo" add prova.txt
git -C "$repo" commit -qm inicial
casos=0
ok() { casos=$((casos + 1)); printf 'PASS %s\n' "$1"; }
grep -q '^pre-commit$' "$repo/delegacao.log" || { echo 'pre-commit não delegado' >&2; exit 1; }
ok 'pre-commit preserva a delegação'

git -C "$repo" push -q origin HEAD:refs/heads/feature/permitida
grep -q '^pre-push$' "$repo/delegacao.log" || { echo 'pre-push não delegado' >&2; exit 1; }
ok 'branch de trabalho aceita e delega'
inicial="$(git -C "$repo" rev-parse HEAD)"

recusa() {
  local refspec="$1" rotulo="$2"
  if git -C "$repo" push -q origin "$refspec" > "$tmp/saida" 2>&1; then
    printf 'FAIL %s: push foi aceito\n' "$rotulo" >&2
    exit 1
  fi
  grep -q 'pre-push BLOQUEADO:' "$tmp/saida" || { cat "$tmp/saida" >&2; exit 1; }
  ok "$rotulo"
}

recusa HEAD:refs/heads/main 'criação de main bloqueada'
recusa HEAD:refs/heads/integracao 'criação de integracao bloqueada'
recusa HEAD:refs/heads/master 'master continua bloqueada'
git --git-dir="$tmp/remoto.git" update-ref refs/heads/main "$inicial"
git --git-dir="$tmp/remoto.git" update-ref refs/heads/integracao "$inicial"
printf 'depois\n' >> "$repo/prova.txt"
git -C "$repo" add prova.txt
git -C "$repo" commit -qm depois
recusa HEAD:refs/heads/main 'atualização de main bloqueada'
recusa HEAD:refs/heads/integracao 'atualização de integracao bloqueada'
recusa :refs/heads/main 'exclusão de main bloqueada'
recusa :refs/heads/integracao 'exclusão de integracao bloqueada'

if git -C "$repo" push -q origin HEAD:refs/heads/feature/lote HEAD:refs/heads/integracao > "$tmp/saida" 2>&1; then
  echo 'FAIL lote com integracao aceito' >&2; exit 1
fi
if git --git-dir="$tmp/remoto.git" show-ref --verify --quiet refs/heads/feature/lote; then
  echo 'FAIL lote foi parcialmente enviado' >&2; exit 1
fi
ok 'lote com ref protegida não envia outras refs'

git -C "$repo" push -q origin HEAD:refs/heads/feature/integracao
ok 'nome integracao dentro de feature não gera falso bloqueio'
[ "$(git --git-dir="$tmp/remoto.git" rev-parse refs/heads/main)" = "$inicial" ]
[ "$(git --git-dir="$tmp/remoto.git" rev-parse refs/heads/integracao)" = "$inicial" ]
ok 'refs protegidas preservam o SHA original'

printf '#!/usr/bin/env bash\ncat >/dev/null\nexit 42\n' > "$delegado/pre-push"
if git -C "$repo" push -q origin HEAD:refs/heads/feature/veto-delegado > "$tmp/saida" 2>&1; then
  echo 'FAIL veto do hook original foi perdido' >&2; exit 1
fi
ok 'veto delegado continua impedindo push'
printf '%s casos aprovados\n' "$casos"
