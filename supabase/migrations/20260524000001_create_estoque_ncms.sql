-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.estoque_ncms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    codigo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, codigo)
);

-- 2. Enable RLS
ALTER TABLE public.estoque_ncms ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy
CREATE POLICY "Tenants can manage their own NCMs" 
ON public.estoque_ncms
FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4. Automatically set updated_at trigger (assuming the function already exists in schema)
-- We will use the standard trigger if update_modified_column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        CREATE TRIGGER update_estoque_ncms_modtime
            BEFORE UPDATE ON public.estoque_ncms
            FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
