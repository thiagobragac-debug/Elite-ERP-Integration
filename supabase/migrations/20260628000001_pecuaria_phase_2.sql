-- MIGRATION PHASE 2: PECUÁRIA OPTIMIZATION
-- 1. Transação atômica para lançamento de trato nutricional
CREATE OR REPLACE FUNCTION apply_nutrition_feed(p_payload JSON, p_tenant_id UUID, p_fazenda_id UUID)
RETURNS VOID AS $$
DECLARE
    item JSON;
    insumo JSON;
    v_animal RECORD;
    v_num_animais INT;
    v_qty_per_animal NUMERIC;
    v_value_per_animal NUMERIC;
BEGIN
    FOR item IN SELECT * FROM json_array_elements(p_payload)
    LOOP
        -- Descobre total de animais no lote (ou 1 se for animal_id direto)
        IF (item->>'animal_id') IS NOT NULL THEN
            v_num_animais := 1;
        ELSE
            SELECT COUNT(id) INTO v_num_animais 
            FROM animais 
            WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO';
            
            IF v_num_animais = 0 THEN
                v_num_animais := 1; -- Fallback prevent division by zero
            END IF;
        END IF;

        -- Calcula as métricas globais para a distribuição
        v_qty_per_animal := 0;
        v_value_per_animal := 0;

        FOR insumo IN SELECT * FROM json_array_elements(item->'insumos')
        LOOP
            v_qty_per_animal := v_qty_per_animal + ((insumo->>'quantidade')::NUMERIC / v_num_animais);
            v_value_per_animal := v_value_per_animal + (((insumo->>'quantidade')::NUMERIC * (insumo->>'custo_medio')::NUMERIC) / v_num_animais);

            -- Baixa de Estoque
            INSERT INTO movimentacoes_estoque (
                tenant_id, fazenda_id, produto_id, deposito_id, tipo, 
                quantidade, custo_unitario, data_movimentacao, 
                origem_destino, responsavel
            ) VALUES (
                p_tenant_id, p_fazenda_id, (insumo->>'produto_id')::UUID, 
                (item->>'deposito_id')::UUID, 'SAIDA', 
                (insumo->>'quantidade')::NUMERIC, (insumo->>'custo_medio')::NUMERIC, 
                (item->>'data_trato')::DATE, 'Trato Animal', 'Sistema Automático'
            );
        END LOOP;

        -- Rateio nos animais
        IF (item->>'animal_id') IS NOT NULL THEN
            INSERT INTO nutricao_animais (
                tenant_id, fazenda_id, animal_id, dieta_id, lote_id,
                quantidade_kg, valor_unitario_kg, valor_total_consumido, data_consumo, fase
            ) VALUES (
                p_tenant_id, p_fazenda_id, (item->>'animal_id')::UUID, 
                (item->>'dieta_id')::UUID, (item->>'lote_id')::UUID,
                v_qty_per_animal, CASE WHEN v_qty_per_animal > 0 THEN v_value_per_animal / v_qty_per_animal ELSE 0 END, 
                v_value_per_animal, (item->>'data_trato')::DATE, 'CRIA'
            );
        ELSE
            FOR v_animal IN (SELECT id FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO')
            LOOP
                INSERT INTO nutricao_animais (
                    tenant_id, fazenda_id, animal_id, dieta_id, lote_id,
                    quantidade_kg, valor_unitario_kg, valor_total_consumido, data_consumo, fase
                ) VALUES (
                    p_tenant_id, p_fazenda_id, v_animal.id, 
                    (item->>'dieta_id')::UUID, (item->>'lote_id')::UUID,
                    v_qty_per_animal, CASE WHEN v_qty_per_animal > 0 THEN v_value_per_animal / v_qty_per_animal ELSE 0 END, 
                    v_value_per_animal, (item->>'data_trato')::DATE, 'CRIA'
                );
            END LOOP;
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Estatísticas Agregadas de Performance do Lote
CREATE OR REPLACE FUNCTION get_lot_weight_performance(p_tenant_id UUID, p_lote_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_top_performers JSON;
BEGIN
    WITH lot_weighings AS (
        SELECT 
            p.peso,
            p.gmd,
            a.raca,
            a.brinco,
            a.nome,
            a.id as animal_id
        FROM pesagens p
        JOIN animais a ON p.animal_id = a.id
        WHERE p.tenant_id = p_tenant_id 
        AND (p_lote_id IS NULL OR a.lote_id = p_lote_id)
        AND a.status = 'ATIVO'
    ),
    stats AS (
        SELECT 
            COUNT(*) as total_pesagens,
            COALESCE(AVG(peso), 0) as avg_weight,
            COALESCE(AVG(gmd), 0) as avg_gmd,
            MODE() WITHIN GROUP (ORDER BY raca) as dominant_breed,
            COUNT(*) FILTER (WHERE peso < 350) as count_light,
            COUNT(*) FILTER (WHERE peso >= 350 AND peso < 450) as count_recria,
            COUNT(*) FILTER (WHERE peso >= 450 AND peso < 500) as count_termination,
            COUNT(*) FILTER (WHERE peso >= 500) as count_ready
        FROM lot_weighings
    )
    SELECT json_agg(t) INTO v_top_performers FROM (
        SELECT 
            animal_id, brinco, raca, nome, gmd, peso
        FROM lot_weighings
        ORDER BY gmd DESC NULLS LAST
        LIMIT 5
    ) t;

    SELECT json_build_object(
        'avgWeight', avg_weight,
        'avgGmd', avg_gmd,
        'totalCount', total_pesagens,
        'dominantBreed', dominant_breed,
        'topPerformers', COALESCE(v_top_performers, '[]'::json),
        'classes', json_build_object(
            'light', count_light,
            'recria', count_recria,
            'termination', count_termination,
            'ready', count_ready
        )
    ) INTO result
    FROM stats;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Transação atômica para registro de Reforma de Pastagem
CREATE OR REPLACE FUNCTION register_pasture_renovation_step(p_payload JSON, p_tenant_id UUID, p_fazenda_id UUID)
RETURNS VOID AS $$
DECLARE
    v_reforma JSON := p_payload->'reforma';
    v_etapa JSON := p_payload->'nova_etapa';
    v_reforma_id UUID;
    v_item JSON;
BEGIN
    -- Upsert na Reforma
    IF (v_reforma->>'id') IS NOT NULL AND (v_reforma->>'id') != '' THEN
        v_reforma_id := (v_reforma->>'id')::UUID;
        UPDATE reformas_pasto SET 
            status = v_reforma->>'status',
            objetivo = v_reforma->>'objetivo',
            analise_v_percent = (v_reforma->>'analise_v_percent')::NUMERIC,
            analise_p_mgdm3 = (v_reforma->>'analise_p_mgdm3')::NUMERIC,
            analise_ca_cmolc = (v_reforma->>'analise_ca_cmolc')::NUMERIC,
            foto_antes_url = v_reforma->>'foto_antes_url',
            foto_depois_url = v_reforma->>'foto_depois_url',
            observacoes = v_reforma->>'observacoes'
        WHERE id = v_reforma_id;
    ELSE
        INSERT INTO reformas_pasto (
            pasto_id, tenant_id, fazenda_id, data_inicio, status, objetivo,
            analise_v_percent, analise_p_mgdm3, analise_ca_cmolc, 
            foto_antes_url, foto_depois_url, observacoes
        ) VALUES (
            (v_reforma->>'pasto_id')::UUID, p_tenant_id, p_fazenda_id, 
            (v_reforma->>'data_inicio')::DATE, v_reforma->>'status', v_reforma->>'objetivo',
            (v_reforma->>'analise_v_percent')::NUMERIC, (v_reforma->>'analise_p_mgdm3')::NUMERIC, (v_reforma->>'analise_ca_cmolc')::NUMERIC,
            v_reforma->>'foto_antes_url', v_reforma->>'foto_depois_url', v_reforma->>'observacoes'
        ) RETURNING id INTO v_reforma_id;
    END IF;

    -- Inserção da Etapa
    INSERT INTO reforma_etapas (
        tenant_id, reforma_id, tipo_etapa, data_registro, maquina_id,
        horas_trabalhadas, custo_hora, itens_consumidos, custo_etapa, observacoes
    ) VALUES (
        p_tenant_id, v_reforma_id, v_etapa->>'tipo_etapa', (v_etapa->>'data_registro')::DATE, 
        (v_etapa->>'maquina_id')::UUID,
        (v_etapa->>'horas_trabalhadas')::NUMERIC, (v_etapa->>'custo_hora')::NUMERIC, 
        v_etapa->'itens_consumidos', (v_etapa->>'custo_etapa')::NUMERIC, v_etapa->>'observacoes'
    );

    -- Baixa de Estoque
    IF json_typeof(v_etapa->'itens_consumidos') = 'array' THEN
        FOR v_item IN SELECT * FROM json_array_elements(v_etapa->'itens_consumidos')
        LOOP
            IF (v_item->>'produto_id') IS NOT NULL AND (v_item->>'produto_id') != '' THEN
                INSERT INTO movimentacoes_estoque (
                    tenant_id, fazenda_id, produto_id, deposito_id, tipo, 
                    quantidade, custo_unitario, data_movimentacao, 
                    origem_destino, responsavel
                ) VALUES (
                    p_tenant_id, p_fazenda_id, (v_item->>'produto_id')::UUID, 
                    (v_item->>'deposito_id')::UUID, 'SAIDA', 
                    (v_item->>'quantidade')::NUMERIC, (v_item->>'valor_unitario')::NUMERIC, 
                    CURRENT_DATE, 'REFORMA_PASTO', 'Sistema Automático'
                );
            END IF;
        END LOOP;
    END IF;

    -- Update Pasto Status
    IF v_reforma->>'status' = 'concluida' THEN
        UPDATE pastos SET status = 'resting' WHERE id = (v_reforma->>'pasto_id')::UUID;
    ELSE
        UPDATE pastos SET status = 'em_reforma' WHERE id = (v_reforma->>'pasto_id')::UUID;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
