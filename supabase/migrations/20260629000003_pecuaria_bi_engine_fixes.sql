-- MIGRATION: 20260629000003_pecuaria_bi_engine_fixes.sql
-- Fix BI Engine views for proper scaling and event-based tracking

-- 1. Create pesagens table for Event Sourcing
CREATE TABLE IF NOT EXISTS public.pesagens_animal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id),
    fazenda_id uuid REFERENCES public.fazendas(id),
    animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
    peso numeric NOT NULL,
    data_pesagem timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pesagens_animal ENABLE ROW LEVEL SECURITY;

-- 2. View of Animal Metrics (Use last pesagem for GMD)
DROP VIEW IF EXISTS public.vw_animais_metricas_dashboard CASCADE;
CREATE OR REPLACE VIEW public.vw_animais_metricas_dashboard AS
WITH ultima_pesagem AS (
    SELECT DISTINCT ON (animal_id) animal_id, peso, data_pesagem
    FROM public.pesagens_animal
    ORDER BY animal_id, data_pesagem DESC
),
primeira_pesagem AS (
    SELECT DISTINCT ON (animal_id) animal_id, peso, data_pesagem
    FROM public.pesagens_animal
    ORDER BY animal_id, data_pesagem ASC
)
SELECT 
    a.*,
    -- Idade em meses
    COALESCE(
        (EXTRACT(year FROM age(now(), a.data_nascimento)) * 12) +
        EXTRACT(month FROM age(now(), a.data_nascimento)), 
        0
    )::int as computed_age_months,
    
    -- Peso e Ganho
    COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0) as computed_weight,
    COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0) - COALESCE(pp.peso, a.peso_inicial, 0) as computed_gain,
    EXTRACT(epoch from age(now(), a.created_at))/86400 as computed_days_on_farm,
    
    -- GMD (Ganho Médio Diário em KG) com base no delta real
    CASE 
        WHEN up.data_pesagem > pp.data_pesagem AND (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400) > 0
        THEN (up.peso - pp.peso) / (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400)
        WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
        THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
        ELSE 0 
    END as computed_gmd,
    
    -- Meta de Abate
    f.peso_meta_abate,
    
    -- Dias estimados para Abate
    CASE
        WHEN COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0) >= COALESCE(f.peso_meta_abate, 500) THEN 0
        WHEN 
            (
                CASE 
                    WHEN up.data_pesagem > pp.data_pesagem AND (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400) > 0
                    THEN (up.peso - pp.peso) / (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400)
                    WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
                    THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
                    ELSE 0 
                END
            ) > 0
        THEN 
            (COALESCE(f.peso_meta_abate, 500) - COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0)) / 
            (
                CASE 
                    WHEN up.data_pesagem > pp.data_pesagem AND (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400) > 0
                    THEN (up.peso - pp.peso) / (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400)
                    WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
                    THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
                    ELSE 0 
                END
            )
        ELSE NULL
    END as computed_dias_abate,
    
    -- Data Estimada de Abate
    CASE
        WHEN COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0) >= COALESCE(f.peso_meta_abate, 500) THEN CURRENT_DATE
        WHEN 
            (
                CASE 
                    WHEN up.data_pesagem > pp.data_pesagem AND (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400) > 0
                    THEN (up.peso - pp.peso) / (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400)
                    WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
                    THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
                    ELSE 0 
                END
            ) > 0
        THEN 
            CURRENT_DATE + (
                (COALESCE(f.peso_meta_abate, 500) - COALESCE(up.peso, a.peso_atual, a.peso_inicial, 0)) / 
                (
                    CASE 
                        WHEN up.data_pesagem > pp.data_pesagem AND (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400) > 0
                        THEN (up.peso - pp.peso) / (EXTRACT(epoch from age(up.data_pesagem, pp.data_pesagem))/86400)
                        WHEN (EXTRACT(epoch from age(now(), a.created_at))/86400) > 0 
                        THEN (COALESCE(a.peso_atual, a.peso_inicial, 0) - COALESCE(a.peso_inicial, 0)) / (EXTRACT(epoch from age(now(), a.created_at))/86400)
                        ELSE 0 
                    END
                )
            )::int
        ELSE NULL
    END as data_estimada_abate

FROM public.animais a
LEFT JOIN public.fazendas f ON a.fazenda_id = f.id
LEFT JOIN ultima_pesagem up ON a.id = up.animal_id
LEFT JOIN primeira_pesagem pp ON a.id = pp.animal_id
WHERE a.deleted_at IS NULL;

-- 3. View de Custeio por Cabeça (On-The-Fly Base Approximation fix)
CREATE OR REPLACE VIEW public.vw_custeio_cabeca_diario AS
WITH custo_nutricao AS (
    SELECT animal_id, SUM(valor_total_aplicado) as total_nutricao
    FROM public.custos_animal
    GROUP BY animal_id
),
custo_sanidade AS (
    SELECT animal_id, SUM(valor_total_aplicado) as total_sanidade
    FROM public.sanidade_animais
    GROUP BY animal_id
)
SELECT 
    v.*,
    COALESCE(cn.total_nutricao, 0) + COALESCE(cs.total_sanidade, 0) as custo_total_variavel,
    (v.computed_days_on_farm * 1.50) as custo_total_fixo_estimado,
    COALESCE(cn.total_nutricao, 0) + COALESCE(cs.total_sanidade, 0) + (v.computed_days_on_farm * 1.50) + COALESCE(v.valor_compra, 0) as custo_total_acumulado,
    (COALESCE(cn.total_nutricao, 0) + COALESCE(cs.total_sanidade, 0) + (v.computed_days_on_farm * 1.50) + COALESCE(v.valor_compra, 0)) / NULLIF((v.computed_weight / 30), 0) as custo_por_arroba
FROM public.vw_animais_metricas_dashboard v
LEFT JOIN custo_nutricao cn ON v.id = cn.animal_id
LEFT JOIN custo_sanidade cs ON v.id = cs.animal_id;
