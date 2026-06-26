-- ==========================================================
-- MIGRATION: RPC Atômica para Remanejamento de Animais
-- Resolve P1 (atomicidade), P2 (status normalization), P3 (timestamptz)
-- ==========================================================

-- ─── 1. Normalizar status dos animais (P2) ────────────────────────────────────
-- Garante que o campo status seja sempre uppercase antes de salvar
CREATE OR REPLACE FUNCTION public.trg_normalize_animal_status()
RETURNS trigger AS $$
BEGIN
  NEW.status := UPPER(TRIM(NEW.status));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_animal_status_normalize ON public.animais;
CREATE TRIGGER trg_animal_status_normalize
  BEFORE INSERT OR UPDATE ON public.animais
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_normalize_animal_status();

-- Normalizar dados históricos inconsistentes
UPDATE public.animais
SET status = UPPER(TRIM(status))
WHERE status IS DISTINCT FROM UPPER(TRIM(status));

-- ─── 2. Adicionar campo requer_gta no historico_movimentacao_animal ───────────
ALTER TABLE public.historico_movimentacao_animal
  ADD COLUMN IF NOT EXISTS requer_gta       boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS gta_confirmada   boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_id          uuid     REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS fazenda_origem_id uuid    REFERENCES public.fazendas(id);

-- ─── 3. RPC Principal — relocate_animals (P1 + P3) ───────────────────────────
-- Executa UPDATE nos animais + INSERT no histórico em bloco atômico.
-- Se qualquer parte falhar, NADA é commitado (transação PostgreSQL garantida).
CREATE OR REPLACE FUNCTION public.relocate_animals(
  p_animal_ids          uuid[],
  p_source_lot_id       uuid,
  p_target_lot_id       uuid,
  p_date                date,
  p_motivo              text,
  p_tenant_id           uuid,
  p_user_id             uuid,
  p_gta_confirmada      boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_fazenda_id uuid;
  v_target_fazenda_id uuid;
  v_requer_gta        boolean := false;
  v_count             int;
BEGIN
  -- Validações de entrada
  IF p_animal_ids IS NULL OR array_length(p_animal_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum animal informado.');
  END IF;

  IF p_source_lot_id = p_target_lot_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lote de origem e destino são iguais.');
  END IF;

  -- Verificar fazendas para flag GTA
  SELECT fazenda_id INTO v_source_fazenda_id FROM public.lotes WHERE id = p_source_lot_id;
  SELECT fazenda_id INTO v_target_fazenda_id FROM public.lotes WHERE id = p_target_lot_id;

  v_requer_gta := (v_source_fazenda_id IS DISTINCT FROM v_target_fazenda_id)
                  AND (v_source_fazenda_id IS NOT NULL)
                  AND (v_target_fazenda_id IS NOT NULL);

  -- Se requer GTA e não foi confirmada, bloquear
  IF v_requer_gta AND NOT p_gta_confirmada THEN
    RETURN jsonb_build_object(
      'success',     false,
      'error',       'Movimentação entre fazendas requer confirmação de GTA.',
      'requer_gta',  true
    );
  END IF;

  -- ── OPERAÇÃO ATÔMICA (dentro da mesma transação PostgreSQL) ──────────────

  -- 1. Atualizar lote dos animais
  UPDATE public.animais
  SET lote_id    = p_target_lot_id,
      updated_at = now()
  WHERE id        = ANY(p_animal_ids)
    AND tenant_id = p_tenant_id
    AND status    = 'ATIVO';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum animal ativo foi atualizado. Verifique os IDs informados.');
  END IF;

  -- 2. Inserir histórico de movimentação por animal (P3: data correta)
  INSERT INTO public.historico_movimentacao_animal (
    animal_id,
    lote_origem_id,
    lote_destino_id,
    data_movimentacao,
    motivo,
    tenant_id,
    fazenda_id,
    fazenda_origem_id,
    requer_gta,
    gta_confirmada,
    user_id
  )
  SELECT
    unnest(p_animal_ids),
    p_source_lot_id,
    p_target_lot_id,
    -- P3: converte date para timestamptz no fuso de Brasília (UTC-3)
    (p_date::text || ' 12:00:00-03:00')::timestamptz,
    p_motivo,
    p_tenant_id,
    v_target_fazenda_id,
    v_source_fazenda_id,
    v_requer_gta,
    p_gta_confirmada,
    p_user_id;

  RETURN jsonb_build_object(
    'success',      true,
    'transferred',  v_count,
    'requer_gta',   v_requer_gta
  );
END;
$$;

-- RLS: apenas usuários autenticados com tenant correto podem chamar
REVOKE ALL ON FUNCTION public.relocate_animals FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.relocate_animals TO authenticated;
