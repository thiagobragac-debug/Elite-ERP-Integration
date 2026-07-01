import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    // Validate inputs
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase admin client (Service Role) to bypass RLS for audit table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Check if the account is currently locked
    const { data: auditRecord } = await supabaseAdmin
      .from('failed_logins')
      .select('*')
      .eq('email', email)
      .single()

    if (auditRecord && auditRecord.locked_until) {
      const lockedUntilDate = new Date(auditRecord.locked_until)
      if (lockedUntilDate > new Date()) {
        const diffMs = lockedUntilDate.getTime() - new Date().getTime()
        const diffMins = Math.ceil(diffMs / 60000)
        return new Response(JSON.stringify({ 
          error: `Múltiplas falhas detectadas. Dispositivo bloqueado por segurança. Tente novamente em ${diffMins} minuto(s).` 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 2. Attempt to login using a standard anon client
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // 3. Increment failed attempts
      let newAttempts = 1
      let newLockedUntil = null
      
      if (auditRecord) {
        newAttempts = auditRecord.attempts + 1
      }

      if (newAttempts >= 5) {
        // Lock for 10 minutes
        const lockTime = new Date()
        lockTime.setMinutes(lockTime.getMinutes() + 10)
        newLockedUntil = lockTime.toISOString()
      }

      // Upsert the record
      await supabaseAdmin.from('failed_logins').upsert({
        email,
        attempts: newAttempts,
        last_attempt: new Date().toISOString(),
        locked_until: newLockedUntil
      })

      const errorMessage = newAttempts >= 5 
        ? 'System Guard: 5 tentativas falhas. Seu acesso foi temporariamente bloqueado por 10 minutos.' 
        : `E-mail ou senha incorretos. Tentativa ${newAttempts}/5.`

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Success! Clear the failed attempts
    await supabaseAdmin.from('failed_logins').delete().eq('email', email)

    // Return the session tokens to the client
    return new Response(JSON.stringify({ session: authData.session, user: authData.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

