# assas
Repositorio com Exemplos de Consumo do ASSAS

## Planilha de Demandas: https://docs.google.com/spreadsheets/d/1yKt4Ac5cFl5k1UJfExrH4bj-Er_r_hgZqh4ryvrwCnQ/edit?pli=1&gid=390149627#gid=390149627
## Docs em: https://docs.asaas.com/
## Configuração Token: https://sandbox.asaas.com/customerApiAccessToken/index


## Dados de Acesso: sandbox.asaas.com
## User: murilo.carvalho.mcs@outlook.com / Password: Nomkun-6tewto-bekbyk 
## User: mobile.costa@gmail.com / Password: 303351@Wag
## Token: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmE1YmU5ZWVmLWM1Y2YtNDcwNy05OTEzLTJmMWM2OTMwMzQ1YTo6JGFhY2hfMWEzZDY4ZWUtYjFkYS00ZmE3LWJiNWEtYWU0YmQ0MzkzM2E4

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

No projeto, é usado alguns scripts como o para criar as 3 principais tabelas e scripts para inserir novos cliente dentro das mesmas, seja no SUPABASE ou no POSTGRESQL Local, segue abaixo algum deles: 

# Criando as 3 tabelas (supabase e PostgreSQL): 

```sql
CREATE TABLE public.sfj0007000 (
    id SERIAL PRIMARY KEY,

    a1_codcli SERIAL UNIQUE,

    sfj_nome TEXT NOT NULL,
    sfj_cpf_cnpj TEXT NOT NULL,
    sfj_cadastro TIMESTAMP NOT NULL,
    sfj_tipo INTEGER NOT NULL,
    sfj_ddd TEXT,
    sfj_fone TEXT,
    sfj_email TEXT,
    sfj_perfil TEXT,
    sfj_situacao INTEGER
);

CREATE TABLE public.se20007000 (
    id SERIAL PRIMARY KEY,

    a1_codcli INTEGER NOT NULL REFERENCES public.sfj0007000(a1_codcli) ON DELETE CASCADE,

    se2_ender TEXT NOT NULL,
    se2_cep TEXT NOT NULL,
    se2_vigencia DATE NOT NULL,
    sz9_municipio TEXT NOT NULL
);

CREATE TABLE public.san0007001 (
    id SERIAL PRIMARY KEY,

    a1_codcli INTEGER NOT NULL REFERENCES public.sfj0007000(a1_codcli) ON DELETE CASCADE,

    an_vencto DATE NOT NULL,
    an_valor NUMERIC(15,2) NOT NULL,
    an_historico TEXT,
    an_codtit TEXT,
    an_emissao DATE NOT NULL,
    an_venctoreal DATE NOT NULL
);
```
# Incluindo Clientes em Tabelas (Supabase e PostgreSQL):
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
        'Teste de teste' || floor(random() * 10000)::int,
        '611.584.650-17', 
        NOW(),
        2,
        '11',
        '999035165',
        'testedeteste22' || floor(random() * 1000)::int || '@gmail.com',
        '{1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',
        1
    )
    RETURNING a1_codcli
),
insere_endereco AS (
    INSERT INTO public.se20007000 (
        se2_ender,
        se2_cep,
        se2_vigencia,
        sz9_municipio,
        a1_codcli
    )
    SELECT
        'Rua Luiz Mantovani',
        '13902762',
        '2011-06-02',
        '3547809',
        a1_codcli
    FROM novo_cliente
    RETURNING a1_codcli
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
    '2030-02-28',
    '5.01',
    'teste',
    '826',
    '2013-02-28',
    '2013-03-01',
    a1_codcli
FROM novo_cliente;
```

(obs: É possível alterar os valores do campo substituindo as informações do script acima por novos clientes).

# informações Adicionais:

Para o processo de cadastro de clientes através de requisições POST, a api do asaas precisa de algumas informações do cliente para que seja possível seu cadastro.
As informações podem ser classificadas como Obrigatórias e opcional/Recomendadas. Todas as informações precisam ser enviadas para o sistema em formato de json.

## Informações Obrigatórias: 

```
Nome completo do cliente (string)
cpf/cnpj (string)
```

## Informações Recomendadas: 

```
Email
phone
MobilePhone
PostalCode
Adress
AdressNumber
Complement
Province
ExternalReference
notificationDisabled
PersonType
```

Um perfil de cliente com informações o torna copleto, abrindo mais opções de funcionalidades que possam ser feitas através da api.

