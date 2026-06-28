-- Migration para garantir atomicidade na exclusão de Eventos Reprodutivos

CREATE OR REPLACE FUNCTION rpc_delete_reproduction_event(p_event_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Apaga sanidades geradas por este evento reprodutivo
    DELETE FROM public.sanidade_animais 
    WHERE tenant_id = p_tenant_id AND observacao LIKE '%[REF:' || p_event_id || ']%';

    -- 2. Apaga movimentações de estoque geradas por este evento reprodutivo
    DELETE FROM public.movimentacoes_estoque 
    WHERE tenant_id = p_tenant_id AND origem_destino LIKE '%[REF:' || p_event_id || ']%';

    -- 3. Apaga o evento reprodutivo em si
    DELETE FROM public.eventos_reprodutivos 
    WHERE tenant_id = p_tenant_id AND id = p_event_id;

END;
$$;
