-- ==============================================================================
-- Migration: Restore SaaS Admin RLS Override
-- Date: 2026-06-08
-- Description: The previous optimization migration accidentally removed the 
-- auth_helpers.is_saas_admin() bypass, preventing SaaS admins from managing tenant data.
-- ==============================================================================

DROP POLICY IF EXISTS "pesagens_tenant" ON public.pesagens;
CREATE POLICY "pesagens_tenant" ON public.pesagens
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

DROP POLICY IF EXISTS "animais_tenant" ON public.animais;
CREATE POLICY "animais_tenant" ON public.animais
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

DROP POLICY IF EXISTS "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque;
CREATE POLICY "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());
