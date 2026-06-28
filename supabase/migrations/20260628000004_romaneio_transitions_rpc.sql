CREATE OR REPLACE FUNCTION transit_romaneio(p_id UUID, p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE romaneios 
    SET status = 'Em Trânsito'
    WHERE id = p_id AND tenant_id = p_tenant_id;
    
    UPDATE animais 
    SET status = 'EM_TRANSITO'
    WHERE romaneio_id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION conclude_romaneio(p_id UUID, p_tipo_destino TEXT, p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    novo_status TEXT;
BEGIN
    UPDATE romaneios 
    SET status = 'Concluído', data_chegada = CURRENT_DATE
    WHERE id = p_id AND tenant_id = p_tenant_id;
    
    IF p_tipo_destino = 'TRANSFERENCIA' THEN
        novo_status := 'INATIVO';
    ELSIF p_tipo_destino = 'VENDA' THEN
        novo_status := 'VENDIDO';
    ELSE
        novo_status := 'Abatido';
    END IF;

    UPDATE animais 
    SET status = novo_status
    WHERE romaneio_id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_romaneio(p_id UUID, p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE romaneios 
    SET status = 'Cancelado'
    WHERE id = p_id AND tenant_id = p_tenant_id;
    
    UPDATE animais 
    SET status = 'ATIVO', romaneio_id = NULL
    WHERE romaneio_id = p_id AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
