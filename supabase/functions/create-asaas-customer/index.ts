import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') //para segurança, usei uma variavel de ambiente pegada no supabase
const ASAAS_API_URL = 'https://api.asaas.com/v3/customers'

//cria um cliente Supabase com privilégios de administrador
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
) 

serve(async (req) => {
  try {
    const { record } = await req.json()
    //mapeamento de dados
    const asaasData = {
      name: record.sfj_nome,
      cpfCnpj: record.sfj_cpf_cnpj, 
      email: record.sfj_email,
      mobilePhone: `${record.sfj_ddd}${record.sfj_fone.replace(/[^\d]/g, '')}`,
      externalReference: record.sfj_pessoa.toString(),
    }
    //chamada http
    const response = await fetch(ASAAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY!,
      },
      body: JSON.stringify(asaasData),
    });

    const asaasResult = await response.json()
    //se der certo faz update 
    if (response.ok) { 
      const customerId = asaasResult.id 

      await supabaseAdmin
      .from('sfj0007000') 
        .update({
        asaas_customer_id: customerId,
        asaas_status: 'ACTIVE',
      })
      .eq('sfj_pessoa', record.sfj_pessoa)

      return new Response(JSON.stringify({ success: true, customerId }), { status: 200 })
      } else {
        console.error('ERRO ASAAS:', asaasResult)

        await supabaseAdmin
        .from('sfj0007000')
        .update({ asaas_status: 'ERROR' })
        .eq('sfj_pessoa', record.sfj_pessoa)

        return new Response(JSON.stringify({ success: false, error: asaasResult }), { status: 500 })
      }
      //se der errado deixa rastro do problema
  } catch (error) {
    const err = error as Error
    console.error('Erro na Edge Function:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
});