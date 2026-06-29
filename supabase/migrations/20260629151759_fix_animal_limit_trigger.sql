-- ==============================================================================
-- MIGRATION: 20260629151759_fix_animal_limit_trigger.sql
-- PURPOSE: Fix the trigger enforce_tenant_animal_limit by using the correct column 'animals_limit'
--          instead of trying to extract it from 'features' which is a text[] array.
-- ==============================================================================

CREATE OR REPLACE FUNCTION enforce_tenant_animal_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_limit INT;
    v_count INT;
    v_plano_nome TEXT;
BEGIN
    -- Obter o plano do tenant
    SELECT plano INTO v_plano_nome FROM public.tenants WHERE id = NEW.tenant_id;
    
    -- Se não encontrar, assume sem limites (ex: trial ou erro, deixa frontend lidar ou admin)
    IF v_plano_nome IS NULL THEN
        RETURN NEW;
    END IF;

    -- Tentar buscar o limite do plano na tabela saas_plans, se existir. 
    -- Utilizando Exception catching caso saas_plans tenha um schema diferente.
    BEGIN
        SELECT animals_limit INTO v_limit 
        FROM public.saas_plans 
        WHERE name = v_plano_nome 
        LIMIT 1;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        -- Fallback if table/column does not exist
        v_limit := 999999;
    END;

    v_limit := COALESCE(v_limit, 999999);

    -- Contar animais associados ao tenant
    SELECT count(id) INTO v_count 
    FROM public.animais 
    WHERE tenant_id = NEW.tenant_id;

    -- Considerando que o limite de 0 representa ilimitado em alguns contextos, vamos apenas validar
    -- se o valor for estritamente maior que 0 e o count for maior ou igual ao limite.
    -- Se for 0 vamos tratar como Ilimitado ou bloquear? No default do schema é animals_limit = 0 para ilimitado (Trial/Demo).
    -- Então só aplica a restrição se v_limit > 0.
    IF v_limit > 0 AND v_count >= v_limit THEN
        RAISE EXCEPTION 'Limite de % animais atingido para o plano %.', v_limit, v_plano_nome;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
