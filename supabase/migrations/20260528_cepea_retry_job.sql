-- Job de retry: executa 2h após o principal (23h BRT = 02h UTC)
-- Busca APENAS os indicadores que ainda não foram salvos hoje
-- Usa retry_only_missing: true para evitar re-fetch desnecessário
SELECT cron.schedule(
  'importar-cepea-retry',
  '0 2 * * 2-6',
  $$
  SELECT net.http_post(
    url     := 'https://nmirpozhgcoabcjwgvqk.supabase.co/functions/v1/cepea-widget-scraper',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2MDkyMiwiZXhwIjoyMDkzNDM2OTIyfQ.DxO8EEQVInDcmEg9kntLzjG2Y79aN-l5CKec3NFLayE'
    ),
    body := '{"retry_only_missing": true}'::jsonb
  );
  $$
);
