CREATE TABLE IF NOT EXISTS public.approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    module TEXT NOT NULL,
    condition_label TEXT NOT NULL,
    min_amount NUMERIC(15,2) DEFAULT 0,
    stages INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    farm_id UUID,
    type TEXT NOT NULL,
    reference_id UUID NOT NULL,
    reference_table TEXT NOT NULL,
    description TEXT,
    requester TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    current_stage INTEGER DEFAULT 1,
    total_stages INTEGER DEFAULT 1,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

-- Policies for approval_rules
DROP POLICY IF EXISTS "approval_rules_tenant" ON public.approval_rules;
CREATE POLICY "approval_rules_tenant" ON public.approval_rules FOR ALL 
USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

-- Policies for approval_queue
DROP POLICY IF EXISTS "approval_queue_tenant" ON public.approval_queue;
CREATE POLICY "approval_queue_tenant" ON public.approval_queue FOR ALL 
USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());
