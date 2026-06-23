-- Create approval_rules table
CREATE TABLE IF NOT EXISTS public.approval_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    condition_label TEXT,
    stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval_queue table
CREATE TABLE IF NOT EXISTS public.approval_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    requester TEXT,
    amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    current_stage INTEGER DEFAULT 1,
    total_stages INTEGER DEFAULT 1,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own approval rules"
    ON public.approval_rules
    FOR ALL
    USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid));

CREATE POLICY "Tenants can manage their own approval queue"
    ON public.approval_queue
    FOR ALL
    USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid));

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_approval_rules
    BEFORE UPDATE ON public.approval_rules
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_approval_queue
    BEFORE UPDATE ON public.approval_queue
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
