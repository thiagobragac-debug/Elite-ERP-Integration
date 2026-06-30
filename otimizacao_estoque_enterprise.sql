-- ==========================================================
-- ELITE ERP - AUDITORIA DE SEGURANÇA E PERFORMANCE ESTOQUE
-- ==========================================================

-- 1. CONSTRAINTS DE INTEGRIDADE
ALTER TABLE public.movimentacoes_estoque
ADD CONSTRAINT chk_movimentacao_quantidade_positiva CHECK (quantidade > 0),
ADD CONSTRAINT chk_movimentacao_custo_positivo CHECK (custo_unitario >= 0);

-- 2. ÍNDICES DE ESCALABILIDADE (PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_mov_estoque_tenant_data ON public.movimentacoes_estoque(tenant_id, data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_mov_estoque_produto ON public.movimentacoes_estoque(tenant_id, produto_id);
CREATE INDEX IF NOT EXISTS idx_saldos_estoque_tenant ON public.saldos_estoque(tenant_id, produto_id, deposito_id);
CREATE INDEX IF NOT EXISTS idx_produtos_tenant_categoria ON public.produtos(tenant_id, categoria_id, is_active);

-- 3. CORREÇÃO DE SEGURANÇA (IDOR) EM RPCs SECURITY DEFINER
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
    v_custo_unitario := COALESCE((payload->>'custo_unitario')::NUMERIC, 0);

    -- 1. Inserir Movimentação
    INSERT INTO movimentacoes_estoque (
        produto_id, deposito_id, quantidade, tipo, data_movimentacao, 
        origem_destino, responsavel, custo_unitario, lote, data_validade, tenant_id, fazenda_id
    ) VALUES (
        v_produto_id, v_deposito_id, v_quantidade, v_tipo, 
        COALESCE(payload->>'data_movimentacao', NOW()::TEXT)::TIMESTAMP,
        payload->>'origem_destino', payload->>'responsavel', v_custo_unitario,
        payload->>'lote', (payload->>'data_validade')::DATE, v_tenant_id, (payload->>'fazenda_id')::UUID
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

-- 4. VIEW DE BI (VALUATION SUMMARY)
DROP VIEW IF EXISTS public.vw_inventory_valuation_summary CASCADE;
CREATE OR REPLACE VIEW public.vw_inventory_valuation_summary AS
SELECT 
    p.tenant_id,
    p.fazenda_id,
    p.id as produto_id,
    p.nome as produto_nome,
    c.nome as categoria_nome,
    p.unidade,
    COALESCE(p.custo_medio, 0) as custo_medio,
    COALESCE(p.estoque_atual, 0) as estoque_total,
    (COALESCE(p.custo_medio, 0) * COALESCE(p.estoque_atual, 0)) as valor_total_estimado,
    CASE 
        WHEN COALESCE(p.estoque_atual, 0) <= COALESCE(p.estoque_minimo, 0) THEN 'CRITICO'
        WHEN COALESCE(p.estoque_atual, 0) <= COALESCE(p.estoque_minimo, 0) * 1.5 THEN 'ALERTA'
        ELSE 'NORMAL'
    END as status_estoque
FROM public.produtos p
LEFT JOIN public.categorias_sistema c ON p.categoria_id = c.id
WHERE p.deleted_at IS NULL AND p.is_active = true;
