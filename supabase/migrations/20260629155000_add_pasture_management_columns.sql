-- ==============================================================================
-- MIGRATION: 20260629155000_add_pasture_management_columns.sql
-- PURPOSE: Adicionar colunas faltantes na tabela pastos utilizadas pelo formulário de Pastagem
-- ==============================================================================

ALTER TABLE public.pastos 
ADD COLUMN IF NOT EXISTS sistema_pastejo text DEFAULT 'Contínuo',
ADD COLUMN IF NOT EXISTS coordenadas text,
ADD COLUMN IF NOT EXISTS num_piquetes integer,
ADD COLUMN IF NOT EXISTS dias_ocupacao integer,
ADD COLUMN IF NOT EXISTS dias_descanso integer,
ADD COLUMN IF NOT EXISTS data_diferimento date;
