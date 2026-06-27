-- Migration: Adicionar configurações globais na tabela fazendas

ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb;
