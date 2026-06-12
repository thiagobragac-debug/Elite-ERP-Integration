-- Criação do Motor de Kardex (Recálculo Cronológico Completo)
CREATE OR REPLACE FUNCTION public.rebuild_kardex_fn(
    p_tenant_id uuid,
    p_produto_id uuid,
    p_deposito_id uuid
)
RETURNS void AS $$
DECLARE
    v_estoque_atual numeric := 0;
    v_custo_medio numeric := 0;
    v_nova_quantidade numeric;
    r RECORD;
BEGIN
    -- Se não foi passado um depósito, não podemos calcular saldo isolado
    IF p_deposito_id IS NULL THEN
        RETURN;
    END IF;

    -- Cursor para iterar por todas as movimentações do produto/depósito desde o início dos tempos
    -- Ordenado pela data real da movimentação, e depois pela ordem de criação (desempate)
    FOR r IN 
        SELECT id, tipo, quantidade, custo_unitario, origem
        FROM public.movimentacoes_estoque
        WHERE tenant_id = p_tenant_id 
          AND produto_id = p_produto_id 
          AND deposito_id = p_deposito_id
        ORDER BY data_movimentacao ASC, created_at ASC
    LOOP
        IF r.tipo = 'ENTRADA' THEN
            v_nova_quantidade := v_estoque_atual + r.quantidade;
            
            -- Recalcular Custo Médio Ponderado (apenas se a nova quantidade for > 0)
            IF v_nova_quantidade > 0 THEN
                -- Se a entrada veio de inventario/nf-e e tem custo_unitario
                v_custo_medio := ((v_estoque_atual * v_custo_medio) + (r.quantidade * COALESCE(r.custo_unitario, 0))) / v_nova_quantidade;
            END IF;
            
            v_estoque_atual := v_nova_quantidade;
            
        ELSIF r.tipo IN ('SAIDA', 'CONSUMO') THEN
            v_nova_quantidade := v_estoque_atual - r.quantidade;
            
            -- Para saídas, o custo_unitario da movimentação DEVE ser o custo médio atual
            -- Se for diferente, nós corrigimos (viagem no tempo)
            IF COALESCE(r.custo_unitario, -1) != v_custo_medio THEN
                UPDATE public.movimentacoes_estoque
                SET custo_unitario = v_custo_medio
                WHERE id = r.id;
            END IF;
            
            v_estoque_atual := v_nova_quantidade;
        END IF;
    END LOOP;

    -- Por fim, atualizar o saldo real na tabela de saldos_estoque para bater com o Kardex reconstruído
    UPDATE public.saldos_estoque
    SET quantidade = v_estoque_atual,
        custo_medio = v_custo_medio,
        updated_at = now()
    WHERE tenant_id = p_tenant_id 
      AND produto_id = p_produto_id 
      AND deposito_id = p_deposito_id;

    -- E atualizar a soma legado na tabela de produtos
    UPDATE public.produtos
    SET estoque_atual = (SELECT SUM(quantidade) FROM public.saldos_estoque WHERE produto_id = p_produto_id)
    WHERE id = p_produto_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizando a Trigger principal para engatilhar o Kardex
CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_is_storable boolean;
    v_allow_negative boolean;
    v_current_stock numeric;
    v_fazenda_id uuid;
BEGIN
    -- Validar se o produto é estocável
    SELECT COALESCE(is_storable, true) INTO v_is_storable
    FROM public.produtos WHERE id = NEW.produto_id;

    -- Se não for estocável (ex: serviço), permite a movimentação sem afetar saldos físicos
    IF NOT v_is_storable THEN
        RETURN NEW;
    END IF;

    -- Validar depósito
    IF NEW.deposito_id IS NULL THEN
        RAISE EXCEPTION 'DEPOSITO_REQUIRED';
    END IF;

    -- Validar bloqueio de estoque negativo para Saídas
    IF NEW.tipo IN ('SAIDA', 'CONSUMO') THEN
        SELECT COALESCE((settings->>'allow_negative_stock')::boolean, false) INTO v_allow_negative
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF NOT v_allow_negative THEN
            -- Buscar saldo no depósito específico
            SELECT quantidade INTO v_current_stock
            FROM public.saldos_estoque
            WHERE produto_id = NEW.produto_id AND deposito_id = NEW.deposito_id;

            v_current_stock := COALESCE(v_current_stock, 0);

            IF (v_current_stock - NEW.quantidade) < 0 THEN
                RAISE EXCEPTION 'NEGATIVE_STOCK_PREVENTION';
            END IF;
        END IF;
    END IF;

    -- Após garantir que a movimentação passou pelas regras físicas, o Kardex 
    -- será reconstruído no AFTER TRIGGER, então aqui retornamos apenas NEW.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O Motor de Kardex deve ser disparado APÓS a inserção, atualização ou deleção na tabela
CREATE OR REPLACE FUNCTION public.trigger_kardex_rebuild_fn()
RETURNS trigger AS $$
BEGIN
    -- Disparar a reconstrução passando o ID do produto e depósito
    -- Se for DELETE, usa o OLD, senão usa NEW
    IF TG_OP = 'DELETE' THEN
        PERFORM public.rebuild_kardex_fn(OLD.tenant_id, OLD.produto_id, OLD.deposito_id);
    ELSE
        PERFORM public.rebuild_kardex_fn(NEW.tenant_id, NEW.produto_id, NEW.deposito_id);
    END IF;

    -- Se for um UPDATE e o depósito ou produto mudou (raríssimo, mas possível), recriar para o OLD também
    IF TG_OP = 'UPDATE' THEN
        IF OLD.produto_id != NEW.produto_id OR OLD.deposito_id != NEW.deposito_id THEN
            PERFORM public.rebuild_kardex_fn(OLD.tenant_id, OLD.produto_id, OLD.deposito_id);
        END IF;
    END IF;

    RETURN NULL; -- AFTER triggers retornam NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_kardex_rebuild_after ON public.movimentacoes_estoque;
CREATE TRIGGER trigger_kardex_rebuild_after
    AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque
    FOR EACH ROW EXECUTE FUNCTION public.trigger_kardex_rebuild_fn();

-- Com a trigger acima, nós NÃO precisamos mais atualizar saldos_estoque ou custo médio
-- DENTRO das triggers ou functions antigas, pois o AFTER INSERT já fará isso perfeitamente.
