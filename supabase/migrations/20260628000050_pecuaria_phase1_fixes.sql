-- ==========================================================
-- ELITE ERP - CORREÇÕES DE AUDITORIA FASE 1 (PECUÁRIA)
-- ==========================================================

-- 1. CORREÇÃO CRÍTICA DE RLS (Vazamento Multi-Tenant)
-- Revertendo a falha onde tenant_id era comparado com auth.uid() ao invés do helper.

DROP POLICY IF EXISTS "tenant_animais_select" ON public.animais;
CREATE POLICY "tenant_animais_select" ON public.animais
  FOR SELECT USING (tenant_id = auth_helpers.get_auth_tenant() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "tenant_lotes_select" ON public.lotes;
CREATE POLICY "tenant_lotes_select" ON public.lotes
  FOR SELECT USING (tenant_id = auth_helpers.get_auth_tenant() AND deleted_at IS NULL);

-- 2. CORREÇÃO DA RPC DE BULK MANAGEMENT (Regra de Negócio de Pesagem)
-- A trigger 'trg_sincroniza_peso_animal' já sincroniza o peso_atual após a inserção em 'pesagens'.
-- O UPDATE redundante (e errado, que mudava peso_entrada) foi removido.
CREATE OR REPLACE FUNCTION public.rpc_bulk_animal_management(
  p_tenant_id UUID,
  p_animal_ids UUID[],
  p_new_lote_id UUID DEFAULT NULL,
  p_new_weight NUMERIC DEFAULT NULL,
  p_weight_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_animal_id UUID;
BEGIN
  FOREACH v_animal_id IN ARRAY p_animal_ids
  LOOP
    -- Mudar Lote se fornecido
    IF p_new_lote_id IS NOT NULL THEN
      UPDATE public.animais SET lote_id = p_new_lote_id WHERE id = v_animal_id AND tenant_id = p_tenant_id;
    END IF;
    
    -- Inserir Pesagem se fornecida (A trigger fará o sync para a tabela animais)
    IF p_new_weight IS NOT NULL THEN
      INSERT INTO public.pesagens (tenant_id, animal_id, peso, data_pesagem)
      VALUES (p_tenant_id, v_animal_id, p_new_weight, p_weight_date);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CORREÇÃO DO CÁLCULO DE IDADE NA VIEW (Precisão)
-- Usar funções nativas do PostgreSQL para contagem exata de meses em vez de segundos fixos.
CREATE OR REPLACE VIEW public.vw_animais_metricas_dashboard AS
SELECT 
    a.*,
    -- Cálculo matematicamente preciso (Anos * 12 + Meses)
    COALESCE(
        (EXTRACT(year FROM age(now(), a.data_nascimento)) * 12) +
        EXTRACT(month FROM age(now(), a.data_nascimento)), 
        0
    )::int as computed_age_months,
    COALESCE(a.peso_atual, a.peso_inicial, 0) as computed_weight,
    COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0) as computed_gain,
    EXTRACT(epoch from age(now(), a.created_at))/86400 as computed_days_on_farm
FROM public.animais a
WHERE a.deleted_at IS NULL;
