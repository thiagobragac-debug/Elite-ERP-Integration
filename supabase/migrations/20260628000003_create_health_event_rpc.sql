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
        -- 1. Insert into sanidade
        -- Assuming JSON keys map exactly to table columns based on the frontend payload
        INSERT INTO sanidade (
            tenant_id, fazenda_id, lote_id, animal_id, data_manejo, 
            titulo, produto, produto_id, dose,
            status, veterinario, observacoes, created_at, updated_at
        ) VALUES (
            p_tenant_id, p_fazenda_id, 
            NULLIF(item->>'lote_id', '')::UUID, NULLIF(item->>'animal_id', '')::UUID, 
            (item->>'data_manejo')::DATE, item->>'titulo', 
            item->>'produto', NULLIF(item->>'produto_id', '')::UUID, item->>'dose', 
            item->>'status', item->>'veterinario', 
            item->>'observacoes', NOW(), NOW()
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

            -- Get first active deposit for the farm or null
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
            
            FOR v_animal IN (SELECT id FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO')
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
            -- Calculate total quantity (dose * number of target animals)
            DECLARE
                v_num_animais INT;
                v_total_qty NUMERIC;
            BEGIN
                IF (item->>'animal_id') IS NOT NULL AND (item->>'animal_id') != '' THEN
                    v_num_animais := 1;
                ELSE
                    SELECT COUNT(*) INTO v_num_animais FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO';
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
                        COALESCE(item->>'veterinario', 'Sistema Automático')
                    );
                END IF;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
