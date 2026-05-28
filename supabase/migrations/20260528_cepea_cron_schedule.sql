-- ============================================================
-- AGENDAMENTO: Cron job para importar cotações CEPEA
-- Execute APÓS o deploy da Edge Function e APÓS a migration anterior
-- Substitua <PROJECT_REF> pelo seu ID: nmirpozhgcoabcjwgvqk
-- ============================================================

-- URL da sua Edge Function (já com o project ref correto)
-- https://nmirpozhgcoabcjwgvqk.supabase.co/functions/v1/cepea-widget-scraper

-- Remover agendamentos anteriores (se existirem)
SELECT cron.unschedule('importar-cepea-diario')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'importar-cepea-diario'
);

-- Agendar: Segunda a Sexta às 18h (horário UTC = 15h BRT)
-- CEPEA publica cotações por volta das 15h-17h (horário de Brasília)
SELECT cron.schedule(
  'importar-cepea-diario',        -- nome do job
  '0 21 * * 1-5',                 -- 18h BRT = 21h UTC, seg-sex
  $$
  SELECT net.http_post(
    url     := 'https://nmirpozhgcoabcjwgvqk.supabase.co/functions/v1/cepea-widget-scraper',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- Verificar se foi agendado
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'importar-cepea-diario';
