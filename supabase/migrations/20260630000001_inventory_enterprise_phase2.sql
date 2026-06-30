-- ==============================================================================
-- MIGRATION: 20260630000001_inventory_enterprise_phase2.sql
-- PURPOSE: Phase 2 for Inventory (Event Sourcing, BI Engine, Transfer RPC)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. SCHEMA FIXES
-- ------------------------------------------------------------------------------
ALTER TABLE public.movimentacoes_estoque 
ADD COLUMN IF NOT EXISTS observacao TEXT,
ADD COLUMN IF NOT EXISTS custo_total NUMERIC;

-- ------------------------------------------------------------------------------
-- 1. EVENT SOURCING & TIMELINE
-- ------------------------------------------------------------------------------

-- Criar a view de linha do tempo de eventos de estoque
CREATE OR REPLACE VIEW public.vw_inventory_events_timeline AS
SELECT 
    m.id as event_id,
    m.produto_id,
    m.tenant_id,
    m.fazenda_id,
    m.deposito_id,
    UPPER(m.tipo) as event_type,
    'Movimentação: ' || UPPER(m.tipo) || ' de ' || m.quantidade as title,
    m.data_movimentacao as event_date,
    m.observacao as description,
    m.quantidade,
    m.custo_total,
    m.created_at
FROM public.movimentacoes_estoque m

UNION ALL

SELECT 
    a.id as event_id,
    i.produto_id,
    a.tenant_id,
    a.fazenda_id,
    a.deposito_id,
    'AUDITORIA' as event_type,
    'Auditoria de Estoque (Cega)' as title,
    a.data::timestamp as event_date,
    'Divergência Encontrada: ' || i.divergencia as description,
    i.divergencia as quantidade,
    i.custo_divergencia as custo_total,
    a.created_at
FROM public.auditorias_estoque a
JOIN public.auditoria_itens i ON a.id = i.auditoria_id;

-- Refatorar o Trigger para atualização atômica (CQRS), removendo o gargalo do SELECT FOR UPDATE
CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_estoque_atual numeric;
    v_allow_negative boolean := false;
    v_is_storable boolean := true;
    v_delta numeric := 0;
BEGIN
    -- Se o produto não for estocável (is_storable = false), ignorar
    SELECT COALESCE(is_storable, true) 
    INTO v_is_storable
    FROM public.produtos
    WHERE id = NEW.produto_id;

    IF NOT v_is_storable THEN
        RETURN NEW;
    END IF;

    IF NEW.deposito_id IS NULL THEN
        RAISE EXCEPTION 'DEPOSITO_OBRIGATORIO';
    END IF;

    -- Definir o delta (incremento ou decremento)
    IF NEW.tipo IN ('ENTRADA', 'in') THEN
        v_delta := NEW.quantidade;
    ELSIF NEW.tipo IN ('SAIDA', 'CONSUMO', 'out') THEN
        v_delta := -NEW.quantidade;
    ELSIF NEW.tipo = 'AJUSTE' THEN
        v_delta := NEW.quantidade;
    END IF;

    -- Inserir ou atualizar atomicamente sem FOR UPDATE
    INSERT INTO public.saldos_estoque (tenant_id, fazenda_id, produto_id, deposito_id, quantidade, custo_medio, valor_total)
    VALUES (NEW.tenant_id, NEW.fazenda_id, NEW.produto_id, NEW.deposito_id, v_delta, 0, 0)
    ON CONFLICT (tenant_id, produto_id, deposito_id)
    DO UPDATE SET 
        quantidade = public.saldos_estoque.quantidade + EXCLUDED.quantidade,
        updated_at = now()
    RETURNING quantidade INTO v_estoque_atual;

    -- Validar estoque negativo
    IF v_estoque_atual < 0 THEN
        SELECT COALESCE((settings->>'allow_negative_stock')::boolean, false) INTO v_allow_negative
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF NOT v_allow_negative THEN
            RAISE EXCEPTION 'NEGATIVE_STOCK_PREVENTION';
        END IF;
    END IF;

    -- Atualizar o cache em produtos
    UPDATE public.produtos
    SET estoque_atual = (SELECT SUM(quantidade) FROM public.saldos_estoque WHERE produto_id = NEW.produto_id)
    WHERE id = NEW.produto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. INVENTORY BI ENGINE
-- ------------------------------------------------------------------------------

-- View de Giro de Estoque (Turnover) e Consumo Médio
CREATE OR REPLACE VIEW public.vw_inventory_turnover AS
WITH consumption AS (
    SELECT 
        produto_id,
        tenant_id,
        SUM(quantidade) as total_saidas_30d,
        SUM(quantidade) / 30.0 as consumo_medio_diario_historico
    FROM public.movimentacoes_estoque
    WHERE tipo IN ('SAIDA', 'CONSUMO', 'out')
      AND data_movimentacao >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY produto_id, tenant_id
)
SELECT 
    p.id as produto_id,
    p.tenant_id,
    c.total_saidas_30d,
    c.consumo_medio_diario_historico,
    -- Como a dieta futura estruturada requer JSON extraction complexo, 
    -- usamos o histórico recente de consumo animal (que já cai nas movimentações)
    c.consumo_medio_diario_historico as consumo_medio_diario_hibrido
FROM public.produtos p
LEFT JOIN consumption c ON p.id = c.produto_id;

