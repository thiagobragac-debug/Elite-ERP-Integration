-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.categorias_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    modulo TEXT NOT NULL,
    nome TEXT NOT NULL,
    cor TEXT DEFAULT '#94a3b8',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, modulo, nome)
);

ALTER TABLE public.categorias_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own categories" 
ON public.categorias_sistema
FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Add categoria_id to tables
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_sistema(id);
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_sistema(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_sistema(id);
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_sistema(id);

-- 3. Data Migration (produtos)
DO $$
DECLARE
    r RECORD;
    new_cat_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT categoria, tenant_id FROM public.produtos WHERE categoria IS NOT NULL AND categoria != ''
    LOOP
        -- Insert category if not exists for this tenant and module 'estoque'
        INSERT INTO public.categorias_sistema (tenant_id, modulo, nome)
        VALUES (r.tenant_id, 'estoque', r.categoria)
        ON CONFLICT (tenant_id, modulo, nome) DO NOTHING;
        
        -- Get the id
        SELECT id INTO new_cat_id FROM public.categorias_sistema WHERE tenant_id = r.tenant_id AND modulo = 'estoque' AND nome = r.categoria;
        
        -- Update products
        UPDATE public.produtos SET categoria_id = new_cat_id WHERE tenant_id = r.tenant_id AND categoria = r.categoria;
    END LOOP;
END $$;

-- 4. Data Migration (contas_pagar)
DO $$
DECLARE
    r RECORD;
    new_cat_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT categoria, tenant_id FROM public.contas_pagar WHERE categoria IS NOT NULL AND categoria != ''
    LOOP
        INSERT INTO public.categorias_sistema (tenant_id, modulo, nome)
        VALUES (r.tenant_id, 'financeiro', r.categoria)
        ON CONFLICT (tenant_id, modulo, nome) DO NOTHING;
        
        SELECT id INTO new_cat_id FROM public.categorias_sistema WHERE tenant_id = r.tenant_id AND modulo = 'financeiro' AND nome = r.categoria;
        
        UPDATE public.contas_pagar SET categoria_id = new_cat_id WHERE tenant_id = r.tenant_id AND categoria = r.categoria;
    END LOOP;
END $$;

-- 5. Data Migration (contas_receber)
DO $$
DECLARE
    r RECORD;
    new_cat_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT categoria, tenant_id FROM public.contas_receber WHERE categoria IS NOT NULL AND categoria != ''
    LOOP
        INSERT INTO public.categorias_sistema (tenant_id, modulo, nome)
        VALUES (r.tenant_id, 'financeiro', r.categoria)
        ON CONFLICT (tenant_id, modulo, nome) DO NOTHING;
        
        SELECT id INTO new_cat_id FROM public.categorias_sistema WHERE tenant_id = r.tenant_id AND modulo = 'financeiro' AND nome = r.categoria;
        
        UPDATE public.contas_receber SET categoria_id = new_cat_id WHERE tenant_id = r.tenant_id AND categoria = r.categoria;
    END LOOP;
END $$;

-- 6. Data Migration (parceiros)
DO $$
DECLARE
    r RECORD;
    new_cat_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT categoria, tenant_id FROM public.parceiros WHERE categoria IS NOT NULL AND categoria != ''
    LOOP
        INSERT INTO public.categorias_sistema (tenant_id, modulo, nome)
        VALUES (r.tenant_id, 'parceiros', r.categoria)
        ON CONFLICT (tenant_id, modulo, nome) DO NOTHING;
        
        SELECT id INTO new_cat_id FROM public.categorias_sistema WHERE tenant_id = r.tenant_id AND modulo = 'parceiros' AND nome = r.categoria;
        
        UPDATE public.parceiros SET categoria_id = new_cat_id WHERE tenant_id = r.tenant_id AND categoria = r.categoria;
    END LOOP;
END $$;

-- 7. Drop the old columns
ALTER TABLE public.produtos DROP COLUMN IF EXISTS categoria;
ALTER TABLE public.contas_pagar DROP COLUMN IF EXISTS categoria;
ALTER TABLE public.contas_receber DROP COLUMN IF EXISTS categoria;
ALTER TABLE public.parceiros DROP COLUMN IF EXISTS categoria;
