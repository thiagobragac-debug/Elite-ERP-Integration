CREATE OR REPLACE FUNCTION public.process_romaneio_embarque(
    p_payload JSONB,
    p_tenant_id UUID,
    p_fazenda_id UUID
) RETURNS UUID AS $
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
                SELECT 1 FROM sanidade_animais s
                WHERE (s.animal_id = (v_animal->>'animal_id')::UUID OR s.lote_id = (SELECT lote_id FROM animais WHERE id = (v_animal->>'animal_id')::UUID))
                AND s.tenant_id = p_tenant_id
                AND s.carencia_dias > 0
                AND s.data_manejo + (s.carencia_dias * interval '1 day') >= CURRENT_DATE
            ) INTO v_has_carencia;
            
            IF v_has_carencia THEN
                RAISE EXCEPTION 'Ação bloqueada pelo banco de dados: O animal % possui carência sanitária ativa.', v_animal->>'brinco';
            END IF;
        END LOOP;
    END IF;

    -- 1. Gerar CÓDIGO único (ROM-YYYYMMDD-HHMMSS)
    v_codigo := 'ROM-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD-HH24MISS');

    -- 2. Inserir ROMANEIO HEADER
    INSERT INTO romaneios (
        tenant_id,
        fazenda_id,
        codigo,
        comprador,
        comprador_cnpj,
        comprador_ie,
        gta_numero,
        data,
        previsao_abate,
        frigorifico_destino,
        motorista_nome,
        motorista_cpf,
        veiculo_placa,
        status,
        valor_arroba_negociada,
        especie_id,
        aptidao_id
    ) VALUES (
        p_tenant_id,
        p_fazenda_id,
        v_codigo,
        p_payload->>'comprador',
        p_payload->>'comprador_cnpj',
        p_payload->>'comprador_ie',
        p_payload->>'gta_numero',
        (p_payload->>'data')::TIMESTAMP WITH TIME ZONE,
        (p_payload->>'previsao_abate')::TIMESTAMP WITH TIME ZONE,
        p_payload->>'frigorifico_destino',
        p_payload->>'motorista_nome',
        p_payload->>'motorista_cpf',
        p_payload->>'veiculo_placa',
        COALESCE(p_payload->>'status', 'PENDENTE'),
        (p_payload->>'valor_arroba_negociada')::NUMERIC,
        p_payload->>'especie_id',
        p_payload->>'aptidao_id'
    ) RETURNING id INTO v_romaneio_id;

    -- 3. Inserir ITENS DA CARGA e Atualizar Status do Animal
    IF jsonb_array_length(p_payload->'composicaoCarga') > 0 THEN
        FOR v_animal IN SELECT * FROM jsonb_array_elements(p_payload->'composicaoCarga')
        LOOP
            INSERT INTO romaneios_animais (
                tenant_id,
                romaneio_id,
                animal_id,
                peso_embarque
            ) VALUES (
                p_tenant_id,
                v_romaneio_id,
                (v_animal->>'animal_id')::UUID,
                (v_animal->>'peso')::NUMERIC
            );

            -- Marcar animal como EM_TRANSITO e definir lote_id como null temporariamente se configurado
            UPDATE animais 
            SET status = 'EM_TRANSITO'
            WHERE id = (v_animal->>'animal_id')::UUID
            AND tenant_id = p_tenant_id;
            
        END LOOP;
    END IF;

    RETURN v_romaneio_id;
END;
$ LANGUAGE plpgsql;

