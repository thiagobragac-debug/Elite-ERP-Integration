-- RPC para verificar se o IP atual está banido
CREATE OR REPLACE FUNCTION public.check_ip_banned()
RETURNS boolean AS $$
DECLARE
  v_client_ip text;
  v_tenant_id uuid;
BEGIN
  v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  
  -- Se o x-forwarded-for possuir múltiplos IPs, pegamos o primeiro
  IF position(',' in v_client_ip) > 0 THEN
    v_client_ip := split_part(v_client_ip, ',', 1);
  END IF;

  v_tenant_id := auth_helpers.get_auth_tenant();

  IF v_client_ip IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.banned_ips
      WHERE tenant_id = v_tenant_id
      AND ip_address::text = v_client_ip
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para forçar sessão única (Deleta todas exceto a atual)
CREATE OR REPLACE FUNCTION public.enforce_single_session()
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_current_session_id uuid;
BEGIN
  v_user_id := auth.uid();
  v_current_session_id := (current_setting('request.jwt.claims', true)::json->>'session_id')::uuid;

  IF v_user_id IS NOT NULL AND v_current_session_id IS NOT NULL THEN
    DELETE FROM auth.sessions 
    WHERE user_id = v_user_id 
    AND id != v_current_session_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
