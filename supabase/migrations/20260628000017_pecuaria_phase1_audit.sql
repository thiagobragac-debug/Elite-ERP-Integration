-- Migração Fase 1: Soft Delete, RPCs Transacionais e Views Materializadas

-- 1. Adicionar `deleted_at` para Soft Delete Universal
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Atualizar RLS para esconder deletados por padrão
-- (Nota: Para simplificar, ajustaremos as políticas principais)
DROP POLICY IF EXISTS "tenant_animais_select" ON public.animais;
CREATE POLICY "tenant_animais_select" ON public.animais
  FOR SELECT USING (tenant_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "tenant_lotes_select" ON public.lotes;
CREATE POLICY "tenant_lotes_select" ON public.lotes
  FOR SELECT USING (tenant_id = auth.uid() AND deleted_at IS NULL);

-- 3. Função RPC para Soft Delete Consistente
CREATE OR REPLACE FUNCTION public.rpc_soft_delete_animal(p_id UUID, p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Atualiza animal
  UPDATE public.animais 
  SET deleted_at = NOW(), status = 'EXCLUIDO' 
  WHERE id = p_id AND tenant_id = p_tenant_id;
  
  -- Soft delete nas pesagens
  UPDATE public.pesagens
  SET observacao = '[EXCLUIDO] ' || COALESCE(observacao, '')
  WHERE animal_id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função RPC Transacional para Relocação e Pesagem em Massa
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
    
    -- Inserir Pesagem se fornecida
    IF p_new_weight IS NOT NULL THEN
      INSERT INTO public.pesagens (tenant_id, animal_id, peso, data_pesagem)
      VALUES (p_tenant_id, v_animal_id, p_new_weight, p_weight_date);
      
      -- Atualiza peso atual no animal (simulando cache)
      UPDATE public.animais SET peso_entrada = p_new_weight WHERE id = v_animal_id AND tenant_id = p_tenant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View Materializada/Normal para desonerar Client-side process
CREATE OR REPLACE VIEW public.vw_animais_metricas_dashboard AS
SELECT 
    a.*,
    -- Cálculos
    COALESCE((EXTRACT(epoch from age(now(), a.data_nascimento)) / 2592000)::int, 0) as computed_age_months,
    COALESCE(a.peso_atual, a.peso_inicial, 0) as computed_weight,
    COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0) as computed_gain,
    EXTRACT(epoch from age(now(), a.created_at))/86400 as computed_days_on_farm
FROM public.animais a
WHERE a.deleted_at IS NULL;
