-- Migration para garantir ACID na exclusão de eventos sanitários e de estoque

CREATE OR REPLACE FUNCTION rpc_delete_health_event(p_id UUID, p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Apaga a movimentação de estoque atrelada (a origem_destino conterá a REF)
    DELETE FROM movimentacoes_estoque
    WHERE tenant_id = p_tenant_id 
      AND origem_destino LIKE '%[REF:' || p_id || ']%';

    -- 2. Apaga o evento sanitário em si
    DELETE FROM sanidade
    WHERE id = p_id 
      AND tenant_id = p_tenant_id;
END;
$$;
