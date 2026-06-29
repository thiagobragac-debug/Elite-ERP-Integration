-- ==============================================================================
-- MIGRATION: 20260629153500_add_updated_at_animais.sql
-- PURPOSE: Adicionar coluna updated_at na tabela animais. 
-- Várias funções e RPCs (como relocate_animals e update_animal_peso_atual) tentam 
-- dar update_at = now() na tabela animais, mas a coluna não existia, causando o erro:
-- "column 'updated_at' of relation 'animais' does not exist"
-- ==============================================================================

ALTER TABLE public.animais 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
