-- ==========================================================
-- ELITE ERP - CORREÇÕES DE AUDITORIA FASE 3 (REPRODUÇÃO)
-- ==========================================================

-- 1. CORREÇÃO DA DELEÇÃO DE REPRODUÇÃO (Crash e Quebra de Auditoria)
CREATE OR REPLACE FUNCTION rpc_delete_reproduction_event(p_event_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Estorno das movimentações de estoque atreladas ao evento
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
    WHERE tenant_id = p_tenant_id AND origem_destino LIKE '%[REF:' || p_event_id || ']%';

    -- 2. Invalida os custos inseridos (sanidade_animais não tem deleted_at, então apagamos o vínculo de custo)
    DELETE FROM public.sanidade_animais 
    WHERE sanidade_id IN (
        SELECT id FROM public.sanidade 
        WHERE tenant_id = p_tenant_id AND observacao LIKE '%[REF:' || p_event_id || ']%'
    );

    -- 3. Soft Delete nos eventos de sanidade vinculados
    UPDATE public.sanidade 
    SET deleted_at = NOW(), status = 'CANCELADO'
    WHERE tenant_id = p_tenant_id AND observacao LIKE '%[REF:' || p_event_id || ']%';

    -- 4. Soft Delete no evento reprodutivo
    UPDATE public.eventos_reprodutivos 
    SET deleted_at = NOW(), status = 'CANCELADO'
    WHERE tenant_id = p_tenant_id AND id = p_event_id;

END;
$$;


-- 2. CORREÇÃO DO CUSTEIO DO MANEJO REPRODUTIVO (Vinculação no Kardex)
CREATE OR REPLACE FUNCTION register_reproduction_event(
    p_repro_payload JSONB,
    p_animal_id UUID,
    p_resultado TEXT,
    p_produtos JSONB,
    p_insert_payload JSONB,
    p_event_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID := p_event_id;
    v_fase_atual TEXT;
    v_total_custo_repro NUMERIC := 0;
    v_produto JSONB;
    v_sanidade_id UUID;
    v_produto_db RECORD;
    v_custo_calc NUMERIC;
BEGIN
    -- 1. Calcular Custo Total dos Produtos
    IF jsonb_array_length(p_produtos) > 0 THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(p_produtos)
        LOOP
            v_total_custo_repro := v_total_custo_repro + (
                (v_produto->>'quantidade')::NUMERIC * COALESCE((v_produto->>'custo_medio')::NUMERIC, (v_produto->>'valor_unitario')::NUMERIC, 0)
            );
        END LOOP;
    END IF;

    p_repro_payload := jsonb_set(p_repro_payload, '{custo}', to_jsonb(v_total_custo_repro));

    -- 2. Insert ou Update no Evento
    IF v_event_id IS NOT NULL THEN
        UPDATE eventos_reprodutivos
        SET
            tipo_evento = p_repro_payload->>'tipo_evento',
            status = p_repro_payload->>'status',
            resultado = p_repro_payload->>'resultado',
            ecc = (p_repro_payload->>'ecc')::NUMERIC,
            touro = p_repro_payload->>'touro',
            observacoes = p_repro_payload->>'observacoes',
            data_evento = (p_repro_payload->>'data_evento')::DATE,
            data_cobertura = (p_repro_payload->>'data_cobertura')::DATE,
            data_parto_previsto = (p_repro_payload->>'data_parto_previsto')::DATE,
            custo = (p_repro_payload->>'custo')::NUMERIC
        WHERE id = v_event_id;
    ELSE
        INSERT INTO eventos_reprodutivos (
            animal_id, tipo_evento, status, resultado, ecc, touro, observacoes, 
            data_evento, data_cobertura, data_parto_previsto, custo,
            tenant_id, fazenda_id
        )
        VALUES (
            p_animal_id,
            p_repro_payload->>'tipo_evento',
            p_repro_payload->>'status',
            p_repro_payload->>'resultado',
            (p_repro_payload->>'ecc')::NUMERIC,
            p_repro_payload->>'touro',
            p_repro_payload->>'observacoes',
            (p_repro_payload->>'data_evento')::DATE,
            (p_repro_payload->>'data_cobertura')::DATE,
            (p_repro_payload->>'data_parto_previsto')::DATE,
            (p_repro_payload->>'custo')::NUMERIC,
            (p_insert_payload->>'tenant_id')::UUID,
            (p_insert_payload->>'fazenda_id')::UUID
        ) RETURNING id INTO v_event_id;
    END IF;

    -- 3. Atualizar Dossiê do Animal
    IF p_resultado = 'Prenha' THEN
        v_fase_atual := 'Prenha';
    ELSIF p_resultado = 'Vazia' THEN
        v_fase_atual := 'Vazia';
    ELSIF p_repro_payload->>'tipo_evento' = 'Parto' THEN
        v_fase_atual := 'Lactação';
    END IF;

    IF v_fase_atual IS NOT NULL THEN
        UPDATE animais SET fase_atual = v_fase_atual WHERE id = p_animal_id;
    END IF;

    -- 4. Efeito Cascata: Sanidade e Estoque
    IF jsonb_array_length(p_produtos) > 0 THEN
        FOR v_produto IN SELECT * FROM jsonb_array_elements(p_produtos)
        LOOP
            -- Buscar infos do produto
            SELECT id, is_storable, nome INTO v_produto_db 
            FROM produtos 
            WHERE id = (v_produto->>'produto_id')::UUID;

            v_custo_calc := (v_produto->>'quantidade')::NUMERIC * COALESCE((v_produto->>'custo_medio')::NUMERIC, (v_produto->>'valor_unitario')::NUMERIC, 0);

            -- 4.1 Inserir na Sanidade (Master)
            INSERT INTO sanidade (
                produto, produto_id, dose, data_manejo, animal_id, status, observacao, tenant_id, fazenda_id
            ) VALUES (
                COALESCE(v_produto_db.nome, 'Produto ID ' || (v_produto->>'produto_id')),
                v_produto_db.id,
                (v_produto->>'quantidade') || ' un',
                (p_repro_payload->>'data_evento')::DATE,
                p_animal_id,
                'REALIZADO',
                'Fármaco aplicado em manejo reprodutivo [REF:' || v_event_id || ']',
                (p_insert_payload->>'tenant_id')::UUID,
                (p_insert_payload->>'fazenda_id')::UUID
            ) RETURNING id INTO v_sanidade_id;

            -- 4.2 Inserir Sanidade_Animais (Taxímetro do Animal) - AGORA COM PRODUTO_ID e DOSAGEM PARA KARDEX!
            INSERT INTO sanidade_animais (
                sanidade_id, animal_id, produto_id, quantidade_dose, valor_unitario_aplicado, 
                data_aplicacao, valor_total_aplicado, tenant_id, fazenda_id
            ) VALUES (
                v_sanidade_id, p_animal_id, v_produto_db.id, (v_produto->>'quantidade')::NUMERIC, COALESCE((v_produto->>'custo_medio')::NUMERIC, (v_produto->>'valor_unitario')::NUMERIC, 0),
                (p_repro_payload->>'data_evento')::DATE, v_custo_calc,
                (p_insert_payload->>'tenant_id')::UUID, (p_insert_payload->>'fazenda_id')::UUID
            );

            -- 4.3 Baixa de Estoque
            IF v_produto_db.is_storable = TRUE AND (v_produto->>'deposito_id') IS NOT NULL THEN
                PERFORM processar_saida_estoque(
                    (v_produto->>'produto_id')::UUID,
                    (v_produto->>'deposito_id')::UUID,
                    (v_produto->>'quantidade')::NUMERIC,
                    COALESCE((v_produto->>'valor_unitario')::NUMERIC, 0),
                    (p_insert_payload->>'tenant_id')::UUID,
                    (p_insert_payload->>'fazenda_id')::UUID,
                    'MANEJO_REPRODUTIVO',
                    v_event_id,
                    NULL
                );
            END IF;
        END LOOP;
    END IF;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
