-- 1. ADIÇÃO DE FLAG CONTROLA LOTE
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS controla_lote BOOLEAN DEFAULT false;

-- 2. TABELA DE SALDOS POR LOTE (GRANULARIDADE FEFO)
CREATE TABLE IF NOT EXISTS public.saldos_por_lote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    deposito_id UUID NOT NULL REFERENCES public.depositos(id) ON DELETE CASCADE,
    lote TEXT NOT NULL,
    validade DATE,
    quantidade NUMERIC(15,4) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    fazenda_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lote_produto_deposito ON public.saldos_por_lote(tenant_id, produto_id, deposito_id, lote);

-- 3. MIGRAÇÃO DE SALDOS EXISTENTES PARA "LOTE GENÉRICO" (Caso existam)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT produto_id, deposito_id, quantidade, tenant_id FROM public.saldos_estoque WHERE quantidade > 0)
    LOOP
        INSERT INTO public.saldos_por_lote (produto_id, deposito_id, lote, validade, quantidade, tenant_id)
        VALUES (r.produto_id, r.deposito_id, 'GENERICO_LEGADO', '2099-12-31', r.quantidade, r.tenant_id)
        ON CONFLICT (tenant_id, produto_id, deposito_id, lote) 
        DO UPDATE SET quantidade = saldos_por_lote.quantidade + EXCLUDED.quantidade, updated_at = NOW();
    END LOOP;
END
$$;

-- 4. ADICIONAR CAMPO STATUS ÀS MOVIMENTAÇÕES (Para o Estorno)
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONCLUIDO';
-- Rastreabilidade de qual lote foi afetado
CREATE TABLE IF NOT EXISTS public.movimentacoes_lote_detalhe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimentacao_id UUID NOT NULL REFERENCES public.movimentacoes_estoque(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL,
    lote TEXT NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL
);

-- 5. RPC FEFO (Entrada e Saída)
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_estoque(payload JSONB)
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
    v_lote TEXT;
    v_validade DATE;
    v_controla_lote BOOLEAN;
    v_qtd_restante NUMERIC;
    r RECORD;
    v_consumido NUMERIC;
