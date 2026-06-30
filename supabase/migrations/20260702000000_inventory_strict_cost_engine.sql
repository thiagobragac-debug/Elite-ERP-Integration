-- ==============================================================================
-- Migration: Inventory Strict Cost Engine
-- ==============================================================================

-- Modificando a função registrar_movimentacao_estoque para ignorar o custo 
-- unitário enviado pelo payload quando a operação for SAIDA ou TRANSFERENCIA
-- e sempre adotar o custo médio da tabela produtos como fallback, garantindo 
-- consistência contábil (FEFO/FIFO).

CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    v_quantidade NUMERIC;
    v_tipo TEXT;
    v_tenant_id UUID;
    v_custo_unitario NUMERIC;
    v_movimentacao_id UUID;
    v_auth_tenant UUID;
    v_custo_medio_db NUMERIC;
BEGIN
    -- Validação de Segurança Multi-Tenant (Prevenção de IDOR)
    v_auth_tenant := auth_helpers.get_auth_tenant();
    v_tenant_id := (payload->>'tenant_id')::UUID;
    
    IF v_tenant_id != v_auth_tenant THEN
        RAISE EXCEPTION 'Acesso Negado: tenant_id não corresponde à sessão autenticada. Ação bloqueada pelo Security Definer.';
    END IF;

    -- Extrair dados do payload
    v_produto_id := (payload->>'produto_id')::UUID;
    v_deposito_id := (payload->>'deposito_id')::UUID;
    v_quantidade := (payload->>'quantidade')::NUMERIC;
    v_tipo := payload->>'tipo';
    
    -- Busca custo médio atual do banco para garantir consistência
    SELECT custo_medio INTO v_custo_medio_db FROM produtos WHERE id = v_produto_id AND tenant_id = v_tenant_id;
    
    IF v_tipo IN ('SAIDA', 'out', 'TRANSFERENCIA', 'transfer') THEN
        v_custo_unitario := COALESCE(v_custo_medio_db, 0);
    ELSE
        v_custo_unitario := COALESCE((payload->>'custo_unitario')::NUMERIC, 0);
    END IF;

    -- 1. Inserir Movimentação
    INSERT INTO movimentacoes_estoque (
        produto_id, deposito_id, quantidade, tipo, data_movimentacao, 
        origem_destino, responsavel, custo_unitario, lote, data_validade, tenant_id, fazenda_id,
        especie_id, aptidao_id, animal_id, lote_pecuario_id
    ) VALUES (
        v_produto_id, v_deposito_id, v_quantidade, v_tipo, 
        COALESCE(payload->>'data_movimentacao', NOW()::TEXT)::TIMESTAMP,
        payload->>'origem_destino', payload->>'responsavel', v_custo_unitario,
        payload->>'lote', (payload->>'data_validade')::DATE, v_tenant_id, (payload->>'fazenda_id')::UUID,
        payload->>'especie_id', payload->>'aptidao_id', 
        (payload->>'animal_id')::UUID, (payload->>'lote_pecuario_id')::UUID
    ) RETURNING id INTO v_movimentacao_id;

    -- 2. Atualizar ou Inserir Saldo na tabela saldos_estoque de forma atômica
    IF v_tipo IN ('ENTRADA', 'in') THEN
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) 
        DO UPDATE SET quantidade = saldos_estoque.quantidade + EXCLUDED.quantidade, updated_at = NOW();
        
        -- Atualizar o Custo Médio na tabela produtos
        IF v_custo_unitario > 0 THEN
            UPDATE produtos 
            SET custo_medio = (
                COALESCE(custo_medio, 0) + v_custo_unitario
            ) / 2
            WHERE id = v_produto_id;
        END IF;

    ELSIF v_tipo IN ('SAIDA', 'out') THEN
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, -v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) 
        DO UPDATE SET quantidade = saldos_estoque.quantidade - EXCLUDED.quantidade, updated_at = NOW();
    END IF;

    -- 3. Atualizar estoque_atual legado por retrocompatibilidade
    UPDATE produtos
    SET estoque_atual = (
        SELECT SUM(quantidade) FROM saldos_estoque WHERE produto_id = v_produto_id
    )
    WHERE id = v_produto_id;

    RETURN jsonb_build_object('success', true, 'movimentacao_id', v_movimentacao_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
