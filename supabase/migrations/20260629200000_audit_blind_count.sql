-- 1. Alter table auditorias_estoque to add missing columns
ALTER TABLE public.auditorias_estoque
ADD COLUMN IF NOT EXISTS deposito_id UUID REFERENCES public.depositos(id),
ADD COLUMN IF NOT EXISTS motivo VARCHAR(100),
ADD COLUMN IF NOT EXISTS ajuste_automatico BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS contagem_cega BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custo_divergencia NUMERIC(15, 2) DEFAULT 0;

-- 2. Create table auditoria_itens
CREATE TABLE IF NOT EXISTS public.auditoria_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    auditoria_id UUID REFERENCES public.auditorias_estoque(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    lote VARCHAR(100),
    data_validade DATE,
    quantidade_sistema NUMERIC(15, 4) DEFAULT 0,
    quantidade_encontrada NUMERIC(15, 4) DEFAULT 0,
    divergencia NUMERIC(15, 4) DEFAULT 0,
    custo_divergencia NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on auditoria_itens
ALTER TABLE public.auditoria_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation - auditoria_itens" 
ON public.auditoria_itens FOR ALL 
USING (tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid);

-- 3. Create RPC execute_audit_count
CREATE OR REPLACE FUNCTION public.execute_audit_count(
    p_auditoria_id UUID,
    p_tenant_id UUID,
    p_itens JSONB -- Array of { produto_id, lote, data_validade, quantidade_encontrada }
)
RETURNS void AS $$
DECLARE
    v_item JSONB;
    v_fazenda_id UUID;
    v_deposito_id UUID;
    v_ajuste_automatico BOOLEAN;
    v_produto_id UUID;
    v_lote VARCHAR;
    v_validade DATE;
    v_qtd_encontrada NUMERIC;
    v_qtd_sistema NUMERIC;
    v_divergencia NUMERIC;
    v_custo_medio NUMERIC;
    v_custo_divergencia NUMERIC;
    v_total_custo_perdas NUMERIC := 0;
    v_total_items INTEGER := 0;
    v_total_acertos INTEGER := 0;
BEGIN
    -- Get audit details
    SELECT fazenda_id, deposito_id, ajuste_automatico
    INTO v_fazenda_id, v_deposito_id, v_ajuste_automatico
    FROM public.auditorias_estoque
    WHERE id = p_auditoria_id AND tenant_id = p_tenant_id;

    IF v_deposito_id IS NULL THEN
        RAISE EXCEPTION 'Depósito não especificado na auditoria';
    END IF;

    -- Delete existing items just in case this is a re-execution
    DELETE FROM public.auditoria_itens WHERE auditoria_id = p_auditoria_id;

    -- Process each item from the JSON array
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        v_produto_id := (v_item->>'produto_id')::UUID;
        v_lote := v_item->>'lote';
        IF v_lote IS NULL OR v_lote = '' THEN
            v_lote := 'GERAL';
        END IF;

        IF v_item->>'data_validade' IS NOT NULL AND v_item->>'data_validade' != '' THEN
            v_validade := (v_item->>'data_validade')::DATE;
        ELSE
            v_validade := NULL;
        END IF;

        v_qtd_encontrada := COALESCE((v_item->>'quantidade_encontrada')::NUMERIC, 0);

        -- Find current system quantity and cost
        SELECT quantidade, custo_medio INTO v_qtd_sistema, v_custo_medio
        FROM public.saldos_estoque
        WHERE tenant_id = p_tenant_id 
          AND produto_id = v_produto_id 
          AND deposito_id = v_deposito_id 
          AND lote = v_lote;

        v_qtd_sistema := COALESCE(v_qtd_sistema, 0);
        v_divergencia := v_qtd_encontrada - v_qtd_sistema;
        
        -- Custo_medio comes from saldos_estoque. If not found, try produtos.
        IF v_custo_medio IS NULL OR v_custo_medio = 0 THEN
            SELECT custo_medio INTO v_custo_medio FROM public.produtos WHERE id = v_produto_id;
            v_custo_medio := COALESCE(v_custo_medio, 0);
        END IF;

        v_custo_divergencia := v_divergencia * v_custo_medio;
        v_total_custo_perdas := v_total_custo_perdas + v_custo_divergencia;

        v_total_items := v_total_items + 1;
        IF v_divergencia = 0 THEN
            v_total_acertos := v_total_acertos + 1;
        END IF;

        -- Insert into auditoria_itens
        INSERT INTO public.auditoria_itens (
            auditoria_id, tenant_id, produto_id, lote, data_validade,
            quantidade_sistema, quantidade_encontrada, divergencia, custo_divergencia
        ) VALUES (
            p_auditoria_id, p_tenant_id, v_produto_id, v_lote, v_validade,
            v_qtd_sistema, v_qtd_encontrada, v_divergencia, v_custo_divergencia
        );

        -- Generate adjustment movement if needed
        IF v_ajuste_automatico = TRUE AND v_divergencia != 0 THEN
            -- Calculate tipo: in or out
            INSERT INTO public.movimentacoes_estoque (
                tenant_id, fazenda_id, produto_id, deposito_id, lote, data_validade,
                tipo, quantidade, custo_unitario, custo_total, 
                origem, responsavel, observacao, data_movimentacao
            ) VALUES (
                p_tenant_id, v_fazenda_id, v_produto_id, v_deposito_id, v_lote, v_validade,
                CASE WHEN v_divergencia > 0 THEN 'in' ELSE 'out' END, -- Adjust in or out
                ABS(v_divergencia), v_custo_medio, ABS(v_custo_divergencia),
                'INVENTARIO', 'Sistema', 'Ajuste Automático de Inventário', NOW()
            );
            -- The trigger process_stock_movement_fn will handle the saldos_estoque update
        END IF;
    END LOOP;

    -- Update audit record
    UPDATE public.auditorias_estoque
    SET 
        status = 'completed',
        items_count = v_total_items,
        accuracy = CASE WHEN v_total_items > 0 THEN (v_total_acertos::NUMERIC / v_total_items::NUMERIC) * 100 ELSE 100 END,
        custo_divergencia = v_total_custo_perdas -- can be negative if we missed items
    WHERE id = p_auditoria_id AND tenant_id = p_tenant_id;

END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
