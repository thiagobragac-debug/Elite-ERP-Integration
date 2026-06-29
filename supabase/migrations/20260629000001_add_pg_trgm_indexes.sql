-- Migração para criação de índices pg_trgm nas tabelas de Pecuária para otimizar pesquisas ILIKE

-- 1. Habilitar a extensão pg_trgm, caso não exista
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índices na tabela 'animais'
CREATE INDEX IF NOT EXISTS idx_animais_brinco_trgm ON animais USING gin (brinco gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_animais_raca_trgm ON animais USING gin (raca gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_animais_categoria_trgm ON animais USING gin (categoria gin_trgm_ops);

-- 3. Índices na tabela 'lotes'
CREATE INDEX IF NOT EXISTS idx_lotes_nome_trgm ON lotes USING gin (nome gin_trgm_ops);

-- 4. Índice na tabela 'romaneios' (opcional, para busca de placa ou gta)
CREATE INDEX IF NOT EXISTS idx_romaneios_codigo_trgm ON romaneios USING gin (codigo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_romaneios_gta_trgm ON romaneios USING gin (gta_numero gin_trgm_ops);
