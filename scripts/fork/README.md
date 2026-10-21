# Hooks locais da governança do fork

Decisão do Human de 20/10/2026, 20h33 BRT: push direto em `main` e `integracao` deve ser bloqueado. O hook também preserva o bloqueio de `master` e delega as guardas anteriores à skill do contribuidor. Hook local não substitui ruleset no servidor.

Instalação neste clone, após conferir que `core.hooksPath` ainda aponta para o hook do contribuidor ou para esta pasta:

```bash
chmod +x scripts/fork/hooks/pre-commit scripts/fork/hooks/pre-push
git config --local core.hooksPath scripts/fork/hooks
git config --local user.name 'Codex (implementadora)'
git config --local user.email 'codex-implementadora@agents.invalid'
```

O endereço em `.invalid` identifica a agente local e não é caixa de e-mail nem afirmação de conta verificada no GitHub. Os commits anteriores são preservados; novos commits não usam o e-mail pessoal do Human como autoria.

O pre-commit continua executando a guarda de migrations e o aviso de identidade do contribuidor. O pre-push lê todas as refs antes de delegar: criação, atualização e exclusão de bases são recusadas; refs comuns permanecem sujeitas ao hook original.

Prova com remoto local descartável, sem envio ao GitHub:

```bash
bash tests/shell/fork-governanca-hooks.test.sh
```

Criação inicial de `integracao` e do checkpoint é provisionamento após o fast-forward do Human; não exige nem autoriza liberar o hook. Sincronização de `main`, rulesets e merges permanecem atos do Human. A branch de trabalho publica somente para seu próprio nome e abre PR contra `integracao` quando ela existir.
