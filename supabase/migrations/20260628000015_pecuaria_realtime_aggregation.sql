-- ==========================================================
-- ELITE ERP - PERFORMANCE PECUÁRIA (REAL-TIME AGGREGATION)
-- ==========================================================

-- 1. Adicionar colunas de cache na tabela de animais
ALTER TABLE public.animais 
ADD COLUMN IF NOT EXISTS peso_atual NUMERIC,
ADD COLUMN IF NOT EXISTS data_ultima_pesagem DATE;

-- 2. Atualizar os animais existentes com o último peso (Migração de Dados)
UPDATE public.animais a
SET 
  peso_atual = p.peso,
  data_ultima_pesagem = p.data_pesagem
FROM (
  SELECT animal_id, peso, data_pesagem
  FROM (
    SELECT animal_id, peso, data_pesagem,
           ROW_NUMBER() OVER(PARTITION BY animal_id ORDER BY data_pesagem DESC, created_at DESC) as rn
    FROM public.pesagens
  ) sub
  WHERE rn = 1
) p
WHERE a.id = p.animal_id;

-- 3. Função Trigger para manter peso_atual sincronizado
CREATE OR REPLACE FUNCTION public.trg_sincroniza_peso_animal()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_id UUID;
  v_ultimo_peso NUMERIC;
  v_ultima_data DATE;
BEGIN
  -- Identifica qual animal foi afetado
  IF TG_OP = 'DELETE' THEN
    v_animal_id := OLD.animal_id;
  ELSE
    v_animal_id := NEW.animal_id;
  END IF;

  -- Busca o peso mais recente para este animal
  SELECT peso, data_pesagem 
  INTO v_ultimo_peso, v_ultima_data
  FROM public.pesagens
  WHERE animal_id = v_animal_id
  ORDER BY data_pesagem DESC, created_at DESC
  LIMIT 1;

  -- Atualiza a tabela animais (se não houver pesagem, vira NULL e o sistema usa peso_inicial)
  UPDATE public.animais
  SET peso_atual = v_ultimo_peso,
      data_ultima_pesagem = v_ultima_data
  WHERE id = v_animal_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Cria a Trigger na tabela de pesagens
DROP TRIGGER IF EXISTS trg_atualiza_peso_atual ON public.pesagens;
CREATE TRIGGER trg_atualiza_peso_atual
AFTER INSERT OR UPDATE OR DELETE ON public.pesagens
FOR EACH ROW EXECUTE FUNCTION public.trg_sincroniza_peso_animal();

-- 5. Criar um Índice Otimizado (Covering Index) para cálculos de Rebanho
-- O PostgreSQL usará Index-Only Scans para somar os pesos instantaneamente
CREATE INDEX IF NOT EXISTS idx_animais_agregacao_peso 
ON public.animais (tenant_id, fazenda_id, status)
INCLUDE (peso_atual, peso_inicial);

-- 6. Otimizar a RPC get_herd_total_weight
CREATE OR REPLACE FUNCTION public.get_herd_total_weight(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_auth_tenant UUID;
    v_total NUMERIC;
BEGIN
    v_auth_tenant := auth_helpers.get_auth_tenant();
    IF p_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão.';
    END IF;

    -- Cálculo Real-Time Ultra Rápido (Lê do Cache da Tabela Animais via Index-Only Scan)
    SELECT COALESCE(SUM(COALESCE(peso_atual, peso_inicial, 0)), 0) 
    INTO v_total 
    FROM public.animais
    WHERE tenant_id = v_auth_tenant 
      AND status = 'ATIVO'
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    RETURN v_total;
END;
$$;
