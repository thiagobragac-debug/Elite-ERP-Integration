-- ==============================================================================
-- Migration: Performance Indexes and Row Level Security for Agritech Tables
-- Date: 2026-06-08
-- ==============================================================================

-- 1. Indexes for high-frequency/high-volume operations
CREATE INDEX IF NOT EXISTS idx_pesagens_tenant_farm ON public.pesagens(tenant_id, fazenda_id);
CREATE INDEX IF NOT EXISTS idx_pesagens_animal_id ON public.pesagens(animal_id);
CREATE INDEX IF NOT EXISTS idx_pesagens_data ON public.pesagens(data_pesagem);

CREATE INDEX IF NOT EXISTS idx_animais_tenant_farm ON public.animais(tenant_id, fazenda_id);
CREATE INDEX IF NOT EXISTS idx_animais_lote_id ON public.animais(lote_id);
CREATE INDEX IF NOT EXISTS idx_animais_brinco ON public.animais(brinco);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_tenant_farm ON public.movimentacoes_estoque(tenant_id, fazenda_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto_id ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_data ON public.movimentacoes_estoque(data_movimentacao);

-- 2. Row Level Security policies
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pesagens_tenant" ON public.pesagens;
CREATE POLICY "pesagens_tenant" ON public.pesagens
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "animais_tenant" ON public.animais;
CREATE POLICY "animais_tenant" ON public.animais
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque;
CREATE POLICY "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());
