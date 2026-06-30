-- Migração Inicial de Saldos (Produtos Legados sem registro em saldos_estoque)
DO $$
DECLARE
    r RECORD;
    v_deposito_id UUID;
    v_fazenda_id UUID;
BEGIN
    -- Percorre todos os produtos que possuem estoque_atual > 0 mas não têm saldo registrado na saldos_estoque
    FOR r IN
        SELECT p.id as produto_id, p.tenant_id, p.estoque_atual, p.custo_medio
        FROM public.produtos p
        LEFT JOIN public.saldos_estoque se ON p.id = se.produto_id
        WHERE p.estoque_atual > 0 AND se.id IS NULL AND p.is_storable = true
    LOOP
        -- Tenta pegar a fazenda associada à categoria (se for fazenda_id) ou ao tenant
        SELECT id INTO v_fazenda_id FROM public.fazendas WHERE tenant_id = r.tenant_id LIMIT 1;
        
        -- Tenta encontrar um deposito default para o tenant
        SELECT id INTO v_deposito_id FROM public.depositos WHERE tenant_id = r.tenant_id AND (fazenda_id = v_fazenda_id OR fazenda_id IS NULL) LIMIT 1;
        
        -- Se não tem deposito, cria um deposito padrão "Depósito Principal (Auto)"
        IF v_deposito_id IS NULL THEN
            INSERT INTO public.depositos (tenant_id, fazenda_id, nome, tipo, unidade_capacidade)
            VALUES (r.tenant_id, v_fazenda_id, 'Depósito Principal (Auto)', 'Galpão', 'un')
            RETURNING id INTO v_deposito_id;
        END IF;

        -- Insere o saldo inicial
        INSERT INTO public.saldos_estoque (tenant_id, fazenda_id, produto_id, deposito_id, quantidade, custo_medio, valor_total)
        VALUES (
            r.tenant_id, 
            v_fazenda_id, 
            r.produto_id, 
            v_deposito_id, 
            r.estoque_atual, 
            COALESCE(r.custo_medio, 0), 
            r.estoque_atual * COALESCE(r.custo_medio, 0)
        );

        -- Opcional: Criar uma movimentacao de INVENTARIO INICIAL para bater o kardex
        INSERT INTO public.movimentacoes_estoque (
            tenant_id, fazenda_id, produto_id, deposito_id, tipo, quantidade, 
            custo_unitario, custo_total, origem, responsavel, observacao, data_movimentacao
        ) VALUES (
            r.tenant_id, v_fazenda_id, r.produto_id, v_deposito_id, 'ENTRADA', r.estoque_atual,
            COALESCE(r.custo_medio, 0), r.estoque_atual * COALESCE(r.custo_medio, 0),
            'INVENTARIO', 'Sistema', 'Saldo Inicial de Implantação', now()
        );
    END LOOP;
END;
$$;


-- RPC para trazer os KPIs do Dashboard de Estoque no Server-Side
CREATE OR REPLACE FUNCTION public.get_inventory_kpis(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
    v_total_movimentos integer;
    v_entradas integer;
    v_saidas integer;
    v_transferencias integer;
BEGIN
    SELECT COUNT(*) INTO v_total_movimentos
    FROM public.movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);

    SELECT COUNT(*) INTO v_entradas
    FROM public.movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND tipo IN ('ENTRADA', 'in');

    SELECT COUNT(*) INTO v_saidas
    FROM public.movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND tipo IN ('SAIDA', 'CONSUMO', 'out');

    SELECT COUNT(*) INTO v_transferencias
    FROM public.movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
      AND tipo IN ('TRANSFERENCIA', 'transfer');

    RETURN json_build_object(
        'total', v_total_movimentos,
        'entradas', v_entradas,
        'saidas', v_saidas,
        'transferencias', v_transferencias
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
