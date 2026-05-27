-- 1. Add is_template column
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- 2. Create the MASTER TENANT
INSERT INTO public.tenants (id, name, db_host, status, is_template, code, schema_name)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'TEMPLATE MASTER [NÃO EXCLUIR]', 
    'localhost', 
    'active', 
    true, 
    'MASTER', 
    'master'
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE is_template = true
);



-- 3. Create the clone function
CREATE OR REPLACE FUNCTION public.clone_tenant_template_data()
RETURNS TRIGGER AS $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Only clone for non-template tenants
    IF NEW.is_template = true THEN
        RETURN NEW;
    END IF;

    -- Find the master template
    SELECT id INTO v_template_id FROM public.tenants WHERE is_template = true LIMIT 1;
    
    IF v_template_id IS NOT NULL THEN
        
        -- Clone Perfis de Usuario
        INSERT INTO public.perfis_usuario (tenant_id, nome, descricao, permissoes, is_active)
        SELECT NEW.id, nome, descricao, permissoes, is_active
        FROM public.perfis_usuario
        WHERE tenant_id = v_template_id;

        -- Clone Cargos
        INSERT INTO public.cargos (tenant_id, nome, descricao, is_active)
        SELECT NEW.id, nome, descricao, is_active
        FROM public.cargos
        WHERE tenant_id = v_template_id;

        -- Clone Categorias de Sistema
        INSERT INTO public.categorias_sistema (tenant_id, modulo, nome, cor, is_active, modulo_vinculado, is_system)
        SELECT NEW.id, modulo, nome, cor, is_active, modulo_vinculado, is_system
        FROM public.categorias_sistema
        WHERE tenant_id = v_template_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger
DROP TRIGGER IF EXISTS trg_clone_tenant_template ON public.tenants;

CREATE TRIGGER trg_clone_tenant_template
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.clone_tenant_template_data();

NOTIFY pgrst, 'reload schema';
