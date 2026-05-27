-- Migration: Implement SAAS_ADMIN role and God Mode RLS bypass

-- 1. Helper function to check if the current user is a SAAS_ADMIN
CREATE OR REPLACE FUNCTION auth_helpers.is_saas_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SAAS_ADMIN'
  );
$$;

GRANT EXECUTE ON FUNCTION auth_helpers.is_saas_admin() TO authenticated;

-- 2. Trigger to prevent unauthorized users from assigning SAAS_ADMIN role in profiles
CREATE OR REPLACE FUNCTION public.check_saas_admin_role()
RETURNS trigger AS $$
BEGIN
  -- If trying to set or keep role as SAAS_ADMIN
  IF NEW.role = 'SAAS_ADMIN' THEN
    -- Allow if the user making the change is ALREADY a SAAS_ADMIN
    -- Also allow if it's the postgres superuser (e.g. during migrations/seeding)
    IF NOT auth_helpers.is_saas_admin() AND current_user != 'postgres' THEN
      RAISE EXCEPTION 'Apenas um Administrador SaaS pode conceder ou manter o perfil SAAS_ADMIN.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_saas_admin_role ON public.profiles;
CREATE TRIGGER enforce_saas_admin_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_saas_admin_role();

-- 3. Trigger to prevent creating a custom profile named SAAS_ADMIN in perfis_usuario
CREATE OR REPLACE FUNCTION public.check_saas_admin_profile_name()
RETURNS trigger AS $$
BEGIN
  IF UPPER(NEW.nome) LIKE '%SAAS_ADMIN%' OR UPPER(NEW.nome) LIKE '%ADMIN SAAS%' THEN
    IF NOT auth_helpers.is_saas_admin() AND current_user != 'postgres' THEN
      RAISE EXCEPTION 'Não é permitido criar perfis com o nome SAAS_ADMIN.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_saas_admin_profile_name ON public.perfis_usuario;
CREATE TRIGGER enforce_saas_admin_profile_name
BEFORE INSERT OR UPDATE ON public.perfis_usuario
FOR EACH ROW EXECUTE FUNCTION public.check_saas_admin_profile_name();

-- 4. Update ALL existing RLS policies to allow SAAS_ADMIN bypass (God Mode)

-- Manually handle profiles and tenants since they have specific policies
DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (id = (SELECT auth.uid()) OR auth_helpers.is_saas_admin());

DROP POLICY IF EXISTS "tenants_isolation" ON public.tenants;
CREATE POLICY "tenants_isolation" ON public.tenants FOR ALL USING (id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

-- Dynamically handle all other tenant_id based tables
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('profiles', 'tenants')
    LOOP
        -- Check if the table has a tenant_id column
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl 
              AND column_name = 'tenant_id'
        ) THEN
            -- Drop existing policy if any (assuming it's named tablename_tenant)
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_tenant', tbl);
            
            -- Create the new policy with SAAS_ADMIN bypass
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin())', tbl || '_tenant', tbl);
        END IF;
    END LOOP;
END $$;

-- 5. Auto-Convert current thiagobraga.c user to SAAS_ADMIN
UPDATE public.profiles
SET role = 'SAAS_ADMIN'
WHERE email = 'thiagobraga.c@hotmail.com' OR email LIKE 'thiago%';
