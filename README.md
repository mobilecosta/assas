# assas
Repositorio com Exemplos de Consumo do ASSAS

Docs em: https://docs.asaas.com/

## Dados de Acesso: sandbox.asaas.com
## User: murilo.carvalho.mcs@outlook.com
## Password: Nomkun-6tewto-bekbyk 

# MODO DE USAR
## 1 - DE INSERT DE UM NOVO CLIENTE NA TABELA SUPABASE

Certifique-se de que haja um novo usuario inserido na tabela do supabase. É estritamente importante que todos os dados do usuário como email, cfp_cnpj, dentre outros dados únicos sejam exclusivos e válidos como consta na api asaas.

  Na página de SQL EDITOR há 2 exemplos de scripts para inserir novos clientes.

## 2 - RODE O SCRIPT NODE (AGENDADOR.JS)

Para que seja cadastrado o novo cliente inserido no supabase dentro do asaas, é necessário o "run" do código escrito no arquivo "agendador.js", responsável pela integração com a api. Basta escrever "node agendador.js" no terminal do projeto.

(obs: a integração de novos usuários é feita a cada 1 minuto após o run)
