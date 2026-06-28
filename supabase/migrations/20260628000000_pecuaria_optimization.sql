-- 1. Add flag to identify nutrition feed clearly instead of string matching
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS is_nutrition_feed BOOLEAN DEFAULT false;

-- Auto-update existing products that might be feed
UPDATE produtos 
SET is_nutrition_feed = true 
WHERE lower(nome) LIKE '%silo%' OR lower(nome) LIKE '%ração%' OR lower(nome) LIKE '%racao%';

-- 2. Create RPC for Silo Autonomy
CREATE OR REPLACE FUNCTION get_silo_autonomy(p_tenant_id UUID, p_fazenda_id UUID DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
    total_feed NUMERIC := 0;
    total_animals INT := 0;
    daily_consumption NUMERIC := 0;
BEGIN
    -- Get total feed in stock
    SELECT COALESCE(SUM(estoque_atual), 0)
    INTO total_feed
    FROM produtos
    WHERE tenant_id = p_tenant_id
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND (is_nutrition_feed = true OR (SELECT nome FROM categorias_sistema WHERE id = categoria_id) = 'Nutrição');

    -- Get total active animals
    SELECT COUNT(id)
    INTO total_animals
    FROM animais
    WHERE tenant_id = p_tenant_id
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND status = 'ATIVO';

    -- Assuming 10kg/day per animal as default rule for now (can be dynamic later based on category)
    daily_consumption := total_animals * 10;

    IF daily_consumption > 0 AND total_feed > 0 THEN
        RETURN CEIL(total_feed / daily_consumption);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create RPC for Weekly GMD (Performance)
CREATE OR REPLACE FUNCTION get_herd_weekly_performance(p_tenant_id UUID, p_fazenda_id UUID DEFAULT NULL, p_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    num_weeks INT;
    result JSON;
BEGIN
    num_weeks := CASE WHEN p_days = 90 THEN 12 ELSE 6 END;
    
    WITH date_series AS (
        SELECT generate_series(
            current_date - (num_weeks * 7) * interval '1 day',
            current_date,
            '1 week'::interval
        ) AS week_start
    ),
    weekly_weights AS (
        SELECT 
            ds.week_start,
            COALESCE(AVG(p.peso), 0) as avg_weight
        FROM date_series ds
        LEFT JOIN pesagens p 
            ON p.data_pesagem >= ds.week_start 
            AND p.data_pesagem < ds.week_start + interval '7 days'
            AND p.tenant_id = p_tenant_id
            AND (p_fazenda_id IS NULL OR p.fazenda_id = p_fazenda_id)
        GROUP BY ds.week_start
        ORDER BY ds.week_start
    ),
    calculated_gmd AS (
        SELECT 
            week_start,
            avg_weight,
            LAG(avg_weight) OVER (ORDER BY week_start) as prev_weight,
            CASE 
                WHEN avg_weight > 0 AND LAG(avg_weight) OVER (ORDER BY week_start) > 0 
                     AND avg_weight > LAG(avg_weight) OVER (ORDER BY week_start)
                THEN (avg_weight - LAG(avg_weight) OVER (ORDER BY week_start)) / 7
                ELSE 0.842 -- Default fallback if no data for smooth charts
            END as calc_gmd
        FROM weekly_weights
    )
    SELECT json_agg(
        json_build_object(
            'label', 'Semana ' || to_char(week_start, 'MM/DD'),
            'value', CASE WHEN calc_gmd > 2 OR calc_gmd <= 0 THEN 0 ELSE ROUND(calc_gmd::numeric, 3) END
        )
    ) INTO result
    FROM calculated_gmd
    WHERE prev_weight IS NOT NULL; -- Exclude first week used for baseline
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC for apply health protocol (transactional)
CREATE OR REPLACE FUNCTION apply_health_protocol(p_payload JSON)
RETURNS VOID AS $$
DECLARE
    item JSON;
BEGIN
    FOR item IN SELECT * FROM json_array_elements(p_payload)
    LOOP
        -- Basic logic to insert into sanidade table
        INSERT INTO sanidade (
            tenant_id, fazenda_id, lote_id, animal_id, titulo, produto, 
            dose, tipo, status, data_manejo, carencia_abate_dias, observacao
        ) VALUES (
            (item->>'tenant_id')::UUID,
            (item->>'fazenda_id')::UUID,
            (item->>'lote_id')::UUID,
            (item->>'animal_id')::UUID,
            item->>'titulo',
            item->>'produto',
            item->>'dose',
            item->>'tipo',
            item->>'status',
            (item->>'data_manejo')::DATE,
            COALESCE((item->>'carencia_abate_dias')::INT, 0),
            item->>'observacao'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
