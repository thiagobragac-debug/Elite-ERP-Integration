-- ==========================================================
-- ELITE ERP - MIGRATION 004: Correção de Vazamento Multi-Tenant na RPC get_finance_summary
-- Descrição: Impede que qualquer usuário autenticado passe o
-- tenant_id de outro cliente para ler dados financeiros privados.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.get_finance_summary(
  p_table_name text,
  p_tenant_id uuid,
  p_fazenda_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(status text, total_value numeric, record_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_tenant_id uuid;
BEGIN
  -- 1. Whitelist de tabelas autorizadas para evitar injeções dinâmicas
  IF p_table_name NOT IN ('contas_pagar', 'contas_receber') THEN
    RAISE EXCEPTION 'A tabela % não é permitida para agregações financeiras.', p_table_name;
  END IF;

  -- 2. Busca o tenant_id associado ao usuário autenticado (auth.uid())
  v_user_tenant_id := auth_helpers.get_auth_tenant();

  -- 3. Validação de Segurança: Bloqueia caso o tenant_id solicitado seja diferente do tenant do usuário conectado
  IF p_tenant_id <> v_user_tenant_id THEN
    RAISE EXCEPTION 'Acesso negado. Você só pode consultar resumos financeiros do seu próprio Tenant (Inquilino).';
  END IF;

  -- 4. Executa a query dinâmica com segurança (utilizando %I e %L para prevenir injeções de SQL)
  RETURN QUERY EXECUTE format(
    'SELECT status, SUM(valor_total) as total_value, COUNT(*) as record_count 
     FROM %I 
     WHERE tenant_id = %L 
     AND (%L::uuid IS NULL OR fazenda_id = %L::uuid)
     GROUP BY status',
    p_table_name, p_tenant_id, p_fazenda_id, p_fazenda_id
  );
END;
$function$;

-- Garante permissões apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_finance_summary(text, uuid, uuid) TO authenticated;
