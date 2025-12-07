# assas
Repositorio com Exemplos de Consumo do ASSAS

## Docs em: https://docs.asaas.com/
## Configuração Token: https://sandbox.asaas.com/customerApiAccessToken/index


## Dados de Acesso: sandbox.asaas.com
## User: murilo.carvalho.mcs@outlook.com / Password: Nomkun-6tewto-bekbyk 
## User: mobile.costa@gmail.com / Password: 303351@Wag
## Token: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQyODU3ZWQxLWNhMWMtNGVlOS1iMDhlLTBhNTY0ZmE1OTQzOTo6JGFhY2hfMjBjNmQ4N2YtNzYzYi00MzYyLWFmMDQtMmYyMjAxZGFmZGZh

# MODO DE USAR
## 1 - DE INSERT DE UM NOVO CLIENTE NA TABELA SUPABASE

Certifique-se de que haja um novo usuario inserido na tabela do supabase. É estritamente importante que todos os dados do usuário como email, cfp_cnpj, dentre outros dados únicos sejam exclusivos e válidos como consta na api asaas.

  Na página de SQL EDITOR e no tópico abaixo deste, há exemplos de scripts para inserir novos clientes.

## 2 - RODE O SCRIPT NODE (AGENDADOR.JS)

Para que seja cadastrado o novo cliente inserido no supabase dentro do asaas, é necessário o "run" do código escrito no arquivo "agendador.js", responsável pela integração com a api. Basta escrever:

```node
 node agendador.js
```
 no terminal do projeto.
 
(obs: a integração de novos usuários é feita a cada 1 minuto após o run)

## 3 - SCRIPTS PARA FACILITAR TESTES (mais usados)

No projeto, é usado alguns scripts como o para inserir um novo cliente dentro das tabelas, seja no SUPABASE ou no POSTGRESQL Local, segue abaixo algum deles: 

# Incluindo Clientes em Tabelas (supabase):
```sql
WITH novo_cliente AS (
    INSERT INTO public.sfj0007000 (
        sfj_nome, 
        sfj_cpf_cnpj, 
        sfj_cadastro, 
        sfj_tipo, 
        sfj_ddd, 
        sfj_fone, 
        sfj_email, 
        sfj_perfil, 
        sfj_situacao
    )
    VALUES (
        '' || floor(random() * 10000)::int, --> Gera uma sequência numérica no final do nome para melhor individualismo.
        '', --> CPF
        NOW(),
        2,
        '', --> DDD
        '', --> Número de telefone (sem "-" )
        '' || floor(random() * 1000)::int || '@gmail.com', --> email (pode tirar a função do meio caso tenha um válido)
        '{1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',
        1
    )
    RETURNING a1_codcli
)
INSERT INTO public.se20007000 (
    se2_ender,
    se2_cep,
    se2_vigencia,
    sz9_municipio,
    a1_codcli
)
SELECT
    '', --> Rua
    '', --> CEP
    '2011-06-02', --> pode deixar essa para teste
    '', --> número do municipio
    a1_codcli
FROM novo_cliente
RETURNING a1_codcli;

-- segunda parte: cobrança (roda separada ou dentro de outro WITH)

WITH ultimo_cliente AS (
  SELECT a1_codcli FROM public.sfj0007000 ORDER BY a1_codcli DESC LIMIT 1
)
INSERT INTO public.san0007001 (
    an_vencto,
    an_valor,
    an_historico,
    an_codtit,
    an_emissao,
    an_venctoreal,
    a1_codcli
)
SELECT
    '2030-02-28', --> pode deixar para teste
    '5.01', --> valor mínimo permitido pelo asaas, para teste pode permanecer
    'teste', --> Pode deixar para teste
    '826', --> pode deixar para teste
    '2013-02-28', --> pode deixar para teste
    '2013-03-01', --> pode deixar para teste
    a1_codcli
FROM ultimo_cliente;
```

# Incluindo Clientes em Tabelas (POSTGRESQL):

```sql
-- Inserir cliente e endereço em uma única execução
WITH novo_cliente AS (
    INSERT INTO public.sfj0007000 (
        sfj_nome, 
        sfj_cpf_cnpj, 
        sfj_cadastro, 
        sfj_tipo, 
        sfj_ddd, 
        sfj_fone, 
        sfj_email, 
        sfj_perfil, 
        sfj_situacao
    )
    VALUES (
        '' || floor(random() * 10000)::int, --> Gera uma sequência numérica no final do nome para melhor individualismo.
        '', --> CPF
        NOW(),
        2,
        '', --> DDD
        '', --> Número de telefone (sem "-" )
        '' || floor(random() * 1000)::int || '@gmail.com', --> email (pode tirar a função do meio caso tenha um válido)
        '{1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',
        1
    )
    RETURNING a1_codcli
)
INSERT INTO public.se20007000 (
    se2_ender,
    se2_cep,
    se2_vigencia,
    sz9_municipio,
    a1_codcli
)
SELECT
    '', --> Rua
    '', --> CEP
    '2011-06-02',
    '', --> Número de município 
    a1_codcli
FROM novo_cliente
RETURNING a1_codcli;
-- Segunda parte: inserir título vinculando ao último cliente criado
WITH ultimo_cliente AS (
    SELECT a1_codcli 
    FROM public.sfj0007000 
    ORDER BY a1_codcli DESC 
    LIMIT 1
)
INSERT INTO public.san0007001 (
    an_vencto,
    an_valor,
    an_historico,
    an_codtit,
    an_emissao,
    an_venctoreal,
    a1_codcli
)
SELECT 
    '2030-02-28', --> pode deixar para teste
    '5.01', --> valor mínimo permitido pelo asaas, para teste pode permanecer
    'teste', --> Pode deixar para teste
    '826', --> pode deixar para teste
    '2013-02-28', --> pode deixar para teste
    '2013-03-01', --> pode deixar para teste
    a1_codcli
FROM ultimo_cliente;
```


