# Avaliação: GitHub Actions com IA

**Aluno:** João Vytor Kruger  
**Repositório:** [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger)  
**Projeto:** Desenho Assinado — Cloudflare Pages, Functions e D1

## Tarefa 1 — CI a cada commit (2,5 pontos)

O arquivo `.github/workflows/ci.yml` foi configurado para executar em eventos `push` e em `pull_request` destinados à `main`. Ele procura possíveis segredos expostos, valida as migrações SQL em SQLite local e verifica arquivos HTML.

**Evidências:**

- Execução aprovada (verde): [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38329741432](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38329741432)
- Execução com erro proposital (vermelha): [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38330614825](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38330614825)

**Erro de sintaxe provocado:**

```text
CREATE TABLEx erro_proposital (id INTEGER);
Parse error: near "TABLEx": syntax error
Process completed with exit code 1.
```

**Por que testar no SQLite antes do D1?**

Porque a verificação local detecta erros nas migrações antes de alterar o banco remoto, reduzindo o risco de falha na aplicação.

## Tarefa 2 — Proteção da `main` (1,5 ponto)

Foi criada uma regra de proteção para a branch `main`, exigindo Pull Request e a aprovação do status check `verificar` para realizar o merge.

**Evidências:**

- Pull Request bloqueado pelo SQL incorreto e posteriormente liberado após a correção: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2)
- Tentativa de `git push` direto na `main`, feita no Codespaces: `git push origin HEAD:main`.

**Resposta do GitHub:**

```text
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
remote: - Required status check "verificar" is expected.
! [remote rejected] HEAD -> main (push declined due to repository rule violations)
```

O push foi recusado pelas regras do repositório. O commit de teste não foi incorporado à `main`.

## Tarefa 3 — Revisão automática por IA (3,5 pontos)

O workflow `.github/workflows/revisao-ia.yml` revisa o diff do Pull Request e publica uma análise automática como comentário. O arquivo passou a utilizar `actions/ai-inference@v3` e seleção automática de modelo para permitir a execução com o Copilot disponível na conta.

**Evidências:**

- Revisão automática inicial: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6158828513](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6158828513)
- Comentário da IA identificando SQL com interpolação potencialmente insegura: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6159033357](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6159033357)
- Comentário após correção com `prepare()` e `bind(nome)`: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6159106121](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/2#issuecomment-6159106121)
- Execução que falhou após retirar temporariamente `pull-requests: write`: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38498251010/job/115638870295?pr=2](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38498251010/job/115638870295?pr=2)

O teste de permissões retirou temporariamente `pull-requests: write`, e a automação falhou na etapa de publicar o comentário. A permissão foi restaurada, e as verificações posteriores passaram. O link acima permite consultar o log da execução de falha.

### Análise crítica de uma afirmação da IA

A IA alertou que Pull Requests originados de forks não recebem os segredos do repositório de destino. Embora essa afirmação seja válida em geral, ela não se aplica ao nosso teste, pois o Pull Request foi criado entre as branches `avaliacao-actions` e `main` do mesmo repositório. Dessa forma, consideramos o alerta irrelevante para o contexto analisado, mostrando a importância de verificar as respostas da IA antes de aceitá-las como corretas.

## Tarefa 4 — Migrações D1 após o merge (1,5 ponto)

O workflow `.github/workflows/migrar.yml` executa as migrações remotas do Cloudflare D1 após um `push` na `main` que inclua alterações em `migrations/**`.

**Evidências:**

- Execução bem-sucedida após o merge do PR #2: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38501977031/job/115650815028](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/runs/38501977031/job/115650815028)
- No log do Wrangler, `0001_inicial.sql` e `0002_adiciona_coluna.sql` aparecem com status de sucesso.
- Verificação no console D1: `PRAGMA table_info(notas);` confirmou as colunas `id` (INTEGER), `aluno` (TEXT), `nota` (REAL) e `observacao` (TEXT).
- PR #3, com alteração somente no `README.md` e merge aprovado: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/3](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/pull/3)
- Histórico do workflow `Migrar D1`, sem nova execução decorrente do PR #3: [https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/workflows/migrar.yml](https://github.com/JVK74/2bim-Avalia1-Joao-Vytor-Kruger/actions/workflows/migrar.yml)

O segundo merge não alterou arquivos da pasta `migrations/`; por isso, o filtro `paths` impediu uma execução desnecessária da migração.

## Perguntas teóricas (1,0 ponto)

**1. O `ci.yml` roda duas vezes quando você faz push numa ramificação com PR aberto. Por quê, e qual das duas execuções o status check da `main` considera?**

Isso ocorre porque o workflow escuta dois eventos diferentes: `push` na ramificação e `pull_request` atualizado com aquele commit. Na avaliação do merge, a proteção da `main` exige o status check `verificar` no contexto do Pull Request, considerando o resultado do commit de teste de merge quando ele existe; uma execução de `push` isolada não substitui essa verificação do PR.

**2. Por que um PR vindo de um fork não consegue usar `secrets.COPILOT_PAT`? Qual ataque essa regra impede?**

O GitHub não disponibiliza, por padrão, segredos do repositório de destino para workflows disparados por Pull Requests de forks externos. Isso impede que alguém envie código malicioso em um PR para ler e transmitir tokens ou outras credenciais privadas do projeto.

**3. Por que o workflow da Tarefa 3 declara `permissions` em vez de usar as permissões padrão do `GITHUB_TOKEN`?**

Declarar `permissions` aplica o princípio do menor privilégio: `contents: read` permite ler o código, enquanto `pull-requests: write` permite comentar no PR. Assim evitamos depender de permissões padrão, que podem ser insuficientes ou mais amplas do que o necessário; o teste sem permissão de escrita demonstrou a importância dessa configuração.

**4. A revisão da
