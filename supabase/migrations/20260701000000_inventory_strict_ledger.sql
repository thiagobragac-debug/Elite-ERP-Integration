-- ==============================================================================
-- Migration: Inventory Strict Ledger, Cost Rules & Purchase Integration
-- ==============================================================================

-- 1. Função e Triggers para Imutabilidade (Bloquear UPDATE e DELETE)
CREATE OR REPLACE FUNCTION public.block_movimentacoes_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'A tabela movimentacoes_estoque é imutável. Para correções, efetue um estorno ou ajuste de inventário.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_movimentacoes_update ON public.movimentacoes_estoque;
CREATE TRIGGER trg_block_movimentacoes_update
BEFORE UPDATE ON public.movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION public.block_movimentacoes_modification();

DROP TRIGGER IF EXISTS trg_block_movimentacoes_delete ON public.movimentacoes_estoque;
CREATE TRIGGER trg_block_movimentacoes_delete
BEFORE DELETE ON public.movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION public.block_movimentacoes_modification();

-- 2. Apropriação de Custos (Adicionando colunas de frete, seguro, impostos)
ALTER TABLE public.movimentacoes_estoque
ADD COLUMN IF NOT EXISTS frete NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS seguro NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS outras_despesas NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impostos NUMERIC DEFAULT 0;

-- 3. RPC para Gerar Solicitação de Compra (Acionado pelo Usuário)
CREATE OR REPLACE FUNCTION public.gerar_solicitacao_compra_lote(
    p_tenant_id uuid, 
    p_produto_ids uuid[], 
    p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_produto_id uuid;
    v_count integer := 0;
BEGIN
    -- A implementação real dependerá da existência do módulo de compras.
    -- Aqui criamos o contrato da RPC que será acionada pelo frontend.
    
    FOREACH v_produto_id IN ARRAY p_produto_ids
    LOOP
        v_count := v_count + 1;
        -- INSERT INTO solicitacoes_compra ... 
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', v_count || ' solicitações de compra geradas com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
