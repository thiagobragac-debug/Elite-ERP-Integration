import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Indicadores CEPEA ───────────────────────────────────────────────────────
const INDICATORS = [
  { id: 2,  name: 'boi_gordo_cepea',  label: 'Boi Gordo (@)'      },
  { id: 8,  name: 'bezerro_ms_cepea', label: 'Bezerro MS (cab)'   },
  { id: 3,  name: 'bezerro_sp_cepea', label: 'Bezerro SP (cab)'   },
  { id: 77, name: 'milho_cepea',      label: 'Milho (saca 60kg)'  },
];

// ─── Parâmetros de contingência ──────────────────────────────────────────────
const MAX_RETRIES      = 3;       // tentativas por indicador
const RETRY_DELAY_MS   = 4000;    // espera entre tentativas (4s)
const FETCH_TIMEOUT_MS = 15000;   // timeout por requisição CEPEA

// ─── Utilitários ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

function todayISO(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC
}

// ─── Fetch com timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TauzeBot/1.0)' },
    });
  } finally {
    clearTimeout(id);
  }
}

// ─── Parser do widget CEPEA ──────────────────────────────────────────────────
async function fetchIndicator(
  id: number,
  indicatorName: string,
  retries = MAX_RETRIES
): Promise<{ indicator: string; date: string; value: number } | null> {
  const url = `https://cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=transparent&cortexto=333333&corlinha=cccccc&id_indicador[]=${id}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!response.ok) {throw new Error(`HTTP ${response.status}`);}

      const scriptText = await response.text();
      const tdRegex = /<td[^>]*>(.*?)<\/td>/g;
      const tds = [...scriptText.matchAll(tdRegex)].map(m =>
        m[1].replace(/<[^>]*>/g, '').trim()
      );

      const dateIndex = tds.findIndex(t => /^\d{2}\/\d{2}\/\d{4}$/.test(t));
      if (dateIndex === -1 || !tds[dateIndex + 2]) {
        // Widget respondeu mas sem dados (cotação ainda não publicada)
        if (attempt < retries) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return null; // exauriu tentativas: sem cotação hoje
      }

      const dateStr  = tds[dateIndex];
      const valueStr = tds[dateIndex + 2].replace(/R\$\s*/i, '').trim();
      if (!valueStr || !/\d/.test(valueStr)) {return null;}

      const [day, month, year] = dateStr.split('/');
      const isoDate      = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      const numericValue = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));
      if (isNaN(numericValue) || numericValue <= 0) {return null;}

      return { indicator: indicatorName, date: isoDate, value: numericValue };

    } catch (err: any) {
      const isLast = attempt === retries;
      if (!isLast) {await sleep(RETRY_DELAY_MS);}
      else {return null;}
    }
  }
  return null;
}

// ─── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Suporte a modo retry: { "retry_only_missing": true }
  let body: any = {};
  try { body = await req.json(); } catch { /* sem body */ }
  const retryOnlyMissing: boolean = body?.retry_only_missing === true;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today     = todayISO();
  const startedAt = new Date().toISOString();
  const details: Record<string, any> = {};
  let ok = 0, failed = 0, skipped = 0;

  // ── Verifica quais indicadores já têm cotação hoje ──────────────────────
  const { data: existing } = await supabase
    .from('market_quotes')
    .select('indicator')
    .eq('date', today)
    .in('indicator', INDICATORS.map(i => i.name));

  const alreadySaved = new Set((existing ?? []).map((r: any) => r.indicator));

  // ── Decide quais buscar ──────────────────────────────────────────────────
  const toFetch = retryOnlyMissing
    ? INDICATORS.filter(i => !alreadySaved.has(i.name))
    : INDICATORS;

  if (toFetch.length === 0) {
    // Todos os indicadores já foram salvos hoje
    const msg = `Todos os ${INDICATORS.length} indicadores já estão no histórico para ${today}. Nada a fazer.`;
    await logExecution(supabase, 'skipped_all', 0, 0, INDICATORS.length, { already_saved: [...alreadySaved] }, null);
    return new Response(
      JSON.stringify({ success: true, message: msg, skipped: INDICATORS.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Busca em paralelo (com retries individuais) ──────────────────────────
  const settled = await Promise.allSettled(
    toFetch.map(ind => fetchIndicator(ind.id, ind.name))
  );

  const results: { indicator: string; date: string; value: number }[] = [];

  settled.forEach((result, i) => {
    const ind = toFetch[i];
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
      details[ind.name] = { status: 'ok', value: result.value.value, date: result.value.date };
      ok++;
    } else {
      const reason = result.status === 'rejected' ? result.reason?.message : 'sem cotação publicada';
      details[ind.name] = { status: 'failed', reason };
      failed++;
    }
  });

  // Indicadores que foram pulados (já existiam)
  INDICATORS.filter(i => alreadySaved.has(i.name)).forEach(ind => {
    details[ind.name] = { status: 'skipped', reason: 'já salvo hoje' };
    skipped++;
  });

  // ── Upsert no banco ──────────────────────────────────────────────────────
  let dbError: string | null = null;
  if (results.length > 0) {
    const { error } = await supabase
      .from('market_quotes')
      .upsert(results, { onConflict: 'indicator,date' });
    if (error) {
      dbError = error.message;
      failed += results.length;
      ok = 0;
      results.forEach(r => {
        details[r.indicator] = { status: 'db_error', reason: error.message };
      });
    }
  }

  // ── Log da execução ──────────────────────────────────────────────────────
  const finalStatus = failed > 0 && ok === 0 ? 'error'
    : failed > 0 ? 'partial'
    : 'success';

  await logExecution(supabase, finalStatus, ok, failed, skipped, details, dbError);

  return new Response(
    JSON.stringify({
      success: failed === 0 || ok > 0,
      status:  finalStatus,
      today,
      ok, failed, skipped,
      details,
      ...(dbError ? { db_error: dbError } : {}),
    }),
    {
      status: failed > 0 && ok === 0 ? 502 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});

// ─── Salva log da execução no banco ─────────────────────────────────────────
async function logExecution(
  supabase: any,
  status: string,
  ok: number,
  failed: number,
  skipped: number,
  details: any,
  errorMessage: string | null
) {
  try {
    await supabase.from('market_import_logs').insert({
      job_name:             'cepea-widget-scraper',
      status,
      indicators_ok:        ok,
      indicators_failed:    failed,
      indicators_skipped:   skipped,
      details,
      error_message:        errorMessage,
    });
  } catch (e) {
    console.error('[logExecution] Falha ao salvar log:', e);
  }
}
