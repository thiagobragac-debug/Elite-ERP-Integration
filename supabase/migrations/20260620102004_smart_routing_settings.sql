-- Create smart routing table for global payment gateway configuration
CREATE TABLE IF NOT EXISTS public.saas_payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_card_gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
    default_pix_gateway VARCHAR(50) NOT NULL DEFAULT 'asaas',
    default_boleto_gateway VARCHAR(50) NOT NULL DEFAULT 'pagarme',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a single settings row if it doesn't exist
INSERT INTO public.saas_payment_settings (id)
SELECT uuid_generate_v4()
WHERE NOT EXISTS (
    SELECT 1 FROM public.saas_payment_settings
);

-- Enable RLS
ALTER TABLE public.saas_payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (so edge functions / frontend can read configs)
CREATE POLICY "Enable read access for all users" ON public.saas_payment_settings
    FOR SELECT
    USING (true);

-- Allow update access only to system admins
CREATE POLICY "Enable update for admins" ON public.saas_payment_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid() AND auth.users.email LIKE '%@tauze.com%'
        )
    );

-- Add JSONB column to saas_invoices to store multiple payment IDs for smart routing orchestration
ALTER TABLE public.saas_invoices ADD COLUMN IF NOT EXISTS gateway_payment_ids JSONB;
