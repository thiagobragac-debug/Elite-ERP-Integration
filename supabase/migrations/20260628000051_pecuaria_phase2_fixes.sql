-- ==========================================================
-- ELITE ERP - CORREÇÕES DE AUDITORIA FASE 2 (SAÚDE)
-- ==========================================================

-- 1. CORREÇÃO DA DELEÇÃO DE SAÚDE (Soft Delete no lugar de Hard Delete)
CREATE OR REPLACE FUNCTION rpc_delete_health_event(p_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Estorno da movimentação de estoque atrelada
    -- Como a movimentação foi uma SAÍDA, geramos uma ENTRADA de estorno.
    INSERT INTO movimentacoes_estoque (
        tenant_id, fazenda_id, produto_id, deposito_id, tipo, 
        quantidade, custo_unitario, data_movimentacao, 
        origem_destino, responsavel, created_at
    )
    SELECT 
        tenant_id, fazenda_id, produto_id, deposito_id, 'ENTRADA', 
        quantidade, custo_unitario, CURRENT_DATE, 
        '[ESTORNO EXCLUSÃO] ' || origem_destino, responsavel, NOW()
    FROM movimentacoes_estoque
    WHERE tenant_id = p_tenant_id AND origem_destino LIKE '%[REF:' || p_id || ']%';

    -- 2. Apaga a movimentação original fisicamente apenas se a regra de negócio permitir, 
    -- mas a boa prática contábil exige apenas estorno. 
    -- Vamos realizar Soft Delete no evento sanitário:
    UPDATE sanidade
    SET deleted_at = NOW(), status = 'CANCELADO'
    WHERE id = p_id AND tenant_id = p_tenant_id;
    
    -- 3. Invalida o custo alocado em sanidade_animais
    DELETE FROM sanidade_animais
    WHERE sanidade_id = p_id AND tenant_id = p_tenant_id;
END;
$$;

-- 2. UNIFICAÇÃO DA LÓGICA DE EVENTOS (Estoque + Carência + Sanidade Animais)
-- O `register_health_event` agora suporta carencia_abate_dias e carencia_leite_dias
CREATE OR REPLACE FUNCTION register_health_event(p_payload JSON, p_tenant_id UUID, p_fazenda_id UUID)
RETURNS VOID AS $$
DECLARE
    item JSON;
    v_sanidade_id UUID;
    v_produto_id UUID;
    v_custo_medio NUMERIC;
    v_is_storable BOOLEAN;
    v_deposito_id UUID;
    v_animal RECORD;
    v_fase TEXT;
    v_dose NUMERIC;
BEGIN
    FOR item IN SELECT * FROM json_array_elements(p_payload)
    LOOP
        -- 1. Insert into sanidade with carencias
        INSERT INTO sanidade (
            tenant_id, fazenda_id, lote_id, animal_id, data_manejo, 
            titulo, produto, produto_id, dose,
            tipo,
            status, veterinario, observacao,
            carencia_abate_dias, carencia_leite_dias,
            created_at, updated_at
        ) VALUES (
            p_tenant_id, p_fazenda_id, 
            NULLIF(item->>'lote_id', '')::UUID, NULLIF(item->>'animal_id', '')::UUID, 
            (item->>'data_manejo')::DATE, item->>'titulo', 
            item->>'produto', NULLIF(item->>'produto_id', '')::UUID, item->>'dose', 
            item->>'tipo',
            item->>'status', COALESCE(item->>'veterinario', item->>'tecnico_resp'), 
            COALESCE(item->>'observacao', item->>'observacoes'),
            COALESCE((item->>'carencia_abate_dias')::INT, 0),
            COALESCE((item->>'carencia_leite_dias')::INT, 0),
            NOW(), NOW()
        ) RETURNING id INTO v_sanidade_id;

        -- If not REALIZADO, we don't do the cascade for costs and inventory
        IF item->>'status' != 'REALIZADO' THEN
            CONTINUE;
        END IF;

        -- 2. Resolve Product ID and Cost
        v_produto_id := NULLIF(item->>'produto_id', '')::UUID;
        v_custo_medio := 0;
        v_is_storable := FALSE;
        v_deposito_id := NULL;

        IF v_produto_id IS NULL AND (item->>'produto') IS NOT NULL AND (item->>'produto') != '' THEN
            SELECT id INTO v_produto_id FROM produtos WHERE nome = (item->>'produto') AND tenant_id = p_tenant_id LIMIT 1;
        END IF;

        IF v_produto_id IS NOT NULL THEN
            SELECT custo_medio, is_storable INTO v_custo_medio, v_is_storable 
            FROM produtos WHERE id = v_produto_id;

            SELECT id INTO v_deposito_id 
            FROM depositos 
            WHERE tenant_id = p_tenant_id AND (fazenda_id = p_fazenda_id OR fazenda_id IS NULL) 
            LIMIT 1;
        END IF;

        -- 3. Resolve target animals and insert into sanidade_animais
        v_dose := COALESCE(NULLIF(regexp_replace(item->>'dose', '[^0-9.]', '', 'g'), ''), '1')::NUMERIC;
        IF v_dose = 0 THEN v_dose := 1; END IF;

        v_fase := 'RECRIA';
        IF (item->>'lote_id') IS NOT NULL AND (item->>'lote_id') != '' THEN
            IF EXISTS (SELECT 1 FROM confinamento WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO') THEN
                v_fase := 'CONFINAMENTO';
            END IF;
            
            FOR v_animal IN (SELECT id FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO' AND deleted_at IS NULL)
            LOOP
                INSERT INTO sanidade_animais (
                    tenant_id, fazenda_id, sanidade_id, animal_id, produto_id, 
                    quantidade_dose, valor_unitario_aplicado, valor_total_aplicado, data_aplicacao, fase
                ) VALUES (
                    p_tenant_id, p_fazenda_id, v_sanidade_id, v_animal.id, v_produto_id, 
                    v_dose, v_custo_medio, v_dose * v_custo_medio, (item->>'data_manejo')::DATE, v_fase
                );
            END LOOP;
        ELSIF (item->>'animal_id') IS NOT NULL AND (item->>'animal_id') != '' THEN
            INSERT INTO sanidade_animais (
                tenant_id, fazenda_id, sanidade_id, animal_id, produto_id, 
                quantidade_dose, valor_unitario_aplicado, valor_total_aplicado, data_aplicacao, fase
            ) VALUES (
                p_tenant_id, p_fazenda_id, v_sanidade_id, (item->>'animal_id')::UUID, v_produto_id, 
                v_dose, v_custo_medio, v_dose * v_custo_medio, (item->>'data_manejo')::DATE, v_fase
            );
        END IF;

        -- 4. Give stock exit if storable
        IF v_is_storable AND v_produto_id IS NOT NULL AND v_deposito_id IS NOT NULL THEN
            DECLARE
                v_num_animais INT;
                v_total_qty NUMERIC;
            BEGIN
                IF (item->>'animal_id') IS NOT NULL AND (item->>'animal_id') != '' THEN
                    v_num_animais := 1;
                ELSE
                    SELECT COUNT(*) INTO v_num_animais FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO' AND deleted_at IS NULL;
                END IF;

                v_total_qty := v_dose * v_num_animais;

                IF v_total_qty > 0 THEN
                    INSERT INTO movimentacoes_estoque (
                        tenant_id, fazenda_id, produto_id, deposito_id, tipo, 
                        quantidade, custo_unitario, data_movimentacao, 
                        origem_destino, responsavel
                    ) VALUES (
                        p_tenant_id, p_fazenda_id, v_produto_id, v_deposito_id, 'SAIDA', 
                        v_total_qty, v_custo_medio, (item->>'data_manejo')::DATE, 
                        'Manejo Sanitário [REF:' || v_sanidade_id || ']: ' || COALESCE(item->>'titulo', item->>'produto', 'Aplicação'), 
                        COALESCE(item->>'veterinario', item->>'tecnico_resp', 'Sistema Automático')
                    );
                END IF;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. REESCRITA DA APPLY_HEALTH_PROTOCOL PARA USAR A ENGINE COMPLETA
CREATE OR REPLACE FUNCTION apply_health_protocol(p_payload JSON)
RETURNS VOID AS $$
DECLARE
    v_auth_tenant UUID;
    v_fazenda_id UUID;
    item JSON;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    
    -- Validação de segurança básica e extração da fazenda
    IF json_array_length(p_payload) > 0 THEN
        item := p_payload->0;
        IF (item->>'tenant_id')::UUID != v_auth_tenant THEN
            RAISE EXCEPTION 'Acesso Negado: Tentativa de injetar dados em outro tenant.';
        END IF;
        v_fazenda_id := (item->>'fazenda_id')::UUID;
        
        -- Encaminha a payload JSON inteira para a RPC de registro completo
        PERFORM register_health_event(p_payload, v_auth_tenant, v_fazenda_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
