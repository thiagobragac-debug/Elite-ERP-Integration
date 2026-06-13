-- =================================================================
-- MIGRATION: Auto-custeio em Sanidade e Recálculo Retroativo
-- Garantia: valor_total_aplicado SEMPRE correto via saldos_estoque
-- =================================================================

-- 1. Função que busca o custo_medio de saldos_estoque (melhor fonte)
-- e calcula valor_total_aplicado para sanidade_animais
CREATE OR REPLACE FUNCTION public.fn_calcular_custo_sanidade_animal()
RETURNS TRIGGER AS $$
DECLARE
  v_custo_medio numeric := 0;
BEGIN
  -- Só calcula se tem produto vinculado
  IF NEW.produto_id IS NOT NULL THEN
    -- Busca o custo_medio mais recente em saldos_estoque (média ponderada entre depósitos)
    SELECT COALESCE(
      SUM(custo_medio * quantidade) / NULLIF(SUM(quantidade), 0),
      0
    )
    INTO v_custo_medio
    FROM public.saldos_estoque
    WHERE produto_id = NEW.produto_id
      AND tenant_id = NEW.tenant_id;

    -- Fallback: se não há saldo (estoque negativo ou produto sem entrada ainda),
    -- usa custo_medio da tabela produtos
    IF v_custo_medio = 0 THEN
      SELECT COALESCE(custo_medio, 0)
      INTO v_custo_medio
      FROM public.produtos
      WHERE id = NEW.produto_id;
    END IF;

    -- Garante que dose seja positiva
    NEW.quantidade_dose := COALESCE(NEW.quantidade_dose, 1);
    IF NEW.quantidade_dose <= 0 THEN
      NEW.quantidade_dose := 1;
    END IF;

    -- Calcula e atribui os valores
    NEW.valor_unitario_aplicado := v_custo_medio;
    NEW.valor_total_aplicado    := NEW.quantidade_dose * v_custo_medio;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger que dispara ANTES de inserir ou atualizar sanidade_animais
DROP TRIGGER IF EXISTS trg_auto_custo_sanidade_animais ON public.sanidade_animais;
CREATE TRIGGER trg_auto_custo_sanidade_animais
BEFORE INSERT OR UPDATE OF produto_id, quantidade_dose
ON public.sanidade_animais
FOR EACH ROW
EXECUTE FUNCTION public.fn_calcular_custo_sanidade_animal();

-- 3. RPC de recálculo retroativo em lote (chama para corrigir todos os registros existentes)
CREATE OR REPLACE FUNCTION public.recalcular_sanidade_animais_batch(
  p_tenant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated int := 0;
  v_custo_medio numeric;
  r RECORD;
BEGIN
  FOR r IN
    SELECT sa.id, sa.produto_id, sa.quantidade_dose, sa.tenant_id
    FROM public.sanidade_animais sa
    WHERE sa.produto_id IS NOT NULL
      AND (p_tenant_id IS NULL OR sa.tenant_id = p_tenant_id)
  LOOP
    -- Busca custo_medio ponderado dos depósitos
    SELECT COALESCE(
      SUM(se.custo_medio * se.quantidade) / NULLIF(SUM(se.quantidade), 0),
      0
    )
    INTO v_custo_medio
    FROM public.saldos_estoque se
    WHERE se.produto_id = r.produto_id
      AND se.tenant_id = r.tenant_id;

    -- Fallback para tabela produtos
    IF v_custo_medio = 0 THEN
      SELECT COALESCE(custo_medio, 0)
      INTO v_custo_medio
      FROM public.produtos
      WHERE id = r.produto_id;
    END IF;

    -- Só atualiza se tiver custo para aplicar
    IF v_custo_medio > 0 THEN
      UPDATE public.sanidade_animais
      SET
        valor_unitario_aplicado = v_custo_medio,
        valor_total_aplicado    = COALESCE(quantidade_dose, 1) * v_custo_medio
      WHERE id = r.id;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('updated', v_updated, 'ok', true);
END;
$$;

-- 4. Atualiza função recalcular_custos_animal para também usar saldos_estoque
-- (chamada pelo trigger quando custo_medio de produto muda)
CREATE OR REPLACE FUNCTION public.recalcular_custos_animal(
  p_produto_id uuid,
  p_data_inicio date,
  p_novo_custo_medio numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza tratos/nutrição a partir da data
  UPDATE public.custos_animal
  SET
    valor_unitario_aplicado = p_novo_custo_medio,
    valor_total_aplicado    = quantidade_consumida * p_novo_custo_medio
  WHERE produto_id = p_produto_id
    AND data_consumo >= p_data_inicio;

  -- Atualiza aplicações de sanidade a partir da data
  UPDATE public.sanidade_animais
  SET
    valor_unitario_aplicado = p_novo_custo_medio,
    valor_total_aplicado    = quantidade_dose * p_novo_custo_medio
  WHERE produto_id = p_produto_id
    AND data_aplicacao >= p_data_inicio;
END;
$$;

-- 5. Executa o recálculo retroativo imediatamente para todos os tenants
-- (corrige os 19 registros existentes com produto_id)
SELECT public.recalcular_sanidade_animais_batch(NULL);
