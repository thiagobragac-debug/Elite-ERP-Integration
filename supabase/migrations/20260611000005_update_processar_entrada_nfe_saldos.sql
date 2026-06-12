-- Atualiza a procedure processar_entrada_nfe para suportar saldos_estoque e depósitos

CREATE OR REPLACE FUNCTION public.processar_entrada_nfe(payload jsonb)
RETURNS uuid AS $$
DECLARE
    v_tenant_id uuid;
    v_company_id uuid;
    v_nota_id uuid;
    v_item jsonb;
    v_parcela jsonb;
    v_estoque_atual numeric;
    v_custo_medio numeric;
    v_nova_quantidade numeric;
    v_deposito_id uuid;
    v_is_storable boolean;
BEGIN
    -- 1. Inserir a Nota Fiscal
    v_tenant_id := (payload->>'tenant_id')::uuid;
    v_company_id := NULLIF(payload->>'company_id', '')::uuid;

    INSERT INTO public.notas_fiscais (
        tenant_id, fazenda_id, chave_acesso, numero, serie, 
        data_emissao, fornecedor_id, valor_total, status, tipo
    ) VALUES (
        v_tenant_id,
        v_company_id,
        payload->>'access_key',
        payload->>'invoice_number',
        payload->>'series',
        (payload->>'issue_date')::date,
        (payload->>'supplier_id')::uuid,
        (payload->>'total_value')::numeric,
        'PROCESSADA',
        'ENTRADA'
    ) RETURNING id INTO v_nota_id;

    -- 2. Processar Itens
    FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
    LOOP
        IF (v_item->>'produto_id') IS NOT NULL AND (v_item->>'produto_id') != '' THEN
            
            v_deposito_id := NULLIF(v_item->>'deposito_id', '')::uuid;
            
            -- Inserir Item da NF
            INSERT INTO public.nota_fiscal_itens (
                tenant_id, nota_id, produto_id, deposito_id, 
                quantidade, preco_unitario, valor_total, xml_ncm
            ) VALUES (
                v_tenant_id,
                v_nota_id,
                (v_item->>'produto_id')::uuid,
                v_deposito_id,
                (v_item->>'quantidade')::numeric,
                (v_item->>'preco_unitario')::numeric,
                (v_item->>'total')::numeric,
                v_item->>'xml_ncm'
            );

            -- Verificar se produto é estocável
            SELECT COALESCE(is_storable, true) INTO v_is_storable
            FROM public.produtos WHERE id = (v_item->>'produto_id')::uuid;

            -- Registrar movimentação de estoque
            INSERT INTO public.movimentacoes_estoque (
                tenant_id, fazenda_id, produto_id, deposito_id, tipo, quantidade, 
                custo_unitario, origem, documento_id
            ) VALUES (
                v_tenant_id,
                v_company_id,
                (v_item->>'produto_id')::uuid,
                v_deposito_id,
                'ENTRADA',
                (v_item->>'quantidade')::numeric,
                (v_item->>'preco_unitario')::numeric,
                'NF-E',
                v_nota_id
            );

            -- Somente gerencia saldo e custo se for estocável e houver depósito
            IF v_is_storable AND v_deposito_id IS NOT NULL THEN
                -- Obter dados atuais do produto NO DEPOSITO
                SELECT quantidade, custo_medio INTO v_estoque_atual, v_custo_medio
                FROM public.saldos_estoque 
                WHERE produto_id = (v_item->>'produto_id')::uuid AND deposito_id = v_deposito_id
                FOR UPDATE;

                v_estoque_atual := COALESCE(v_estoque_atual, 0);
                v_custo_medio := COALESCE(v_custo_medio, 0);

                -- Atualizar saldo e custo médio no deposito
                v_nova_quantidade := v_estoque_atual + (v_item->>'quantidade')::numeric;
                
                IF v_nova_quantidade > 0 THEN
                    v_custo_medio := ((v_estoque_atual * v_custo_medio) + ((v_item->>'quantidade')::numeric * (v_item->>'preco_unitario')::numeric)) / v_nova_quantidade;
                END IF;

                -- Inserir ou atualizar na saldos_estoque
                INSERT INTO public.saldos_estoque (tenant_id, fazenda_id, produto_id, deposito_id, quantidade, custo_medio, valor_total)
                VALUES (v_tenant_id, v_company_id, (v_item->>'produto_id')::uuid, v_deposito_id, v_nova_quantidade, v_custo_medio, 0)
                ON CONFLICT (tenant_id, produto_id, deposito_id) DO UPDATE 
                SET quantidade = EXCLUDED.quantidade, custo_medio = EXCLUDED.custo_medio, updated_at = now();

                -- Atualizar campo legado na public.produtos para views antigas
                UPDATE public.produtos
                SET estoque_atual = (SELECT SUM(quantidade) FROM public.saldos_estoque WHERE produto_id = (v_item->>'produto_id')::uuid)
                WHERE id = (v_item->>'produto_id')::uuid;
            END IF;
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
