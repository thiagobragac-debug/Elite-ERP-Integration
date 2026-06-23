-- Tabela para armazenar as configurações de segurança do Tenant
CREATE TABLE public.tenant_security_settings (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  min_8_chars boolean DEFAULT true,
  special_chars boolean DEFAULT true,
  num_letters boolean DEFAULT true,
  inactivity_30m boolean DEFAULT true,
  force_logout boolean DEFAULT false,
  multi_device boolean DEFAULT true,
  block_3_attempts boolean DEFAULT true,
  geo_ip_check boolean DEFAULT true,
  mfa_required boolean DEFAULT false,
  maintenance_mode boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE public.tenant_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin can manage security settings"
  ON public.tenant_security_settings
  FOR ALL
  TO authenticated
  USING (
    tenant_id = auth_helpers.get_auth_tenant() AND 
    auth_helpers.is_saas_admin()
  )
  WITH CHECK (
    tenant_id = auth_helpers.get_auth_tenant() AND 
    auth_helpers.is_saas_admin()
  );

-- Garantir que todo tenant criado tenha uma linha padrão
CREATE OR REPLACE FUNCTION public.handle_new_tenant_security()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tenant_security_settings (tenant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created_security
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_security();

-- Inserir settings para tenants existentes
INSERT INTO public.tenant_security_settings (tenant_id)
SELECT id FROM public.tenants
ON CONFLICT DO NOTHING;

-- Tabela de IPs bloqueados
CREATE TABLE public.banned_ips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admin can manage banned ips"
  ON public.banned_ips
  FOR ALL
  TO authenticated
  USING (
    tenant_id = auth_helpers.get_auth_tenant() AND 
    auth_helpers.is_saas_admin()
  )
  WITH CHECK (
    tenant_id = auth_helpers.get_auth_tenant() AND 
    auth_helpers.is_saas_admin()
  );

-- RPC para suspender ou reativar usuários na tabela auth.users (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.suspend_user_account(p_user_id uuid, p_action text)
RETURNS boolean AS $$
BEGIN
  -- Verificar se quem chama é SAAS_ADMIN (segurança)
  IF NOT auth_helpers.is_saas_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem suspender contas.';
  END IF;

  IF p_action = 'suspend' OR p_action = 'block' THEN
    UPDATE auth.users
    SET banned_until = '2099-12-31 23:59:59Z'
    WHERE id = p_user_id;
  ELSIF p_action = 'reactivate' THEN
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- RPC para bloquear IP
CREATE OR REPLACE FUNCTION public.block_ip_address(p_ip_address text, p_reason text)
RETURNS boolean AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF NOT auth_helpers.is_saas_admin() THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  v_tenant_id := auth_helpers.get_auth_tenant();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não identificado.';
  END IF;

  INSERT INTO public.banned_ips (tenant_id, ip_address, reason)
  VALUES (v_tenant_id, p_ip_address::inet, p_reason);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
