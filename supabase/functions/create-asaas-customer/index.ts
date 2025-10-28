import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3/customers'

serve(async (req) => {
  console.log("Webhook disparado! Novo registro recebido.");
  try {
    const payload = await req.json()
    const user = payload.record 

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Nenhum registro encontrado no payload' }),
        { status: 400 }
      )
    }

    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ASAAS_API_KEY não configurada nos secrets.' }),
        { status: 500 }
      )
    }

    // Mapeia os campos da tua tabela pro Asaas
    const asaasData = {
      name: user.sfj_nome,
      email: user.sfj_email,
      cpfCnpj: user.sfj_cpf_cnpj,
      ddi: user.sfj_ddi,
      phone: `${user.sfj_ddd}${user.sfj_fone}`,
      externalReference: user.sfj_pessoa,
    }

    // Faz o POST pro Asaas
    const response = await fetch(ASAAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(asaasData),
    })

    const asaasResult = await response.json()

    if (response.ok) {
      console.log(' Cliente criado no Asaas:', asaasResult)
      return new Response(
        JSON.stringify({ success: true, customerId: asaasResult.id }),
        { status: 200 }
      )
    } else {
      console.error(' ERRO ASAAS:', asaasResult)
      return new Response(
        JSON.stringify({ success: false, error: asaasResult }),
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(' Erro na Edge Function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})
