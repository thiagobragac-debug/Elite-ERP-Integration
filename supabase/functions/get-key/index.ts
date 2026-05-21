Deno.serve(async (req) => {
  return new Response(JSON.stringify({ key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') }), { headers: { 'Content-Type': 'application/json' } })
})
