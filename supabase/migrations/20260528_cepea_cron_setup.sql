-- ============================================================
-- MIGRATION: Setup pg_cron para importar cotações CEPEA diariamente
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Habilitar extensões necessárias (caso não estejam ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Garantir constraint única para evitar duplicatas no upsert
ALTER TABLE market_quotes 
  DROP CONSTRAINT IF EXISTS market_quotes_indicator_date_key;

ALTER TABLE market_quotes 
  ADD CONSTRAINT market_quotes_indicator_date_key UNIQUE (indicator, date);

-- 3. Verificar o resultado
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
