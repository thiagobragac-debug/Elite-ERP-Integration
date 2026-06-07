-- =============================================================
-- FIX: Certificados Digitais - RLS + RPC insert definitivo
-- =============================================================

-- 1. Remove todas as políticas antigas
DROP POLICY IF EXISTS "certificados_tenant"         ON public.certificados_digitais;
DROP POLICY IF EXISTS "certificados_tenant_select"  ON public.certificados_digitais;
DROP POLICY IF EXISTS "certificados_tenant_insert"  ON public.certificados_digitais;
DROP POLICY IF EXISTS "certificados_tenant_update"  ON public.certificados_digitais;
DROP POLICY IF EXISTS "certificados_tenant_delete"  ON public.certificados_digitais;

-- 2. Desativa e reativa RLS para garantir estado limpo
ALTER TABLE public.certificados_digitais DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados_digitais ENABLE ROW LEVEL SECURITY;

-- 3. Políticas simples de leitura/edição/exclusão usando auth_helpers.get_auth_tenant()
CREATE POLICY "cert_select" ON public.certificados_digitais
    FOR SELECT USING (tenant_id = auth_helpers.get_auth_tenant());

CREATE POLICY "cert_update" ON public.certificados_digitais
    FOR UPDATE USING (tenant_id = auth_helpers.get_auth_tenant());

CREATE POLICY "cert_delete" ON public.certificados_digitais
    FOR DELETE USING (tenant_id = auth_helpers.get_auth_tenant());

-- 4. Para INSERT: uma RPC SECURITY DEFINER bypassa o RLS de forma
--    segura e controlada (mesma abordagem usada pelo resto do sistema)
CREATE OR REPLACE FUNCTION public.upsert_certificado_digital(
    p_tenant_id    UUID,
    p_company_id   UUID,
    p_titular      TEXT,
    p_cnpj_cpf     TEXT,
    p_senha        TEXT,
    p_pfx_base64   TEXT,
    p_data_vencimento TIMESTAMP WITH TIME ZONE,
    p_existing_id  UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result_id UUID;
BEGIN
    -- Valida que o tenant_id informado pertence de fato ao usuário logado
    IF p_tenant_id <> auth_helpers.get_auth_tenant() THEN
        -- SAAS_ADMIN pode impersonar qualquer tenant: verificamos se o usuário tem role SAAS_ADMIN no profile
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('SAAS_ADMIN', 'ADMIN')
        ) THEN
            RAISE EXCEPTION 'Acesso negado: tenant_id não pertence ao usuário autenticado';
        END IF;
    END IF;

    IF p_existing_id IS NOT NULL THEN
        -- UPDATE
        UPDATE public.certificados_digitais SET
            company_id       = p_company_id,
            titular          = p_titular,
            cnpj_cpf         = p_cnpj_cpf,
            senha            = p_senha,
            pfx_base64       = p_pfx_base64,
            data_vencimento  = p_data_vencimento,
            updated_at       = NOW()
        WHERE id = p_existing_id AND tenant_id = p_tenant_id
        RETURNING id INTO v_result_id;
    ELSE
        -- INSERT (on conflict: atualiza o certificado existente para a mesma empresa)
        INSERT INTO public.certificados_digitais
            (tenant_id, company_id, titular, cnpj_cpf, senha, pfx_base64, data_vencimento)
        VALUES
            (p_tenant_id, p_company_id, p_titular, p_cnpj_cpf, p_senha, p_pfx_base64, p_data_vencimento)
        ON CONFLICT (tenant_id, company_id)
            DO UPDATE SET
                titular         = EXCLUDED.titular,
                cnpj_cpf        = EXCLUDED.cnpj_cpf,
                senha           = EXCLUDED.senha,
                pfx_base64      = EXCLUDED.pfx_base64,
                data_vencimento = EXCLUDED.data_vencimento,
                updated_at      = NOW()
        RETURNING id INTO v_result_id;
    END IF;

    RETURN v_result_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_certificado_digital(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;

-- 5. RPC SECURITY DEFINER para SELECT (garante que SAAS_ADMIN impersonando outro tenant consiga ler)
CREATE OR REPLACE FUNCTION public.get_certificados_digitais(p_tenant_id UUID)
RETURNS SETOF public.certificados_digitais
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_tenant_id <> auth_helpers.get_auth_tenant() THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('SAAS_ADMIN', 'ADMIN')
        ) THEN
            RAISE EXCEPTION 'Acesso negado: tenant_id nao pertence ao usuario autenticado';
        END IF;
    END IF;

    RETURN QUERY
        SELECT * FROM public.certificados_digitais
        WHERE tenant_id = p_tenant_id
        ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_certificados_digitais(UUID) TO authenticated;
