-- ==========================================================
-- ELITE ERP - AÇÕES EM MASSA PECUÁRIA
-- ==========================================================

-- RPC para Bulk Management (Manejo em Massa de Animais)
-- Permite registrar Pesagens, Sanidade, ou Mudança de Lote/Pasto em massa.
CREATE OR REPLACE FUNCTION rpc_apply_bulk_management(
    p_tenant_id uuid,
    p_fazenda_id uuid,
    p_animal_ids uuid[],
    p_tipo_manejo text, -- 'PESAGEM', 'SANIDADE', 'MOVIMENTACAO'
    p_payload jsonb
)
RETURNS VOID AS $$
DECLARE
    v_auth_tenant UUID;
    v_animal_id UUID;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    IF p_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão.';
    END IF;

    FOREACH v_animal_id IN ARRAY p_animal_ids
    LOOP
        -- Processa o tipo de manejo
        IF p_tipo_manejo = 'PESAGEM' THEN
            INSERT INTO public.pesagens (
                tenant_id, fazenda_id, animal_id, peso, observacao, data_pesagem
            ) VALUES (
                p_tenant_id, 
                p_fazenda_id, 
                v_animal_id, 
                (p_payload->>'peso')::NUMERIC,
                p_payload->>'observacao',
                COALESCE((p_payload->>'data_pesagem')::DATE, CURRENT_DATE)
            );
            
        ELSIF p_tipo_manejo = 'SANIDADE' THEN
            INSERT INTO public.sanidade (
                tenant_id, fazenda_id, animal_id, produto, dose, tipo, status, data_manejo, carencia_abate_dias
            ) VALUES (
                p_tenant_id,
                p_fazenda_id,
                v_animal_id,
                p_payload->>'produto',
                p_payload->>'dose',
                p_payload->>'tipo',
                COALESCE(p_payload->>'status', 'Concluído'),
                COALESCE((p_payload->>'data_manejo')::DATE, CURRENT_DATE),
                COALESCE((p_payload->>'carencia_abate_dias')::INT, 0)
            );
            
        ELSIF p_tipo_manejo = 'MOVIMENTACAO' THEN
            UPDATE public.animais
            SET lote_id = COALESCE((p_payload->>'lote_id')::UUID, lote_id),
                pasto_id = COALESCE((p_payload->>'pasto_id')::UUID, pasto_id),
                updated_at = NOW()
            WHERE id = v_animal_id AND tenant_id = p_tenant_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
