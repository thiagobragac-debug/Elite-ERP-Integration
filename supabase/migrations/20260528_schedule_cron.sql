SELECT cron.schedule(
  'importar-cepea-diario',
  '0 21 * * 1-5',
  $$
  SELECT net.http_post(
    url     := 'https://nmirpozhgcoabcjwgvqk.supabase.co/functions/v1/cepea-widget-scraper',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2MDkyMiwiZXhwIjoyMDkzNDM2OTIyfQ.DxO8EEQVInDcmEg9kntLzjG2Y79aN-l5CKec3NFLayE'
    ),
    body    := '{}'::jsonb
  );
  $$
);
