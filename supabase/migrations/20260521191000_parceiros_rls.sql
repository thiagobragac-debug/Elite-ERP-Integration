-- Adiciona política de RLS para parceiros
CREATE POLICY "parceiros_tenant" ON public.parceiros 
FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());
