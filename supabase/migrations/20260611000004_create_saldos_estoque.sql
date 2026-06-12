-- Criação da tabela de Saldos de Estoque por Depósito
CREATE TABLE IF NOT EXISTS public.saldos_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    fazenda_id UUID REFERENCES public.fazendas(id),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    deposito_id UUID NOT NULL REFERENCES public.depositos(id) ON DELETE CASCADE,
    quantidade NUMERIC NOT NULL DEFAULT 0,
    custo_medio NUMERIC NOT NULL DEFAULT 0,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, produto_id, deposito_id)
);

ALTER TABLE public.saldos_estoque ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "saldos_estoque_tenant" ON public.saldos_estoque
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- Nova Trigger de Estoque (Substitui a anterior)
CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_estoque_atual numeric;
    v_custo_medio numeric;
    v_allow_negative boolean := false;
    v_is_storable boolean := true;
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

    -- Tentar buscar o saldo atual travando a linha. Se não existir, v_estoque_atual fica NULL
    SELECT quantidade, custo_medio
    INTO v_estoque_atual, v_custo_medio
    FROM public.saldos_estoque
    WHERE produto_id = NEW.produto_id AND deposito_id = NEW.deposito_id
    FOR UPDATE;

    -- Se não existe saldo ainda para este deposito, inicializamos
    IF v_estoque_atual IS NULL THEN
        v_estoque_atual := 0;
        v_custo_medio := 0;
        
        INSERT INTO public.saldos_estoque (tenant_id, fazenda_id, produto_id, deposito_id, quantidade, custo_medio, valor_total)
        VALUES (NEW.tenant_id, NEW.fazenda_id, NEW.produto_id, NEW.deposito_id, 0, 0, 0);
    END IF;

    -- Calcular novo saldo baseado no tipo de movimento
    IF NEW.tipo IN ('ENTRADA') THEN
        v_estoque_atual := v_estoque_atual + NEW.quantidade;
        -- TODO: O custo médio geralmente é calculado aqui ou na processar_entrada_nfe. 
        -- Mantemos a lógica simples para entradas manuais, sem recalcular custo aqui por enquanto (ou atualizamos se custo_unitario > 0).
    ELSIF NEW.tipo IN ('SAIDA', 'CONSUMO') THEN
        v_estoque_atual := v_estoque_atual - NEW.quantidade;
    ELSIF NEW.tipo = 'AJUSTE' THEN
        v_estoque_atual := v_estoque_atual + NEW.quantidade;
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
    IF NEW.origem IS DISTINCT FROM 'NF-E' THEN
        UPDATE public.saldos_estoque
        SET quantidade = v_estoque_atual,
            updated_at = now()
        WHERE produto_id = NEW.produto_id AND deposito_id = NEW.deposito_id;
        
        -- Atualizamos também o campo legado em public.produtos temporariamente para não quebrar o frontend imediatamente
        -- até que as views/frontend sejam ajustados.
        UPDATE public.produtos
        SET estoque_atual = (SELECT SUM(quantidade) FROM public.saldos_estoque WHERE produto_id = NEW.produto_id)
        WHERE id = NEW.produto_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
