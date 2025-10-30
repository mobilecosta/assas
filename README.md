# assas
Repositorio com Exemplos de Consumo do ASSAS

Docs em:
https://docs.asaas.com/

# MODO DE USAR
## 1 - DE INSERT DE UM NOVO CLIENTE NA TABELA SUPABASE

Certifique-se de que haja um novo usuario inserido na tabela do supabase. É estritamente importante que todos os dados do usuário como email, cfp_cnpj, dentre outros dados únicos sejam exclusivos e válidos como consta na api asaas.

  Na página de SQL EDITOR há 2 exemplos de scripts para inserir novos clientes.

## 2 - RODE O SCRIPT NODE (INDEX.JS)

Para que seja cadastrado o novo cliente inserido no supabase dentro do asaas, é necessário o "run" do código escrito no arquivo "index.js", responsável pela integração com a api. Basta escrever "node index.js" no terminal do projeto.

(obs: Por enquanto, o código não é contínuo, ou seja, para cada novo usuário cadastrado, é necessário a execução do código novamente. Melhorias em relação a esta parte ja estão sendo desenvolvidas)
