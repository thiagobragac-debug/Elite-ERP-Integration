-- ==========================================================
-- ELITE ERP - CORREÇÕES DE AUDITORIA FASE 5 (PESAGENS E ROMANEIOS)
-- ==========================================================

-- 1. CORREÇÃO DA TRIGGER DE SINCRONIZAÇÃO DE PESOS
-- Antes: Ignorava deleted_at, o que fazia um soft delete não surtir efeito no peso_atual.
-- Agora: Exige que a pesagem não esteja deletada para ser considerada válida.
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

  -- Busca o peso mais recente para este animal (ignorando registros soft-deleted)
  SELECT peso, data_pesagem 
  INTO v_ultimo_peso, v_ultima_data
  FROM public.pesagens
  WHERE animal_id = v_animal_id
    AND deleted_at IS NULL
  ORDER BY data_pesagem DESC, created_at DESC
  LIMIT 1;

  -- Atualiza a tabela animais
  -- Se v_ultimo_peso for NULL (ex: deletou a única pesagem), 
  -- poderíamos usar o peso_inicial ou NULL. No ERP usaremos NULL e deixaremos a UI tratar.
  UPDATE public.animais
  SET peso_atual = COALESCE(v_ultimo_peso, peso_inicial),
      data_ultima_pesagem = COALESCE(v_ultima_data, data_nascimento, created_at::DATE)
  WHERE id = v_animal_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RE-SINCRONIZAR EM MASSA
-- Forçar a correção retroativa de todos os animais caso haja algum peso corrompido
UPDATE public.animais a
SET 
  peso_atual = COALESCE(p.peso, a.peso_inicial),
  data_ultima_pesagem = COALESCE(p.data_pesagem, a.data_nascimento, a.created_at::DATE)
FROM (
  SELECT animal_id, peso, data_pesagem
  FROM (
    SELECT animal_id, peso, data_pesagem,
           ROW_NUMBER() OVER(PARTITION BY animal_id ORDER BY data_pesagem DESC, created_at DESC) as rn
    FROM public.pesagens
    WHERE deleted_at IS NULL
  ) sub
  WHERE rn = 1
) p
WHERE a.id = p.animal_id;
