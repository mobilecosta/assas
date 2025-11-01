//arquivo responsável pela integração

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

//variaveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ASAAS_API_KEY) {
    console.error('Erro: faltam váriaveis do .env');
    process.exit(1);
}

//conexão com o supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//Função principal
async function executarIntegracao() {
    try {
        console.log('Buscando dados no supabase');

        const { data: clientes, error: erroClientes } = await supabase
            .from('sfj0007000')
            .select('*');

        const { data: enderecos, error: erroEnderecos } = await supabase
            .from('se20007000')
            .select('*');

        const { data: cobrancas, error: erroCobrancas } = await supabase
            .from('san0007001')
            .select('*');

        if (erroClientes || erroEnderecos || erroCobrancas) {
            console.error('Erro ao buscar dados:', erroClientes || erroEnderecos || erroCobrancas);
            return;
        }

        if (!clientes?.length || !enderecos?.length || !cobrancas?.length) {
            console.log('Nenhum dado encontrado nas tabelas');
            return;
        }

        console.log('✅ Dados carregados com sucesso!');
        console.log(`Clientes: ${clientes.length} | Endereços: ${enderecos.length} | Cobranças: ${cobrancas.length}`);

        // percorre todos os clientes da tabela
        for (const cliente of clientes) {
            try {
                const cpfCnpj = cliente.sfj_cpf_cnpj?.replace(/\D/g, '');
                const checkResp = await axios.get(
                    `https://sandbox.asaas.com/api/v3/customers?cpfCnpj=${cpfCnpj}`,
                    { headers: { access_token: ASAAS_API_KEY } }
                );

                if (checkResp.data.totalCount > 0) {
                    console.log(`⚠️ Cliente ${cliente.sfj_nome} (${cpfCnpj}) já existe no Asaas. Pulando...`);
                    continue;
                }

                const endereco = enderecos.find(e => e.a1_codcli == cliente.a1_codcli);
                const cobranca = cobrancas.find(c => c.a1_codcli == cliente.a1_codcli);

                if (!endereco || !cobranca) {
                    console.log(` Dados incompletos para cliente ${cliente.sfj_nome}, pulando...`);
                    continue;
                }

                // montagem dos dados para o ASAAS
                const payloadCliente = {
                    name: cliente.sfj_nome,
                    cpfCnpj: cliente.sfj_cpf_cnpj,
                    phone: `${cliente.sfj_ddd}${cliente.sfj_fone.replace('-', '')}`,
                    email: cliente.sfj_email,
                    address: endereco.se2_ender,
                    postalCode: endereco.se2_cep,
                };

                console.log(`📦 Enviando Cliente: ${payloadCliente.name}`);

                const clienteResp = await axios.post(
                    'https://sandbox.asaas.com/api/v3/customers',
                    payloadCliente,
                    { headers: { access_token: ASAAS_API_KEY } }
                );

                const clienteId = clienteResp.data.id;
                console.log(' Cliente criado:', clienteId);

                const payloadCobranca = {
                    customer: clienteId,
                    billingType: 'BOLETO',
                    dueDate: cobranca.an_vencto,
                    value: parseFloat(cobranca.an_valor),
                    description: cobranca.an_historico,
                };

                console.log(' Criando cobrança no Asaas...');
                const cobrancaResp = await axios.post(
                    'https://sandbox.asaas.com/api/v3/payments',
                    payloadCobranca,
                    { headers: { access_token: ASAAS_API_KEY } }
                );

                console.log(' Cobrança criada:', cobrancaResp.data.id, '\n');

            } catch (erroCliente) {
                console.error(` Erro ao processar cliente ${cliente.sfj_nome}:`,
                    erroCliente.response ? erroCliente.response.data : erroCliente.message,
                    '\n'
                );
            }
        }

        console.log('🏁 Integração concluída.');

    } catch (erro) {
        console.error('Erro Geral:', erro.response ? erro.response.data : erro.message);
    }
}

executarIntegracao();
