import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const fetchWidget = async (id, indicatorName) => {
      const url = `https://cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=transparent&cortexto=333333&corlinha=cccccc&id_indicador[]=${id}`
      const response = await fetch(url)
      const scriptText = await response.text()
      
      const tdRegex = /<td[^>]*>(.*?)<\/td>/g
      const tds = [...scriptText.matchAll(tdRegex)].map(m => m[1])
      
      const dateIndex = tds.findIndex(t => /^\d{2}\/\d{2}\/\d{4}$/.test(t.trim()))
      
      let dateStr = ''
      let valueStr = ''
      
      if (dateIndex !== -1 && tds[dateIndex + 2]) {
        dateStr = tds[dateIndex].trim()
        valueStr = tds[dateIndex + 2].replace(/<[^>]*>?/gm, '').replace(/R\$\s*/i, '').trim()
      }
      
      if (!dateStr || !valueStr) return null;
      
      const [day, month, year] = dateStr.split('/')
      const isoDate = `${year}-${month}-${day}`
      const numericValue = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'))
      
      return { indicator: indicatorName, date: isoDate, value: numericValue }
    };

    const results = await Promise.all([
      fetchWidget(8, 'bezerro_ms_cepea'),
      fetchWidget(3, 'bezerro_sp_cepea'),
      fetchWidget(77, 'milho_cepea'),
      fetchWidget(2, 'boi_gordo_cepea')
    ]);

    const validResults = results.filter(Boolean);

    if (validResults.length === 0) {
       return new Response(JSON.stringify({ error: 'Could not parse any CEPEA data' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('market_quotes')
      .upsert(validResults, { onConflict: 'indicator,date' })
      .select()
      
    if (error) throw error

    return new Response(JSON.stringify({ success: true, inserted: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