BEGIN
    v_tenant_id := (payload->>'tenant_id')::UUID;
    v_produto_id := (payload->>'produto_id')::UUID;
    v_deposito_id := (payload->>'deposito_id')::UUID;
    v_quantidade := (payload->>'quantidade')::NUMERIC;
    v_tipo := payload->>'tipo';
    v_custo_unitario := COALESCE((payload->>'custo_unitario')::NUMERIC, 0);
    v_lote := payload->>'lote';
    v_validade := (payload->>'data_validade')::DATE;

    SELECT controla_lote INTO v_controla_lote FROM produtos WHERE id = v_produto_id;
    
    IF v_controla_lote AND v_tipo IN ('ENTRADA', 'in') AND (v_lote IS NULL OR v_validade IS NULL) THEN
        RAISE EXCEPTION 'Produto exige controle de lote e validade na entrada.';
    END IF;

    IF v_tipo IN ('ENTRADA', 'in') AND v_lote IS NULL THEN
        v_lote := 'GENERICO_' || TO_CHAR(NOW(), 'YYYYMMDD');
        v_validade := '2099-12-31';
    END IF;

    -- INSERIR CABEÇALHO DA MOVIMENTAÇÃO
    INSERT INTO movimentacoes_estoque (
        produto_id, deposito_id, quantidade, tipo, data_movimentacao, 
        origem_destino, responsavel, custo_unitario, lote, data_validade, tenant_id, fazenda_id
    ) VALUES (
        v_produto_id, v_deposito_id, v_quantidade, v_tipo, 
        COALESCE(payload->>'data_movimentacao', NOW()::TEXT)::TIMESTAMP,
        payload->>'origem_destino', payload->>'responsavel', v_custo_unitario,
        v_lote, v_validade, v_tenant_id, (payload->>'fazenda_id')::UUID
    ) RETURNING id INTO v_movimentacao_id;

    IF v_tipo IN ('ENTRADA', 'in') THEN
        INSERT INTO saldos_por_lote (produto_id, deposito_id, lote, validade, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, v_lote, v_validade, v_quantidade, v_tenant_id)
        ON CONFLICT (tenant_id, produto_id, deposito_id, lote) 
        DO UPDATE SET quantidade = saldos_por_lote.quantidade + EXCLUDED.quantidade, updated_at = NOW();

        INSERT INTO movimentacoes_lote_detalhe(movimentacao_id, produto_id, lote, quantidade)
        VALUES (v_movimentacao_id, v_produto_id, v_lote, v_quantidade);

        -- Saldo macro
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) DO UPDATE SET quantidade = saldos_estoque.quantidade + EXCLUDED.quantidade;
        
        IF v_custo_unitario > 0 THEN
            UPDATE produtos SET custo_medio = (COALESCE(custo_medio, 0) + v_custo_unitario) / 2 WHERE id = v_produto_id;
        END IF;

    ELSIF v_tipo IN ('SAIDA', 'out') THEN
        v_qtd_restante := v_quantidade;

        -- FEFO: Puxar lotes mais antigos a vencer que têm saldo
        FOR r IN (
            SELECT id, lote, validade, quantidade 
            FROM saldos_por_lote 
            WHERE produto_id = v_produto_id AND deposito_id = v_deposito_id AND quantidade > 0 
            ORDER BY validade ASC NULLS LAST
        )
        LOOP
            IF v_qtd_restante <= 0 THEN EXIT; END IF;
            
            IF r.quantidade >= v_qtd_restante THEN
                v_consumido := v_qtd_restante;
            ELSE
                v_consumido := r.quantidade;
            END IF;

            UPDATE saldos_por_lote SET quantidade = quantidade - v_consumido WHERE id = r.id;
            INSERT INTO movimentacoes_lote_detalhe(movimentacao_id, produto_id, lote, quantidade) VALUES (v_movimentacao_id, v_produto_id, r.lote, v_consumido);
            
            v_qtd_restante := v_qtd_restante - v_consumido;
        END LOOP;

        IF v_qtd_restante > 0 THEN
            RAISE EXCEPTION 'Saldo FEFO insuficiente nos lotes.';
        END IF;

        -- Saldo macro
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, -v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) DO UPDATE SET quantidade = saldos_estoque.quantidade - EXCLUDED.quantidade;
    END IF;

    -- Sincronizar estoque_atual para frontend antigo
    UPDATE produtos SET estoque_atual = (SELECT COALESCE(SUM(quantidade),0) FROM saldos_estoque WHERE produto_id = v_produto_id) WHERE id = v_produto_id;

    RETURN jsonb_build_object('success', true, 'movimentacao_id', v_movimentacao_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. ESTORNO ROBUSTO E BLOQUEANTE
CREATE OR REPLACE FUNCTION public.estornar_movimentacao(p_movimentacao_id UUID, p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mov RECORD;
    v_detalhe RECORD;
    v_saldo_lote NUMERIC;
BEGIN
    SELECT * INTO v_mov FROM movimentacoes_estoque WHERE id = p_movimentacao_id AND tenant_id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movimentação não encontrada.';
    END IF;

    IF v_mov.status = 'CANCELED' THEN
        RAISE EXCEPTION 'Movimentação já estornada.';
    END IF;

    IF v_mov.tipo IN ('ENTRADA', 'in') THEN
        FOR v_detalhe IN (SELECT * FROM movimentacoes_lote_detalhe WHERE movimentacao_id = p_movimentacao_id)
        LOOP
            SELECT quantidade INTO v_saldo_lote FROM saldos_por_lote 
            WHERE produto_id = v_detalhe.produto_id AND lote = v_detalhe.lote AND deposito_id = v_mov.deposito_id;
            
            IF v_saldo_lote < v_detalhe.quantidade THEN
                RAISE EXCEPTION 'BLOQUEIO DE ESTORNO: O lote % já sofreu consumo parcial ou total e não pode ser estornado diretamente. É necessário recompor o saldo.', v_detalhe.lote;
            END IF;

            UPDATE saldos_por_lote SET quantidade = quantidade - v_detalhe.quantidade 
            WHERE produto_id = v_detalhe.produto_id AND lote = v_detalhe.lote AND deposito_id = v_mov.deposito_id;
        END LOOP;
        
        UPDATE saldos_estoque SET quantidade = quantidade - v_mov.quantidade WHERE produto_id = v_mov.produto_id AND deposito_id = v_mov.deposito_id;
    
    ELSIF v_mov.tipo IN ('SAIDA', 'out') THEN
        FOR v_detalhe IN (SELECT * FROM movimentacoes_lote_detalhe WHERE movimentacao_id = p_movimentacao_id)
        LOOP
            UPDATE saldos_por_lote SET quantidade = quantidade + v_detalhe.quantidade 
            WHERE produto_id = v_detalhe.produto_id AND lote = v_detalhe.lote AND deposito_id = v_mov.deposito_id;
        END LOOP;
        
        UPDATE saldos_estoque SET quantidade = quantidade + v_mov.quantidade WHERE produto_id = v_mov.produto_id AND deposito_id = v_mov.deposito_id;
    END IF;

    UPDATE movimentacoes_estoque SET status = 'CANCELED', origem_destino = COALESCE(origem_destino, '') || ' [ESTORNADO]' WHERE id = p_movimentacao_id;
    UPDATE produtos SET estoque_atual = (SELECT COALESCE(SUM(quantidade),0) FROM saldos_estoque WHERE produto_id = v_mov.produto_id) WHERE id = v_mov.produto_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- 7. DASHBOARD RPCS (ABC Curve & Coverage)
CREATE OR REPLACE FUNCTION public.get_abc_curve(p_tenant_id UUID, p_warehouse_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_value NUMERIC;
    v_result JSONB;
BEGIN
    SELECT SUM(COALESCE(estoque_atual,0) * COALESCE(custo_medio,0)) INTO v_total_value 
    FROM produtos WHERE tenant_id = p_tenant_id AND is_active = true AND deleted_at IS NULL;

    WITH ranked AS (
        SELECT 
            id as produto_id,
            nome,
            unidade,
            COALESCE(estoque_atual,0) as quantidade,
            COALESCE(estoque_atual,0) * COALESCE(custo_medio,0) as valor_total
        FROM produtos
        WHERE tenant_id = p_tenant_id AND is_active = true AND deleted_at IS NULL
          AND COALESCE(estoque_atual,0) * COALESCE(custo_medio,0) > 0
        ORDER BY COALESCE(estoque_atual,0) * COALESCE(custo_medio,0) DESC
    ),
    cumulative AS (
        SELECT 
            *,
            SUM(valor_total) OVER (ORDER BY valor_total DESC) as accumulated
        FROM ranked
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'nome', nome,
            'valor_total', valor_total,
            'quantidade', quantidade,
            'unidade', unidade,
            'percentage', CASE WHEN v_total_value > 0 THEN (valor_total / v_total_value) * 100 ELSE 0 END,
            'classification', CASE 
                WHEN CASE WHEN v_total_value > 0 THEN (accumulated / v_total_value) * 100 ELSE 0 END <= 80 THEN 'A'
                WHEN CASE WHEN v_total_value > 0 THEN (accumulated / v_total_value) * 100 ELSE 0 END <= 95 THEN 'B'
                ELSE 'C'
            END
        )
    ) INTO v_result
    FROM cumulative
    WHERE CASE WHEN v_total_value > 0 THEN (accumulated / v_total_value) * 100 ELSE 0 END <= 80 -- Só top A
    LIMIT 5;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


CREATE OR REPLACE FUNCTION public.get_stock_coverage(p_tenant_id UUID, p_warehouse_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Consumo dos ultimos 30 dias
    WITH consumption AS (
        SELECT produto_id, SUM(quantidade) as q_saida
        FROM movimentacoes_estoque
        WHERE tenant_id = p_tenant_id AND tipo IN ('SAIDA', 'out') AND status = 'CONCLUIDO' 
        AND data_movimentacao >= NOW() - INTERVAL '30 days'
        GROUP BY produto_id
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'nome', p.nome,
            'unidade', p.unidade,
            'currentStock', COALESCE(p.estoque_atual,0),
            'dailyConsumption', (c.q_saida / 30.0),
            'days', CASE WHEN c.q_saida > 0 THEN FLOOR(COALESCE(p.estoque_atual,0) / (c.q_saida / 30.0)) ELSE 999 END
        )
    ) INTO v_result
    FROM consumption c
    JOIN produtos p ON p.id = c.produto_id
    WHERE CASE WHEN c.q_saida > 0 THEN FLOOR(COALESCE(p.estoque_atual,0) / (c.q_saida / 30.0)) ELSE 999 END <= 15
    ORDER BY 5 ASC
    LIMIT 4;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
