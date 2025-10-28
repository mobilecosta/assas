import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabaseUrl = 'https://cwlggwkqesdfnjaambcf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3bGdnd2txZXNkZm5qYWFtYmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTM3MzYsImV4cCI6MjA3NjgyOTczNn0.4DJFKMRqx8gLU84LrOiOK1NXLbm5szVkZwA5GZhjYPE'
const supabase = createClient(supabaseUrl, supabaseKey)

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZiN2Y2M2UzLWU2NmItNGYxZS1hMTJmLTE1YzkwMjdlMjQxMjo6JGFhY2hfNDdlY2IwZTItYTVjNy00ZjRiLWE4OWMtNmFmNDRjZmUzZGE2'

// URL da sandbox
const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3/customers'

async function syncUsersToAsaas() {
    const { data: users, error } = await supabase
    .from('sfj0007000')
    .select('*')

    if (error) {
    console.error('Erro ao buscar usuários:', error)
    return
    }

    for (const user of users) {

    //caso o usuario ja exista no asaas
    if (user.asaas_customer_id) {
        console.log(`cliente ${user.sfj_nome} já cadastrado no asaas, pulando...`)
        continue 
    }

    console.log(` Enviando ${user.sfj_nome} para o Asaas...`)

    const response = await fetch(ASAAS_API_URL, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
    },
        body: JSON.stringify({
        name:  user.sfj_nome,
        email: user.sfj_email,
        cpfCnpj: user.sfj_cpf_cnpj,
        ddi: user.sfj_ddi,
        phone: `${user.sfj_ddd}${user.sfj_fone}`,
        externalReference: user.sfj_pessoa,
        }),
    })

    const result = await response.json()

    if (response.ok) {
        console.log(` Cliente criado: ${result.id}`)

        await supabase
            .from('sfj0007000')
            .update({ asaas_customer_id: result.id })
            .eq('id', user.id)
    } else {
        console.error(` Erro no cliente ${user.sfj_nome}:`, result)
    }
    }
}

await syncUsersToAsaas()
