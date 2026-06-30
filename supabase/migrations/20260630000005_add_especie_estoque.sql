-- ==============================================================================
-- Migration: Add Especie and Aptidao to Movimentacoes de Estoque
-- ==============================================================================

-- 1. Add columns to the table
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

-- 2. Update the RPC to accept these fields from payload
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


-- 3. Criar Trigger para capturar movimentações criadas DIRETAMENTE do módulo de Pecuária (Health, Nutrition)
CREATE OR REPLACE FUNCTION public.trg_set_especie_estoque()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for oriundo da pecuária, as colunas animal_id ou lote_pecuario_id estarão preenchidas
    -- Ou a string de origem terá os nomes do módulo
    IF NEW.animal_id IS NOT NULL OR 
       NEW.lote_pecuario_id IS NOT NULL OR 
       NEW.origem_destino ILIKE '%Manejo Sanitário%' OR 
       NEW.origem_destino ILIKE '%Nutrição%' OR 
       NEW.origem_destino ILIKE '%Relocação%' OR
       NEW.origem_destino ILIKE '%Bovino%'
    THEN
        IF NEW.especie_id IS NULL THEN
            NEW.especie_id := 'bovino';
        END IF;
        IF NEW.aptidao_id IS NULL THEN
            NEW.aptidao_id := 'corte';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimentacoes_estoque_especie ON public.movimentacoes_estoque;
CREATE TRIGGER trg_movimentacoes_estoque_especie
BEFORE INSERT ON public.movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_especie_estoque();
