-- Migration: register_new_tenant RPC for atomic registration
-- Date: 2026-06-18

CREATE OR REPLACE FUNCTION public.register_new_tenant(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_company_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_unidade_id uuid;
    v_fazenda_id uuid;
BEGIN
    -- 1. Criar Tenant
    INSERT INTO public.tenants (nome, status, plano)
    VALUES (p_company_name, 'ativo', 'trial')
    RETURNING id INTO v_tenant_id;

    -- 2. Criar Unidade (Empresa Matriz)
    INSERT INTO public.unidades (tenant_id, nome, tipo, razao_social)
    VALUES (v_tenant_id, p_company_name, 'MATRIZ', p_company_name)
    RETURNING id INTO v_unidade_id;

    -- 3. Criar Fazenda Principal
    INSERT INTO public.fazendas (tenant_id, unidade_id, nome, area_total, area_ha, peso_abate_kg)
    VALUES (v_tenant_id, v_unidade_id, 'Fazenda Principal', 0, 0, 450)
    RETURNING id INTO v_fazenda_id;

    -- 4. Upsert no Profile (vinculando tenant_id e fazenda permitida)
    INSERT INTO public.profiles (id, tenant_id, role, full_name, email, fazendas_permitidas)
    VALUES (p_user_id, v_tenant_id, 'ADMIN', p_full_name, p_email, ARRAY[v_fazenda_id])
    ON CONFLICT (id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        fazendas_permitidas = EXCLUDED.fazendas_permitidas;
END;
$$;
