-- ==============================================================================
-- MIGRATION: 20260628000005_pecuaria_event_sourcing.sql
-- PURPOSE: Event Sourcing para Pesagens e Controle de Limites no BD (RLS/Triggers)
-- ==============================================================================

-- 1. Ensure animais has the necessary fields to cache state
ALTER TABLE public.animais 
ADD COLUMN IF NOT EXISTS peso_atual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sanidade_ok boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS fase_atual text;

-- 2. Trigger on pesagens to update peso_atual
CREATE OR REPLACE FUNCTION update_animal_peso_atual()
RETURNS TRIGGER AS $$
BEGIN
    -- Update peso_atual on the animal
    UPDATE public.animais
    SET peso_atual = NEW.peso,
        updated_at = now()
    WHERE id = NEW.animal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_animal_peso ON public.pesagens;
CREATE TRIGGER trigger_update_animal_peso
AFTER INSERT OR UPDATE ON public.pesagens
FOR EACH ROW
EXECUTE FUNCTION update_animal_peso_atual();

-- 3. Trigger for Plan Limits Enforcement
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
        SELECT (features->>'animals_limit')::INT INTO v_limit 
        FROM public.saas_plans 
        WHERE name = v_plano_nome 
        LIMIT 1;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        -- Fallback if table/column does not exist
        v_limit := 999999;
    END;

    v_limit := COALESCE(v_limit, 999999);

    -- Contar animais ativos
    SELECT count(id) INTO v_count 
    FROM public.animais 
    WHERE tenant_id = NEW.tenant_id;

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'Limite de % animais atingido para o plano %.', v_limit, v_plano_nome;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_tenant_animal_limit ON public.animais;
CREATE TRIGGER trigger_enforce_tenant_animal_limit
BEFORE INSERT ON public.animais
FOR EACH ROW
EXECUTE FUNCTION enforce_tenant_animal_limit();

-- 4. View to aggregate all animal events (Timeline)
CREATE OR REPLACE VIEW animal_events_timeline AS
SELECT 
    p.id as event_id,
    p.animal_id,
    p.tenant_id,
    p.fazenda_id,
    'PESAGEM' as event_type,
    'Pesagem: ' || p.peso || ' kg' as title,
    p.data_pesagem as event_date,
    p.observacao as description,
    p.created_at
FROM public.pesagens p

UNION ALL

SELECT 
    s.id as event_id,
    s.animal_id,
    s.tenant_id,
    s.fazenda_id,
    'SANIDADE' as event_type,
    'Sanidade: ' || COALESCE(s.produto, 'Manejo Sanitário') as title,
    s.data_manejo as event_date,
    s.observacao as description,
    s.created_at
FROM public.sanidade s
WHERE s.animal_id IS NOT NULL

UNION ALL

SELECT 
    r.id as event_id,
    r.animal_id,
    r.tenant_id,
    r.fazenda_id,
    'REPRODUCAO' as event_type,
    'Reprodutivo: ' || r.tipo_evento as title,
    r.data_evento as event_date,
    r.observacoes as description,
    r.data_evento::timestamp as created_at
FROM public.eventos_reprodutivos r;

-- Create RPC for animal timeline for easier frontend consumption
CREATE OR REPLACE FUNCTION get_animal_timeline(p_animal_id UUID, p_limit INT DEFAULT 50)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(t) INTO result
    FROM (
        SELECT * FROM animal_events_timeline
        WHERE animal_id = p_animal_id
        ORDER BY event_date DESC, created_at DESC
        LIMIT p_limit
    ) t;
    
    RETURN COALESCE(result, '[]');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
