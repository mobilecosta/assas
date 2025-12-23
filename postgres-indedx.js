//importações para conexão com o banco de dados PostgreSQL
require('dotenv').config();
const axios = require('axios');
const dayjs = require('dayjs');
const PQueue = require('p-queue').default;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//variáveis de ambiente: 

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '200', 10);//tamanho do lote padrão de clientes por chamada: 200
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);//número de chamadas simultâneas padrão: 5
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

if (!ASAAS_API_KEY) {
    console.error('ERRO: Variável ASAAS_API_KEY não encontrada no .env');
    process.exit(1);
}

axios.defaults.headers.common['access_token'] = ASAAS_API_KEY;
axios.defaults.timeout = 30_000; // 30 segundos

const sleep = ms => new Promise(res => setTimeout(res, ms));

//formata cpf/cnpj e telefone para formato aceito pelo asaas (somente números)
const normalizeCpfCnpj = (s) => (s ? String(s).replace(/\D/g, '') : null);
const normalizePhone = (ddd = '', fone = '') => {
    const d = (ddd || '').replace(/\D/g, '');
    const f = (fone || '').replace(/\D/g, '');
    if (!f) return null;
    const phone = d ?d + f : f;
    return phone.length >= 8 ? phone : null;
};
//formata datas para o padrão AAAA-MM-DD (aceito pelo asaas)
const formatDateForAsaas = (v) => {
    if (!v) return null;
    const d = dayjs(v);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
};

//função tentativa de requisição com retries
async function axiosWithRetries(config) {
    let attempt = 0;
    while (attempt < RETRY_ATTEMPTS) {
        try {
        return await axios(config);
        } catch (err) {
        attempt++;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) throw err;
        if (attempt >= RETRY_ATTEMPTS) throw err;
        await sleep(RETRY_DELAY_MS * attempt);
        }
    }
}

//checa se cliente ja foi processado (através da tela de log)
async function isAlreadyProcessed(a1_codcli) {
    const rows = await prisma.$queryRaw`SELECT 1 FROM asaas_integration_log WHERE a1_codcli = ${a1_codcli} LIMIT 1`;
    return rows.length > 0;
} 

//grava log (insert)
async function insertIntegrationLog({ a1_codcli, cpf_cnpj, asaas_customer_id = null, asaas_payment_id = null, cobranca_recno = null }) {
    await prisma.$executeRaw`
    INSERT INTO asaas_integration_log (a1_codcli, cpf_cnpj, asaas_customer_id, asaas_payment_id, cobranca_recno, created_at, updated_at)
    VALUES (${a1_codcli}, ${cpf_cnpj}, ${asaas_customer_id}, ${asaas_payment_id}, ${cobranca_recno}, now(), now())
    ON CONFLICT (a1_codcli) DO UPDATE SET asaas_customer_id = EXCLUDED.asaas_customer_id, asaas_payment_id = EXCLUDED.asaas_payment_id, cpf_cnpj = EXCLUDED.cpf_cnpj, cobranca_recno = EXCLUDED.cobranca_recno, updated_at = now();`;
}

