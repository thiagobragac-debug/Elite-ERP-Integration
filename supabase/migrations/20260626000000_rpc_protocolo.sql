CREATE OR REPLACE FUNCTION iniciar_protocolo_reprodutivo(
  p_tenant_id uuid,
  p_farm_id uuid,
  p_template_id uuid,
  p_nome text,
  p_tipo text,
  p_data_inicio date,
  p_tecnico_resp text,
  p_touro_id uuid,
  p_data_fim_monta date,
  p_observacoes text,
  p_etapas jsonb,
  p_animais uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_protocolo_id uuid;
  v_etapa jsonb;
  v_animal_id uuid;
  v_etapa_id uuid;
  v_tipo_evento text;
  v_ref_label text;
BEGIN
  -- 1. Inserir o Protocolo
  INSERT INTO protocolos_reprodutivos (
    tenant_id, farm_id, template_id, nome, tipo, data_inicio, tecnico_resp,
    touro_id, data_fim_monta, observacoes, status, created_at, updated_at
  ) VALUES (
    p_tenant_id, p_farm_id, p_template_id, p_nome, p_tipo, p_data_inicio, p_tecnico_resp,
    p_touro_id, p_data_fim_monta, p_observacoes, 'ativo', now(), now()
  ) RETURNING id INTO v_protocolo_id;

  v_ref_label := '[PROTOCOLO:' || v_protocolo_id || ']';

  -- 2. Loop pelas Etapas
  FOR v_etapa IN SELECT * FROM jsonb_array_elements(p_etapas)
  LOOP
    INSERT INTO protocolo_etapas (
      protocolo_id, nome_etapa, dia_relativo, data_prevista, tipo_acao,
      instrucao, obrigatorio, ordem, status
    ) VALUES (
      v_protocolo_id,
      v_etapa->>'nome_etapa',
      (v_etapa->>'dia_relativo')::int,
      (v_etapa->>'data_prevista')::date,
      v_etapa->>'tipo_acao',
      v_etapa->>'instrucao',
      COALESCE((v_etapa->>'obrigatorio')::boolean, true),
      (v_etapa->>'ordem')::int,
      'pendente'
    ) RETURNING id INTO v_etapa_id;

    -- Mapear tipo_evento granular
    v_tipo_evento := CASE v_etapa->>'tipo_acao'
      WHEN 'farmaco' THEN 'Medicamento'
      WHEN 'ia' THEN 'IA'
      WHEN 'diagnostico' THEN 'Diagnóstico'
      WHEN 'observacao' THEN 'Observação'
      ELSE p_tipo
    END;

    -- 3. Loop pelos Animais para gerar Eventos
    FOREACH v_animal_id IN ARRAY p_animais
    LOOP
      -- Inserir evento reprodutivo
      INSERT INTO eventos_reprodutivos (
        tenant_id, farm_id, animal_id, protocolo_id, tipo_evento,
        data_evento, status, resultado, observacoes, tecnico, created_at
      ) VALUES (
        p_tenant_id, p_farm_id, v_animal_id, v_protocolo_id, v_tipo_evento,
        (v_etapa->>'data_prevista')::date, 'pendente', '',
        (v_etapa->>'nome_etapa') || ' — ' || v_ref_label,
        p_tecnico_resp, now()
      );

      -- Inserir sanidade APENAS se for farmaco
      IF v_etapa->>'tipo_acao' = 'farmaco' THEN
        INSERT INTO sanidade (
          tenant_id, farm_id, animal_id, titulo, tipo, produto, data_manejo,
          status, observacao, veterinario, created_at
        ) VALUES (
          p_tenant_id, p_farm_id, v_animal_id, v_etapa->>'nome_etapa', 'medicamento',
          SPLIT_PART(v_etapa->>'instrucao', E'\n', 1),
          (v_etapa->>'data_prevista')::date, 'PENDENTE',
          'Protocolo Reprodutivo: ' || p_nome || ' ' || v_ref_label,
          p_tecnico_resp, now()
        );
      END IF;
    END LOOP;
  END LOOP;

  -- 4. Associar Animais ao Protocolo (tabela protocolo_animais)
  FOREACH v_animal_id IN ARRAY p_animais
  LOOP
    INSERT INTO protocolo_animais (
      protocolo_id, animal_id, lote_id
    )
    SELECT v_protocolo_id, id, lote_id
    FROM animais
    WHERE id = v_animal_id;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'protocolo_id', v_protocolo_id);
END;
$$ LANGUAGE plpgsql;
