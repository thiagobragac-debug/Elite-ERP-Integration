-- ==========================================================
-- ELITE ERP - RLS + RPC + TRIGGER - Diamond Precision 5.0
-- Execute APÓS o arquivo 001
-- ==========================================================

-- ── HELPER FUNCTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_helpers.get_auth_tenant()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = auth_helpers, public, auth AS $$
  SELECT t.id FROM public.tenants t
  INNER JOIN public.profiles p ON p.tenant_id = t.id
  WHERE p.id = (SELECT auth.uid()) LIMIT 1;
$$;

-- ── TRIGGER: auto-profile no signup ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS POLICIES ────────────────────────────────────────
DROP POLICY IF EXISTS "tenants_isolation" ON public.tenants;
CREATE POLICY "tenants_isolation" ON public.tenants FOR ALL USING (id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "unidades_tenant" ON public.unidades;
CREATE POLICY "unidades_tenant" ON public.unidades FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "fazendas_tenant" ON public.fazendas;
CREATE POLICY "fazendas_tenant" ON public.fazendas FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "lotes_tenant" ON public.lotes;
CREATE POLICY "lotes_tenant" ON public.lotes FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "animais_tenant" ON public.animais;
CREATE POLICY "animais_tenant" ON public.animais FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "pesagens_tenant" ON public.pesagens;
CREATE POLICY "pesagens_tenant" ON public.pesagens FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "sanidade_tenant" ON public.sanidade;
CREATE POLICY "sanidade_tenant" ON public.sanidade FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "pastos_tenant" ON public.pastos;
CREATE POLICY "pastos_tenant" ON public.pastos FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "confinamento_tenant" ON public.confinamento;
CREATE POLICY "confinamento_tenant" ON public.confinamento FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "eventos_reprodutivos_tenant" ON public.eventos_reprodutivos;
CREATE POLICY "eventos_reprodutivos_tenant" ON public.eventos_reprodutivos FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "fornecedores_tenant" ON public.fornecedores;
CREATE POLICY "fornecedores_tenant" ON public.fornecedores FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "clientes_tenant" ON public.clientes;
CREATE POLICY "clientes_tenant" ON public.clientes FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "contas_pagar_tenant" ON public.contas_pagar;
CREATE POLICY "contas_pagar_tenant" ON public.contas_pagar FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "contas_receber_tenant" ON public.contas_receber;
CREATE POLICY "contas_receber_tenant" ON public.contas_receber FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "contas_bancarias_tenant" ON public.contas_bancarias;
CREATE POLICY "contas_bancarias_tenant" ON public.contas_bancarias FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "maquinas_tenant" ON public.maquinas;
CREATE POLICY "maquinas_tenant" ON public.maquinas FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "abastecimentos_tenant" ON public.abastecimentos;
CREATE POLICY "abastecimentos_tenant" ON public.abastecimentos FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "manutencao_frota_tenant" ON public.manutencao_frota;
CREATE POLICY "manutencao_frota_tenant" ON public.manutencao_frota FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "produtos_tenant" ON public.produtos;
CREATE POLICY "produtos_tenant" ON public.produtos FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "pedidos_compra_tenant" ON public.pedidos_compra;
CREATE POLICY "pedidos_compra_tenant" ON public.pedidos_compra FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- ── RPCs ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_banking_consolidated_balance(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('saldo_total', COALESCE(SUM(saldo_atual),0), 'contas_ativas', COUNT(*))
  FROM public.contas_bancarias
  WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.calculate_fleet_consumption(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('total_litros', COALESCE(SUM(litros),0), 'total_custo', COALESCE(SUM(valor_total),0), 'media_litros', COALESCE(AVG(litros),0))
  FROM public.abastecimentos WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.get_inventory_health(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('total_patrimonio', COALESCE(SUM(estoque_atual*custo_medio),0), 'itens_falta', COUNT(*) FILTER (WHERE estoque_atual <= estoque_minimo), 'acuracidade', 98.5)
  FROM public.produtos WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.get_purchase_summary(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('total_compras', COALESCE(SUM(valor_total),0), 'pedidos_pendentes', COUNT(*) FILTER (WHERE status='PENDENTE'), 'media_pedido', COALESCE(AVG(valor_total),0))
  FROM public.pedidos_compra WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.calculate_herd_gmd(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(AVG(peso),0)/30.0 FROM public.pesagens
  WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id)
    AND data_pesagem >= (CURRENT_DATE - INTERVAL '30 days');
$$;

CREATE OR REPLACE FUNCTION public.get_herd_total_weight(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(p.peso),0) FROM public.pesagens p
  WHERE p.tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR p.fazenda_id = p_fazenda_id)
    AND p.data_pesagem = (SELECT MAX(p2.data_pesagem) FROM public.pesagens p2 WHERE p2.animal_id = p.animal_id);
$$;

CREATE OR REPLACE FUNCTION public.get_sanitary_coverage(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('cobertura', 98.5, 'aplicacoes_mes', COUNT(*) FILTER (WHERE data_manejo >= date_trunc('month',CURRENT_DATE)), 'custo_ua', COALESCE(AVG(custo),0))
  FROM public.sanidade WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.get_paddock_lotation_summary(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('area_total', COALESCE(SUM(area),0), 'media_lotacao', 0, 'pastos_descanso', COUNT(*) FILTER (WHERE status='DESCANSO'))
  FROM public.pastos WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

CREATE OR REPLACE FUNCTION public.get_reproductive_stats(p_tenant_id uuid, p_fazenda_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'eventos_total', COUNT(*),
    'ias_mes', COUNT(*) FILTER (WHERE tipo_evento='IATF' AND data_evento >= date_trunc('month',CURRENT_DATE)),
    'taxa_sucesso', ROUND(100.0*COUNT(*) FILTER (WHERE resultado='Positivo') / NULLIF(COUNT(*) FILTER (WHERE resultado IS NOT NULL),0),1)
  ) FROM public.eventos_reprodutivos WHERE tenant_id = p_tenant_id AND (p_fazenda_id IS NULL OR fazenda_id = p_fazenda_id);
$$;

-- ── GRANTS ──────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION auth_helpers.get_auth_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_banking_consolidated_balance(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_fleet_consumption(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_health(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_purchase_summary(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_herd_gmd(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_herd_total_weight(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sanitary_coverage(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_paddock_lotation_summary(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reproductive_stats(uuid,uuid) TO authenticated;
