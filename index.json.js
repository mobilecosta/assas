const axios = require("axios");
const API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJlOGMzOWFjLWIwMjUtNDFkYS04MTllLTQ4NmQ5Mzc1ZGI5NDo6JGFhY2hfYTEyODk3NTQtOTFjNS00NWNmLThmODYtMDEyYjFhZjY5YTM3";

// Dados simulados
const dados = {
    "public.sfj0007000": [
        {
            "sfj_nome": "Jfr Tecnologia E Sistemas Ltda - Epp",
            "sfj_apelido": "Conceitho Tecnologia",
            "sfj_ddd": "11",
            "sfj_fone": "98951-8720",
            "sfj_email": "fabio@conceitho.com",
            "cpfCnpj": "12345678909"
        }
    ],
    "public.se20007000": [
        {
            "se2_cep": "09295410",
            "se2_ender": "Rua Coroados",
            "se2_num": "315",
            "sz9_municipio": "3547809",
        }
    ],
    "public.san0007001": [
        {
            "an_valor": "5.00",
            "an_vencto": "2025-11-01",
            "an_historico": "teste"
        }
    ]
}

// Extraindo os dados necessários
const cliente = dados["public.sfj0007000"][0];
const endereco = dados["public.se20007000"][0];
const cobranca = dados ["public.san0007001"][0];

// Função para criar cliente e cobrança
async function criarClienteCobranca() {
    try {
        const clienteResp = await axios.post(
            "https://sandbox.asaas.com/api/v3/customers",
            {
                name: cliente.sfj_nome,
                email: cliente.sfj_email,
                phone: `${cliente.sfj_ddd}${cliente.sfj_fone.replace("-", "")}`,
                address: endereco.se2_ender,
                addressNumber: endereco.se2_num,
                postalCode: endereco.se2_cep,
                cpfCnpj: cliente.cpfCnpj,
            },
            { headers: { 
                    access_token: API_KEY,
                }, 
            }
        );

        // ID do cliente criado
        const clienteId = clienteResp.data.id;
        console.log("cliente criado:", clienteId);

        const cobrancaResp = await axios.post(
            "https://sandbox.asaas.com/api/v3/payments",
            {
                customer: clienteId,
                billingType: "BOLETO",
                dueDate: cobranca.an_vencto,
                value: parseFloat(cobranca.an_valor),
                description: cobranca.an_historico,
            },
            { headers: { access_token: API_KEY} }
        );

        // ID da cobrança criada
        console.log("cobrança criada:", cobrancaResp.data.id);
        } catch (error) {
            console.error("erro:", error.response ? error.response.data : error.message);
        }
    }


criarClienteCobranca();
