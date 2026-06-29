CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
