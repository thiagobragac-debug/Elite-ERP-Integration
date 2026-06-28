-- ==========================================================
-- ELITE ERP - PECUÁRIA (EVENT SOURCING / SOFT DELETE)
-- ==========================================================

-- 1. Sanidade (Eventos Sanitários)
CREATE OR REPLACE FUNCTION rpc_delete_health_event(p_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Apaga a movimentação de estoque atrelada (engatilha a trg_atualiza_estoque_kardex que repõe o saldo)
    DELETE FROM public.movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND origem_destino LIKE '%[REF:' || p_id || ']%';

    -- Atualiza o status para CANCELADO para manter o histórico (Soft Delete)
    UPDATE public.sanidade
    SET status = 'CANCELADO'
    WHERE id = p_id 
      AND tenant_id = p_tenant_id;
END;
$$;

-- 2. Reprodução (Eventos Reprodutivos)
CREATE OR REPLACE FUNCTION rpc_delete_reproduction_event(p_event_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Apaga sanidades geradas por este evento reprodutivo (Hard delete porque não são a origem principal)
    DELETE FROM public.sanidade_animais 
    WHERE tenant_id = p_tenant_id AND observacao LIKE '%[REF:' || p_event_id || ']%';

    -- Apaga movimentações de estoque geradas por este evento reprodutivo
    DELETE FROM public.movimentacoes_estoque 
    WHERE tenant_id = p_tenant_id AND origem_destino LIKE '%[REF:' || p_event_id || ']%';

    -- Atualiza para CANCELADO a raiz
    UPDATE public.eventos_reprodutivos 
    SET status = 'CANCELADO'
    WHERE tenant_id = p_tenant_id AND id = p_event_id;
END;
$$;
