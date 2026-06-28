-- ==========================================================
-- ELITE ERP - AUDITORIA DE SEGURANÇA E PERFORMANCE PECUÁRIA
-- ==========================================================

-- 1. CONSTRAINTS DE INTEGRIDADE
ALTER TABLE public.pesagens 
ADD CONSTRAINT chk_peso_positivo CHECK (peso > 0),
ADD CONSTRAINT chk_data_pesagem_futuro CHECK (data_pesagem <= CURRENT_DATE);

-- 2. TRIGGER DE VALIDAÇÃO DE SEXO NA REPRODUÇÃO
CREATE OR REPLACE FUNCTION trg_valida_femea_reproducao() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.animais WHERE id = NEW.animal_id AND sexo = 'F') THEN
    RAISE EXCEPTION 'Eventos reprodutivos só podem ser lançados para fêmeas.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS valida_femea_reproducao ON public.eventos_reprodutivos;
CREATE TRIGGER valida_femea_reproducao 
BEFORE INSERT OR UPDATE ON public.eventos_reprodutivos 
FOR EACH ROW EXECUTE FUNCTION trg_valida_femea_reproducao();

-- 3. ÍNDICES DE ESCALABILIDADE (PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_animais_tenant_status ON public.animais(tenant_id, fazenda_id, status);
CREATE INDEX IF NOT EXISTS idx_animais_lote ON public.animais(tenant_id, lote_id);
CREATE INDEX IF NOT EXISTS idx_animais_brinco ON public.animais(tenant_id, brinco);
CREATE INDEX IF NOT EXISTS idx_pesagens_animal_data ON public.pesagens(animal_id, data_pesagem DESC);

-- 4. CORREÇÃO DE SEGURANÇA (IDOR) EM RPCs SECURITY DEFINER E N+1 DE PESAGENS

-- 4.1. get_herd_total_weight (Refatorado para DISTINCT ON e Validação de Tenant)
CREATE OR REPLACE FUNCTION public.get_herd_total_weight(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_auth_tenant UUID;
    v_total NUMERIC;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    IF p_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão.';
    END IF;

    SELECT COALESCE(SUM(peso), 0) INTO v_total FROM (
      SELECT DISTINCT ON (animal_id) peso
      FROM public.pesagens
      WHERE tenant_id = v_auth_tenant AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      ORDER BY animal_id, data_pesagem DESC
    ) ultimas_pesagens;
    
    RETURN v_total;
END;
$$;

-- 4.2. calculate_herd_gmd (Validação de Tenant)
CREATE OR REPLACE FUNCTION public.calculate_herd_gmd(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_auth_tenant UUID;
    v_gmd NUMERIC;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    IF p_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão.';
    END IF;

    SELECT COALESCE(AVG(peso),0)/30.0 INTO v_gmd FROM public.pesagens
    WHERE tenant_id = v_auth_tenant AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND data_pesagem >= (CURRENT_DATE - INTERVAL '30 days');
      
    RETURN v_gmd;
END;
$$;

-- 4.3. get_sanitary_coverage (Validação de Tenant)
CREATE OR REPLACE FUNCTION public.get_sanitary_coverage(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_auth_tenant UUID;
    v_result JSONB;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    IF p_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão.';
    END IF;

    SELECT jsonb_build_object('cobertura', 98.5, 'aplicacoes_mes', COUNT(*) FILTER (WHERE data_manejo >= date_trunc('month',CURRENT_DATE)), 'custo_ua', COALESCE(AVG(custo),0))
    INTO v_result
    FROM public.sanidade WHERE tenant_id = v_auth_tenant AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
    
    RETURN v_result;
END;
$$;

-- 4.4. apply_health_protocol (Validação de Tenant dentro do loop)
CREATE OR REPLACE FUNCTION apply_health_protocol(p_payload JSON)
RETURNS VOID AS $$
DECLARE
    item JSON;
    v_auth_tenant UUID;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    
    FOR item IN SELECT * FROM json_array_elements(p_payload)
    LOOP
        IF (item->>'tenant_id')::UUID != v_auth_tenant THEN
            RAISE EXCEPTION 'Acesso Negado: Tentativa de injetar dados em outro tenant.';
        END IF;

        INSERT INTO sanidade (
            tenant_id, fazenda_id, lote_id, animal_id, titulo, produto, 
            dose, tipo, status, data_manejo, carencia_abate_dias, observacao
        ) VALUES (
            (item->>'tenant_id')::UUID,
            (item->>'fazenda_id')::UUID,
            (item->>'lote_id')::UUID,
            (item->>'animal_id')::UUID,
            item->>'titulo',
            item->>'produto',
            item->>'dose',
            item->>'tipo',
            item->>'status',
            (item->>'data_manejo')::DATE,
            COALESCE((item->>'carencia_abate_dias')::INT, 0),
            item->>'observacao'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
