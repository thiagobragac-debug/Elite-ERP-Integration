-- ==============================================================================
-- Migration: Corrigir Clonagem Dinâmica (UUIDs determinísticos e FK checks bypass)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.clone_tenant_from_template(
    p_new_tenant_id uuid,
    p_nome text,
    p_documento text,
    p_is_demo boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_master_tenant_id uuid := '00000000-0000-0000-0000-000000000000';
    v_table text;
    v_columns_insert text;
    v_columns_select text;
    v_sql text;
    v_tables_to_exclude text[] := ARRAY['tenants', 'unidades', 'fazendas', 'profiles', 'audit_logs', 'saas_audit_logs'];
    v_razao_social text;
    v_doc text;
BEGIN
    -- 1. Desabilitar verificação de Foreign Keys temporariamente nesta transação
    -- Isso previne erros de dependência se a ordem das tabelas for arbitrária
    SET LOCAL session_replication_role = 'replica';

    -- 2. Criar Empresa Matriz Base
    IF p_is_demo THEN
        v_razao_social := p_nome || ' (DEMO)';
        v_doc := '00.000.000/0001-00';
    ELSE
        v_razao_social := p_nome;
        v_doc := COALESCE(p_documento, '');
    END IF;

    -- Se já inserido via RPC auxiliar, não vai falhar graças ao ON CONFLICT DO NOTHING
    INSERT INTO public.unidades (tenant_id, nome, razao_social, documento, tipo)
    VALUES (p_new_tenant_id, p_nome, v_razao_social, v_doc, 'MATRIZ')
    ON CONFLICT DO NOTHING;

    -- 3. Clonagem Dinâmica com Mapeamento Determinístico
    FOR v_table IN
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
        WHERE c.table_schema = 'public' 
          AND c.column_name = 'tenant_id' 
          AND t.table_type = 'BASE TABLE'
          AND c.table_name != ALL(v_tables_to_exclude)
        GROUP BY c.table_name
    LOOP
        -- Construir colunas para INSERT (todas exceto tenant_id)
        SELECT string_agg(quote_ident(column_name), ', ') INTO v_columns_insert
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = v_table AND column_name != 'tenant_id';

        -- Construir colunas para SELECT com remapeamento
        SELECT string_agg(
            CASE 
                -- Ignorar colunas de FK globais (não remapeá-las para a namespace do tenant)
                WHEN column_name IN ('user_id', 'created_by', 'updated_by', 'aprovador_id', 'solicitante_id') THEN quote_ident(column_name)
                
                -- Mapear UUIDs locais (ex: id, lote_id, produto_id) determinísticamente. 
                -- uuid_generate_v5 vai gerar sempre o mesmo uuid baseado no p_new_tenant_id + string do old_id
                WHEN data_type = 'uuid' THEN 
                    format('CASE WHEN %I IS NULL THEN NULL ELSE uuid_generate_v5(%L::uuid, %I::text) END', column_name, p_new_tenant_id, column_name)
                
                -- Copiar valores comuns
                ELSE quote_ident(column_name)
            END, 
            ', '
        ) INTO v_columns_select
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = v_table AND column_name != 'tenant_id';

        IF v_columns_insert IS NOT NULL AND v_columns_select IS NOT NULL THEN
            v_sql := format(
                'INSERT INTO public.%I (%s, tenant_id) SELECT %s, %L FROM public.%I WHERE tenant_id = %L ON CONFLICT DO NOTHING',
                v_table, v_columns_insert, v_columns_select, p_new_tenant_id, v_table, v_master_tenant_id
            );
            EXECUTE v_sql;
        END IF;
    END LOOP;

    -- 4. Limpar logs indesejados originados no master e copiados
    DELETE FROM public.audit_logs WHERE tenant_id = p_new_tenant_id;
    DELETE FROM public.saas_audit_logs WHERE tenant_id = p_new_tenant_id;
END;
$$;
