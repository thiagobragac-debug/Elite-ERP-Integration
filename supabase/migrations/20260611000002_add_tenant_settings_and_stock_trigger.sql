-- Migration: Adicionar configuração global de Estoque Negativo e Trigger de validação/atualização

-- 1. Adicionar coluna settings na tabela tenants (caso não exista)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Criar a função do trigger para validar e atualizar o saldo
CREATE OR REPLACE FUNCTION public.process_stock_movement_fn()
RETURNS trigger AS $$
DECLARE
    v_estoque_atual numeric;
    v_allow_negative boolean := false;
BEGIN
    -- Obter o estoque atual do produto travando a linha para concorrência
    SELECT COALESCE(estoque_atual, 0) INTO v_estoque_atual
    FROM public.produtos
    WHERE id = NEW.produto_id
    FOR UPDATE;

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

-- 3. Criar o trigger na tabela movimentacoes_estoque
DROP TRIGGER IF EXISTS trg_process_stock_movement ON public.movimentacoes_estoque;
CREATE TRIGGER trg_process_stock_movement
BEFORE INSERT ON public.movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION public.process_stock_movement_fn();
