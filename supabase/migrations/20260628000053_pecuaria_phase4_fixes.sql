-- ==========================================================
-- ELITE ERP - CORREÇÕES DE AUDITORIA FASE 4 (NUTRIÇÃO E KARDEX)
-- ==========================================================

-- 1. CORREÇÃO DA RPC DE TRATOS (Crash "nutricao_animais" e Rateio por Ingrediente)
CREATE OR REPLACE FUNCTION apply_nutrition_feed(p_payload JSON, p_tenant_id UUID, p_fazenda_id UUID)
RETURNS VOID AS $$
DECLARE
    item JSON;
    insumo JSON;
    v_animal RECORD;
    v_num_animais INT;
    v_qty_per_animal NUMERIC;
    v_value_per_animal NUMERIC;
    v_fase TEXT;
BEGIN
    FOR item IN SELECT * FROM json_array_elements(p_payload)
    LOOP
        -- Descobre total de animais vivos no lote (ou 1 se for animal_id direto)
        IF (item->>'animal_id') IS NOT NULL AND (item->>'animal_id') != '' THEN
            v_num_animais := 1;
        ELSE
            SELECT COUNT(id) INTO v_num_animais 
            FROM animais 
            WHERE lote_id = (item->>'lote_id')::UUID 
              AND status = 'ATIVO' 
              AND deleted_at IS NULL;
            
            IF v_num_animais = 0 THEN
                CONTINUE; -- Não há animais no lote, não podemos lançar trato
            END IF;
        END IF;

        -- Define a fase do lote/animal (RECRIA ou CONFINAMENTO)
        v_fase := 'RECRIA';
        IF (item->>'lote_id') IS NOT NULL AND (item->>'lote_id') != '' THEN
            IF EXISTS (SELECT 1 FROM confinamento WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO') THEN
                v_fase := 'CONFINAMENTO';
            END IF;
        END IF;

        FOR insumo IN SELECT * FROM json_array_elements(item->'insumos')
        LOOP
            -- Cálculos por insumo distribuídos pelos animais alvo
            v_qty_per_animal := ((insumo->>'quantidade')::NUMERIC / v_num_animais);
            v_value_per_animal := (((insumo->>'quantidade')::NUMERIC * (insumo->>'custo_medio')::NUMERIC) / v_num_animais);

            -- 1. Baixa de Estoque Global do Insumo
            INSERT INTO movimentacoes_estoque (
                tenant_id, fazenda_id, produto_id, deposito_id, tipo, 
                quantidade, custo_unitario, data_movimentacao, 
                origem_destino, responsavel
            ) VALUES (
                p_tenant_id, p_fazenda_id, (insumo->>'produto_id')::UUID, 
                (item->>'deposito_id')::UUID, 'SAIDA', 
                (insumo->>'quantidade')::NUMERIC, (insumo->>'custo_medio')::NUMERIC, 
                (item->>'data_trato')::DATE, 'Trato Animal [Dieta: ' || COALESCE(item->>'dieta_nome', 'N/A') || ']', 'Sistema Automático'
            );

            -- 2. Rateio Individual no Taxímetro (custos_animal) - Para o motor do Kardex funcionar
            IF (item->>'animal_id') IS NOT NULL AND (item->>'animal_id') != '' THEN
                INSERT INTO custos_animal (
                    tenant_id, fazenda_id, animal_id, dieta_id, produto_id, lote_id,
                    quantidade_consumida, valor_unitario_aplicado, valor_total_aplicado, data_consumo, fase
                ) VALUES (
                    p_tenant_id, p_fazenda_id, (item->>'animal_id')::UUID, 
                    (item->>'dieta_id')::UUID, (insumo->>'produto_id')::UUID, (item->>'lote_id')::UUID,
                    v_qty_per_animal, (insumo->>'custo_medio')::NUMERIC, 
                    v_value_per_animal, (item->>'data_trato')::DATE, v_fase
                );
            ELSE
                FOR v_animal IN (SELECT id FROM animais WHERE lote_id = (item->>'lote_id')::UUID AND status = 'ATIVO' AND deleted_at IS NULL)
                LOOP
                    INSERT INTO custos_animal (
                        tenant_id, fazenda_id, animal_id, dieta_id, produto_id, lote_id,
                        quantidade_consumida, valor_unitario_aplicado, valor_total_aplicado, data_consumo, fase
                    ) VALUES (
                        p_tenant_id, p_fazenda_id, v_animal.id, 
                        (item->>'dieta_id')::UUID, (insumo->>'produto_id')::UUID, (item->>'lote_id')::UUID,
                        v_qty_per_animal, (insumo->>'custo_medio')::NUMERIC, 
                        v_value_per_animal, (item->>'data_trato')::DATE, v_fase
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
