-- Correção da política RLS para administradores SaaS
DROP POLICY IF EXISTS "Usuários podem ver períodos do seu tenant" ON public.periodos_contabeis;
DROP POLICY IF EXISTS "Usuários podem gerenciar períodos do seu tenant" ON public.periodos_contabeis;

CREATE POLICY "periodos_contabeis_tenant_select" 
    ON public.periodos_contabeis FOR SELECT 
    USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

CREATE POLICY "periodos_contabeis_tenant_all" 
    ON public.periodos_contabeis FOR ALL 
    USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());
