-- ==============================================================================
-- Migration: Backend para Notas Fiscais de Entrada e Saída
-- ==============================================================================

-- 1. TABELA DE MOVIMENTAÇÕES DE ESTOQUE (Se não existir)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    fazenda_id UUID REFERENCES public.fazendas(id),
    produto_id UUID NOT NULL REFERENCES public.produtos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'CONSUMO')),
    quantidade NUMERIC NOT NULL,
    custo_unitario NUMERIC DEFAULT 0,
    data_movimentacao TIMESTAMPTZ DEFAULT now(),
    origem TEXT, -- 'NF-E', 'MANUAL', etc.
    documento_id UUID, -- Pode apontar para a Nota Fiscal
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque;
CREATE POLICY "movimentacoes_estoque_tenant" ON public.movimentacoes_estoque
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- 2. TABELA DE NOTAS FISCAIS (CAPA)
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    company_id UUID REFERENCES public.fazendas(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    parceiro_id UUID REFERENCES public.parceiros(id),
    numero_nota TEXT,
    serie TEXT,
    chave_acesso TEXT UNIQUE,
    data_emissao DATE,
    data_entrada DATE,
    valor_total NUMERIC DEFAULT 0,
    xml_raw TEXT,
    status TEXT DEFAULT 'PROCESSADA' CHECK (status IN ('PROCESSADA', 'CANCELADA')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notas_fiscais_tenant" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_tenant" ON public.notas_fiscais
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- 3. TABELA DE ITENS DA NOTA FISCAL
CREATE TABLE IF NOT EXISTS public.nota_fiscal_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id),
    deposito_id UUID REFERENCES public.depositos(id),
    quantidade NUMERIC NOT NULL DEFAULT 0,
    preco_unitario NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    ncm TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.nota_fiscal_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nota_fiscal_itens_tenant" ON public.nota_fiscal_itens;
CREATE POLICY "nota_fiscal_itens_tenant" ON public.nota_fiscal_itens
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- 4. FUNÇÃO RPC PARA PROCESSAR A ENTRADA DE FORMA TRANSACIONAL
CREATE OR REPLACE FUNCTION public.processar_entrada_nfe(payload jsonb)
RETURNS uuid AS $$
DECLARE
    v_nota_id uuid;
    v_item jsonb;
    v_parcela jsonb;
    v_tenant_id uuid;
    v_company_id uuid;
    v_estoque_atual numeric;
    v_custo_medio numeric;
    v_nova_quantidade numeric;
BEGIN
    -- Extrair o tenant_id da sessão ou do payload
    v_tenant_id := (payload->>'tenant_id')::uuid;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'tenant_id é obrigatório';
    END IF;

    v_company_id := (payload->>'company_id')::uuid;

    -- 1. Inserir Capa da Nota
    INSERT INTO public.notas_fiscais (
        tenant_id, company_id, tipo, parceiro_id, numero_nota, serie, 
        chave_acesso, data_emissao, data_entrada, valor_total, xml_raw, status
    ) VALUES (
        v_tenant_id,
        v_company_id,
        'ENTRADA',
        (payload->>'supplier_id')::uuid,
        payload->>'invoice_number',
        payload->>'series',
        payload->>'xml_key',
        (payload->>'issue_date')::date,
        (payload->>'entry_date')::date,
        (payload->>'total_value')::numeric,
        payload->>'xml_raw',
        'PROCESSADA'
    ) RETURNING id INTO v_nota_id;

    -- 2. Inserir Itens e Movimentar Estoque
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        IF (v_item->>'produto_id') IS NOT NULL AND (v_item->>'produto_id') != '' THEN
            -- Inserir item da nota
            INSERT INTO public.nota_fiscal_itens (
                tenant_id, nota_fiscal_id, produto_id, deposito_id, 
                quantidade, preco_unitario, total, ncm
            ) VALUES (
                v_tenant_id,
                v_nota_id,
                (v_item->>'produto_id')::uuid,
                NULLIF(v_item->>'deposito_id', '')::uuid,
                (v_item->>'quantidade')::numeric,
                (v_item->>'preco_unitario')::numeric,
                (v_item->>'total')::numeric,
                v_item->>'xml_ncm'
            );

            -- Obter dados atuais do produto
            SELECT estoque_atual, custo_medio INTO v_estoque_atual, v_custo_medio
            FROM public.produtos WHERE id = (v_item->>'produto_id')::uuid;

            v_estoque_atual := COALESCE(v_estoque_atual, 0);
            v_custo_medio := COALESCE(v_custo_medio, 0);

            -- Registrar movimentação de estoque
            INSERT INTO public.movimentacoes_estoque (
                tenant_id, fazenda_id, produto_id, tipo, quantidade, 
                custo_unitario, origem, documento_id
            ) VALUES (
                v_tenant_id,
                v_company_id,
                (v_item->>'produto_id')::uuid,
                'ENTRADA',
                (v_item->>'quantidade')::numeric,
                (v_item->>'preco_unitario')::numeric,
                'NF-E',
                v_nota_id
            );

            -- Atualizar saldo e custo médio no produto
            v_nova_quantidade := v_estoque_atual + (v_item->>'quantidade')::numeric;
            
            IF v_nova_quantidade > 0 THEN
                v_custo_medio := ((v_estoque_atual * v_custo_medio) + ((v_item->>'quantidade')::numeric * (v_item->>'preco_unitario')::numeric)) / v_nova_quantidade;
            END IF;

            UPDATE public.produtos
            SET estoque_atual = v_nova_quantidade,
                custo_medio = v_custo_medio
            WHERE id = (v_item->>'produto_id')::uuid;
        END IF;
    END LOOP;

    -- 3. Gerar Financeiro (Contas a Pagar)
    IF (payload->>'generate_financial')::boolean = true THEN
        FOR v_parcela IN SELECT * FROM jsonb_array_elements(payload->'installments')
        LOOP
            INSERT INTO public.contas_pagar (
                tenant_id, fazenda_id, fornecedor_id, descricao, 
                valor_total, data_vencimento, status
            ) VALUES (
                v_tenant_id,
                v_company_id,
                (payload->>'supplier_id')::uuid,
                'NF-e ' || (payload->>'invoice_number') || ' - Parcela ' || (v_parcela->>'id'),
                (v_parcela->>'value')::numeric,
                (v_parcela->>'dueDate')::date,
                'PENDENTE'
            );
        END LOOP;
    END IF;

    RETURN v_nota_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
