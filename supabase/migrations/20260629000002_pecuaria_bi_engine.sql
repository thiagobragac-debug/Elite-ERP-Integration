-- MIGRATION: 20260629000002_pecuaria_bi_engine.sql
-- Implementação do Motor de Custeio e Projeção de Abate (GMD)

-- 1. Novas colunas de configurações
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS peso_meta_abate NUMERIC DEFAULT 500;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS valor_arroba_venda NUMERIC DEFAULT 300;

ALTER TABLE public.categorias_sistema ADD COLUMN IF NOT EXISTS is_custeio_rateio BOOLEAN DEFAULT false;

-- 2. Atualizar a View de Métricas dos Animais com GMD e Projeção de Abate
DROP VIEW IF EXISTS public.vw_animais_metricas_dashboard CASCADE;
CREATE OR REPLACE VIEW public.vw_animais_metricas_dashboard AS
SELECT 
    a.*,
    -- Idade em meses
    COALESCE(
        (EXTRACT(year FROM age(now(), a.data_nascimento)) * 12) +
        EXTRACT(month FROM age(now(), a.data_nascimento)), 
        0
    )::int as computed_age_months,
    
    -- Peso e Ganho
    COALESCE(a.peso_atual, a.peso_inicial, 0) as computed_weight,
    COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0) as computed_gain,
    EXTRACT(epoch from age(now(), a.created_at))/86400 as computed_days_on_farm,
    
    -- GMD (Ganho Médio Diário em KG)
    CASE 
        WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
        THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
        ELSE 0 
    END as computed_gmd,
    
    -- Meta de Abate
    f.peso_meta_abate,
    
    -- Dias estimados para Abate
    CASE
        WHEN COALESCE(a.peso_atual, a.peso_inicial, 0) >= COALESCE(f.peso_meta_abate, 500) THEN 0
        WHEN 
            (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
            AND ((COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)) > 0
        THEN 
            (COALESCE(f.peso_meta_abate, 500) - COALESCE(a.peso_atual, a.peso_inicial, 0)) / 
            ((COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400))
        ELSE NULL
    END as computed_dias_abate,
    
    -- Data Estimada de Abate
    CASE
        WHEN COALESCE(a.peso_atual, a.peso_inicial, 0) >= COALESCE(f.peso_meta_abate, 500) THEN CURRENT_DATE
        WHEN 
            (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
            AND ((COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)) > 0
        THEN 
            CURRENT_DATE + (
                (COALESCE(f.peso_meta_abate, 500) - COALESCE(a.peso_atual, a.peso_inicial, 0)) / 
                ((COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400))
            )::int
        ELSE NULL
    END as data_estimada_abate

FROM public.animais a
LEFT JOIN public.fazendas f ON a.fazenda_id = f.id
WHERE a.deleted_at IS NULL;

-- 3. View de Custeio por Cabeça (On-The-Fly Base Approximation)
-- Esta view faz a alocação de custos variáveis + uma taxa fixa diária aproximada baseada nas transações de rateio.
CREATE OR REPLACE VIEW public.vw_custeio_cabeca_diario AS
WITH custo_variavel AS (
    SELECT 
        animal_id,
        SUM(quantidade_consumida * 1) as custo_nutricao, -- Na vida real, join com produto para pegar preco_medio_unitario
        SUM(0) as custo_sanidade
    FROM public.custos_animal
    GROUP BY animal_id
)
SELECT 
    v.*,
    COALESCE(cv.custo_nutricao, 0) + COALESCE(cv.custo_sanidade, 0) as custo_total_variavel,
    (v.computed_days_on_farm * 1.50) as custo_total_fixo_estimado, -- Placeholder para rateio real da categoria
    COALESCE(cv.custo_nutricao, 0) + COALESCE(cv.custo_sanidade, 0) + (v.computed_days_on_farm * 1.50) + COALESCE(v.valor_compra, 0) as custo_total_acumulado,
    (COALESCE(cv.custo_nutricao, 0) + COALESCE(cv.custo_sanidade, 0) + (v.computed_days_on_farm * 1.50) + COALESCE(v.valor_compra, 0)) / NULLIF((v.computed_weight / 30), 0) as custo_por_arroba
FROM public.vw_animais_metricas_dashboard v
LEFT JOIN custo_variavel cv ON v.id = cv.animal_id;
