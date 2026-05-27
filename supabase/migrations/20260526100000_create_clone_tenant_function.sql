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
    v_columns text;
    v_sql text;
    v_tables_to_exclude text[] := ARRAY['tenants', 'unidades', 'fazendas', 'profiles', 'audit_logs', 'saas_audit_logs'];
    v_razao_social text;
    v_doc text;
BEGIN
    -- 1. Criar Empresa Matriz Base (Bypass RLS and handle schema dynamically)
    IF p_is_demo THEN
        v_razao_social := p_nome || ' (DEMO)';
        v_doc := '00.000.000/0001-00';
    ELSE
        v_razao_social := p_nome;
        v_doc := COALESCE(p_documento, '');
    END IF;

    -- Inserção da Empresa Matriz Base (sem EXCEPTION para expor o erro real se houver falha de schema)
    INSERT INTO public.unidades (tenant_id, nome, razao_social, documento, tipo)
    VALUES (p_new_tenant_id, p_nome, v_razao_social, v_doc, 'MATRIZ');

    -- 2. Clonagem Dinâmica do Template Master (Apenas tabelas reais, ignorando views)
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
        SELECT string_agg(quote_ident(column_name), ', ') INTO v_columns
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = v_table AND column_name NOT IN ('id', 'tenant_id');

        IF v_columns IS NOT NULL THEN
            v_sql := format(
                'INSERT INTO public.%I (%s, tenant_id) SELECT %s, %L FROM public.%I WHERE tenant_id = %L',
                v_table, v_columns, v_columns, p_new_tenant_id, v_table, v_master_tenant_id
            );
            EXECUTE v_sql;
        END IF;
    END LOOP;

    -- 3. Limpar logs de auditoria gerados durante o processo de seed/clonagem
    DELETE FROM public.audit_logs WHERE tenant_id = p_new_tenant_id;
    DELETE FROM public.saas_audit_logs WHERE tenant_id = p_new_tenant_id;
END;
$$;