-- View de Previsão de Ruptura (Rupture Risk)
CREATE OR REPLACE VIEW public.vw_inventory_rupture_risk AS
SELECT 
    t.produto_id,
    t.tenant_id,
    p.nome as produto_nome,
    p.estoque_atual,
    p.estoque_minimo,
    t.consumo_medio_diario_hibrido as consumo_diario,
    CASE 
        WHEN t.consumo_medio_diario_hibrido > 0 THEN (COALESCE(p.estoque_atual, 0) / t.consumo_medio_diario_hibrido)::int
        ELSE 999 
    END as dias_para_ruptura,
    CASE 
        WHEN t.consumo_medio_diario_hibrido > 0 THEN CURRENT_DATE + ((COALESCE(p.estoque_atual, 0) / t.consumo_medio_diario_hibrido)::int)
        ELSE NULL
    END as data_estimada_ruptura
FROM public.vw_inventory_turnover t
JOIN public.produtos p ON t.produto_id = p.id;

-- View de Curva ABC
CREATE OR REPLACE VIEW public.vw_inventory_abc_curve AS
WITH ranked_products AS (
    SELECT 
        id as produto_id,
        tenant_id,
        nome,
        COALESCE(estoque_atual, 0) as estoque,
        COALESCE(custo_medio, 0) as custo_unitario,
        (COALESCE(estoque_atual, 0) * COALESCE(custo_medio, 0)) as valor_total,
        SUM(COALESCE(estoque_atual, 0) * COALESCE(custo_medio, 0)) OVER(PARTITION BY tenant_id) as tenant_total_value
    FROM public.produtos
    WHERE is_storable = true
),
cumulative AS (
    SELECT 
        *,
        SUM(valor_total) OVER(PARTITION BY tenant_id ORDER BY valor_total DESC) as running_total
    FROM ranked_products
)
SELECT 
    *,
    (running_total / NULLIF(tenant_total_value, 0)) * 100 as cumulative_percentage,
    CASE 
        WHEN (running_total / NULLIF(tenant_total_value, 0)) * 100 <= 80 THEN 'A'
        WHEN (running_total / NULLIF(tenant_total_value, 0)) * 100 <= 95 THEN 'B'
        ELSE 'C'
    END as curva_abc
FROM cumulative;

-- ------------------------------------------------------------------------------
-- 3. STRICT RPCs (Transações Atômicas)
-- ------------------------------------------------------------------------------

-- Função atômica para transferência de estoque entre depósitos/fazendas
CREATE OR REPLACE FUNCTION public.execute_stock_transfer(
    p_tenant_id UUID,
    p_produto_id UUID,
    p_deposito_origem UUID,
    p_deposito_destino UUID,
    p_quantidade NUMERIC,
    p_responsavel TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_fazenda_origem UUID;
    v_fazenda_destino UUID;
    v_saldo_origem NUMERIC;
    v_custo_medio NUMERIC;
    v_mov_out_id UUID;
    v_mov_in_id UUID;
BEGIN
    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'A quantidade a transferir deve ser maior que zero.';
    END IF;

    IF p_deposito_origem = p_deposito_destino THEN
        RAISE EXCEPTION 'O depósito de destino deve ser diferente da origem.';
    END IF;

    -- Obter saldos e custo da origem (sem FOR UPDATE pois o trigger cuida da atomicidade e levanta erro se negativo)
    SELECT quantidade, custo_medio INTO v_saldo_origem, v_custo_medio
    FROM public.saldos_estoque
    WHERE tenant_id = p_tenant_id 
      AND produto_id = p_produto_id 
      AND deposito_id = p_deposito_origem;

    IF v_saldo_origem IS NULL OR v_saldo_origem < p_quantidade THEN
        RAISE EXCEPTION 'Saldo insuficiente no depósito de origem para realizar a transferência.';
    END IF;

    -- Obter fazendas dos depositos
    SELECT fazenda_id INTO v_fazenda_origem FROM public.depositos WHERE id = p_deposito_origem;
    SELECT fazenda_id INTO v_fazenda_destino FROM public.depositos WHERE id = p_deposito_destino;

    -- 1. Gerar a SAIDA na origem
    INSERT INTO public.movimentacoes_estoque (
        tenant_id, fazenda_id, produto_id, deposito_id, tipo, quantidade, 
        custo_unitario, custo_total, origem, responsavel, observacao
    ) VALUES (
        p_tenant_id, v_fazenda_origem, p_produto_id, p_deposito_origem, 'out', p_quantidade, 
        v_custo_medio, (p_quantidade * COALESCE(v_custo_medio, 0)), 'TRANSFERENCIA', p_responsavel, 
        'Transferência para Depósito Destino'
    ) RETURNING id INTO v_mov_out_id;

    -- 2. Gerar a ENTRADA no destino
    INSERT INTO public.movimentacoes_estoque (
        tenant_id, fazenda_id, produto_id, deposito_id, tipo, quantidade, 
        custo_unitario, custo_total, origem, responsavel, observacao
    ) VALUES (
        p_tenant_id, v_fazenda_destino, p_produto_id, p_deposito_destino, 'in', p_quantidade, 
        v_custo_medio, (p_quantidade * COALESCE(v_custo_medio, 0)), 'TRANSFERENCIA', p_responsavel, 
        'Transferência do Depósito Origem'
    ) RETURNING id INTO v_mov_in_id;

    -- A trigger `process_stock_movement_fn` que acabamos de refatorar cuidará de atualizar `saldos_estoque` para ambas movimentações atômicamente.

    RETURN jsonb_build_object(
        'success', true, 
        'movimentacao_out', v_mov_out_id,
        'movimentacao_in', v_mov_in_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
