-- Migration: Create RPC for Auto Purchase Requests securely on the backend

CREATE OR REPLACE FUNCTION public.generate_auto_purchase_request(
    p_produto_id uuid,
    p_tenant_id uuid,
    p_fazenda_id uuid
)
RETURNS uuid AS $$
DECLARE
    v_produto record;
    v_estoque_atual numeric;
    v_custo_medio numeric;
    v_diff numeric;
    v_valor_estimado numeric;
    v_solicitacao_id uuid;
BEGIN
    -- Obter os dados do produto
    SELECT id, nome, unidade, estoque_minimo
    INTO v_produto
    FROM public.produtos
    WHERE id = p_produto_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado para o tenant especificado.';
    END IF;

    -- Calcular estoque atual e custo medio real (protegido contra manipulação do client)
    SELECT 
        COALESCE(SUM(quantidade), 0),
        COALESCE(AVG(custo_medio), 0)
    INTO v_estoque_atual, v_custo_medio
    FROM public.saldos_estoque
    WHERE produto_id = p_produto_id AND tenant_id = p_tenant_id;

    -- Validar se a reposição realmente é necessária
    IF v_estoque_atual >= v_produto.estoque_minimo THEN
        RAISE EXCEPTION 'O estoque atual (%.2f) já atende ou supera o estoque mínimo (%.2f). Não é necessário repor.', v_estoque_atual, v_produto.estoque_minimo;
    END IF;

    v_diff := GREATEST(1, v_produto.estoque_minimo - v_estoque_atual);
    
    -- Definir um valor estimado mínimo para não ficar zerado caso custo seja 0
    IF v_custo_medio <= 0 THEN
        v_custo_medio := 1.00; 
    END IF;

    v_valor_estimado := GREATEST(100, v_diff * v_custo_medio);

    -- Inserir a solicitação de compra
    INSERT INTO public.solicitacoes_compra (
        titulo,
        departamento,
        prioridade,
        valor_estimado,
        descricao,
        status,
        solicitante,
        fazenda_id,
        tenant_id,
        created_at,
        updated_at
    ) VALUES (
        'Reposição de Insumo: ' || v_produto.nome,
        'Estoque',
        'high',
        v_valor_estimado,
        'Solicitação automática de reposição gerada pelo Módulo de Estoque devido a nível crítico de saldo físico. Saldo Atual: ' || v_estoque_atual || ' ' || v_produto.unidade || ' | Nível Mínimo Exigido: ' || v_produto.estoque_minimo || ' ' || v_produto.unidade || '.',
        'pending',
        'Sistema de Estoque (Auto)',
        p_fazenda_id,
        p_tenant_id,
        now(),
        now()
    ) RETURNING id INTO v_solicitacao_id;

    RETURN v_solicitacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
