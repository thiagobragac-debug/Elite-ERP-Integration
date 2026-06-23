-- 20260621000001_billing_enhancements_and_addons.sql

-- 1. Create Add-ons catalog
CREATE TABLE IF NOT EXISTS public.saas_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- e.g., 'storage', 'module', 'feature'
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly', 'one_time'
    metadata JSONB DEFAULT '{}'::jsonb, -- Store limits or flags (e.g. { "storage_gb": 10 })
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Tenant Add-ons (active subscriptions to add-ons)
CREATE TABLE IF NOT EXISTS public.saas_tenant_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.saas_addons(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saas_tenant_addons_tenant ON public.saas_tenant_addons(tenant_id);

-- RLS
ALTER TABLE public.saas_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_tenant_addons ENABLE ROW LEVEL SECURITY;

-- Addons Catalog is public for authenticated users
CREATE POLICY "Addons catalog is visible to everyone" 
ON public.saas_addons FOR SELECT 
USING (true);

CREATE POLICY "saas_admin_manage_addons" 
ON public.saas_addons FOR ALL 
USING (auth_helpers.is_saas_admin());

-- Tenant Addons visible to tenant or saas_admin
CREATE POLICY "Tenant can see own addons" 
ON public.saas_tenant_addons FOR SELECT 
USING (tenant_id = auth_helpers.get_auth_tenant() OR auth_helpers.is_saas_admin());

CREATE POLICY "saas_admin_manage_tenant_addons" 
ON public.saas_tenant_addons FOR ALL 
USING (auth_helpers.is_saas_admin());

-- 3. Add receipt_url and invoice_pdf columns to saas_invoices if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saas_invoices' AND column_name='receipt_url') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN receipt_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saas_invoices' AND column_name='invoice_pdf') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN invoice_pdf TEXT;
    END IF;
END
$$;

-- 4. Create RPC to calculate real storage usage
CREATE OR REPLACE FUNCTION public.get_tenant_storage_usage(p_tenant_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_bytes BIGINT;
BEGIN
    -- This assumes Supabase Storage objects are in the storage.objects table.
    -- We assume the object name typically starts with the tenant_id or contains it in metadata.
    -- Since we might not have permissions or exact bucket structure knowledge inside the RPC,
    -- we query it safely.
    SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0)
    INTO v_total_bytes
    FROM storage.objects
    WHERE name LIKE p_tenant_id::TEXT || '/%'
       OR metadata->>'tenant_id' = p_tenant_id::TEXT
       OR owner = p_tenant_id;
       
    RETURN v_total_bytes;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback to 0 if storage schema is inaccessible or other errors occur
        RETURN 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_storage_usage(UUID) TO authenticated;
