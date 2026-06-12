ALTER TABLE public.periodos_contabeis
ADD COLUMN data_bloqueio_automatico DATE;

CREATE OR REPLACE FUNCTION public.check_periodo_aberto_fn()
RETURNS trigger AS $$
DECLARE
    v_data_operacao date;
    v_ano integer;
    v_mes integer;
    v_status text;
    v_data_bloqueio date;
    v_tenant_id uuid;
    v_fazenda_id uuid;
BEGIN
    -- Identificar qual campo de data usar dependendo da tabela
    IF TG_TABLE_NAME = 'movimentacoes_estoque' THEN
        v_data_operacao := (CASE WHEN TG_OP = 'DELETE' THEN OLD.data_movimentacao ELSE NEW.data_movimentacao END)::date;
        v_tenant_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
        v_fazenda_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.fazenda_id ELSE NEW.fazenda_id END;
    ELSIF TG_TABLE_NAME = 'notas_fiscais' THEN
        v_data_operacao := (CASE WHEN TG_OP = 'DELETE' THEN OLD.data_emissao ELSE NEW.data_emissao END);
        v_tenant_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
        v_fazenda_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.fazenda_id ELSE NEW.fazenda_id END;
    ELSIF TG_TABLE_NAME = 'contas_pagar' OR TG_TABLE_NAME = 'contas_receber' THEN
        v_data_operacao := (CASE WHEN TG_OP = 'DELETE' THEN OLD.data_vencimento ELSE NEW.data_vencimento END);
        v_tenant_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
        v_fazenda_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.fazenda_id ELSE NEW.fazenda_id END;
    ELSE
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    -- Se a data for nula (raro, mas possivel se os campos nao forem obrigatórios e estiver criando), ignorar
    IF v_data_operacao IS NULL THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    v_ano := extract(year from v_data_operacao);
    v_mes := extract(month from v_data_operacao);

    -- Buscar se o período existe e qual o status e data de bloqueio
    SELECT status, data_bloqueio_automatico INTO v_status, v_data_bloqueio
    FROM public.periodos_contabeis
    WHERE tenant_id = v_tenant_id 
      AND (fazenda_id IS NULL OR fazenda_id = v_fazenda_id)
      AND ano = v_ano 
      AND mes = v_mes
    ORDER BY fazenda_id NULLS LAST
    LIMIT 1;

    -- Se encontrar status FECHADO, abortar a operação
    IF v_status = 'FECHADO' THEN
        RAISE EXCEPTION 'PERIOD_CLOSED';
    END IF;

    -- Se tiver data de bloqueio automatico e o dia atual ja tiver passado ou for igual a ela
    IF v_data_bloqueio IS NOT NULL AND CURRENT_DATE >= v_data_bloqueio THEN
        RAISE EXCEPTION 'AUTO_LOCKED';
    END IF;

    -- Retornar o registro apropriado dependendo do tipo da operação
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
