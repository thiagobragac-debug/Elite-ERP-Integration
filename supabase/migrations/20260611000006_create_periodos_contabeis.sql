-- Criação da tabela de períodos contábeis
CREATE TABLE IF NOT EXISTS public.periodos_contabeis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    fazenda_id uuid REFERENCES public.fazendas(id) ON DELETE CASCADE,
    ano integer NOT NULL,
    mes integer NOT NULL,
    status text NOT NULL CHECK (status IN ('ABERTO', 'FECHADO')),
    fechado_em timestamptz,
    fechado_por uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, fazenda_id, ano, mes)
);

-- RLS
ALTER TABLE public.periodos_contabeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver períodos do seu tenant"
    ON public.periodos_contabeis FOR SELECT
    USING (tenant_id = auth_helpers.get_auth_tenant());

CREATE POLICY "Usuários podem gerenciar períodos do seu tenant"
    ON public.periodos_contabeis FOR ALL
    USING (tenant_id = auth_helpers.get_auth_tenant());

-- Função de trava global para ser usada como trigger
CREATE OR REPLACE FUNCTION public.check_periodo_aberto_fn()
RETURNS trigger AS $$
DECLARE
    v_data_operacao date;
    v_ano integer;
    v_mes integer;
    v_status text;
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

    -- Buscar se o período existe e qual o status
    SELECT status INTO v_status
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

    -- Retornar o registro apropriado dependendo do tipo da operação
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a Trigger nas tabelas base
DROP TRIGGER IF EXISTS check_periodo_aberto_trigger ON public.movimentacoes_estoque;
CREATE TRIGGER check_periodo_aberto_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque
    FOR EACH ROW EXECUTE FUNCTION public.check_periodo_aberto_fn();

DROP TRIGGER IF EXISTS check_periodo_aberto_trigger_nf ON public.notas_fiscais;
CREATE TRIGGER check_periodo_aberto_trigger_nf
    BEFORE INSERT OR UPDATE OR DELETE ON public.notas_fiscais
    FOR EACH ROW EXECUTE FUNCTION public.check_periodo_aberto_fn();

DROP TRIGGER IF EXISTS check_periodo_aberto_trigger_cp ON public.contas_pagar;
CREATE TRIGGER check_periodo_aberto_trigger_cp
    BEFORE INSERT OR UPDATE OR DELETE ON public.contas_pagar
    FOR EACH ROW EXECUTE FUNCTION public.check_periodo_aberto_fn();

DROP TRIGGER IF EXISTS check_periodo_aberto_trigger_cr ON public.contas_receber;
CREATE TRIGGER check_periodo_aberto_trigger_cr
    BEFORE INSERT OR UPDATE OR DELETE ON public.contas_receber
    FOR EACH ROW EXECUTE FUNCTION public.check_periodo_aberto_fn();