async function executarIntegracao() {
    console.log('Iniciando Integração com (PRISMA --> ASAAS)');

    // PEGA TOTAL DE CLIENTES PARA PAGINAR
    const total = await prisma.sfj0000000.count();
    console.log(`Total aproximado de clientes: ${total}`);

    for (let skip = 0; skip < total; skip += BATCH_SIZE) {
        console.log(`processando batch: skip=${skip} take=${BATCH_SIZE}`);

        //Busca batch de clientes: 
        const clientes = await prisma.sfj0000000.findMany({
            skip,
            take: BATCH_SIZE,
            orderBy: { a1_codcli: 'asc' }
        });

        if (!clientes || clientes.length === 0 ) {
            console.log('Nenhum Cliente no batch, indo para o próximo...');
            continue;
        }

        //pegar todos os a1_codcli no batch
        const ids = clientes.map(c => c.a1_codcli);

        //buscar endereços e cobranças relacionados a esses clientes
        const enderecos = await prisma.se2000000.findMany({
            where: { a1_codcli : { in: ids } }
        });

        const cobrancas = await prisma.san0000001.findMany({
            where: { a1_codcli : { in: ids } }
        });

        //agrupa por a1_codcli para lookup rápido
        const enderecosByClient = enderecos.reduce((acc, e) => {
            (acc[e.a1_codcli] = acc[e.a1_codcli] || []).push(e);
            return acc;
        }, {});

        //fila para controlar concorrência
        const queue = new PQueue({ concurrency: CONCURRENCY });

        //Processa cada cliente no batch
        for (const cliente of clientes) {
            queue.add(async () => {
                const a1 = cliente.a1_codcli;

                try {
                    //checa se já foi processado
                    if (await isAlreadyProcessed(a1)) {
                        console.log(`Cliente ${a1} já processado, pulando...`);
                        return;
                    }

                    const cpfCnpjRaw = cliente.sfj_cpf_cnpj;
                    const cpfCnpj = normalizeCpfCnpj(cpfCnpjRaw);
                    if (!cpfCnpj) {
                        console.warn(`Cliente ${a1} sem CPF/CNPJ válido, Pulando...`)
                        return;
                    }

                    //checa se cliente já existe no ASAAS via cpf/cnpj
                    let existsOnAsaas = false;
                    try {
                        const resp = await axiosWithRetries({
                            method: 'get',
                            url: `${ASAAS_BASE}/customers`,
                            params: { cpfCnpj },
                        });
                        existsOnAsaas = (resp.data && resp.data.totalCount > 0);
                    } catch (err) {
                        console.warn(`Erro checando Asaas para ${a1} (${cpfCnpj})`, err?.response?.data || err.message);
                        //pula para o próximo cliente
                        return;
                    }

                    if (existsOnAsaas) {
                        console.log(`Cliente ${a1} (${cpfCnpj}) já existe no asaas, registrando no log e pulando...`);
                        //gravando id no log para referancia 
                        const resp = await axiosWithRetries({
                            method: 'get',
                            url: `${ASAAS_BASE}/customers`,
                            params: { cpfCnpj }, 
                        });
                        const first = resp.data.data && resp.data.data[0];
                        await insertIntegrationLog({ a1_codcli: a1, cpf_cnpj: cpfCnpj, asaas_customers_id: first?.id || null });
                        return;
                    }

                    //pega endereco e cobranca corretos
                    const listaEnderecos = enderecosByClient[a1] || [];
                    const listaCobrancas = cobrancasByClient[a1] || [];

                    if (!listaEnderecos || !listaCobrancas.length) {
                        console.log(`Dados Incompletos para cliente ${a1} (${cliente.sfj_nome}), enreços ou combranças ausentes, pulando...`);
                        return;
                    }
                    
                    //Seleciona a cobrança: preferir a mais próxima de vencimento futura/atual
                    listaCobrancas.sort((a, b) => new Date(a.an_vencto) - new Date(b.an_vencto));

                    //pega a primeira cobrança que ainda não venceu ou a primeira disponível
                    const cobranca = listaCobrancas[0];

                    //validações e normalizações
                    const phone = normalizePhone(cliente.sfj_ddd, cliente.sfj_fone);
                    const email = cliente.sfj_email || null;
                    const dueDate = formatDateForAsaas(cobranca.an_vencto);
                    const value = Number(cobranca.an_valor || 0);
                    const description = cobranca.an_historico || `Cobrança ${cobranca.an_codtit || ''}`;

                    //monta payload do cliente
                    const payloadCliente = {
                        name: cliente.sfj_nome,
                        cpfCnpj: cpfCnpj,
                        phone,
                        email,
                        address: enderecos.se2_ender,
                        postalCode: enderecos.se2_cep,
                    };

                    //cria cliente no asaas (com retries)
                    let clienteId;
                    try {
                        const r = await axiosWithRetries({
                            method: 'post',
                            url: `${ASAAS_BASE}/customers`,
                            data: payloadCliente,
                        });
                        clienteId = r.data.id;
                        console.log(`Cliente criado no Asaas: ${cliente.sfj_nome} -> ${clienteId}`);
                    } catch (err) {
                        console.error(`Erro criando Cliente ${a1} (${cpfCnpj}):`, err?.response?.data || err.message);
                        return;
                    }

                    //cria cobranças no Asaas
                    const payloadCobranca = {
                        customer: clienteId,
                        billingType: 'BOLETO',
                        dueDate,
                        value,
                        description,
                    };

                    let paymentId;
                    try {
                        const r2 = await axiosWithRetries({
                            method: 'post',
                            url: `${ASAAS_BASE}/payments`,
                            data: payloadCobranca, 
                        });
                        paymentId = r2.data.id;
                        console.log(`Cobrança criada no Asaas para cliente ${a1}: paymentId=${paymentId}`);
                    } catch (err) {
                        console.error(`Erro criando Cobrança para cliente: ${a1}`, err?.response?.data || err.message);
                    }

                    //grava log de interação
                    await insertIntegrationLog({
                        a1_codcli: a1,
                        cpf_cnpj: cpfCnpj,
                        asaas_customer_id: clienteId,
                        asaas_payment_id: paymentId,
                        cobranca_recno: cobranca.recno || null,
                    });

                } catch (err) {
                    console.error(`Erro no processamento do cliente ${cliente.a1_codcli}:`, err?.response?.data || err?.message || err);
                }
            }).catch(e => {
                //captura erro de queue
                console.error('Erro em task da fila:', e);
            }); 
        } //Fim For Clientes

        //espera todas as tasks da fila terminarem
        await queue.onIdle();
        console.log(`Batch skip=${skip} finalizado.`);
    } //fim por paginação
    console.log('Integração finalizada.');
}

executarIntegracao()
.catch(e => {
    console.error('Erro fatal na integração:', e);
})
.finally(async () => {
    await prisma.$disconnect();
});