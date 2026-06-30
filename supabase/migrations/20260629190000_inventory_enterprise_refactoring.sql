-- 1. Add lote and data_validade to saldos_estoque
ALTER TABLE public.saldos_estoque ADD COLUMN IF NOT EXISTS lote text DEFAULT 'GERAL';
ALTER TABLE public.saldos_estoque ADD COLUMN IF NOT EXISTS data_validade date;

-- 2. Update existing null lotes to 'GERAL' so we can create a unique constraint
UPDATE public.saldos_estoque SET lote = 'GERAL' WHERE lote IS NULL;

-- 3. Drop old unique constraint
ALTER TABLE public.saldos_estoque DROP CONSTRAINT IF EXISTS saldos_estoque_tenant_id_produto_id_deposito_id_key;

-- 4. Create new unique constraint including lote
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'saldos_estoque_tenant_prod_dep_lote_key'
    ) THEN
        ALTER TABLE public.saldos_estoque ADD CONSTRAINT saldos_estoque_tenant_prod_dep_lote_key UNIQUE (tenant_id, produto_id, deposito_id, lote);
    END IF;
END $$;

-- 5. Create or Update View for Inventory Valuation Summary
CREATE OR REPLACE VIEW public.vw_inventory_valuation_summary AS
SELECT 
    s.tenant_id,
    s.fazenda_id,
    s.deposito_id,
    p.nome AS produto_nome,
    p.unidade,
    c.nome AS categoria,
    s.lote,
    s.data_validade,
    s.quantidade,
    s.custo_medio,
    s.valor_total,
    (s.quantidade * s.custo_medio) as calculo_valor_total,
    p.estoque_minimo
FROM public.saldos_estoque s
JOIN public.produtos p ON p.id = s.produto_id
LEFT JOIN public.categorias_sistema c ON c.id = p.categoria_id;

-- 6. Update Trigger to calculate Custo Medio and Handle Lotes
CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_estoque_atual numeric;
    v_custo_medio numeric;
    v_allow_negative boolean := false;
    v_is_storable boolean := true;
    v_lote text;
    v_valor_total_atual numeric;
    v_valor_movimento numeric;
BEGIN
    -- Se o produto não for estocável (is_storable = false), ignorar completamente o controle físico
    SELECT COALESCE(is_storable, true) 
    INTO v_is_storable
    FROM public.produtos
    WHERE id = NEW.produto_id;

    IF NOT v_is_storable THEN
        RETURN NEW;
    END IF;

    -- Validação: O depósito é obrigatório para produtos estocáveis
    IF NEW.deposito_id IS NULL THEN
        RAISE EXCEPTION 'DEPOSITO_OBRIGATORIO';
    END IF;

    -- Garantir que lote tenha valor
    v_lote := COALESCE(NEW.lote, 'GERAL');

    -- Tentar buscar o saldo atual travando a linha. Se não existir, v_estoque_atual fica NULL
    SELECT quantidade, custo_medio, valor_total
    INTO v_estoque_atual, v_custo_medio, v_valor_total_atual
    FROM public.saldos_estoque
    WHERE produto_id = NEW.produto_id AND deposito_id = NEW.deposito_id AND lote = v_lote
    FOR UPDATE;

    -- Se não existe saldo ainda para este deposito e lote, inicializamos
    IF v_estoque_atual IS NULL THEN
        v_estoque_atual := 0;
        v_custo_medio := 0;
        v_valor_total_atual := 0;
        
        INSERT INTO public.saldos_estoque (tenant_id, fazenda_id, produto_id, deposito_id, lote, data_validade, quantidade, custo_medio, valor_total)
        VALUES (NEW.tenant_id, NEW.fazenda_id, NEW.produto_id, NEW.deposito_id, v_lote, NEW.data_validade, 0, 0, 0);
    END IF;

    -- Tratar o valor_unitario caso seja nulo
    IF NEW.valor_unitario IS NULL THEN
        NEW.valor_unitario := 0;
    END IF;

    v_valor_movimento := NEW.quantidade * NEW.valor_unitario;

    -- Calcular novo saldo baseado no tipo de movimento
    IF NEW.tipo IN ('ENTRADA', 'COMPRA') THEN
        
        -- Cálculo do Custo Médio Ponderado Móvel (CMPM)
        IF (v_estoque_atual + NEW.quantidade) > 0 THEN
            v_custo_medio := ((v_estoque_atual * v_custo_medio) + v_valor_movimento) / (v_estoque_atual + NEW.quantidade);
        END IF;

        v_estoque_atual := v_estoque_atual + NEW.quantidade;
        v_valor_total_atual := v_estoque_atual * v_custo_medio;

    ELSIF NEW.tipo IN ('SAIDA', 'CONSUMO', 'CONSUMO_ANIMAL', 'PERDA') THEN
        v_estoque_atual := v_estoque_atual - NEW.quantidade;
        -- Em saídas, o custo médio geralmente não muda, a menos que zere.
        v_valor_total_atual := v_estoque_atual * v_custo_medio;
        -- Setar o valor_unitario da movimentacao igual ao custo médio
        NEW.valor_unitario := v_custo_medio;

    ELSIF NEW.tipo = 'AJUSTE' THEN
        v_estoque_atual := v_estoque_atual + NEW.quantidade;
        -- Se for ajuste positivo com valor, ajusta o custo médio (simplificado)
        IF NEW.quantidade > 0 AND NEW.valor_unitario > 0 THEN
             v_custo_medio := ((v_estoque_atual * v_custo_medio) + v_valor_movimento) / (v_estoque_atual + NEW.quantidade);
        END IF;
        v_valor_total_atual := v_estoque_atual * v_custo_medio;
    END IF;

    -- Validar estoque negativo
    IF v_estoque_atual < 0 THEN
        -- Verificar a configuracao do tenant
        SELECT COALESCE((settings->>'allow_negative_stock')::boolean, false) INTO v_allow_negative
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF NOT v_allow_negative THEN
            RAISE EXCEPTION 'NEGATIVE_STOCK_PREVENTION';
        END IF;
    END IF;

    -- Atualizar o saldo na tabela saldos_estoque
    UPDATE public.saldos_estoque
    SET quantidade = v_estoque_atual,
        custo_medio = v_custo_medio,
        valor_total = v_valor_total_atual,
        updated_at = now(),
        data_validade = COALESCE(NEW.data_validade, saldos_estoque.data_validade)
    WHERE produto_id = NEW.produto_id AND deposito_id = NEW.deposito_id AND lote = v_lote;
    
    -- Atualizamos também o campo legado em public.produtos temporariamente para não quebrar o frontend
    UPDATE public.produtos
    SET estoque_atual = (SELECT COALESCE(SUM(quantidade), 0) FROM public.saldos_estoque WHERE produto_id = NEW.produto_id),
        custo_medio = (SELECT COALESCE(AVG(custo_medio), 0) FROM public.saldos_estoque WHERE produto_id = NEW.produto_id AND quantidade > 0)
    WHERE id = NEW.produto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add policies for the View
ALTER VIEW public.vw_inventory_valuation_summary SET (security_invoker = true);
