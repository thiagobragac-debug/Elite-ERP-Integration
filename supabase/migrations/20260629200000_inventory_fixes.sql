-- Fixes for Inventory Module: Dashboard Stats and Transfer Transaction

-- 1. RPC for Dashboard Stats (calculates KPIs ignoring frontend pagination)
CREATE OR REPLACE FUNCTION public.get_inventory_dashboard_stats(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
    v_capital numeric;
    v_rupturas integer;
    v_maturidade integer;
BEGIN
    -- Capital Imobilizado (Total Value of Stock)
    SELECT COALESCE(SUM(p.estoque_atual * p.custo_medio), 0) INTO v_capital
    FROM public.produtos p
    WHERE p.tenant_id = p_tenant_id AND p.is_storable = true
      AND p.deleted_at IS NULL
      AND (p_fazenda_id IS NULL OR p.fazenda_id = p_fazenda_id);

    -- Rupturas (Items below minimum stock)
    SELECT COUNT(*) INTO v_rupturas
    FROM public.produtos p
    WHERE p.tenant_id = p_tenant_id AND p.is_storable = true
      AND p.deleted_at IS NULL
      AND p.estoque_atual < p.estoque_minimo
      AND (p_fazenda_id IS NULL OR p.fazenda_id = p_fazenda_id);

    -- Maturidade / Risco Vencimento (Medicamentos e Vacinas)
    SELECT COUNT(*) INTO v_maturidade
    FROM public.produtos p
    LEFT JOIN public.categorias_sistema c ON c.id = p.categoria_id
    WHERE p.tenant_id = p_tenant_id AND p.is_storable = true
      AND p.deleted_at IS NULL
      AND c.nome IN ('Medicamento', 'Vacina')
      AND (p_fazenda_id IS NULL OR p.fazenda_id = p_fazenda_id);

    RETURN json_build_object(
        'capital_imobilizado', v_capital,
        'itens_ruptura', v_rupturas,
        'itens_maturidade', v_maturidade
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC for Secure Inventory Transfers
CREATE OR REPLACE FUNCTION public.transfer_inventory_transaction(
    p_tenant_id uuid,
    p_fazenda_id uuid,
    p_produto_id uuid,
    p_deposito_origem uuid,
    p_deposito_destino uuid,
    p_quantidade numeric,
    p_custo_unitario numeric,
    p_data_movimentacao timestamptz,
    p_responsavel text
)
RETURNS json AS $$
DECLARE
    v_out_id uuid;
    v_in_id uuid;
BEGIN
    -- 1. Registra a Saída (Débito)
    INSERT INTO public.movimentacoes_estoque (
        tenant_id, fazenda_id, produto_id, deposito_id,
        tipo, quantidade, custo_unitario, custo_total,
        origem_destino, responsavel, data_movimentacao
    ) VALUES (
        p_tenant_id, p_fazenda_id, p_produto_id, p_deposito_origem,
        'SAIDA', p_quantidade, p_custo_unitario, p_quantidade * p_custo_unitario,
        'Transferência para depósito destino', p_responsavel, COALESCE(p_data_movimentacao, now())
    ) RETURNING id INTO v_out_id;

    -- 2. Registra a Entrada (Crédito)
    INSERT INTO public.movimentacoes_estoque (
        tenant_id, fazenda_id, produto_id, deposito_id,
        tipo, quantidade, custo_unitario, custo_total,
        origem_destino, responsavel, data_movimentacao
    ) VALUES (
        p_tenant_id, p_fazenda_id, p_produto_id, p_deposito_destino,
        'ENTRADA', p_quantidade, p_custo_unitario, p_quantidade * p_custo_unitario,
        'Transferência de depósito origem', p_responsavel, COALESCE(p_data_movimentacao, now())
    ) RETURNING id INTO v_in_id;

    -- Return success payload
    RETURN json_build_object(
        'success', true,
        'out_movement_id', v_out_id,
        'in_movement_id', v_in_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
