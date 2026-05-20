-- ==========================================================
-- ELITE ERP - SEED: Usuário Admin + Tenant Inicial
-- Execute APÓS os arquivos 001 e 002
-- IMPORTANTE: O usuário thiagobraga.c@gmail.com deve ser
-- criado PRIMEIRO via Supabase Auth (instruções abaixo)
-- ==========================================================

-- PASSO 1: Crie o usuário via Dashboard:
-- Authentication > Users > Add User
-- Email: thiagobraga.c@gmail.com
-- Password: Thi@#sd1
-- Depois copie o UUID gerado e substitua abaixo.

-- PASSO 2: Execute este SQL substituindo o UUID real:

DO $$
DECLARE
  v_user_id   uuid;
  v_tenant_id uuid;
  v_unidade_id uuid;
  v_fazenda_id uuid;
BEGIN
  -- Busca o usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'thiagobraga.c@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário thiagobraga.c@gmail.com não encontrado no Auth. Crie-o primeiro.';
  END IF;

  -- Cria o tenant
  INSERT INTO public.tenants (nome, email, plano)
  VALUES ('Elite Agro', 'thiagobraga.c@gmail.com', 'enterprise')
  RETURNING id INTO v_tenant_id;

  -- Cria/atualiza o profile como admin
  INSERT INTO public.profiles (id, tenant_id, full_name, role)
  VALUES (v_user_id, v_tenant_id, 'Thiago Braga', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = v_tenant_id,
    full_name = 'Thiago Braga',
    role = 'admin';

  -- Cria unidade matriz
  INSERT INTO public.unidades (tenant_id, nome, tipo, documento)
  VALUES (v_tenant_id, 'Matriz Elite Agro', 'MATRIZ', '00.000.000/0001-00')
  RETURNING id INTO v_unidade_id;

  -- Cria fazenda demo
  INSERT INTO public.fazendas (tenant_id, unidade_id, nome, area_total, area_ha, localizacao)
  VALUES (v_tenant_id, v_unidade_id, 'Fazenda Santa Clara', 1240, 1240, 'Mato Grosso do Sul')
  RETURNING id INTO v_fazenda_id;

  -- Cria lotes demo
  INSERT INTO public.lotes (tenant_id, fazenda_id, nome, status)
  VALUES
    (v_tenant_id, v_fazenda_id, 'Lote Recria 2026-A', 'ATIVO'),
    (v_tenant_id, v_fazenda_id, 'Lote Engorda 2026-B', 'ATIVO');

  RAISE NOTICE '✅ Setup completo! Tenant: %, Fazenda: %', v_tenant_id, v_fazenda_id;
END $$;
