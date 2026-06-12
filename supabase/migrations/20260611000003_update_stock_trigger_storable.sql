-- Atualiza o trigger de estoque para ignorar produtos que não são estocáveis (is_storable = false)

CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_estoque_atual numeric;
    v_allow_negative boolean := false;
    v_is_storable boolean := true;
BEGIN
    -- Obter o estoque atual e a flag is_storable travando a linha para concorrência
    SELECT COALESCE(estoque_atual, 0), COALESCE(is_storable, true) 
    INTO v_estoque_atual, v_is_storable
    FROM public.produtos
    WHERE id = NEW.produto_id
    FOR UPDATE;

    -- Se o produto não for estocável (is_storable = false), ignorar completamente o controle
    IF NOT v_is_storable THEN
        RETURN NEW;
    END IF;

    -- Calcular novo saldo baseado no tipo de movimento
    IF NEW.tipo IN ('ENTRADA') THEN
        v_estoque_atual := v_estoque_atual + NEW.quantidade;
    ELSIF NEW.tipo IN ('SAIDA', 'CONSUMO') THEN
        v_estoque_atual := v_estoque_atual - NEW.quantidade;
    ELSIF NEW.tipo = 'AJUSTE' THEN
        -- Ajustes podem ser valores absolutos positivos ou negativos
        v_estoque_atual := v_estoque_atual + NEW.quantidade;
    END IF;

    -- Validar estoque negativo
    IF v_estoque_atual < 0 THEN
        -- Verificar a configuracao do tenant (se permitir estoque negativo)
        SELECT COALESCE((settings->>'allow_negative_stock')::boolean, false) INTO v_allow_negative
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF NOT v_allow_negative THEN
            RAISE EXCEPTION 'NEGATIVE_STOCK_PREVENTION';
        END IF;
    END IF;

    -- Atualizar o saldo na tabela produtos
    -- Ignoramos a origem 'NF-E' porque a function 'process_nf_backend' já atualiza a tabela produtos por conta própria.
    IF NEW.origem IS DISTINCT FROM 'NF-E' THEN
        UPDATE public.produtos
        SET estoque_atual = v_estoque_atual
        WHERE id = NEW.produto_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
