-- Migração para validar restrição sanitária (Carência) no Romaneio/Embarque

CREATE OR REPLACE FUNCTION process_romaneio_embarque(
    p_payload JSONB,
    p_tenant_id UUID,
    p_fazenda_id UUID
) RETURNS UUID AS $$
DECLARE
    v_romaneio_id UUID;
    v_codigo TEXT;
    v_animal JSONB;
    v_has_carencia BOOLEAN;
BEGIN
    -- 0. Validação Hard de Carência Sanitária
    IF jsonb_array_length(p_payload->'composicaoCarga') > 0 THEN
        FOR v_animal IN SELECT * FROM jsonb_array_elements(p_payload->'composicaoCarga')
        LOOP
            IF (v_animal->>'em_carencia')::BOOLEAN = true THEN
                RAISE EXCEPTION 'Ação bloqueada: O animal % (Brinco: %) está em período de carência sanitária e não pode ser embarcado.', v_animal->>'animal_id', v_animal->>'brinco';
            END IF;
            
            -- Validação extra direto na tabela sanidade para segurança máxima
            SELECT EXISTS (
                SELECT 1 FROM sanidade s
                WHERE (s.animal_id = (v_animal->>'animal_id')::UUID OR s.lote_id = (SELECT lote_id FROM animais WHERE id = (v_animal->>'animal_id')::UUID))
                AND s.tenant_id = p_tenant_id
                AND s.carencia_dias > 0
                AND s.data_manejo + (s.carencia_dias * interval '1 day') >= CURRENT_DATE
            ) INTO v_has_carencia;
            
            IF v_has_carencia THEN
                RAISE EXCEPTION 'Bloqueio do Sistema: O animal % possui registro sanitário com período de carência ativo no banco de dados.', v_animal->>'brinco';
            END IF;
        END LOOP;
    END IF;

    -- 1. Insert do Romaneio Master
    v_codigo := p_payload->'formData'->>'gta_numero';
    IF v_codigo IS NULL OR v_codigo = '' THEN
        v_codigo := floor(random() * 900000 + 100000)::text;
    END IF;

    INSERT INTO romaneios (
        tenant_id,
        fazenda_id,
        codigo,
        comprador,
        comprador_cnpj,
        destino,
        data,
        status,
        animais_qtd,
        valor_estimado,
        nfe,
        gta_numero,
        placa,
        motorista,
        observacoes,
        composicao_carga
    ) VALUES (
        p_tenant_id,
        p_fazenda_id,
        v_codigo,
        p_payload->'formData'->>'comprador',
        p_payload->'formData'->>'comprador_cnpj',
        p_payload->'formData'->>'destino',
        (p_payload->'formData'->>'data_embarque')::DATE,
        'Concluído', -- Expedido instantaneamente
        (p_payload->>'animaisQtd')::INTEGER,
        (p_payload->>'valorTotal')::NUMERIC,
        p_payload->'formData'->>'nfe_numero',
        p_payload->'formData'->>'gta_numero',
        p_payload->'formData'->>'placa_veiculo',
        p_payload->'formData'->>'motorista',
        p_payload->'formData'->>'observacoes',
        p_payload->'composicaoCarga'
    ) RETURNING id INTO v_romaneio_id;

    -- 2. Bulk Insert e Atualização de Animais
    IF jsonb_array_length(p_payload->'animais') > 0 THEN
        FOR v_animal IN SELECT * FROM jsonb_array_elements(p_payload->'animais')
        LOOP
            -- Pivot table
            INSERT INTO romaneios_animais (
                tenant_id,
                romaneio_id,
                animal_id,
                peso_embarque
            ) VALUES (
                p_tenant_id,
                v_romaneio_id,
                (v_animal->>'id')::UUID,
                (v_animal->>'peso_atual')::NUMERIC
            );

            -- Atualiza o Animal
            UPDATE animais 
            SET 
                status = 'VENDIDO',
                lote_id = NULL
            WHERE id = (v_animal->>'id')::UUID;
        END LOOP;
    END IF;

    RETURN v_romaneio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
