// Conteúdo do arquivo: supabase/functions/asaas-creator/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Puxa a chave ASAAS do Secret (igual antes)
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3/customers'

serve(async (req) => {
  try {
    // 1. Recebe o corpo da requisição (JSON do cliente)
    const asaasData = await req.json()

    // 2. Verifica se a chave do Asaas está disponível
    if (!ASAAS_API_KEY) {
        return new Response(JSON.stringify({ error: 'ASAAS_API_KEY is not configured in secrets.' }), { status: 500 })
    }

    // 3. CHAMADA À API ASAAS (Igual antes)
    const response = await fetch(ASAAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Usa a chave do Asaas puxada dos Secrets
        'access_token': ASAAS_API_KEY, 
      },
      body: JSON.stringify(asaasData),
    })

    const asaasResult = await response.json()

    // 4. Retorna o resultado do Asaas (Sucesso ou Falha)
    if (response.ok) {
      return new Response(JSON.stringify({ success: true, customerId: asaasResult.id }), { status: 200 })
    } else {
      console.error('ERRO ASAAS:', asaasResult)
      return new Response(JSON.stringify({ success: false, error: asaasResult }), { status: 500 })
    }
  } catch (error) {
    console.error('Erro na Edge Function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})